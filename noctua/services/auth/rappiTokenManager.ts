/**
 * noctua/services/auth/rappiTokenManager.ts
 * Gestión del Bearer Token de Rappi con renovación automática.
 */

export class RappiTokenManager {
  private static instance: RappiTokenManager;
  private token: string | null = null;
  private expirationTime: number | null = null;
  private isRefreshing: boolean = false;

  private constructor() {
    this.token = process.env.RAPPI_BEARER_TOKEN || null;
    // Asumimos que si viene de env, es nuevo o tiene validez
    if (this.token) {
      this.expirationTime = Date.now() + 7 * 24 * 60 * 60 * 1000;
    }
  }

  public static getInstance(): RappiTokenManager {
    if (!RappiTokenManager.instance) {
      RappiTokenManager.instance = new RappiTokenManager();
    }
    return RappiTokenManager.instance;
  }

  public async getToken(): Promise<string> {
    if (this.shouldRefresh()) {
      await this.refreshToken();
    }
    return this.token || '';
  }

  private shouldRefresh(): boolean {
    if (!this.token || !this.expirationTime) return true;
    // Renovar si faltan menos de 24 horas para expirar
    const oneDayInMs = 24 * 60 * 60 * 1000;
    return Date.now() > this.expirationTime - oneDayInMs;
  }

  public async refreshToken(): Promise<void> {
    if (this.isRefreshing) return;
    this.isRefreshing = true;

    try {
      console.log('Renovando token de Rappi...');
      // Implementación real de renovación de Rappi (ejemplo POST a auth endpoint)
      // Por ahora usamos el del env o simulamos renovación
      const apiUrl = process.env.RAPPI_API_URL;
      
      // Simulación: en producción aquí iría el fetch a Rappi Auth
      /*
      const response = await fetch(`${apiUrl}/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: process.env.RAPPI_CLIENT_ID,
          client_secret: process.env.RAPPI_CLIENT_SECRET
        })
      });
      const data = await response.json();
      this.token = data.access_token;
      this.expirationTime = Date.now() + data.expires_in * 1000;
      */
      
      // Para desarrollo/mock:
      this.token = process.env.RAPPI_BEARER_TOKEN || 'mock_rappi_token';
      this.expirationTime = Date.now() + 7 * 24 * 60 * 60 * 1000;
      
    } catch (error) {
      console.error('Error renovando token de Rappi:', error);
    } finally {
      this.isRefreshing = false;
    }
  }
}

export const rappiTokenManager = RappiTokenManager.getInstance();
