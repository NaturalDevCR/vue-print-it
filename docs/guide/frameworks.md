# Framework Setup

`vue-print-it` is browser-only at the moment printing is triggered. In SSR frameworks, register it on the client side.

## Vite and Vue CLI

```ts
import { createApp } from 'vue'
import { createVuePrintIt } from 'vue-print-it'
import App from './App.vue'

createApp(App)
  .use(createVuePrintIt({
    preserveStyles: true,
    pageSize: 'A4'
  }))
  .mount('#app')
```

## Nuxt 3

Create a client plugin.

```ts
// plugins/vue-print-it.client.ts
import { createVuePrintIt } from 'vue-print-it'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(createVuePrintIt({
    preserveStyles: true,
    windowTitle: 'Nuxt Print Document',
    globalMethodName: '$nuxtPrint'
  }))
})
```

Use it from a component.

```vue
<template>
  <section id="nuxt-content">
    <h1>Printable Nuxt content</h1>
  </section>

  <button @click="$nuxtPrint('nuxt-content')">Print</button>
</template>
```

You can also import `usePrint()` directly in client-side component code.

## Quasar

Create a Quasar boot file.

```bash
quasar new boot vue-print-it
```

```ts
// src/boot/vue-print-it.ts
import { boot } from 'quasar/wrappers'
import { createVuePrintIt } from 'vue-print-it'

export default boot(({ app }) => {
  app.use(createVuePrintIt({
    preserveStyles: true,
    windowTitle: 'Quasar Print Document',
    globalMethodName: '$qPrint'
  }))
})
```

Register the boot file in your Quasar config.

```js
// quasar.config.js
export default {
  boot: ['vue-print-it']
}
```

Use the global method in a component.

```vue
<template>
  <q-page>
    <section id="quasar-content">
      <q-card>
        <q-card-section>
          Printable Quasar content
        </q-card-section>
      </q-card>
    </section>

    <q-btn color="primary" icon="print" label="Print" @click="$qPrint('quasar-content')" />
  </q-page>
</template>
```

## Nuxt 2

Nuxt 2 normally runs Vue 2. `vue-print-it` is a Vue 3 plugin, so Nuxt 2 is not a supported target for this package.
