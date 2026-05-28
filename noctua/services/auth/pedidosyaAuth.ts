/**
 * noctua/services/auth/pedidosyaAuth.ts
 * Gestión de autenticación para PedidosYA.
 */

export class PedidosYaAuth {
  private static instance: PedidosYaAuth;
  private token: string | null = null;
  private expirationTime: number | null = null;
  private isRefreshing: boolean = false;

  private constructor() {}

  public static getInstance(): PedidosYaAuth {
    if (!PedidosYaAuth.instance) {
      PedidosYaAuth.instance = new PedidosYaAuth();
    }
    return PedidosYaAuth.instance;
  }

  public async getToken(): Promise<string> {
    if (this.shouldRefresh()) {
      await this.refreshToken();
    }
    return this.token || '';
  }

  private shouldRefresh(): boolean {
    if (!this.token || !this.expirationTime) return true;
    // Renovar si faltan menos de 5 minutos
    const fiveMinutesInMs = 5 * 60 * 1000;
    return Date.now() > this.expirationTime - fiveMinutesInMs;
  }

  public async refreshToken(): Promise<void> {
    if (this.isRefreshing) return;
    
    if (!process.env.PEDIDOSYA_CLIENT_ID || !process.env.PEDIDOSYA_CLIENT_SECRET) {
      console.warn('PedidosYA credentials missing');
      return;
    }

    this.isRefreshing = true;

    try {
      console.log('Obteniendo nuevo token de PedidosYA...');
      
      const response = await fetch(`${process.env.PEDIDOSYA_API_URL}/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: process.env.PEDIDOSYA_CLIENT_ID,
          clientSecret: process.env.PEDIDOSYA_CLIENT_SECRET,
        }),
      });

      if (!response.ok) {
        throw new Error(`PedidosYA Auth failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.token = data.access_token;
      // PedidosYA suele dar expires_in en segundos
      this.expirationTime = Date.now() + (data.expires_in || 3600) * 1000;
      
    } catch (error) {
      console.error('Error en autenticación de PedidosYA:', error);
    } finally {
      this.isRefreshing = false;
    }
  }

  public invalidateToken(): void {
    this.token = null;
    this.expirationTime = null;
  }
}

export const pedidosYaAuth = PedidosYaAuth.getInstance();
