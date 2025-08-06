<template>
  <div class="container">
    <header class="mb-4">
      <h1 class="text-center text-primary">🖨️ Vue Print It - Demo</h1>
      <p class="text-center text-muted">Prueba todas las funcionalidades del plugin de impresión</p>
    </header>

    <div class="row">
      <div class="col-md-6">
        <PrintExample />
      </div>
      <div class="col-md-6">
        <PrintWithCallbacks />
      </div>
    </div>

    <!-- Contenido de prueba para imprimir -->
    <div id="content-to-print" class="mt-5 p-4 border rounded">
      <h2>📄 Contenido para Imprimir</h2>
      <p>Este es un ejemplo de contenido que se puede imprimir usando el plugin vue-print-it.</p>
      
      <div class="row mt-3">
        <div class="col-6">
          <h4>Lista de elementos:</h4>
          <ul>
            <li>Elemento 1</li>
            <li>Elemento 2</li>
            <li>Elemento 3</li>
          </ul>
        </div>
        <div class="col-6">
          <h4>Tabla de datos:</h4>
          <table class="table table-striped">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Item A</td>
                <td>100</td>
              </tr>
              <tr>
                <td>Item B</td>
                <td>200</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="alert alert-info mt-3">
        <strong>Nota:</strong> Este contenido se imprimirá con todos los estilos aplicados.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import PrintExample from './components/PrintExample.vue'
import PrintWithCallbacks from './components/PrintWithCallbacks.vue'
</script>

<style scoped>
.container {
  min-height: 100vh;
}
</style>