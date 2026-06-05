# API Reference

## Exports

```ts
export {
  createVuePrintIt,
  createVuePrintItBridge,
  usePrintBridge,
  usePrint,
  BridgeClient
}
```

```ts
export type {
  PrintOptions,
  GlobalPrintOptions,
  VuePrintItOptions,
  GlobalPrintMethod,
  PrintCss,
  PrintPageOrientation,
  PrintTarget,
  BridgePluginOptions,
  BridgePluginState,
  PrintBridgeInstance,
  BridgeHealthResponse,
  BridgePrinter,
  BridgePrintRequest,
  BridgePrintResponse
}
```

## createVuePrintIt()

```ts
function createVuePrintIt(options?: VuePrintItOptions): Plugin
```

Registers the Vue plugin, installs the global print method, and provides the print instance used by `usePrint()`.

```ts
app.use(createVuePrintIt({
  globalMethodName: '$print',
  preserveStyles: true,
  includeRoot: true,
  pageSize: 'A4'
}))
```

## usePrint()

```ts
function usePrint(): PrintInstance
```

Returns:

| Method | Description |
| --- | --- |
| `print(element, options?)` | Prints an element ID or `HTMLElement`. |
| `printComponent(componentRef, options?)` | Experimental helper that prints a mounted component's root element. |
| `getBridgeStatus()` | Returns bridge health information when the bridge plugin is installed. |
| `getAvailablePrinters()` | Returns bridge printers when the bridge is installed and available. |
| `printDirect(content, options?)` | Sends raw HTML content directly through the bridge. |

## createVuePrintItBridge()

```ts
function createVuePrintItBridge(options?: BridgePluginOptions): Plugin
```

Registers a bridge client on Vue global properties and provides reactive bridge state.

```ts
app.use(createVuePrintItBridge({
  baseUrl: 'http://localhost:8765',
  autoConnect: true,
  retryAttempts: 3
}))
```

## usePrintBridge()

```ts
function usePrintBridge(): {
  bridgeClient: PrintBridgeInstance | undefined
  bridgeOptions: unknown
  bridgeState: BridgePluginState | undefined
  isAvailable: Ref<boolean | null>
  refreshPrinters: () => Promise<void>
  setDefaultPrinter: (printerName: string) => boolean
  getDefaultPrinter: () => string | null
  checkConnection: () => Promise<boolean>
}
```

Use it to read bridge connection state, refresh printers, and set a default printer.

## Types

```ts
type PrintPageOrientation = 'portrait' | 'landscape'
type PrintCss = string | string[]
type PrintTarget = 'window' | 'iframe'
```

```ts
interface VuePrintItOptions extends GlobalPrintOptions {
  globalMethodName?: string
}
```

```ts
interface PrintOptions extends GlobalPrintOptions {
  onBeforePrint?: () => void | Promise<void>
  onAfterPrint?: () => void | Promise<void>
  onPrintError?: (error: Error) => void
  useBridge?: boolean
  printerName?: string
  copies?: number
  contentType?: 'html' | 'pdf'
}
```

```ts
interface BridgePrinter {
  name: string
  is_default: boolean
  status: string
}

interface BridgePrintRequest {
  printer_name?: string
  content: string
  content_type: 'html' | 'pdf'
  copies?: number
  options?: Record<string, any>
}
```

## Vue Global Properties

The plugin augments Vue component instances with:

```ts
this.$print
this.$printBridge
this.$printBridgeState
```

When `globalMethodName` is customized, the custom method is installed on `app.config.globalProperties` and used by `usePrint()` through the plugin's provided method name.
