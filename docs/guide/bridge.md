# Bridge Printing

Bridge printing is optional. It is useful when an app needs to send jobs directly to a local print service instead of opening the browser print dialog.

The browser print path remains the fallback when `useBridge` is enabled but the bridge is unavailable.

## Register the Bridge Plugin

```ts
import { createApp } from 'vue'
import {
  createVuePrintIt,
  createVuePrintItBridge
} from 'vue-print-it'
import App from './App.vue'

const app = createApp(App)

app.use(createVuePrintItBridge({
  baseUrl: 'http://localhost:8765',
  autoConnect: true,
  autoSelectDefault: true,
  retryAttempts: 3,
  timeout: 2000,
  headers: {
    'X-Bridge-Token': 'local-token'
  }
}))

app.use(createVuePrintIt({
  preserveStyles: true
}))

app.mount('#app')
```

`baseUrl` defaults to `http://localhost:8765`. You can also pass `port` and let the plugin build the local URL.

## Print Through the Bridge

```ts
import { usePrint } from 'vue-print-it'

const { print } = usePrint()

await print('invoice', {
  useBridge: true,
  printerName: 'HP LaserJet Pro',
  copies: 2,
  contentType: 'html'
})
```

The plugin converts the generated HTML document to Base64 before sending it to the bridge.

## Work with Printers

```ts
import { usePrintBridge } from 'vue-print-it'

const {
  bridgeState,
  refreshPrinters,
  setDefaultPrinter,
  checkConnection
} = usePrintBridge()

await checkConnection()
await refreshPrinters()
setDefaultPrinter('Office Printer')
```

`bridgeState` includes:

| Property | Type | Description |
| --- | --- | --- |
| `availablePrinters` | `BridgePrinter[]` | Printers returned by the bridge service. |
| `defaultPrinter` | <code>string &#124; null</code> | Selected default printer name. |
| `isConnected` | `boolean` | Last known bridge connection status. |
| `lastUpdated` | <code>Date &#124; null</code> | Last time printers were refreshed. |

## Direct Bridge API

The global print method and `usePrint()` instance expose bridge helpers.

```ts
const {
  getBridgeStatus,
  getAvailablePrinters,
  printDirect
} = usePrint()

const health = await getBridgeStatus()
const printers = await getAvailablePrinters()

await printDirect('<h1>Receipt</h1>', {
  printer_name: printers[0]?.name,
  content_type: 'html',
  copies: 1
})
```

`printDirect()` requires the bridge plugin. Unlike `print(..., { useBridge: true })`, it does not fall back to browser printing when the bridge is unavailable.

## Bridge Client Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `baseUrl` | `string` | `http://localhost:8765` | Full bridge service URL. |
| `port` | `number` | `8765` | Port used when `baseUrl` is not provided. |
| `autoConnect` | `boolean` | `false` | Checks bridge availability when the plugin is installed. |
| `autoSelectDefault` | `boolean` | `true` | Selects the bridge default printer, or the first printer, when no default is set. |
| `defaultPrinter` | `string` | `undefined` | Initial default printer name. |
| `timeout` | `number` | `2000` | Request timeout in milliseconds. |
| `retryAttempts` | `number` | `3` | Number of attempts for bridge requests. |
| `headers` | `Record<string, string>` | `{}` | Extra headers added to bridge requests. |
| `debug` | `boolean` | `false` | Enables bridge debug logging. |
