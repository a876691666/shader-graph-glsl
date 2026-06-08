import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    'runtime/index': 'packages/runtime/src/index.ts',
    'editor/index': 'packages/editor/src/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  // monaco-editor 是可选的：用户不安装则自定义函数编辑器不可用，其余功能正常
  external: ['monaco-editor'],
  outDir: 'dist',
  splitting: false,
  loader: { '.less': 'empty' },
})
