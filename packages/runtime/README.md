# @shader-graph-glsl/runtime

轻量、独立的 WebGL2 着色器运行时引擎。

## 特性

- **零外部依赖** — 纯 WebGL2，不绑定任何框架
- **ShaderConfig 驱动** — 直接加载编辑器编译产出的 JSON 配置
- **链式 Uniform API** — `runtime.uniforms(program).set('uColor', [1,0,0]).commit()`
- **动画循环** — 内置 `play()/stop()` 管理 rAF
- **渲染状态控制** — 清除颜色、视口、深度/混合测试
- **框架无关** — 可在 Three.js / PixiJS / PlayCanvas / 原生 WebGL2 中使用

## 安装

```bash
pnpm add @shader-graph-glsl/runtime
```

## 快速开始

```ts
import { ShaderGraphRuntime } from '@shader-graph-glsl/runtime'

const canvas = document.getElementById('canvas') as HTMLCanvasElement
const runtime = new ShaderGraphRuntime(canvas)
runtime.resize(800, 600)

// 加载着色器 (由编辑器编译产出)
const program = runtime.load(shaderConfig)

// 设置 uniform 并渲染
runtime.uniforms(program)
  .set('uColor', [1, 0, 0, 1])
  .set('uTime', 0.5)
  .commit()

runtime.draw({
  geometry: { attributes: { aPosition: { data, size: 3 } }, vertexCount: 3 },
  program,
  uniforms: {},
})
```

## API

参见 [API 文档](https://deepkolos.github.io/shader-graph-glsl/#/api)。
