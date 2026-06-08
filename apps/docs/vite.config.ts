import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { readFileSync } from 'fs'

/**
 * 开发服务器下将 /shader-graph-glsl/editor/ 的请求映射到 public/editor/
 * 生产构建时由静态文件直接提供。
 */
function editorDevServerPlugin(): import('vite').Plugin {
  const editorDir = resolve(__dirname, 'public/editor')
  return {
    name: 'editor-dev-server',
    configureServer(server) {
      server.middlewares.use('/shader-graph-glsl/editor', (req, res, next) => {
        // 只处理 GET 请求
        if (req.method !== 'GET' && req.method !== 'HEAD') return next()

        const url = req.url || '/'
        // 映射到 public/editor/ 目录
        let filePath = url === '/' || url === '' || !url.includes('.')
          ? '/index.html'
          : url

        const fullPath = resolve(editorDir, filePath.slice(1))
        try {
          const content = readFileSync(fullPath)
          const ext = filePath.split('.').pop()
          const mime: Record<string, string> = {
            html: 'text/html',
            js: 'application/javascript',
            css: 'text/css',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            png: 'image/png',
            svg: 'image/svg+xml',
            wasm: 'application/wasm',
          }
          res.setHeader('Content-Type', mime[ext || ''] || 'application/octet-stream')
          res.statusCode = 200
          res.end(content)
        } catch {
          next()
        }
      })
    },
  }
}

export default defineConfig({
  base: '/shader-graph-glsl/',
  plugins: [
    vue(),
    editorDevServerPlugin(),
  ],
  resolve: {
    alias: {
      '@xifu/shader-graph-glsl/runtime': resolve(__dirname, '../../packages/runtime/src'),
      '@xifu/shader-graph-glsl/editor': resolve(__dirname, '../../packages/editor/src'),
    },
  },
})
