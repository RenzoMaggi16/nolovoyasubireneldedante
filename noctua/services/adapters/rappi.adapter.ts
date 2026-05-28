/**
 * noctua/services/adapters/rappi.adapter.ts
 */
import { Order, OrderStatus, PlatformId } from '../../types/orders';
import { IPlatformAdapter } from '../platformAdapter.interface';
import { rappiTokenManager } from '../auth/rappiTokenManager';
import { fetchWithResilience } from '../../lib/apiUtils';

export class RappiAdapter implements IPlatformAdapter {
  platformId: PlatformId = 'rappi';
  private apiUrl = process.env.RAPPI_API_URL;
  private restaurantId = process.env.RAPPI_RESTAURANT_ID;

  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const token = await rappiTokenManager.getToken();
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const response = await fetchWithResilience(url, { ...options, headers });

    if (!response.ok) {
      console.error(`Rappi API Error:`, {
        platform: this.platformId,
        operation: options.method || 'GET',
        statusCode: response.status,
        url,
      });
    }

    return response;
  }

  async getOrders(): Promise<Order[]> {
    const response = await this.fetchWithAuth(`${this.apiUrl}/v2/orders?restaurantId=${this.restaurantId}`);

    if (!response.ok) {
      throw new Error(`Rappi API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.map(this.mapToInternalOrder.bind(this));
  }

  async getOrderById(orderId: string): Promise<Order> {
    const response = await this.fetchWithAuth(`${this.apiUrl}/v2/orders/${orderId}`);
    const data = await response.json();
    return this.mapToInternalOrder(data);
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const rappiStatus = this.mapToExternalStatus(status);
    
    const response = await this.fetchWithAuth(`${this.apiUrl}/v2/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: rappiStatus }),
    });

    if (!response.ok) throw new Error(`Failed to update Rappi status`);
    
    const data = await response.json();
    return this.mapToInternalOrder(data);
  }

  async confirmOrder(orderId: string): Promise<Order> {
    return this.updateOrderStatus(orderId, 'confirmed');
  }

  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    const response = await this.fetchWithAuth(`${this.apiUrl}/v2/orders/${orderId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    const data = await response.json();
    return this.mapToInternalOrder(data);
  }

  async markReady(orderId: string): Promise<Order> {
    return this.updateOrderStatus(orderId, 'ready');
  }

  async isConnected(): Promise<boolean> {
    try {
      if (!process.env.RAPPI_BEARER_TOKEN) {
        return false;
      }
      const token = await rappiTokenManager.getToken();
      return !!token;
    } catch (error) {
      console.error('Error checking Rappi connection:', error);
      return false;
    }
  }

  async getStoreStatus(): Promise<'open' | 'closed' | 'busy'> {
    const response = await this.fetchWithAuth(`${this.apiUrl}/v2/restaurants/${this.restaurantId}/status`);
    const data = await response.json();
    return data.status; // 'open' | 'closed' | 'busy'
  }

  async setStoreStatus(status: 'open' | 'closed'): Promise<void> {
    await this.fetchWithAuth(`${this.apiUrl}/v2/restaurants/${this.restaurantId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  private mapToInternalOrder(rappiOrder: any): Order {
    return {
      id: rappiOrder.id.toString(),
      externalId: rappiOrder.display_id || rappiOrder.id.toString(),
      platform: 'rappi',
      status: this.mapToInternalStatus(rappiOrder.status),
      createdAt: new Date(rappiOrder.created_at),
      updatedAt: new Date(rappiOrder.updated_at || rappiOrder.created_at),
      customer: {
        name: rappiOrder.customer.name,
        phone: rappiOrder.customer.phone,
        address: rappiOrder.customer.address,
      },
      items: rappiOrder.items.map((item: any) => ({
        id: item.id.toString(),
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        notes: item.comment,
      })),
      subtotal: rappiOrder.subtotal,
      total: rappiOrder.total,
      paymentMethod: rappiOrder.payment_method === 'CASH' ? 'cash' : 'online',
      notes: rappiOrder.comment,
    };
  }

  private mapToInternalStatus(status: string): OrderStatus {
    const mapping: Record<string, OrderStatus> = {
      'PENDING': 'new',
      'CONFIRMED': 'confirmed',
      'PREPARING': 'preparing',
      'READY': 'ready',
      'PICKED_UP': 'picked_up',
      'DELIVERED': 'delivered',
      'CANCELLED': 'cancelled',
    };
    return mapping[status] || 'new';
  }

  private mapToExternalStatus(status: OrderStatus): string {
    const mapping: Record<OrderStatus, string> = {
      'new': 'PENDING',
      'confirmed': 'CONFIRMED',
      'preparing': 'PREPARING',
      'ready': 'READY',
      'picked_up': 'PICKED_UP',
      'delivered': 'DELIVERED',
      'cancelled': 'CANCELLED',
    };
    return mapping[status];
  }
}
