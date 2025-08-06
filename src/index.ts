export { createVuePrintIt } from './plugin';
export { createVuePrintItBridge, usePrintBridge } from './plugins/bridge-plugin';
export { usePrint } from './composables/usePrint';
export { BridgeClient } from './utils/bridge-client';
export type { 
  PrintOptions, 
  GlobalPrintOptions,
  BridgePluginOptions,
  BridgeHealthResponse, 
  BridgePrinter, 
  BridgePrintRequest, 
  BridgePrintResponse 
} from './types';

// Default export
export { createVuePrintIt as default } from './plugin';