/**
 * noctua/services/adapters/pedidosya.adapter.ts
 */
import { Order, OrderStatus, PlatformId } from '../../types/orders';
import { IPlatformAdapter } from '../platformAdapter.interface';
import { pedidosYaAuth } from '../auth/pedidosyaAuth';
import { fetchWithResilience } from '../../lib/apiUtils';

export class PedidosYaAdapter implements IPlatformAdapter {
  platformId: PlatformId = 'pedidosya';
  private apiUrl = process.env.PEDIDOSYA_API_URL;

  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    let token = await pedidosYaAuth.getToken();
    
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    let response = await fetchWithResilience(url, { ...options, headers });

    if (response.status === 401) {
      console.log('Token de PedidosYA expirado, reintentando...');
      pedidosYaAuth.invalidateToken();
      token = await pedidosYaAuth.getToken();
      response = await fetchWithResilience(url, {
        ...options,
        headers: { ...headers, 'Authorization': `Bearer ${token}` },
      });
    }

    if (!response.ok) {
      console.error(`PedidosYA API Error:`, {
        platform: this.platformId,
        operation: options.method || 'GET',
        statusCode: response.status,
        url,
      });
    }

    return response;
  }

  async getOrders(): Promise<Order[]> {
    const response = await this.fetchWithAuth(`${this.apiUrl}/orders/active`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.map((o: any) => this.mapToInternalOrder(o));
  }

  async getOrderById(orderId: string): Promise<Order> {
    const response = await this.fetchWithAuth(`${this.apiUrl}/orders/${orderId}`);
    const data = await response.json();
    return this.mapToInternalOrder(data);
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const peyaStatus = this.mapToExternalStatus(status);
    if (!peyaStatus) return this.getOrderById(orderId);

    await this.fetchWithAuth(`${this.apiUrl}/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: peyaStatus }),
    });

    return this.getOrderById(orderId);
  }

  async confirmOrder(orderId: string): Promise<Order> {
    return this.updateOrderStatus(orderId, 'confirmed');
  }

  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    await this.fetchWithAuth(`${this.apiUrl}/orders/${orderId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    return this.getOrderById(orderId);
  }

  async markReady(orderId: string): Promise<Order> {
    return this.updateOrderStatus(orderId, 'ready');
  }

  async isConnected(): Promise<boolean> {
    try {
      if (!process.env.PEDIDOSYA_CLIENT_ID || !process.env.PEDIDOSYA_CLIENT_SECRET) {
        return false;
      }
      const token = await pedidosYaAuth.getToken();
      return !!token;
    } catch (error) {
      console.error('Error checking PedidosYA connection:', error);
      return false;
    }
  }

  async getStoreStatus(): Promise<'open' | 'closed' | 'busy'> {
    const response = await this.fetchWithAuth(`${this.apiUrl}/shop/status`);
    const data = await response.json();
    return data.status; // 'open' | 'closed' | 'busy'
  }

  async setStoreStatus(status: 'open' | 'closed'): Promise<void> {
    await this.fetchWithAuth(`${this.apiUrl}/shop/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  private mapToInternalOrder(peyaOrder: any): Order {
    return {
      id: peyaOrder.id.toString(),
      externalId: peyaOrder.remoteId || peyaOrder.id.toString(),
      platform: 'pedidosya',
      status: this.mapToInternalStatus(peyaOrder.status),
      createdAt: new Date(peyaOrder.registeredDate),
      updatedAt: new Date(),
      customer: {
        name: `${peyaOrder.customer.firstName} ${peyaOrder.customer.lastName}`,
        phone: peyaOrder.customer.phone,
        address: peyaOrder.deliveryAddress?.description,
      },
      items: peyaOrder.products.map((p: any) => ({
        id: p.id.toString(),
        name: p.name,
        quantity: p.quantity,
        unitPrice: p.price,
        notes: p.notes,
      })),
      subtotal: peyaOrder.subtotal,
      total: peyaOrder.total,
      paymentMethod: peyaOrder.paymentMethod === 'ONLINE' ? 'online' : 'cash',
      notes: peyaOrder.notes,
    };
  }

  private mapToInternalStatus(status: string): OrderStatus {
    const mapping: Record<string, OrderStatus> = {
      'PENDING': 'new',
      'CONFIRMED': 'confirmed',
      'PREPARING': 'preparing',
      'READY': 'ready',
      'SHIPPED': 'picked_up',
      'DELIVERED': 'delivered',
      'CANCELLED': 'cancelled',
    };
    return mapping[status] || 'new';
  }

  private mapToExternalStatus(status: OrderStatus): string | null {
    const mapping: Partial<Record<OrderStatus, string>> = {
      'confirmed': 'CONFIRMED',
      'preparing': 'PREPARING',
      'ready': 'READY',
    };
    return mapping[status] || null;
  }
}
