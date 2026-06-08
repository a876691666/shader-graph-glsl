import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: false,
  external: ['react', 'react-dom', 'three', '@xifu/shader-graph-glsl'],
  outDir: 'dist',
  splitting: false,
})
