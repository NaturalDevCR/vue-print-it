# Vue Print It 🖨️

[![npm version](https://badge.fury.io/js/vue-print-it.svg)](https://badge.fury.io/js/vue-print-it)
[![npm downloads](https://img.shields.io/npm/dm/vue-print-it.svg)](https://www.npmjs.com/package/vue-print-it)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-4FC08D.svg)](https://vuejs.org/)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/vue-print-it)](https://bundlephobia.com/package/vue-print-it)
[![GitHub stars](https://img.shields.io/github/stars/NaturalDevCR/vue-print-it.svg)](https://github.com/NaturalDevCR/vue-print-it/stargazers)
[![GitHub issues](https://img.shields.io/github/issues/NaturalDevCR/vue-print-it.svg)](https://github.com/NaturalDevCR/vue-print-it/issues)

A simple and powerful Vue 3 plugin for printing components and elements with automatic style injection and TypeScript support.

## Features

✅ **Vue 3 Compatible** - Built specifically for Vue 3 with Composition API support  
✅ **TypeScript Support** - Full TypeScript definitions included  
✅ **Automatic Style Injection** - Preserves your component styles in print  
✅ **Multiple Usage Patterns** - Global plugin, composable, or direct function calls  
✅ **Event Callbacks** - Handle before/after print and error events  
✅ **Flexible Configuration** - Global and per-print options  
✅ **Custom Styles** - Add custom CSS for print layouts  
✅ **Window Specifications** - Control print window dimensions and behavior  

## Installation

```bash
npm install vue-print-it
```

```bash
yarn add vue-print-it
```

```bash
pnpm add vue-print-it
```

### Framework-Specific Setup

#### Quasar Framework

For Quasar projects, create a boot file to register the plugin:

1. **Create a boot file:**

```bash
quasar new boot vue-print-it
```

2. **Configure the boot file (`src/boot/vue-print-it.ts`):**

```typescript
import { boot } from 'quasar/wrappers'
import { createVuePrintIt } from 'vue-print-it'

export default boot(({ app }) => {
  app.use(createVuePrintIt({
    // Global configuration for your Quasar app
    windowTitle: 'Quasar Print Document',
    preserveStyles: true,
    autoClose: true,
    timeout: 1000,
    specs: ['fullscreen=yes', 'titlebar=yes', 'scrollbars=yes'],
    globalMethodName: '$qPrint' // Optional: Quasar-specific method name
  }))
})
```

3. **Register the boot file in `quasar.conf.js`:**

```javascript
// quasar.conf.js
module.exports = function (/* ctx */) {
  return {
    // ...
    boot: [
      'vue-print-it' // Add this line
    ],
    // ...
  }
}
```

4. **Use in Quasar components:**

```vue
<template>
  <q-page>
    <div id="quasar-content">
      <q-card>
        <q-card-section>
          <div class="text-h6">Printable Content</div>
          <p>This content will be printed with Quasar styles preserved.</p>
        </q-card-section>
      </q-card>
    </div>
    
    <q-btn 
      color="primary" 
      icon="print" 
      label="Print" 
      @click="$print('quasar-content')"
    />
  </q-page>
</template>
```

#### Nuxt 3

For Nuxt 3 projects, create a plugin to register vue-print-it:

1. **Create a plugin file (`plugins/vue-print-it.client.ts`):**

```typescript
import { createVuePrintIt } from 'vue-print-it'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(createVuePrintIt({
    // Global configuration for your Nuxt app
    windowTitle: 'Nuxt Print Document',
    preserveStyles: true,
    autoClose: true,
    timeout: 1500,
    specs: { width: 1024, height: 768 },
    globalMethodName: '$nuxtPrint' // Optional: Nuxt-specific method name
  }))
})
```

**Note:** The `.client.ts` suffix ensures the plugin only runs on the client side, which is necessary for printing functionality.

2. **Use in Nuxt pages/components:**

```vue
<template>
  <div>
    <div id="nuxt-content">
      <h1>{{ $route.meta.title || 'Nuxt Page' }}</h1>
      <p>This is a Nuxt page with printable content.</p>
      <NuxtImg src="/logo.png" alt="Logo" />
    </div>
    
    <button 
      class="btn btn-primary" 
      @click="handlePrint"
    >
      Print Page
    </button>
  </div>
</template>

<script setup lang="ts">
// You can also use the composable in Nuxt
const { $print } = useNuxtApp()

function handlePrint() {
  // Using global method
  $print('nuxt-content', {
    windowTitle: `Print - ${useRoute().meta.title}`,
    styles: [
      '@media print { .no-print { display: none; } }'
    ]
  })
}

// Or use the composable
// const { print } = usePrint()
// print('nuxt-content', options)
</script>
```

3. **Alternative: Using the composable in Nuxt:**

```vue
<script setup lang="ts">
import { usePrint } from 'vue-print-it'

const { print } = usePrint()

function printContent() {
  print('content-id', {
    windowTitle: 'Nuxt Document',
    onBeforePrint: () => {
      console.log('Printing from Nuxt app...')
    }
  })
}
</script>
```

#### Nuxt 2 (Legacy)

For Nuxt 2 projects:

1. **Create a plugin file (`plugins/vue-print-it.js`):**

```javascript
import Vue from 'vue'
import { createVuePrintIt } from 'vue-print-it'

Vue.use(createVuePrintIt({
  windowTitle: 'Nuxt 2 Print Document',
  preserveStyles: true
}))
```

2. **Register in `nuxt.config.js`:**

```javascript
export default {
  plugins: [
    { src: '~/plugins/vue-print-it.js', mode: 'client' }
  ]
}
```

## Quick Start

### 1. Plugin Registration (Global Usage)

```typescript
// main.ts
import { createApp } from 'vue'
import { createVuePrintIt } from 'vue-print-it'
import App from './App.vue'

const app = createApp(App)

// Register the plugin with global options
app.use(createVuePrintIt({
  name: '_blank',
  specs: ['fullscreen=yes', 'titlebar=yes', 'scrollbars=yes'],
  styles: [],
  timeout: 1000,
  autoClose: true,
  windowTitle: 'Print Document',
  preserveStyles: true,
  globalMethodName: '$print' // Optional: customize global method name (default: '$print')
}))

app.mount('#app')
```

## Best Practices

### Avoiding Name Conflicts

1. **Check for existing global methods** before using the default `$print`:
   ```javascript
   // Check if $print already exists
   if (app.config.globalProperties.$print) {
     console.warn('$print method already exists, consider using a custom name')
   }
   ```

If you need to avoid conflicts with other plugins or prefer a different method name:

```typescript
// Use a custom global method name
app.use(createVuePrintIt({
  globalMethodName: '$vuePrint', // Custom name
  // ... other options
}))

// Or use a more specific name
app.use(createVuePrintIt({
  globalMethodName: '$printIt',
  // ... other options
}))
```

Then use it in your templates:

```vue
<template>
  <div>
    <div id="content-to-print">
      <h1>Hello World!</h1>
      <p>This content will be printed.</p>
    </div>
    
    <!-- Using custom method name -->
    <button @click="$vuePrint('content-to-print')">Print Content</button>
    
    <!-- Or with options -->
    <button @click="$printIt('content-to-print', { 
      windowTitle: 'My Custom Title',
      specs: { width: 800, height: 600 }
    })">
      Print with Options
    </button>
  </div>
</template>
```

### 2. Component Usage

#### Option A: Global Method (Template)

```vue
<template>
  <div>
    <div id="content-to-print">
      <h1>Hello World!</h1>
      <p>This content will be printed.</p>
    </div>
    
    <button @click="$print('content-to-print')">Print Content</button>
    
    <button @click="$print('content-to-print', { 
      windowTitle: 'My Custom Title',
      specs: { width: 800, height: 600 }
    })">
      Print with Options
    </button>
  </div>
</template>
```

#### Option B: Composable (Script Setup)

```vue
<template>
  <div>
    <div id="printable-content">
      <h2>Vue Print It Demo</h2>
      <p>Easy printing for Vue 3!</p>
    </div>
    
    <button @click="handlePrint">Print Now</button>
  </div>
</template>

<script setup lang="ts">
import { usePrint } from 'vue-print-it'

const { print } = usePrint()

function handlePrint() {
  print('printable-content', {
    windowTitle: 'My Document',
    styles: [
      'body { font-family: Arial, sans-serif; }',
      '.highlight { background-color: yellow; }'
    ]
  })
}
</script>
```

#### Option C: With Event Callbacks

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { usePrint } from 'vue-print-it'

const { print } = usePrint()
const isPrinting = ref(false)
const printStatus = ref('Ready')

function printWithEvents() {
  print('my-content', {
    specs: { width: 800, height: 600 },
    onBeforePrint: () => {
      isPrinting.value = true
      printStatus.value = 'Preparing to print...'
      console.log('Print process started')
    },
    onAfterPrint: () => {
      isPrinting.value = false
      printStatus.value = 'Print completed successfully'
      console.log('Print process finished')
    },
    onPrintError: (error: Error) => {
      isPrinting.value = false
      printStatus.value = `Print failed: ${error.message}`
      console.error('Print error:', error)
    }
  })
}
</script>
```

## API Reference

### Plugin Options (GlobalPrintOptions)

```typescript
interface GlobalPrintOptions {
  name?: string                    // Window name (default: '_blank')
  specs?: string[] | WindowSpecs   // Window specifications
  styles?: string[]                // Global custom styles
  timeout?: number                 // Delay before printing (default: 1000ms)
  autoClose?: boolean              // Auto-close print window (default: true)
  windowTitle?: string             // Print window title
  preserveStyles?: boolean         // Inject page styles (default: true)
}

interface WindowSpecs {
  width?: number   // Window width in pixels
  height?: number  // Window height in pixels
}
```

### Print Options (PrintOptions)

```typescript
interface PrintOptions extends GlobalPrintOptions {
  onBeforePrint?: () => void | Promise<void>     // Called before printing
  onAfterPrint?: () => void | Promise<void>      // Called after printing
  onPrintError?: (error: Error) => void          // Called on print errors
}
```

### Print Function

```typescript
print(element: HTMLElement | string, options?: PrintOptions): Promise<void>
```

**Parameters:**
- `element`: HTML element or element ID to print
- `options`: Print configuration options

## Usage Examples

### Basic Printing

```vue
<template>
  <div>
    <div id="invoice">
      <h1>Invoice #12345</h1>
      <p>Amount: $100.00</p>
    </div>
    <button @click="$print('invoice')">Print Invoice</button>
  </div>
</template>
```

### Custom Window Size

```vue
<script setup>
import { usePrint } from 'vue-print-it'

const { print } = usePrint()

function printReceipt() {
  print('receipt', {
    specs: { width: 400, height: 600 },
    windowTitle: 'Receipt'
  })
}
</script>
```

### Custom Print Styles

```vue
<script setup>
import { usePrint } from 'vue-print-it'

const { print } = usePrint()

function printReport() {
  print('report', {
    styles: [
      '@media print { .no-print { display: none; } }',
      'body { margin: 0; padding: 20px; }',
      '.header { border-bottom: 2px solid #000; }'
    ],
    preserveStyles: false // Don't include page styles
  })
}
</script>
```

### Error Handling

```vue
<script setup>
import { usePrint } from 'vue-print-it'

const { print } = usePrint()

function safePrint() {
  print('content', {
    onPrintError: (error) => {
      alert(`Print failed: ${error.message}`)
      // Log to analytics, show user notification, etc.
    }
  })
}
</script>
```

### Print Component Content

```vue
<template>
  <div id="my-component" class="printable">
    <h2>{{ title }}</h2>
    <p>{{ content }}</p>
    <button @click="printThis" class="no-print">Print This Component</button>
  </div>
</template>

<script setup>
import { usePrint } from 'vue-print-it'

const { print } = usePrint()
const title = ref('My Document')
const content = ref('This is the content to print.')

function printThis() {
  print('my-component', {
    styles: ['.no-print { display: none; }']
  })
}
</script>
```

## Advanced Configuration

### Global Plugin Setup with Custom Defaults

```typescript
// main.ts
import { createApp } from 'vue'
import { createVuePrintIt } from 'vue-print-it'

const app = createApp(App)

app.use(createVuePrintIt({
  // Global defaults for all print operations
  windowTitle: 'Company Document',
  timeout: 2000,
  autoClose: false,
  preserveStyles: true,
  styles: [
    '@page { margin: 1in; }',
    'body { font-family: "Times New Roman", serif; }'
  ],
  specs: { width: 1024, height: 768 }
}))
```

### TypeScript Usage

```typescript
import { usePrint, type PrintOptions } from 'vue-print-it'

const { print } = usePrint()

const printOptions: PrintOptions = {
  windowTitle: 'Typed Document',
  specs: { width: 800, height: 600 },
  onBeforePrint: async () => {
    console.log('Starting print...')
  },
  onAfterPrint: async () => {
    console.log('Print completed!')
  },
  onPrintError: (error: Error) => {
    console.error('Print error:', error.message)
  }
}

print('content-id', printOptions)
```

## Browser Compatibility

- ✅ Chrome 88+
- ✅ Firefox 85+
- ✅ Safari 14+
- ✅ Edge 88+

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you find this plugin helpful, please consider giving it a ⭐ on GitHub!

---

**Made with ❤️ for the Vue.js community**

### Plugin Configuration

```typescript
interface PluginOptions extends GlobalPrintOptions {
  globalMethodName?: string  // Custom name for global method (default: '$print')
}
```

**Plugin Options:**
- `globalMethodName`: Customize the global method name to avoid conflicts (default: `'$print'`)
- All `GlobalPrintOptions` are also available as plugin-level defaults

**Common globalMethodName alternatives:**
- `'$print'` (default)
- `'$vuePrint'` 
- `'$printIt'`
- `'$printComponent'`
- `'$doPrint'`