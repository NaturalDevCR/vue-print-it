import * as vue from 'vue';
import { App } from 'vue';

/**
 * Configuration options for individual print operations
 */
interface PrintOptions {
    /** Window name for the print window (default: '_blank') */
    name?: string;
    /** Window specifications as array of strings or object with width/height */
    specs?: string[] | {
        width?: number;
        height?: number;
    };
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
interface GlobalPrintOptions {
    /** Window name for the print window (default: '_blank') */
    name?: string;
    /** Window specifications as array of strings or object with width/height */
    specs?: string[] | {
        width?: number;
        height?: number;
    };
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
interface BridgePluginOptions {
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
interface BridgeHealthResponse {
    status: string;
    version: string;
    uptime: number;
}
/**
 * Bridge printer information interface
 */
interface BridgePrinter {
    name: string;
    is_default: boolean;
    status: string;
}
/**
 * Bridge print request interface
 */
interface BridgePrintRequest {
    printer_name?: string;
    content: string;
    content_type: 'html' | 'pdf';
    copies?: number;
    options?: Record<string, any>;
}
/**
 * Bridge print response interface
 */
interface BridgePrintResponse {
    success: boolean;
    job_id: string;
    message: string;
}

/**
 * Creates a Vue 3 plugin for vue-print-it with global printing functionality
 * @param options - Global configuration options for the print plugin
 * @param options.globalMethodName - Custom name for the global method (default: '$print')
 * @returns Vue plugin object with install method
 * @example
 * ```typescript
 * app.use(createVuePrintIt({
 *   windowTitle: 'My App Print',
 *   globalMethodName: '$print'
 * }))
 * ```
 */
declare function createVuePrintIt(options?: GlobalPrintOptions & {
    globalMethodName?: string;
}): {
    install(app: App): void;
};

/**
 * Bridge plugin for vue-print-it that enables direct printer communication
 * @param options - Bridge configuration options
 * @returns Vue plugin object with bridge functionality
 * @example
 * ```typescript
 * app.use(createVuePrintItBridge({
 *   baseUrl: 'http://localhost:8765',
 *   autoConnect: true,
 *   autoSelectDefault: true
 * }))
 * ```
 */
declare function createVuePrintItBridge(options?: BridgePluginOptions): {
    install(app: App): void;
};
/**
 * Composable for accessing bridge functionality with state management
 * @returns Bridge client, state, and utility functions
 * @example
 * ```typescript
 * const { bridgeClient, bridgeState, setDefaultPrinter, refreshPrinters } = usePrintBridge()
 * await refreshPrinters()
 * setDefaultPrinter('HP LaserJet Pro')
 * ```
 */
declare function usePrintBridge(): {
    bridgeClient: any;
    bridgeOptions: unknown;
    bridgeState: any;
    isAvailable: vue.Ref<boolean | null, boolean | null>;
    /**
     * Refreshes the list of available printers
     * @returns Promise that resolves when printers are refreshed
     */
    refreshPrinters: () => Promise<void>;
    /**
     * Sets the default printer
     * @param printerName - Name of the printer to set as default
     * @returns boolean indicating success
     */
    setDefaultPrinter: (printerName: string) => any;
    /**
     * Gets the current default printer
     * @returns Default printer name or null
     */
    getDefaultPrinter: () => any;
    /**
     * Checks the bridge connection status
     * @returns Promise that resolves to connection status
     */
    checkConnection: () => Promise<boolean | null>;
};

/**
 * Vue composable for printing functionality
 * @returns Object containing print functions and bridge methods
 * @example
 * ```typescript
 * const { print, getBridgeStatus } = usePrint()
 * await print('element-id', { windowTitle: 'My Print' })
 * ```
 */
declare function usePrint(): {
    print: any;
    getBridgeStatus: any;
    getAvailablePrinters: any;
    printDirect: any;
};

/**
 * Client for communicating with the print bridge service
 * @example
 * ```typescript
 * const client = new BridgeClient('http://localhost:8765')
 * const isAvailable = await client.checkAvailability()
 * ```
 */
declare class BridgeClient {
    private baseUrl;
    private isAvailable;
    /**
     * Creates a new BridgeClient instance
     * @param baseUrl - Base URL of the bridge service (default: 'http://localhost:8765')
     */
    constructor(baseUrl?: string);
    /**
     * Checks if the bridge service is available and responding
     * @returns Promise that resolves to true if bridge is available
     */
    checkAvailability(): Promise<boolean>;
    /**
     * Gets the health status of the bridge service
     * @returns Promise that resolves to bridge health information or null if unavailable
     */
    getHealth(): Promise<BridgeHealthResponse | null>;
    /**
     * Gets list of available printers from the bridge
     * @returns Promise that resolves to array of available printers
     */
    getPrinters(): Promise<BridgePrinter[]>;
    /**
     * Sends content directly to a printer via the bridge
     * @param request - Print request configuration
     * @returns Promise that resolves to print response with job information
     */
    print(request: BridgePrintRequest): Promise<BridgePrintResponse>;
    /**
     * Converts HTML string to Base64 encoding for bridge transmission
     * @param html - HTML string to encode
     * @returns Base64 encoded string
     */
    htmlToBase64(html: string): string;
    /**
     * Getter para saber si el bridge está disponible
     */
    get available(): boolean | null;
}

export { BridgeClient, type BridgeHealthResponse, type BridgePluginOptions, type BridgePrintRequest, type BridgePrintResponse, type BridgePrinter, type GlobalPrintOptions, type PrintOptions, createVuePrintIt, createVuePrintItBridge, createVuePrintIt as default, usePrint, usePrintBridge };
