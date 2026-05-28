/**
 * noctua/services/auth/uberEatsAuth.ts
 * Gestión de autenticación OAuth 2.0 para Uber Eats.
 */

export class UberEatsAuth {
  private static instance: UberEatsAuth;
  private token: string | null = null;
  private expirationTime: number | null = null;
  private isRefreshing: boolean = false;

  private constructor() {}

  public static getInstance(): UberEatsAuth {
    if (!UberEatsAuth.instance) {
      UberEatsAuth.instance = new UberEatsAuth();
    }
    return UberEatsAuth.instance;
  }

  public async getToken(): Promise<string> {
    if (this.shouldRefresh()) {
      await this.refreshToken();
    }
    return this.token || '';
  }

  private shouldRefresh(): boolean {
    if (!this.token || !this.expirationTime) return true;
    // Renovar si faltan menos de 5 minutos para expirar
    const fiveMinutesInMs = 5 * 60 * 1000;
    return Date.now() > this.expirationTime - fiveMinutesInMs;
  }

  public async refreshToken(): Promise<void> {
    if (this.isRefreshing) return;

    if (!process.env.UBEREATS_CLIENT_ID || !process.env.UBEREATS_CLIENT_SECRET) {
      console.warn('Uber Eats credentials missing');
      return;
    }

    this.isRefreshing = true;

    try {
      console.log('Obteniendo nuevo access token de Uber Eats...');
      
      const response = await fetch('https://login.uber.com/oauth/v2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.UBEREATS_CLIENT_ID || '',
          client_secret: process.env.UBEREATS_CLIENT_SECRET || '',
          grant_type: 'client_credentials',
          scope: 'eats.order eats.store',
        }),
      });

      if (!response.ok) {
        throw new Error(`Uber Eats Auth failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.token = data.access_token;
      this.expirationTime = Date.now() + data.expires_in * 1000;
      
    } catch (error) {
      console.error('Error en autenticación de Uber Eats:', error);
    } finally {
      this.isRefreshing = false;
    }
  }
}

export const uberEatsAuth = UberEatsAuth.getInstance();
