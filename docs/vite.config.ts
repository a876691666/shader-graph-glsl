import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

const projectRoot = resolve(__dirname, '..')

/**
 * Vite 配置 — 文档站点 SPA
 *
 * 与 dev 模式共用根目录 public/ 文件夹。
 */
export default defineConfig({
  base: '/shader-graph-glsl/',
  plugins: [react()],
  publicDir: resolve(__dirname, '../public'),
  resolve: {
    alias: {
      '@xifu/shader-graph-glsl/runtime': resolve(__dirname, '../packages/runtime/src'),
      '@xifu/shader-graph-glsl/editor': resolve(__dirname, '../packages/editor/src'),
    },
  },
  server: {
    fs: {
      allow: [projectRoot],
    },
  },
  build: {
    rollupOptions: {
      input: {
        docs: resolve(__dirname, 'index.html'),
      },
    },
  },
})
