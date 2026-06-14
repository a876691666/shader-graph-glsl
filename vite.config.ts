import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { readFileSync } from 'fs'

/**
 * 开发服务器下将 /shader-graph-glsl/editor/ 的请求映射到 docs/public/editor/
 */
function editorDevServerPlugin() {
  const editorDir = resolve(__dirname, 'docs/public/editor')
  return {
    name: 'editor-dev-server',
    configureServer(server: any) {
      server.middlewares.use('/shader-graph-glsl/editor', (req: any, res: any, next: any) => {
        if (req.method !== 'GET' && req.method !== 'HEAD') return next()
        const url = req.url || '/'
        let filePath = url === '/' || url === '' || !url.includes('.')
          ? '/index.html'
          : url
        const fullPath = resolve(editorDir, filePath.slice(1))
        try {
          const content = readFileSync(fullPath)
          const ext = filePath.split('.').pop()
          const mime: Record<string, string> = {
            html: 'text/html', js: 'application/javascript', css: 'text/css',
            jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
            svg: 'image/svg+xml', wasm: 'application/wasm',
          }
          res.setHeader('Content-Type', mime[ext || ''] || 'application/octet-stream')
          res.statusCode = 200
          res.end(content)
        } catch { next() }
      })
    },
  }
}

export default defineConfig({
  base: '/shader-graph-glsl/',
  plugins: [react(), editorDevServerPlugin()],
})
