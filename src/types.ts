/**
 * Supported CSS page orientation values
 */
export type PrintPageOrientation = 'portrait' | 'landscape';

/**
 * Print-specific CSS, either as one CSS string or several CSS strings
 */
export type PrintCss = string | string[];

/**
 * Browser print transport
 */
export type PrintTarget = 'window' | 'iframe';

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
  /** Stylesheet URLs to inject after preserved page styles */
  styleUrls?: string[];
  /** Inline CSS strings to inject after stylesheet URLs */
  inlineStyles?: string[];
  /** Delay in milliseconds before printing (default: 1000) */
  timeout?: number;
  /** Whether to automatically close the print window (default: true) */
  autoClose?: boolean;
  /** Title for the print window */
  windowTitle?: string;
  /** Whether to preserve original page styles (default: true) */
  preserveStyles?: boolean;
  /** Whether to include the target element itself instead of only its children (default: true) */
  includeRoot?: boolean;
  /** CSS page size, for example 'A4', 'Letter', or '210mm 297mm' */
  pageSize?: string;
  /** CSS page orientation */
  orientation?: PrintPageOrientation;
  /** Scale applied to the printed content (default: 1) */
  scale?: number;
  /** Print-specific CSS injected after preserved/custom styles */
  printCss?: PrintCss;
  /** Maximum time in milliseconds to wait for stylesheet links to load (default: 5000) */
  styleLoadTimeout?: number;
  /** Whether to wait for images in the print document before printing (default: true) */
  waitForImages?: boolean;
  /** Maximum time in milliseconds to wait for images to load (default: 5000) */
  imageLoadTimeout?: number;
  /** Browser print target (default: 'window') */
  printTarget?: PrintTarget;
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
  /** Stylesheet URLs to inject after preserved page styles */
  styleUrls?: string[];
  /** Inline CSS strings to inject after stylesheet URLs */
  inlineStyles?: string[];
  /** Delay in milliseconds before printing (default: 1000) */
  timeout?: number;
  /** Whether to automatically close the print window (default: true) */
  autoClose?: boolean;
  /** Title for the print window */
  windowTitle?: string;
  /** Whether to preserve original page styles (default: true) */
  preserveStyles?: boolean;
  /** Whether to include the target element itself instead of only its children (default: true) */
  includeRoot?: boolean;
  /** CSS page size, for example 'A4', 'Letter', or '210mm 297mm' */
  pageSize?: string;
  /** CSS page orientation */
  orientation?: PrintPageOrientation;
  /** Scale applied to the printed content (default: 1) */
  scale?: number;
  /** Print-specific CSS injected after preserved/custom styles */
  printCss?: PrintCss;
  /** Maximum time in milliseconds to wait for stylesheet links to load (default: 5000) */
  styleLoadTimeout?: number;
  /** Whether to wait for images in the print document before printing (default: true) */
  waitForImages?: boolean;
  /** Maximum time in milliseconds to wait for images to load (default: 5000) */
  imageLoadTimeout?: number;
  /** Browser print target (default: 'window') */
  printTarget?: PrintTarget;
}

/**
 * Plugin-level configuration options
 */
export interface VuePrintItOptions extends GlobalPrintOptions {
  /** Custom name for the global method (default: '$print') */
  globalMethodName?: string;
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
 * Bridge plugin state exposed through Vue global properties
 */
export interface BridgePluginState {
  availablePrinters: BridgePrinter[];
  defaultPrinter: string | null;
  isConnected: boolean;
  lastUpdated: Date | null;
}

/**
 * Bridge client exposed through Vue global properties
 */
export interface PrintBridgeInstance {
  checkAvailability: () => Promise<boolean>;
  getHealth: () => Promise<BridgeHealthResponse | null>;
  getPrinters: () => Promise<BridgePrinter[]>;
  print: (request: BridgePrintRequest) => Promise<BridgePrintResponse>;
  htmlToBase64: (html: string) => string;
  readonly available: boolean | null;
  updatePrinters?: () => Promise<void>;
  setDefaultPrinter?: (printerName: string) => boolean;
  getDefaultPrinter?: () => string | null;
  getState?: () => BridgePluginState;
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
 * Callable global print method with helper methods attached
 */
export type GlobalPrintMethod = PrintInstance['print'] & Omit<PrintInstance, 'print'>;

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

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $print: GlobalPrintMethod;
    $printBridge?: PrintBridgeInstance;
    $printBridgeState?: BridgePluginState;
  }
}
