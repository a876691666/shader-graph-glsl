import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

/**
 * Editor 独立构建配置
 *
 * 将编辑器 dev 页面构建为静态资源，
 * 输出到 docs/public/editor/ 下，
 * 由文档站点以 iframe 方式嵌入。
 */
export default defineConfig({
  root: resolve(__dirname, '.'),
  base: '/shader-graph-glsl/editor/',
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, 'docs/public/editor'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'editor.html'),
    },
  },
  resolve: {
    alias: {
      '@xifu/shader-graph-glsl/runtime': resolve(__dirname, 'packages/runtime/src'),
      '@xifu/shader-graph-glsl/editor': resolve(__dirname, 'packages/editor/src'),
    },
  },
})
