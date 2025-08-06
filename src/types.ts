/**
 * Configuration options for individual print operations
 */
export interface PrintOptions {
  /** Window name for the print window (default: '_blank') */
  name?: string;
  /** Window specifications as array of strings or object with width/height */
  specs?: string[] | { width?: number; height?: number };
  /** Array of custom CSS styles to apply */
  styles?: string[];
  /** Delay in milliseconds before printing (default: 1000) */
  timeout?: number;
  /** Whether to automatically close the print window (default: true) */
  autoClose?: boolean;
  /** Title for the print window */
  windowTitle?: string;
  /** Whether to preserve original page styles (default: true) */
  preserveStyles?: boolean;
  /** Callback executed before printing starts */
  onBeforePrint?: () => void | Promise<void>;
  /** Callback executed after printing completes */
  onAfterPrint?: () => void | Promise<void>;
  /** Callback executed when print error occurs */
  onPrintError?: (error: Error) => void;
  /** Whether to use bridge for direct printing (requires bridge plugin) */
  useBridge?: boolean;
  /** Name of the printer to use with bridge */
  printerName?: string;
  /** Number of copies to print */
  copies?: number;
  /** Content type for bridge printing */
  contentType?: 'html' | 'pdf';
}

/**
 * Global configuration options for the print plugin
 */
export interface GlobalPrintOptions {
  /** Window name for the print window (default: '_blank') */
  name?: string;
  /** Window specifications as array of strings or object with width/height */
  specs?: string[] | { width?: number; height?: number };
  /** Array of custom CSS styles to apply */
  styles?: string[];
  /** Delay in milliseconds before printing (default: 1000) */
  timeout?: number;
  /** Whether to automatically close the print window (default: true) */
  autoClose?: boolean;
  /** Title for the print window */
  windowTitle?: string;
  /** Whether to preserve original page styles (default: true) */
  preserveStyles?: boolean;
}

/**
 * Configuration options for the bridge plugin extension
 */
export interface BridgePluginOptions {
  /** Base URL of the bridge service (default: 'http://localhost:8765') */
  baseUrl?: string;
  /** Port number for the bridge service (default: 8765) */
  port?: number;
  /** Whether to automatically connect on plugin installation (default: false) */
  autoConnect?: boolean;
  /** Whether to automatically select a default printer (default: true) */
  autoSelectDefault?: boolean;
  /** Connection timeout in milliseconds (default: 2000) */
  timeout?: number;
  /** Number of retry attempts for failed connections (default: 3) */
  retryAttempts?: number;
  /** Default printer name to use (optional - will auto-select if not provided) */
  defaultPrinter?: string;
  /** Custom headers to send with bridge requests */
  headers?: Record<string, string>;
  /** Enable debug logging for bridge operations */
  debug?: boolean;
}

/**
 * Bridge health response interface
 */
export interface BridgeHealthResponse {
  status: string;
  version: string;
  uptime: number;
}

/**
 * Bridge printer information interface
 */
export interface BridgePrinter {
  name: string;
  is_default: boolean;
  status: string;
}

/**
 * Bridge print request interface
 */
export interface BridgePrintRequest {
  printer_name?: string;
  content: string;
  content_type: 'html' | 'pdf';
  copies?: number;
  options?: Record<string, any>;
}

/**
 * Bridge print response interface
 */
export interface BridgePrintResponse {
  success: boolean;
  job_id: string;
  message: string;
}

/**
 * Print instance interface for global methods
 */
export interface PrintInstance {
  print: (element: HTMLElement | string, options?: PrintOptions) => Promise<void>;
  printComponent: (componentRef: any, options?: PrintOptions) => Promise<void>;
  getBridgeStatus: () => Promise<BridgeHealthResponse | null>;
  getAvailablePrinters: () => Promise<BridgePrinter[]>;
  printDirect: (content: string, options?: Partial<BridgePrintRequest>) => Promise<BridgePrintResponse>;
}

/**
 * Print store interface for managing containers and data
 */
export interface PrintStore {
  containers: Record<string, HTMLElement | null>;
  data: Record<string, any>;
  registerContainer: (key: string, element: HTMLElement) => void;
  getContainer: (key: string) => HTMLElement | null;
  setData: (key: string, data: any) => void;
  getData: (key: string) => any;
  clear: (key: string) => void;
}