# Examples

## Invoice With Print CSS

```vue
<script setup lang="ts">
import { usePrint } from 'vue-print-it'

const { print } = usePrint()

async function printInvoice() {
  await print('invoice', {
    pageSize: 'A4',
    orientation: 'portrait',
    printCss: [
      '@page { margin: 12mm; }',
      '@media print { .no-print { display: none; } }'
    ]
  })
}
</script>

<template>
  <section id="invoice" class="invoice">
    <h1>Invoice</h1>
    <p>Current form values and selected options are preserved.</p>
    <input value="Customer name">
  </section>

  <button class="no-print" @click="printInvoice">Print</button>
</template>
```

## Hidden Iframe Printing

```ts
await print('receipt', {
  printTarget: 'iframe',
  autoClose: true,
  timeout: 250
})
```

## Explicit Stylesheet and Inline CSS

```ts
await print('report', {
  preserveStyles: false,
  styleUrls: ['/assets/report-print.css'],
  inlineStyles: [
    '.report { font-family: system-ui, sans-serif; }',
    '.page-break { break-before: page; }'
  ]
})
```

## Bridge Printer Picker

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { usePrint, usePrintBridge } from 'vue-print-it'

const { print } = usePrint()
const {
  bridgeState,
  refreshPrinters,
  setDefaultPrinter
} = usePrintBridge()

onMounted(refreshPrinters)

async function printTicket() {
  await print('ticket', {
    useBridge: true,
    printerName: bridgeState?.defaultPrinter || undefined,
    copies: 1
  })
}
</script>

<template>
  <select
    :value="bridgeState?.defaultPrinter || ''"
    @change="setDefaultPrinter(($event.target as HTMLSelectElement).value)"
  >
    <option
      v-for="printer in bridgeState?.availablePrinters || []"
      :key="printer.name"
      :value="printer.name"
    >
      {{ printer.name }}
    </option>
  </select>

  <section id="ticket">
    <h1>Ticket</h1>
  </section>

  <button @click="printTicket">Print ticket</button>
</template>
```

## Experimental Component Ref Printing

`printComponent()` expects a component that is already mounted in the DOM. Prefer `print()` with an element ID for predictable results.

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { usePrint } from 'vue-print-it'
import InvoiceCard from './InvoiceCard.vue'

const invoiceRef = ref()
const { printComponent } = usePrint()

async function printMountedComponent() {
  await printComponent(invoiceRef.value)
}
</script>

<template>
  <InvoiceCard ref="invoiceRef" />
  <button @click="printMountedComponent">Print component</button>
</template>
```
