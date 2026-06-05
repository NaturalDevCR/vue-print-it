# Vue Print It

[![npm version](https://badge.fury.io/js/vue-print-it.svg)](https://badge.fury.io/js/vue-print-it)
[![npm downloads](https://img.shields.io/npm/dm/vue-print-it.svg)](https://www.npmjs.com/package/vue-print-it)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](https://www.typescriptlang.org/)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D.svg)](https://vuejs.org/)

Vue 3 printing plugin for browser print windows, hidden iframe printing, print-specific CSS, asset readiness, and optional local bridge printing.

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

## Quick Start

```ts
import { createApp } from 'vue'
import { createVuePrintIt } from 'vue-print-it'
import App from './App.vue'

createApp(App)
  .use(createVuePrintIt({
    preserveStyles: true,
    pageSize: 'A4',
    orientation: 'portrait',
    printCss: '@media print { .no-print { display: none; } }'
  }))
  .mount('#app')
```

```vue
<template>
  <section id="invoice">
    <h1>Invoice</h1>
    <p>This section will be printed.</p>
  </section>

  <button @click="$print('invoice')">Print</button>
</template>
```

## Composable

```vue
<script setup lang="ts">
import { usePrint } from 'vue-print-it'

const { print } = usePrint()

async function printInvoice() {
  await print('invoice', {
    pageSize: 'A4',
    orientation: 'landscape',
    scale: 0.95
  })
}
</script>
```

## Documentation

The full documentation now lives in the VitePress site under `docs/`:

- [Getting Started](docs/guide/getting-started.md)
- [Print Options](docs/guide/options.md)
- [Browser Printing](docs/guide/browser-printing.md)
- [Bridge Printing](docs/guide/bridge.md)
- [Framework Setup](docs/guide/frameworks.md)
- [API Reference](docs/api/index.md)
- [Examples](docs/examples.md)

Run the docs locally:

```bash
npm run docs:dev
```

Build the docs:

```bash
npm run docs:build
```

## Development

```bash
npm ci
npm run typecheck
npm test
npm run build
npm run release:check
```

## License

[MIT](LICENSE)
