# Print Options

Options can be configured globally with `createVuePrintIt()` and overridden per print call. Local options win over global options.

```ts
app.use(createVuePrintIt({
  preserveStyles: true,
  styleUrls: ['/print.css'],
  pageSize: 'A4'
}))

await print('invoice', {
  orientation: 'landscape',
  printCss: '.no-print { display: none; }'
})
```

## Browser Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | `string` | `'_blank'` | Name passed to `window.open()`. |
| `specs` | `string[]` or `{ width?: number; height?: number }` | `['fullscreen=yes', 'titlebar=yes', 'scrollbars=yes']` | Window feature string for popup printing. |
| `timeout` | `number` | `1000` | Delay in milliseconds before `print()` is called after the document is prepared. |
| `autoClose` | `boolean` | `true` | Closes the popup or removes the iframe after printing is triggered. |
| `windowTitle` | `string` | Current document title | Title used in the generated print document. |
| `preserveStyles` | `boolean` | `true` | Copies page styles into the print document. |
| `includeRoot` | `boolean` | `true` | Prints the target element itself with `outerHTML`. Set to `false` to print only its children. |
| `printTarget` | <code>'window' &#124; 'iframe'</code> | `'window'` | Uses a popup window or hidden iframe for browser printing. |

## CSS Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `styles` | `string[]` | `[]` | Legacy mixed list. Values that look like URLs are injected as stylesheet links; other values are injected as inline CSS. |
| `styleUrls` | `string[]` | `[]` | Stylesheet URLs injected after preserved page styles. |
| `inlineStyles` | `string[]` | `[]` | Inline CSS strings injected after stylesheet URLs. |
| `pageSize` | `string` | `undefined` | Adds an `@page size` rule. Examples: `A4`, `Letter`, `210mm 297mm`. |
| `orientation` | <code>'portrait' &#124; 'landscape'</code> | `undefined` | Adds orientation to the generated `@page size` rule. |
| `scale` | `number` | `1` | Applies print scaling to the `.vue-print-it-content` wrapper. |
| `printCss` | <code>string &#124; string[]</code> | `[]` | Print-specific CSS injected after preserved and custom styles. |
| `styleLoadTimeout` | `number` | `5000` | Maximum wait for stylesheet links to load before printing continues. |
| `waitForImages` | `boolean` | `true` | Waits for images in the print document before printing. |
| `imageLoadTimeout` | `number` | `5000` | Maximum wait for images to load before printing continues. |

## Callback Options

Callbacks are per-print options.

| Option | Type | Description |
| --- | --- | --- |
| `onBeforePrint` | <code>() => void &#124; Promise&lt;void&gt;</code> | Runs before the print document is prepared. |
| `onAfterPrint` | <code>() => void &#124; Promise&lt;void&gt;</code> | Runs after `print()` has been triggered successfully. |
| `onPrintError` | `(error: Error) => void` | Runs when printing fails. The error is re-thrown after the callback. |

## Bridge Options

These options are used when `useBridge` is set on a print call.

| Option | Type | Description |
| --- | --- | --- |
| `useBridge` | `boolean` | Attempts direct bridge printing when a bridge client is installed and available. |
| `printerName` | `string` | Printer name to use for the bridge job. |
| `copies` | `number` | Number of copies to request through the bridge. |
| `contentType` | <code>'html' &#124; 'pdf'</code> | Content type sent to the bridge. |

See [Bridge Printing](./bridge.md) for setup details.

## Merge Order

CSS is injected in this order:

1. Preserved page styles, when `preserveStyles` is enabled.
2. Global `styles`, `styleUrls`, and `inlineStyles`.
3. Local `styles`, `styleUrls`, and `inlineStyles`.
4. Managed print CSS from `pageSize`, `orientation`, and `scale`.
5. Global and local `printCss`.
