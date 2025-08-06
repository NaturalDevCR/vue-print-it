<template>
  <div class="card" id="print-example-component">
    <div class="card-header">
      <h3>🔧 Ejemplo Básico</h3>
    </div>
    <div class="card-body">
      <p>Usa el método global <code>$print</code> para imprimir elementos:</p>
      
      <div class="d-grid gap-2">
        <button 
          @click="printContent" 
          class="btn btn-primary"
        >
          🖨️ Imprimir Contenido
        </button>
        
        <button 
          @click="printThisComponent" 
          class="btn btn-secondary"
        >
          📄 Imprimir Este Componente
        </button>
        
        <button 
          @click="printWithCustomStyles" 
          class="btn btn-success"
        >
          🎨 Imprimir con Estilos Personalizados
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getCurrentInstance } from 'vue'

const instance = getCurrentInstance()
const $print = instance?.appContext.config.globalProperties.$print

function printContent() {
  $print('content-to-print', {
    specs: {
      width: 800,
      height: 600
    }
  })
}

function printThisComponent() {
  $print('print-example-component', {
    specs: {
      width: 600,
      height: 400
    }
  })
}

function printWithCustomStyles() {
  $print('content-to-print', {
    styles: [
      `
        body { 
          background: linear-gradient(45deg, #f0f8ff, #e6f3ff) !important;
          font-family: 'Georgia', serif !important;
        }
        h2 { 
          color: #2c5aa0 !important;
          border-bottom: 2px solid #2c5aa0 !important;
          padding-bottom: 10px !important;
        }
        .table {
          border: 2px solid #2c5aa0 !important;
        }
      `
    ],
    specs: {
      width: 900,
      height: 700
    }
  })
}
</script>

<style scoped>
#print-example-component {
  padding: 20px;
  border: 2px dashed #007bff;
  border-radius: 8px;
  background-color: #f8f9fa;
}
</style>