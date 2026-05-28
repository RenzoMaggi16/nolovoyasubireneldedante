/**
 * noctua/services/adapters/ubereats.adapter.ts
 */
import { Order, OrderStatus, PlatformId } from '../../types/orders';
import { IPlatformAdapter } from '../platformAdapter.interface';
import { uberEatsAuth } from '../auth/uberEatsAuth';
import { supabase } from '@/hooks/lib/supabaseClient';
import { fetchWithResilience } from '../../lib/apiUtils';

export class UberEatsAdapter implements IPlatformAdapter {
  platformId: PlatformId = 'ubereats';
  private apiUrl = process.env.UBEREATS_API_URL;
  private storeId = process.env.UBEREATS_STORE_ID;

  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const token = await uberEatsAuth.getToken();
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const response = await fetchWithResilience(url, { ...options, headers });

    if (!response.ok) {
      console.error(`UberEats API Error:`, {
        platform: this.platformId,
        operation: options.method || 'GET',
        statusCode: response.status,
        url,
      });
    }

    return response;
  }

  async receiveWebhookPayload(payload: any): Promise<void> {
    const order = this.mapToInternalOrder(payload);
    
    const { error } = await supabase
      .from('delivery_orders')
      .upsert({
        id: order.id,
        external_id: order.externalId,
        platform: 'ubereats',
        status: order.status,
        customer_name: order.customer.name,
        total: order.total,
        items: order.items,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
  }

  async getOrders(): Promise<Order[]> {
    const response = await this.fetchWithAuth(`${this.apiUrl}/stores/${this.storeId}/active-orders`);

    if (!response.ok) return [];
    
    const data = await response.json();
    return data.orders.map((o: any) => this.mapToInternalOrder(o));
  }

  async getOrderById(orderId: string): Promise<Order> {
    const response = await this.fetchWithAuth(`${this.apiUrl}/orders/${orderId}`);
    const data = await response.json();
    return this.mapToInternalOrder(data);
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    // Uber Eats tiene endpoints específicos por acción
    let endpoint = '';
    let body = {};

    if (status === 'confirmed') {
      endpoint = `${this.apiUrl}/orders/${orderId}/accept_pos_order`;
    } else if (status === 'cancelled') {
      endpoint = `${this.apiUrl}/orders/${orderId}/cancel`;
      body = { reason: 'RESTAURANT_TOO_BUSY' };
    } else if (status === 'ready') {
      endpoint = `${this.apiUrl}/orders/${orderId}/ready_for_pickup`;
    }

    if (endpoint) {
      await this.fetchWithAuth(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });
    }

    return this.getOrderById(orderId);
  }

  async confirmOrder(orderId: string): Promise<Order> {
    return this.updateOrderStatus(orderId, 'confirmed');
  }

  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    return this.updateOrderStatus(orderId, 'cancelled');
  }

  async markReady(orderId: string): Promise<Order> {
    return this.updateOrderStatus(orderId, 'ready');
  }

  async isConnected(): Promise<boolean> {
    try {
      if (!process.env.UBEREATS_CLIENT_ID || !process.env.UBEREATS_CLIENT_SECRET) {
        return false;
      }
      const token = await uberEatsAuth.getToken();
      return !!token;
    } catch (error) {
      console.error('Error checking Uber Eats connection:', error);
      return false;
    }
  }

  async getStoreStatus(): Promise<'open' | 'closed' | 'busy'> {
    const response = await this.fetchWithAuth(`${this.apiUrl}/stores/${this.storeId}`);
    const data = await response.json();
    return data.status === 'OPEN' ? 'open' : 'closed';
  }

  async setStoreStatus(status: 'open' | 'closed'): Promise<void> {
    await this.fetchWithAuth(`${this.apiUrl}/stores/${this.storeId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status: status === 'open' ? 'OPEN' : 'CLOSED' }),
    });
  }

  public mapToInternalOrder(uberOrder: any): Order {
    return {
      id: uberOrder.id,
      externalId: uberOrder.display_id || uberOrder.id,
      platform: 'ubereats',
      status: this.mapToInternalStatus(uberOrder.current_state),
      createdAt: new Date(uberOrder.placed_at),
      updatedAt: new Date(),
      customer: {
        name: `${uberOrder.cart.customer.first_name} ${uberOrder.cart.customer.last_name}`,
        phone: uberOrder.cart.customer.phone_number,
      },
      items: uberOrder.cart.items.map((item: any) => ({
        id: item.id,
        name: item.title,
        quantity: item.quantity,
        unitPrice: item.price / 100, // Uber suele usar centavos
      })),
      subtotal: uberOrder.payment.subtotal / 100,
      total: uberOrder.payment.total / 100,
      paymentMethod: 'online',
      notes: uberOrder.notes,
    };
  }

  private mapToInternalStatus(state: string): OrderStatus {
    const mapping: Record<string, OrderStatus> = {
      'CREATED': 'new',
      'ACCEPTED': 'confirmed',
      'PREPARING': 'preparing',
      'READY_FOR_PICKUP': 'ready',
      'PICKED_UP': 'picked_up',
      'COMPLETED': 'delivered',
      'CANCELED': 'cancelled',
    };
    return mapping[state] || 'new';
  }
}
