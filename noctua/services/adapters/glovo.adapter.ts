/**
 * noctua/services/adapters/glovo.adapter.ts
 */
import { Order, OrderStatus, PlatformId } from '../../types/orders';
import { IPlatformAdapter } from '../platformAdapter.interface';
import { supabase } from '@/hooks/lib/supabaseClient';
import { fetchWithResilience } from '../../lib/apiUtils';

export class GlovoAdapter implements IPlatformAdapter {
  platformId: PlatformId = 'glovo';
  private apiKey = process.env.GLOVO_API_KEY;
  private apiUrl = process.env.GLOVO_API_URL;
  private storeId = process.env.GLOVO_STORE_ID;

  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    const response = await fetchWithResilience(url, { ...options, headers });

    if (!response.ok) {
      console.error(`Glovo API Error:`, {
        platform: this.platformId,
        operation: options.method || 'GET',
        statusCode: response.status,
        url,
      });
    }

    return response;
  }

  async receiveWebhookPayload(payload: any): Promise<void> {
    const order = this.mapToInternalOrder(payload.orderData || payload);
    
    // Guardar/Actualizar en Supabase
    const { error } = await supabase
      .from('delivery_orders')
      .upsert({
        id: order.id,
        external_id: order.externalId,
        platform: 'glovo',
        status: order.status,
        customer_name: order.customer.name,
        customer_phone: order.customer.phone,
        total: order.total,
        items: order.items,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
  }

  async getOrders(): Promise<Order[]> {
    const response = await this.fetchWithAuth(`${this.apiUrl}/laas/orders/active?storeId=${this.storeId}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.map((o: any) => this.mapToInternalOrder(o));
  }

  async getOrderById(orderId: string): Promise<Order> {
    const response = await this.fetchWithAuth(`${this.apiUrl}/laas/orders/${orderId}`);
    const data = await response.json();
    return this.mapToInternalOrder(data);
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const glovoStatus = this.mapToExternalStatus(status);
    if (!glovoStatus) return this.getOrderById(orderId);

    await this.fetchWithAuth(`${this.apiUrl}/laas/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: glovoStatus }),
    });

    return this.getOrderById(orderId);
  }

  async confirmOrder(orderId: string): Promise<Order> {
    return this.updateOrderStatus(orderId, 'confirmed');
  }

  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    await this.fetchWithAuth(`${this.apiUrl}/laas/orders/${orderId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return this.getOrderById(orderId);
  }

  async markReady(orderId: string): Promise<Order> {
    return this.updateOrderStatus(orderId, 'ready');
  }

  async isConnected(): Promise<boolean> {
    return !!this.apiKey && !!this.storeId;
  }

  async getStoreStatus(): Promise<'open' | 'closed' | 'busy'> {
    const response = await this.fetchWithAuth(`${this.apiUrl}/laas/stores/${this.storeId}`);
    const data = await response.json();
    return data.is_open ? 'open' : 'closed';
  }

  async setStoreStatus(status: 'open' | 'closed'): Promise<void> {
    await this.fetchWithAuth(`${this.apiUrl}/laas/stores/${this.storeId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ is_open: status === 'open' }),
    });
  }

  public mapToInternalOrder(glovoOrder: any): Order {
    return {
      id: glovoOrder.order_id,
      externalId: glovoOrder.order_code || glovoOrder.order_id,
      platform: 'glovo',
      status: this.mapToInternalStatus(glovoOrder.status),
      createdAt: new Date(glovoOrder.creation_time),
      updatedAt: new Date(),
      customer: {
        name: glovoOrder.customer_name,
        phone: glovoOrder.customer_phone,
      },
      items: glovoOrder.products.map((p: any) => ({
        id: p.id,
        name: p.name,
        quantity: p.quantity,
        unitPrice: p.price,
      })),
      subtotal: glovoOrder.total_amount - (glovoOrder.delivery_fee || 0),
      total: glovoOrder.total_amount,
      paymentMethod: 'online',
    };
  }

  private mapToInternalStatus(status: string): OrderStatus {
    const mapping: Record<string, OrderStatus> = {
      'PENDING': 'new',
      'ACCEPTED': 'confirmed',
      'PREPARING': 'preparing',
      'READY_FOR_PICKUP': 'ready',
      'PICKED_UP': 'picked_up',
      'DELIVERED': 'delivered',
      'CANCELED': 'cancelled',
    };
    return mapping[status] || 'new';
  }

  private mapToExternalStatus(status: OrderStatus): string | null {
    const mapping: Partial<Record<OrderStatus, string>> = {
      'confirmed': 'ACCEPTED',
      'ready': 'READY_FOR_PICKUP',
    };
    return mapping[status] || null;
  }
}
