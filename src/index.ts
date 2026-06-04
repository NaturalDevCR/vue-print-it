export { createVuePrintIt } from './plugin';
export { createVuePrintItBridge, usePrintBridge } from './plugins/bridge-plugin';
export { usePrint } from './composables/usePrint';
export { BridgeClient } from './utils/bridge-client';
export type { 
  PrintCss,
  PrintPageOrientation,
  PrintTarget,
  PrintOptions, 
  GlobalPrintOptions,
  VuePrintItOptions,
  GlobalPrintMethod,
  BridgePluginOptions,
  BridgePluginState,
  PrintBridgeInstance,
  BridgeHealthResponse, 
  BridgePrinter, 
  BridgePrintRequest, 
  BridgePrintResponse 
} from './types';

// Default export
export { createVuePrintIt as default } from './plugin';
