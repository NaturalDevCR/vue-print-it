<template>
  <div class="container">
    <header class="mb-4">
      <h1 class="text-center text-primary">🖨️ Vue Print It - Demo</h1>
      <p class="text-center text-muted">
        Prueba todas las funcionalidades del plugin de impresión
      </p>
    </header>

    <div class="row">
      <div class="col-md-6">
        <PrintExample />
      </div>
      <div class="col-md-6">
        <PrintWithCallbacks />
      </div>
    </div>

    <form class="card mb-4" @submit.prevent="printConfiguredContent">
      <div class="card-header bg-primary text-white">
        Opciones de impresión
      </div>
      <fieldset class="card-body option-grid">
        <legend class="visually-hidden">Configurar impresión</legend>

        <div>
          <label class="form-label" for="page-size">Tamaño</label>
          <select
            id="page-size"
            v-model="pageSize"
            name="pageSize"
            class="form-select"
          >
            <option value="A4">A4</option>
            <option value="Letter">Letter</option>
            <option value="Legal">Legal</option>
          </select>
        </div>

        <div>
          <label class="form-label" for="orientation">Orientación</label>
          <select
            id="orientation"
            v-model="orientation"
            name="orientation"
            class="form-select"
          >
            <option value="portrait">Vertical</option>
            <option value="landscape">Horizontal</option>
          </select>
        </div>

        <div>
          <label class="form-label" for="scale">Escala</label>
          <input
            id="scale"
            v-model.number="scale"
            name="scale"
            class="form-range"
            type="range"
            min="0.7"
            max="1.2"
            step="0.05"
          />
          <output class="small text-muted" for="scale">{{ scale }}</output>
        </div>

        <div>
          <label class="form-label" for="print-target">Destino</label>
          <select
            id="print-target"
            v-model="printTarget"
            name="printTarget"
            class="form-select"
          >
            <option value="window">Ventana</option>
            <option value="iframe">Iframe oculto</option>
          </select>
        </div>

        <div class="form-check align-self-end">
          <input
            id="include-root"
            v-model="includeRoot"
            name="includeRoot"
            class="form-check-input"
            type="checkbox"
          />
          <label class="form-check-label" for="include-root">
            Incluir elemento raíz
          </label>
        </div>
      </fieldset>
      <div class="card-footer d-flex gap-2">
        <button class="btn btn-primary" type="submit">
          Imprimir contenido configurado
        </button>
        <button class="btn btn-outline-secondary" type="button" @click="printTestArea">
          Imprimir área de prueba
        </button>
      </div>
    </form>

    <!-- Test Section for Forms and Canvas -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card">
          <div class="card-header bg-warning text-dark">
            🛠️ Test Area (Forms & Canvas)
          </div>
          <div class="card-body" id="test-area">
            <div class="mb-3">
              <label class="form-label"
                >Type something (should appear in print):</label
              >
              <input
                type="text"
                class="form-control"
                placeholder="Type here..."
                value="Initial Value"
              />
            </div>
            <div class="mb-3">
              <label class="form-label">Canvas Drawing:</label>
              <canvas
                ref="demoCanvas"
                width="200"
                height="100"
                style="border: 1px solid #ccc; background: #f0f0f0"
              ></canvas>
            </div>
            <p>If you type below and print, does it show?</p>
            <textarea class="form-control" rows="2">Type here too...</textarea>
          </div>
          <div class="card-footer">
            <button class="btn btn-warning" @click="printTestArea">
              Print Test Area
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Contenido de prueba para imprimir -->
    <div id="content-to-print" class="mt-5 p-4 border rounded">
      <h2>📄 Contenido para Imprimir</h2>
      <p>
        Este es un ejemplo de contenido que se puede imprimir usando el plugin
        vue-print-it.
      </p>

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
        <strong>Nota:</strong> Este contenido se imprimirá con todos los estilos
        aplicados.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import PrintExample from "./components/PrintExample.vue";
import PrintWithCallbacks from "./components/PrintWithCallbacks.vue";
import { onMounted, ref } from "vue";
import { usePrint } from "vue-print-it";
import type { PrintOptions, PrintPageOrientation, PrintTarget } from "vue-print-it";

const { print } = usePrint();
const demoCanvas = ref<HTMLCanvasElement | null>(null);
const pageSize = ref("A4");
const orientation = ref<PrintPageOrientation>("portrait");
const scale = ref(1);
const printTarget = ref<PrintTarget>("window");
const includeRoot = ref(true);

const getDemoPrintOptions = (): PrintOptions => ({
  pageSize: pageSize.value,
  orientation: orientation.value,
  scale: scale.value,
  printTarget: printTarget.value,
  includeRoot: includeRoot.value,
  printCss: "@page { margin: 12mm; }",
  imageLoadTimeout: 3000,
  styleLoadTimeout: 3000,
});

onMounted(() => {
  if (demoCanvas.value) {
    const ctx = demoCanvas.value.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "red";
      ctx.fillRect(10, 10, 50, 50);
      ctx.fillStyle = "blue";
      ctx.beginPath();
      ctx.arc(100, 50, 30, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = "black";
      ctx.fillText("Canvas Content", 10, 90);
    }
  }
});

const printTestArea = () => {
  print("test-area", {
    ...getDemoPrintOptions(),
    windowTitle: "Test Area Print",
    onPrintError: (e) => console.error(e),
  });
};

const printConfiguredContent = () => {
  print("content-to-print", {
    ...getDemoPrintOptions(),
    windowTitle: "Contenido configurado",
  });
};
</script>

<style scoped>
.container {
  min-height: 100vh;
}

.option-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}
</style>
