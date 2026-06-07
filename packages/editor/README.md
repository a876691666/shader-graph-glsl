# @shader-graph-glsl/editor

基于 Rete.js 的可视化着色器图编辑器。

## 特性

- **类 Unity ShaderGraph 体验** — 节点编辑、连线、预览
- **子图支持** — 嵌套子图、复用
- **实时预览** — Three.js 驱动的 3D 预览面板
- **参数面板** — Inspector 调整着色器参数
- **90+ 内置节点** — 数学、UV、通道、艺术效果、程序化生成等
- **编译导出** — 输出 ShaderConfig，可供运行时直接加载

## 安装

```bash
pnpm add @shader-graph-glsl/editor
```

需要 peer 依赖: `react`, `react-dom`, `three`

## 快速开始

```ts
import { ShaderGraphEditor } from '@shader-graph-glsl/editor'

const container = document.getElementById('editor')!
const editor = new ShaderGraphEditor(container)

// 初始化新的着色器图
await editor.createGraph()

// 编译
const config = await editor.compile()
console.log(config.vertCode, config.fragCode)

// 导入/导出
const json = editor.save()
editor.load(json)
```

## API

参见 [API 文档](https://deepkolos.github.io/shader-graph-glsl/#/api)。
