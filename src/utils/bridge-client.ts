import type { BridgeHealthResponse, BridgePrinter, BridgePrintRequest, BridgePrintResponse } from '../types';

/**
 * Client for communicating with the print bridge service
 * @example
 * ```typescript
 * const client = new BridgeClient('http://localhost:8765')
 * const isAvailable = await client.checkAvailability()
 * ```
 */
export class BridgeClient {
  private baseUrl: string;
  private isAvailable: boolean | null = null;
  
  /**
   * Creates a new BridgeClient instance
   * @param baseUrl - Base URL of the bridge service (default: 'http://localhost:8765')
   */
  constructor(baseUrl: string = 'http://localhost:8765') {
    this.baseUrl = baseUrl;
  }
  
  /**
   * Checks if the bridge service is available and responding
   * @returns Promise that resolves to true if bridge is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000) // Timeout de 2 segundos
      });
      
      if (response.ok) {
        this.isAvailable = true;
        return true;
      }
    } catch (error) {
      console.debug('Bridge no disponible:', error);
    }
    
    this.isAvailable = false;
    return false;
  }
  
  /**
   * Gets the health status of the bridge service
   * @returns Promise that resolves to bridge health information or null if unavailable
   */
  async getHealth(): Promise<BridgeHealthResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.debug('Error obteniendo estado del bridge:', error);
    }
    return null;
  }
  
  /**
   * Gets list of available printers from the bridge
   * @returns Promise that resolves to array of available printers
   */
  async getPrinters(): Promise<BridgePrinter[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/printers`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.debug('Error obteniendo impresoras:', error);
    }
    return [];
  }
  
  /**
   * Sends content directly to a printer via the bridge
   * @param request - Print request configuration
   * @returns Promise that resolves to print response with job information
   */
  async print(request: BridgePrintRequest): Promise<BridgePrintResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });
      
      if (response.ok) {
        return await response.json();
      } else {
        const error = await response.text();
        throw new Error(`Error del bridge: ${error}`);
      }
    } catch (error) {
      throw new Error(`Error comunicándose con el bridge: ${error}`);
    }
  }
  
  /**
   * Converts HTML string to Base64 encoding for bridge transmission
   * @param html - HTML string to encode
   * @returns Base64 encoded string
   */
  htmlToBase64(html: string): string {
    return btoa(unescape(encodeURIComponent(html)));
  }
  
  /**
   * Getter para saber si el bridge está disponible
   */
  get available(): boolean | null {
    return this.isAvailable;
  }
}