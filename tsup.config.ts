import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  splitting: false,
  sourcemap: true,
  minify: false,
  external: ['vue'],
  treeshake: true,
  target: 'es2018',
  outDir: 'dist',
  banner: {
    js: '/* vue-print-it - A Vue 3 printing plugin */'
  }
});