/**
 * Prebuild script: compile editor.less → editor.css
 *
 * 在 tsup 构建前将所有 LESS 样式编译为单个 CSS 文件，
 * 以便 tsup 原生支持 CSS 输出到 dist/index.css。
 */
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import less from 'less'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function main() {
  const entryFile = resolve(__dirname, '..', 'src/editor.less')
  const outFile = resolve(__dirname, '..', 'src/editor.css')
  const source = readFileSync(entryFile, 'utf8')

  const result = await less.render(source, {
    paths: [resolve(__dirname, '..', 'src')],
    relativeUrls: true,
  })

  writeFileSync(outFile, result.css, 'utf8')
  console.log(`✅ Compiled ${entryFile} → ${outFile} (${result.css.length} bytes)`)
}

main().catch(err => {
  console.error('❌ Failed to compile LESS:', err)
  process.exit(1)
})
