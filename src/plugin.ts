import type { App, Plugin } from 'vue';
import type { GlobalPrintMethod, VuePrintItOptions } from './types';
import {
  createPrintFunction,
  VUE_PRINT_IT_INJECTION_KEY,
  VUE_PRINT_IT_METHOD_NAME_KEY,
} from './composables/usePrint';

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
export function createVuePrintIt(options: VuePrintItOptions = {}): Plugin {
  return {
    install(app: App) {
      const printFunctions = createPrintFunction(
        options,
        () => app.config.globalProperties.$printBridge || null
      );
      const methodName = options.globalMethodName || '$print';
      const globalPrint = printFunctions.print as GlobalPrintMethod;

      globalPrint.printComponent = printFunctions.printComponent;
      globalPrint.getBridgeStatus = printFunctions.getBridgeStatus;
      globalPrint.getAvailablePrinters = printFunctions.getAvailablePrinters;
      globalPrint.printDirect = printFunctions.printDirect;

      app.config.globalProperties[methodName] = globalPrint;
      app.provide(VUE_PRINT_IT_INJECTION_KEY, printFunctions);
      app.provide(VUE_PRINT_IT_METHOD_NAME_KEY, methodName);
    }
  };
}
