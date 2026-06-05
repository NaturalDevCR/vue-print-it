# Browser Printing

Browser printing is the default mode. `vue-print-it` clones the target element, builds a print document, injects styles, waits for assets, and then triggers the browser print dialog.

## Print an Element

Pass an element ID or an `HTMLElement`.

```ts
await print('invoice')
```

```ts
const invoice = document.querySelector('#invoice') as HTMLElement
await print(invoice)
```

By default, the printed output includes the target element itself. This preserves root classes and attributes.

```html
<section id="invoice" class="invoice-print-root">
  ...
</section>
```

Set `includeRoot: false` when you only want the element's children.

```ts
await print('invoice', {
  includeRoot: false
})
```

## Configure Page Size and Print CSS

```ts
await print('invoice', {
  pageSize: 'A4',
  orientation: 'portrait',
  scale: 0.95,
  printCss: [
    '@page { margin: 12mm; }',
    '@media print { .no-print { display: none; } }'
  ]
})
```

`pageSize` and `orientation` generate an `@page size` rule. `printCss` is injected after preserved and custom styles, so it can be used for print-only overrides.

## Preserve Styles

With `preserveStyles: true`, the plugin copies inline `<style>` tags, stylesheet links, and accessible stylesheet rules from the current page into the print document.

```ts
await print('invoice', {
  preserveStyles: true,
  styleLoadTimeout: 5000
})
```

Cross-origin stylesheets may not expose their CSS rules to the browser. The stylesheet link is still cloned, but inaccessible `cssRules` are ignored.

## Add Custom Styles

Use `styleUrls` and `inlineStyles` when you want explicit print assets.

```ts
await print('invoice', {
  styleUrls: ['/print.css'],
  inlineStyles: [
    '.invoice { color: #111; }',
    '.screen-only { display: none; }'
  ]
})
```

The older `styles` option is still supported for compatibility. Values that look like URLs are loaded as stylesheet links, and other values are injected as inline CSS.

## Wait for Assets

The print flow waits for:

- Preserved stylesheet links.
- Custom stylesheet URLs.
- `document.fonts.ready`, when the browser exposes it.
- Images in the print document, unless `waitForImages` is `false`.

```ts
await print('invoice', {
  styleLoadTimeout: 3000,
  waitForImages: true,
  imageLoadTimeout: 3000
})
```

Timeouts keep printing from hanging indefinitely when a stylesheet or image fails to load.

## Popup vs Iframe

The default print target is a popup window.

```ts
await print('invoice', {
  printTarget: 'window',
  specs: { width: 1024, height: 768 }
})
```

Use a hidden iframe when you want to avoid opening a separate window.

```ts
await print('invoice', {
  printTarget: 'iframe',
  autoClose: true
})
```

Popup printing should usually be triggered from a user gesture, such as a button click, so browsers do not block the print window.

## Form and Canvas State

The printed clone preserves current `input`, `textarea`, and `select` values. Canvas elements are converted to images when `toDataURL()` is available, which keeps rendered charts or signatures visible in the print output.
