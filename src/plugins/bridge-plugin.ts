import type { App, Plugin } from 'vue';
import { getCurrentInstance, inject, ref, onMounted, reactive } from 'vue';
import type {
  BridgePluginOptions,
  BridgePluginState,
  PrintBridgeInstance,
} from '../types';
import { BridgeClient } from '../utils/bridge-client';

interface EnhancedBridgeClient extends BridgeClient, PrintBridgeInstance {
  updatePrinters: () => Promise<void>;
  setDefaultPrinter: (printerName: string) => boolean;
  getDefaultPrinter: () => string | null;
  getState: () => BridgePluginState;
}

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
export function createVuePrintItBridge(options: BridgePluginOptions = {}): Plugin {
  const baseUrl = options.baseUrl || `http://localhost:${options.port || 8765}`;
  const bridgeOptions = {
    baseUrl,
    autoConnect: false,
    autoSelectDefault: true,
    timeout: 2000,
    retryAttempts: 3,
    ...options
  };

  // Create reactive bridge state
  const bridgeState = reactive<BridgePluginState>({
    availablePrinters: [],
    defaultPrinter: bridgeOptions.defaultPrinter || null,
    isConnected: false,
    lastUpdated: null
  });

  return {
    install(app: App) {
      const bridgeClient = new BridgeClient(bridgeOptions);
      
      /**
       * Updates the list of available printers and selects default if needed
       * @returns Promise that resolves when printers are updated
       */
      const updatePrinters = async (): Promise<void> => {
        try {
          const isAvailable = await bridgeClient.checkAvailability();
          bridgeState.isConnected = isAvailable;
          
          if (isAvailable) {
            const printers = await bridgeClient.getPrinters();
            bridgeState.availablePrinters = printers;
            bridgeState.lastUpdated = new Date();
            
            // Auto-select default printer if not set
            if (!bridgeState.defaultPrinter && printers.length > 0) {
              if (bridgeOptions.autoSelectDefault) {
                // First try to find a printer marked as default
                const defaultPrinter = printers.find(p => p.is_default);
                if (defaultPrinter) {
                  bridgeState.defaultPrinter = defaultPrinter.name;
                } else {
                  // Fallback to first available printer
                  bridgeState.defaultPrinter = printers[0].name;
                }
                
                if (bridgeOptions.debug) {
                  console.debug(`Auto-selected default printer: ${bridgeState.defaultPrinter}`);
                }
              }
            }
          }
        } catch (error) {
          if (bridgeOptions.debug) {
            console.warn('Failed to update printers:', error);
          }
          bridgeState.isConnected = false;
        }
      };
      
      /**
       * Sets the default printer
       * @param printerName - Name of the printer to set as default
       * @returns boolean indicating success
       */
      const setDefaultPrinter = (printerName: string): boolean => {
        const printer = bridgeState.availablePrinters.find(p => p.name === printerName);
        if (printer) {
          bridgeState.defaultPrinter = printerName;
          if (bridgeOptions.debug) {
            console.debug(`Default printer changed to: ${printerName}`);
          }
          return true;
        }
        if (bridgeOptions.debug) {
          console.warn(`Printer '${printerName}' not found in available printers`);
        }
        return false;
      };
      
      /**
       * Gets the current default printer name
       * @returns Default printer name or null
       */
      const getDefaultPrinter = (): string | null => {
        return bridgeState.defaultPrinter;
      };
      
      // Enhance the class instance without losing prototype methods.
      const enhancedBridgeClient: EnhancedBridgeClient = Object.assign(bridgeClient, {
        updatePrinters,
        setDefaultPrinter,
        getDefaultPrinter,
        getState: () => ({ ...bridgeState })
      });
      
      // Provide bridge client and state globally
      app.provide('vuePrintItBridge', enhancedBridgeClient);
      app.provide('vuePrintItBridgeOptions', bridgeOptions);
      app.provide('vuePrintItBridgeState', bridgeState);
      
      // Add to global properties for template access
      app.config.globalProperties.$printBridge = enhancedBridgeClient;
      app.config.globalProperties.$printBridgeState = bridgeState;
      
      // Auto-connect and update printers if enabled
      if (bridgeOptions.autoConnect) {
        updatePrinters().catch(() => {
          console.debug('Bridge auto-connect failed - will retry on first use');
        });
      }
    }
  };
}

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
export function usePrintBridge() {
  const instance = getCurrentInstance();
  const bridgeClient =
    inject<EnhancedBridgeClient | null>('vuePrintItBridge', null) ||
    instance?.appContext.config.globalProperties.$printBridge;
  const bridgeOptions = inject('vuePrintItBridgeOptions');
  const bridgeState =
    inject<BridgePluginState | null>('vuePrintItBridgeState', null) ||
    instance?.appContext.config.globalProperties.$printBridgeState;
  
  const isAvailable = ref<boolean | null>(null);
  
  onMounted(async () => {
    if (bridgeClient) {
      isAvailable.value = await bridgeClient.checkAvailability();
      // Auto-update printers on mount if not already done
      if (
        isAvailable.value &&
        bridgeState?.availablePrinters.length === 0 &&
        bridgeClient.updatePrinters
      ) {
        await bridgeClient.updatePrinters();
      }
    }
  });
  
  return {
    bridgeClient,
    bridgeOptions,
    bridgeState,
    isAvailable,
    /**
     * Refreshes the list of available printers
     * @returns Promise that resolves when printers are refreshed
     */
    refreshPrinters: async () => {
      if (bridgeClient?.updatePrinters) {
        await bridgeClient.updatePrinters();
        isAvailable.value = bridgeState?.isConnected || false;
      }
    },
    /**
     * Sets the default printer
     * @param printerName - Name of the printer to set as default
     * @returns boolean indicating success
     */
    setDefaultPrinter: (printerName: string) => {
      return bridgeClient?.setDefaultPrinter ? bridgeClient.setDefaultPrinter(printerName) : false;
    },
    /**
     * Gets the current default printer
     * @returns Default printer name or null
     */
    getDefaultPrinter: () => {
      return bridgeClient?.getDefaultPrinter ? bridgeClient.getDefaultPrinter() : null;
    },
    /**
     * Checks the bridge connection status
     * @returns Promise that resolves to connection status
     */
    checkConnection: async () => {
      if (bridgeClient) {
        isAvailable.value = await bridgeClient.checkAvailability();
        return isAvailable.value;
      }
      return false;
    }
  };
}
