<template>
  <div class="card">
    <div class="card-header">
      <h3>⚡ Ejemplo con Callbacks</h3>
    </div>
    <div class="card-body">
      <p>Usa el composable <code>usePrint</code> con eventos personalizados:</p>
      
      <div class="mb-3">
        <label class="form-label">Estado de impresión:</label>
        <div class="alert" :class="statusClass">
          {{ printStatus }}
        </div>
      </div>
      
      <div class="d-grid gap-2">
        <button 
          @click="printWithEvents" 
          class="btn btn-warning"
          :disabled="isPrinting"
        >
          {{ isPrinting ? '⏳ Imprimiendo...' : '🎯 Imprimir con Eventos' }}
        </button>
        
        <button 
          @click="printWithErrorSimulation" 
          class="btn btn-danger"
        >
          ❌ Simular Error de Impresión
        </button>
      </div>
      
      <div class="mt-3">
        <h5>📊 Log de eventos:</h5>
        <div class="log-container">
          <div 
            v-for="(log, index) in eventLogs" 
            :key="index"
            class="log-entry"
            :class="log.type"
          >
            <small class="text-muted">{{ log.timestamp }}</small>
            <strong>{{ log.event }}:</strong> {{ log.message }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePrint } from 'vue-print-it'

const printStatus = ref('Listo para imprimir')
const isPrinting = ref(false)
const eventLogs = ref<Array<{timestamp: string, event: string, message: string, type: string}>>([])

const statusClass = computed(() => {
  if (isPrinting.value) return 'alert-warning'
  if (printStatus.value.includes('Error')) return 'alert-danger'
  if (printStatus.value.includes('Completado')) return 'alert-success'
  return 'alert-info'
})

function addLog(event: string, message: string, type: string = 'info') {
  eventLogs.value.unshift({
    timestamp: new Date().toLocaleTimeString(),
    event,
    message,
    type
  })
  
  // Mantener solo los últimos 10 logs
  if (eventLogs.value.length > 10) {
    eventLogs.value = eventLogs.value.slice(0, 10)
  }
}

function printWithEvents() {
  const { print } = usePrint()
  
  print('content-to-print', {
    specs: {
      width: 800,
      height: 600
    },
    onBeforePrint: () => {
      isPrinting.value = true
      printStatus.value = 'Preparando impresión...'
      addLog('onBeforePrint', 'Iniciando proceso de impresión', 'info')
    },
    onAfterPrint: () => {
      isPrinting.value = false
      printStatus.value = 'Impresión completada exitosamente'
      addLog('onAfterPrint', 'Impresión finalizada correctamente', 'success')
    },
    onPrintError: (error: Error) => {
      isPrinting.value = false
      printStatus.value = `Error en impresión: ${error.message}`
      addLog('onPrintError', error.message, 'error')
    }
  })
}

function printWithErrorSimulation() {
  const { print } = usePrint()
  
  // Simular error intentando imprimir un elemento que no existe
  print('elemento-inexistente', {
    onBeforePrint: () => {
      addLog('onBeforePrint', 'Intentando imprimir elemento inexistente', 'warning')
    },
    onPrintError: (error: Error) => {
      addLog('onPrintError', `Error simulado: ${error.message}`, 'error')
    }
  })
}
</script>

<style scoped>
.log-container {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 10px;
  background-color: #f8f9fa;
}

.log-entry {
  padding: 5px;
  margin-bottom: 5px;
  border-radius: 3px;
  font-size: 0.9em;
}

.log-entry.info {
  background-color: #d1ecf1;
  border-left: 3px solid #17a2b8;
}

.log-entry.success {
  background-color: #d4edda;
  border-left: 3px solid #28a745;
}

.log-entry.warning {
  background-color: #fff3cd;
  border-left: 3px solid #ffc107;
}

.log-entry.error {
  background-color: #f8d7da;
  border-left: 3px solid #dc3545;
}
</style>