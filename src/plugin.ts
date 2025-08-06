import type { App } from 'vue';
import type { GlobalPrintOptions } from './types';
import { createPrintFunction } from './composables/usePrint';

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
export function createVuePrintIt(options: GlobalPrintOptions & { globalMethodName?: string } = {}) {
  return {
    install(app: App) {
      const printFunctions = createPrintFunction(options);
      
      // Allow customizing the global method name
      const methodName = options.globalMethodName || '$print';
      
      // Register the main method and additional methods
      app.config.globalProperties[methodName] = printFunctions.print;
      
      // Only add bridge methods if bridge plugin is installed
      const bridgeClient = app.config.globalProperties.$printBridge;
      if (bridgeClient) {
        app.config.globalProperties[methodName].getBridgeStatus = printFunctions.getBridgeStatus;
        app.config.globalProperties[methodName].getAvailablePrinters = printFunctions.getAvailablePrinters;
        app.config.globalProperties[methodName].printDirect = printFunctions.printDirect;
      }
    }
  };
}