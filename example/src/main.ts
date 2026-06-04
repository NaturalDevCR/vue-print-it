import { createApp } from 'vue'
import App from './App.vue'
import { createVuePrintIt } from 'vue-print-it'

const app = createApp(App)

// Configurar el plugin con opciones globales
app.use(createVuePrintIt({
  styleUrls: [
    'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css',
    '/src/assets/print-styles.css'
  ],
  timeout: 1000,
  autoClose: true,
  windowTitle: 'Impresión - Vue Print It',
  preserveStyles: true
}) as any)

app.mount('#app')
