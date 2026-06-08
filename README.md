# Shader Graph GLSL

一个 Unity `Shader Graph` 高仿，纯 GLSL ES 3.00 实现，渲染器无关。

## 📦 双包架构

```
@xifu/shader-graph-glsl/runtime    — 轻量运行时引擎 (零外部依赖，纯 WebGL2)
@xifu/shader-graph-glsl/editor     — 可视化编辑器 (基于 Rete.js + React + Three.js)
```

| 包 | 描述 | 依赖 |
|---|---|---|
| `@xifu/shader-graph-glsl/runtime` | 独立 WebGL2 渲染引擎，加载 ShaderConfig 渲染 | 无 |
| `@xifu/shader-graph-glsl/editor` | 可视化节点编辑器，编译产出 ShaderConfig | React, Three.js |

## 🚀 快速开始

### 运行时最小用例

```ts
import { ShaderGraphRuntime } from '@xifu/shader-graph-glsl/runtime'

const runtime = new ShaderGraphRuntime(canvas)
const program = runtime.load(shaderConfig)  // ShaderConfig 由编辑器编译产出

runtime.uniforms(program)
  .set('uColor', [1, 0, 0, 1])
  .commit()

runtime.draw({
  geometry: { attributes: { aPosition: { data, size: 3 } }, vertexCount: 3 },
  program,
  uniforms: {},
})
```

### 编辑器最小用例

```ts
import { ShaderGraphEditor } from '@xifu/shader-graph-glsl/editor'

const editor = new ShaderGraphEditor(document.getElementById('editor')!)
await editor.createGraph()

// 编译导出
const config = await editor.compile()
```

## 📖 文档

- [API 文档](https://a876691666.github.io/shader-graph-glsl/#/api)
- [使用用例](https://a876691666.github.io/shader-graph-glsl/#/examples)
  - Three.js 集成
  - PixiJS 集成  
  - 原生 WebGL2
  - PlayCanvas 集成

## 🖼️ 截图

<div style="display: grid; grid: repeat(2, 180px) / auto-flow 290px;">
  <img width="280" alt="fresnelOutline" src="./screenshots/fresnelOutline.png">
  <img width="280" alt="dissolve" src="./screenshots/dissolve.png">
  <img width="280" alt="procedural" src="./screenshots/procedural.png">
  <img width="280" alt="subgraph" src="./screenshots/subgraph.png"> 
  <img width="280" alt="subgraph" src="./screenshots/previewNumber.png"> 
  <img width="280" alt="subgraph" src="./screenshots/flowmap.png"> 
</div>

## 🔧 开发

```bash
# 安装依赖
pnpm install

# 启动编辑器 dev server
pnpm dev

# 启动文档站点
pnpm dev:docs

# 构建文档站点
pnpm build:docs
```

MIT 仅供学习交流使用