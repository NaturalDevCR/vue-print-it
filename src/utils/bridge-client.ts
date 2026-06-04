import type {
  BridgeHealthResponse,
  BridgePluginOptions,
  BridgePrinter,
  BridgePrintRequest,
  BridgePrintResponse,
} from '../types';

interface BridgeClientConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  headers: Record<string, string>;
  debug: boolean;
}

/**
 * Client for communicating with the print bridge service.
 * @example
 * ```typescript
 * const client = new BridgeClient({ baseUrl: 'http://localhost:8765' })
 * const isAvailable = await client.checkAvailability()
 * ```
 */
export class BridgeClient {
  private config: BridgeClientConfig;
  private isAvailable: boolean | null = null;

  /**
   * Creates a new BridgeClient instance.
   * Accepts the legacy baseUrl string or the full bridge plugin options object.
   */
  constructor(options: string | BridgePluginOptions = 'http://localhost:8765') {
    const normalizedOptions =
      typeof options === 'string' ? { baseUrl: options } : options;

    this.config = {
      baseUrl: normalizedOptions.baseUrl || 'http://localhost:8765',
      timeout: normalizedOptions.timeout ?? 2000,
      retryAttempts: normalizedOptions.retryAttempts ?? 3,
      headers: normalizedOptions.headers || {},
      debug: normalizedOptions.debug ?? false,
    };
  }

  private log(message: string, error?: unknown): void {
    if (this.config.debug) {
      console.debug(message, error);
    }
  }

  private async fetchWithTimeout(
    path: string,
    init: RequestInit = {}
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    const headers = { ...this.config.headers };
    new Headers(init.headers).forEach((value, key) => {
      headers[key] = value;
    });

    try {
      return await fetch(`${this.config.baseUrl}${path}`, {
        ...init,
        headers,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private async withRetries<T>(
    operation: () => Promise<T>,
    onFailedAttempt?: (error: unknown, attempt: number) => void
  ): Promise<T> {
    const attempts = Math.max(1, this.config.retryAttempts);
    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        onFailedAttempt?.(error, attempt);
      }
    }

    throw lastError;
  }

  /**
   * Checks if the bridge service is available and responding.
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const response = await this.withRetries(
        () => this.fetchWithTimeout('/health', { method: 'GET' }),
        (error, attempt) => {
          this.log(`Bridge availability attempt ${attempt} failed`, error);
        }
      );

      this.isAvailable = response.ok;
      return response.ok;
    } catch (error) {
      this.log('Bridge not available', error);
      this.isAvailable = false;
      return false;
    }
  }

  /**
   * Gets the health status of the bridge service.
   */
  async getHealth(): Promise<BridgeHealthResponse | null> {
    try {
      const response = await this.withRetries(() =>
        this.fetchWithTimeout('/health')
      );
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      this.log('Error getting bridge health', error);
    }

    return null;
  }

  /**
   * Gets list of available printers from the bridge.
   */
  async getPrinters(): Promise<BridgePrinter[]> {
    try {
      const response = await this.withRetries(() =>
        this.fetchWithTimeout('/api/printers')
      );
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      this.log('Error getting printers', error);
    }

    return [];
  }

  /**
   * Sends content directly to a printer via the bridge.
   */
  async print(request: BridgePrintRequest): Promise<BridgePrintResponse> {
    try {
      const response = await this.withRetries(() =>
        this.fetchWithTimeout('/api/print', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        })
      );

      if (response.ok) {
        return await response.json();
      }

      const error = await response.text();
      throw new Error(`Bridge error: ${error}`);
    } catch (error) {
      throw new Error(`Error communicating with bridge: ${error}`);
    }
  }

  /**
   * Converts HTML string to Base64 encoding for bridge transmission.
   */
  htmlToBase64(html: string): string {
    return btoa(unescape(encodeURIComponent(html)));
  }

  /**
   * Whether the bridge was available during the last check.
   */
  get available(): boolean | null {
    return this.isAvailable;
  }
}
