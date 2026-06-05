# Getting Started

`vue-print-it` is a Vue 3 plugin for printing existing DOM content. It can use the browser print dialog or an optional local bridge service for direct printer jobs.

## Install

```bash
npm install vue-print-it
```

```bash
pnpm add vue-print-it
```

```bash
yarn add vue-print-it
```

## Register the Plugin

```ts
import { createApp } from 'vue'
import { createVuePrintIt } from 'vue-print-it'
import App from './App.vue'

const app = createApp(App)

app.use(createVuePrintIt({
  preserveStyles: true,
  pageSize: 'A4',
  orientation: 'portrait',
  printCss: '@media print { .no-print { display: none; } }'
}))

app.mount('#app')
```

The plugin registers a global method named `$print` by default.

```vue
<template>
  <section id="invoice">
    <h1>Invoice</h1>
    <p>This section will be printed.</p>
  </section>

  <button @click="$print('invoice')">Print invoice</button>
</template>
```

## Use the Composable

`usePrint()` returns the same print instance provided by the plugin. If you use a custom global method name, the composable respects it through Vue provide/inject.

```vue
<script setup lang="ts">
import { usePrint } from 'vue-print-it'

const { print } = usePrint()

async function printInvoice() {
  await print('invoice', {
    windowTitle: 'Invoice',
    pageSize: 'A4',
    orientation: 'landscape',
    scale: 0.95
  })
}
</script>
```

## Custom Global Method

```ts
app.use(createVuePrintIt({
  globalMethodName: '$appPrint'
}))
```

```vue
<template>
  <button @click="$appPrint('invoice')">Print</button>
</template>
```

## Standalone Printing

You can call `usePrint()` without installing the plugin. In that case, it uses default browser print options.

```ts
import { usePrint } from 'vue-print-it'

const { print } = usePrint()

await print(document.querySelector('#invoice') as HTMLElement)
```

## Build the Docs Locally

This documentation site is powered by VitePress. VitePress currently documents Node.js 20 or newer as its requirement for the docs tooling.

```bash
npm run docs:dev
```

```bash
npm run docs:build
```
