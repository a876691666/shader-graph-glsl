<script setup lang="ts">
import DemoPanel from '../components/DemoPanel.vue'
import ScrollNav from '../components/ScrollNav.vue'
import { ShaderGraphRuntime } from '@xifu/shader-graph-glsl/runtime'
import type { ShaderConfig } from '@xifu/shader-graph-glsl/runtime'

// ============================================================
// 导航项
// ============================================================
const navItems = [
  { id: 'demo-minimal', label: '最小三角形' },
  { id: 'demo-animated', label: '动画三角形' },
  { id: 'demo-texture', label: '纹理渲染' },
  { id: 'demo-multi', label: '多材质' },
  { id: 'demo-subgraph', label: '子图关联' },
  { id: 'demo-three', label: 'Three.js 集成' },
  { id: 'demo-pixi', label: 'PixiJS 集成' },
  { id: 'demo-native', label: '原生 WebGL2' },
  { id: 'demo-playcanvas', label: 'PlayCanvas 集成' },
  { id: 'demo-workflow', label: '编辑器+运行时' },
]

// ============================================================
// Demo 1: 最小三角形
// ============================================================
const demo1_vertCode = `#version 300 es
precision highp float;
in vec3 aPosition;
out vec3 vColor;
void main() {
  vColor = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 1.0);
}`

const demo1_fragCode = `#version 300 es
precision highp float;
in vec3 vColor;
out vec4 fragColor;
void main() {
  fragColor = vec4(vColor, 1.0);
}`

const demo1_jsCode = `import { ShaderGraphRuntime } from '@xifu/shader-graph-glsl/runtime'

const runtime = new ShaderGraphRuntime(canvas)
runtime.resize(400, 300)

// ShaderConfig 通常由编辑器编译产出，此处直接引用
const program = runtime.load(demo1_config)

// 彩色三角形顶点
const data = new Float32Array([
  0.0,  0.5, 0.0,
 -0.5, -0.5, 0.0,
  0.5, -0.5, 0.0,
])

runtime.draw({
  geometry: { attributes: { aPosition: { data, size: 3 } }, vertexCount: 3 },
  program,
  uniforms: {},
})`

const demo1_config: ShaderConfig = {
  version: 1, id: 'minimal-triangle',
  vertCode: demo1_vertCode,
  fragCode: demo1_fragCode,
  uniforms: [], textures: [], parameters: [],
}

function demo1_init(canvas: HTMLCanvasElement) {
  const runtime = new ShaderGraphRuntime(canvas)
  runtime.resize(400, 300)
  const program = runtime.load({
    version: 1, id: 'demo1',
    vertCode: demo1_vertCode,
    fragCode: demo1_fragCode,
    uniforms: [], textures: [], parameters: [],
  })
  const data = new Float32Array([0.0, 0.5, 0.0, -0.5, -0.5, 0.0, 0.5, -0.5, 0.0])
  runtime.clear()
  runtime.draw({
    geometry: { attributes: { aPosition: { data, size: 3 as const } }, vertexCount: 3 },
    program, uniforms: {},
  })
  return () => runtime.dispose()
}

// ============================================================
// Demo 2: 动画三角形 (uniform 随时间变化)
// ============================================================
const demo2_vertCode = `#version 300 es
precision highp float;
in vec3 aPosition;
out vec3 vColor;
void main() {
  vColor = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 1.0);
}`

const demo2_fragCode = `#version 300 es
precision highp float;
in vec3 vColor;
uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
out vec4 fragColor;
void main() {
  float t = sin(uTime) * 0.5 + 0.5;
  vec3 color = mix(uColor1, uColor2, t);
  fragColor = vec4(color * vColor, 1.0);
}`

const demo2_config: ShaderConfig = {
  version: 1, id: 'demo2-animated',
  vertCode: demo2_vertCode,
  fragCode: demo2_fragCode,
  uniforms: [
    { name: 'uTime', type: 'float', default: 0 },
    { name: 'uColor1', type: 'vec3', default: [1, 0.5, 0] },
    { name: 'uColor2', type: 'vec3', default: [0, 0.5, 1] },
  ],
  textures: [], parameters: [],
}

const demo2_jsCode = `import { ShaderGraphRuntime } from '@xifu/shader-graph-glsl/runtime'

const runtime = new ShaderGraphRuntime(canvas)
runtime.resize(400, 300)

// ShaderConfig 通常由编辑器编译产出
const program = runtime.load(demo2_config)

const data = new Float32Array([0,0.5,0, -0.5,-0.5,0, 0.5,-0.5,0])
const mesh = {
  geometry: { attributes: { aPosition: { data, size: 3 } }, vertexCount: 3 },
  program, uniforms: {},
}

// 动画循环 — uniform 随时间变化
runtime.play((time) => {
  runtime.uniforms(program)
    .set('uTime', time)
    .setMany({ uColor1: [1, 0.5, 0], uColor2: [0, 0.5, 1] })
    .commit()
  runtime.clear()
  runtime.draw(mesh)
})`

function demo2_init(canvas: HTMLCanvasElement) {
  const runtime = new ShaderGraphRuntime(canvas, { clearColor: [0, 0, 0, 1] })
  runtime.resize(400, 300)
  const program = runtime.load(demo2_config)
  const data = new Float32Array([0, 0.5, 0, -0.5, -0.5, 0, 0.5, -0.5, 0])
  const mesh = {
    geometry: { attributes: { aPosition: { data, size: 3 as const } }, vertexCount: 3 },
    program, uniforms: {} as Record<string, any>,
  }
  // 先渲染一帧确保显示
  runtime.setClearColor(0, 0, 0, 1)
  runtime.gl.clearColor(0, 0, 0, 1)
  runtime.clear()
  runtime.uniforms(program).setMany({ uTime: 0, uColor1: [1, 0.5, 0], uColor2: [0, 0.5, 1] }).commit()
  runtime.draw(mesh)
  // 启动动画循环
  runtime.play((time) => {
    runtime.uniforms(program).set('uTime', time).commit()
    runtime.clear()
    runtime.draw(mesh)
  })
  return () => runtime.dispose()
}

// ============================================================
// Demo 3: 纹理渲染
// ============================================================
function createCheckerTexture(): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = 256; c.height = 256
  const ctx = c.getContext('2d')!
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#ffffff' : '#333333'
      ctx.fillRect(x * 32, y * 32, 32, 32)
    }
  return c
}

const demo3_vertCode = `#version 300 es
precision highp float;
in vec2 aPosition;
in vec2 aUV;
out vec2 vUV;
void main() {
  vUV = aUV;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`

const demo3_fragCode = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uTexture;
uniform float uTime;
out vec4 fragColor;
void main() {
  vec2 uv = vUV + 0.03 * vec2(sin(uTime + vUV.y*8.0), cos(uTime + vUV.x*8.0));
  fragColor = texture(uTexture, uv);
}`

const demo3_jsCode = `import { ShaderGraphRuntime } from '@xifu/shader-graph-glsl/runtime'

const runtime = new ShaderGraphRuntime(canvas)
runtime.resize(400, 300)

// ShaderConfig 通常由编辑器编译产出
const program = runtime.load(demo3_config)

// 全屏四边形 (位置 + UV)
const vertices = new Float32Array([
  -1,-1, 0,0,  1,-1, 1,0,
   1, 1, 1,1, -1, 1, 0,1,
])
const geometry = {
  attributes: {
    aPosition: { data: vertices, size: 2, stride: 16, offset: 0 },
    aUV: { data: vertices, size: 2, stride: 16, offset: 8 },
  },
  index: new Uint16Array([0,1,2, 0,2,3]),
  vertexCount: 6,
}

runtime.play((time) => {
  runtime.uniforms(program).set('uTime', time).commit()
  runtime.draw({ geometry, program, uniforms: {} })
})`

const demo3_config: ShaderConfig = {
  version: 1, id: 'texture-demo',
  vertCode: demo3_vertCode,
  fragCode: demo3_fragCode,
  uniforms: [
    { name: 'uTexture', type: 'sampler2D' },
    { name: 'uTime', type: 'float', default: 0 },
  ],
  textures: [], parameters: [],
}

function demo3_init(canvas: HTMLCanvasElement) {
  const runtime = new ShaderGraphRuntime(canvas, { clearColor: [0, 0, 0, 0] })
  runtime.resize(400, 300)
  const program = runtime.load({
    version: 1, id: 'demo3-texture',
    vertCode: demo3_vertCode,
    fragCode: demo3_fragCode,
    uniforms: [{ name: 'uTexture', type: 'sampler2D' }, { name: 'uTime', type: 'float', default: 0 }],
    textures: [], parameters: [],
  })
  const vertices = new Float32Array([-1,-1,0,0, 1,-1,1,0, 1,1,1,1, -1,1,0,1])
  const mesh = {
    geometry: {
      attributes: {
        aPosition: { data: vertices, size: 2 as const, stride: 16, offset: 0 },
        aUV: { data: vertices, size: 2 as const, stride: 16, offset: 8 },
      },
      index: new Uint16Array([0,1,2,0,2,3]),
      vertexCount: 6,
    },
    program, uniforms: {} as Record<string, any>,
  }
  // Upload texture
  const tex = runtime.gl.createTexture()
  runtime.gl.bindTexture(runtime.gl.TEXTURE_2D, tex)
  const img = createCheckerTexture()
  runtime.gl.texImage2D(runtime.gl.TEXTURE_2D, 0, runtime.gl.RGBA, runtime.gl.RGBA, runtime.gl.UNSIGNED_BYTE, img)
  runtime.gl.texParameteri(runtime.gl.TEXTURE_2D, runtime.gl.TEXTURE_MIN_FILTER, runtime.gl.LINEAR)
  runtime.gl.texParameteri(runtime.gl.TEXTURE_2D, runtime.gl.TEXTURE_MAG_FILTER, runtime.gl.LINEAR)
  runtime.gl.activeTexture(runtime.gl.TEXTURE0)
  runtime.gl.bindTexture(runtime.gl.TEXTURE_2D, tex)
  // 先 useProgram 再设置 uniform
  runtime.gl.useProgram(program.program)
  runtime.gl.uniform1i(runtime.gl.getUniformLocation(program.program, 'uTexture'), 0)

  runtime.play((time) => {
    runtime.uniforms(program).set('uTime', time).commit()
    runtime.clear()
    runtime.draw(mesh)
  })
  return () => runtime.dispose()
}

// ============================================================
// Demo 4: 多材质渲染
// ============================================================
const demo4_vertCode = `#version 300 es
precision highp float;
in vec3 aPosition;
void main() {
  gl_Position = vec4(aPosition, 1.0);
}`

const demo4_jsCode = `import { ShaderGraphRuntime } from '@xifu/shader-graph-glsl/runtime'

const runtime = new ShaderGraphRuntime(canvas)

// 两个不同的着色器配置 (通常由编辑器编译产出)
const redProgram = runtime.load(demo4_redConfig)
const blueProgram = runtime.load(demo4_blueConfig)

// 分别绘制
runtime.clear()
runtime.draw({ geometry: redTri, program: redProgram, uniforms: {} })
runtime.draw({ geometry: blueTri, program: blueProgram, uniforms: {} })`

const demo4_blueConfig: ShaderConfig = {
  version: 1, id: 'blue',
  vertCode: demo4_vertCode,
  fragCode: `#version 300 es\nprecision highp float;\nout vec4 fragColor;\nvoid main() { fragColor = vec4(0.0, 0.0, 1.0, 1.0); }`,
  uniforms: [], textures: [], parameters: [],
}

const demo4_redConfig: ShaderConfig = {
  version: 1, id: 'red',
  vertCode: demo4_vertCode,
  fragCode: `#version 300 es\nprecision highp float;\nout vec4 fragColor;\nvoid main() { fragColor = vec4(1.0, 0.0, 0.0, 1.0); }`,
  uniforms: [], textures: [], parameters: [],
}

function demo4_init(canvas: HTMLCanvasElement) {
  const runtime = new ShaderGraphRuntime(canvas)
  runtime.resize(400, 300)
  const commonVert = `#version 300 es\nprecision highp float;\nin vec3 aPosition;\nvoid main() { gl_Position = vec4(aPosition, 1.0); }`
  const redFrag = `#version 300 es\nprecision highp float;\nout vec4 fragColor;\nvoid main() { fragColor = vec4(1.0, 0.0, 0.0, 1.0); }`
  const blueFrag = `#version 300 es\nprecision highp float;\nout vec4 fragColor;\nvoid main() { fragColor = vec4(0.0, 0.0, 1.0, 1.0); }`
  const redP = runtime.load({ version: 1, id: 'red', vertCode: commonVert, fragCode: redFrag, uniforms: [], textures: [], parameters: [] })
  const blueP = runtime.load({ version: 1, id: 'blue', vertCode: commonVert, fragCode: blueFrag, uniforms: [], textures: [], parameters: [] })
  const d1 = new Float32Array([-0.5, -0.4, 0, -0.1, 0.5, 0, 0.3, -0.4, 0])
  const d2 = new Float32Array([-0.3, -0.4, 0, 0.1, 0.5, 0, 0.5, -0.4, 0])
  runtime.clear()
  runtime.draw({ geometry: { attributes: { aPosition: { data: d1, size: 3 as const } }, vertexCount: 3 }, program: redP, uniforms: {} })
  runtime.draw({ geometry: { attributes: { aPosition: { data: d2, size: 3 as const } }, vertexCount: 3 }, program: blueP, uniforms: {} })
  return () => runtime.dispose()
}

// ============================================================
// Demo 5: 子图关联 demo (无编辑器，用 API 模拟)
// ============================================================
const demo5_vertCode = `#version 300 es
precision highp float;
in vec3 aPosition;
out vec3 vColor;
void main() {
  vColor = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 1.0);
}`

const demo5_mainFrag = `#version 300 es
precision highp float;
in vec3 vColor;
uniform float uIntensity;
out vec4 fragColor;
void main() {
  fragColor = vec4(vColor * uIntensity, 1.0);
}`

const demo5_jsCode = `import { ShaderGraphRuntime } from '@xifu/shader-graph-glsl/runtime'

const runtime = new ShaderGraphRuntime(canvas)
runtime.resize(400, 300)

// 主图配置 (编辑器编译产出)
const mainConfig = demo5_mainConfig

// 子图配置 (独立的 ShaderConfig)
const subConfig: ShaderConfig = {
  version: 1, id: 'sub-effect',
  vertCode: '', fragCode: '',
  uniforms: [{ name: 'uSubParam', type: 'vec3' }],
  textures: [], parameters: [],
}

// 一步加载主图 + 关联子图
const program = runtime.loadWithSubGraphs(mainConfig, {
  'colorEffect': subConfig
})

// uniform 自动管理，运行时无需感知子图
runtime.uniforms(program)
  .set('uIntensity', 1.2)
  .set('uSubParam', [1, 0.5, 0])
  .commit()`

function demo5_init(canvas: HTMLCanvasElement) {
  const runtime = new ShaderGraphRuntime(canvas)
  runtime.resize(400, 300)

  // 主图: 彩色三角形 + intensity 控制
  const mainConfig: ShaderConfig = {
    version: 1, id: 'demo5-main',
    vertCode: demo5_vertCode,
    fragCode: `#version 300 es\nprecision highp float;\nin vec3 vColor;\nuniform float uIntensity;\nout vec4 fragColor;\nvoid main() { fragColor = vec4(vColor * uIntensity, 1.0); }`,
    uniforms: [{ name: 'uIntensity', type: 'float', default: 1.0 }],
    textures: [], parameters: [],
  }

  // 子图: 颜色偏移效果 (独立配置)
  const subConfig: ShaderConfig = {
    version: 1, id: 'demo5-sub',
    vertCode: '', fragCode: '',
    uniforms: [{ name: 'uSubParam', type: 'vec3', default: [1, 0.5, 0] }],
    textures: [], parameters: [],
  }

  // 使用 loadWithSubGraphs 一步加载
  const program = runtime.loadWithSubGraphs(mainConfig, { 'colorEffect': subConfig })

  const data = new Float32Array([0, 0.5, 0, -0.5, -0.5, 0, 0.5, -0.5, 0])
  runtime.play((time) => {
    runtime.uniforms(program)
      .set('uIntensity', 0.8 + 0.4 * Math.sin(time))
      .set('uSubParam', [1, 0.5 + 0.5 * Math.sin(time * 0.5), 0])
      .commit()
    runtime.clear()
    runtime.draw({
      geometry: { attributes: { aPosition: { data, size: 3 as const } }, vertexCount: 3 },
      program, uniforms: {},
    })
  })
  return () => runtime.dispose()
}

const demo5_mainConfig: ShaderConfig = {
  version: 1, id: 'demo5-main',
  vertCode: demo5_vertCode,
  fragCode: `#version 300 es\nprecision highp float;\nin vec3 vColor;\nuniform float uIntensity;\nout vec4 fragColor;\nvoid main() { fragColor = vec4(vColor * uIntensity, 1.0); }`,
  uniforms: [{ name: 'uIntensity', type: 'float', default: 1.0 }],
  textures: [], parameters: [],
}

// ============================================================
// 集成示例 (代码展示)
// ============================================================

const threeCode = `import * as THREE from 'three'
import { ShaderGraphRuntime } from '@xifu/shader-graph-glsl/runtime'

// 方式一: ShaderConfig 驱动 RawShaderMaterial (推荐)
const material = new THREE.RawShaderMaterial({
  vertexShader: shaderConfig.vertCode,
  fragmentShader: shaderConfig.fragCode,
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(1, 0, 0) },
  },
  transparent: true,
  side: THREE.DoubleSide,
})

// 方式二: 共享 WebGL 上下文
const renderer = new THREE.WebGLRenderer()
const runtime = new ShaderGraphRuntime(renderer.domElement)
// 现在 runtime 和 three.js 共享同一个 WebGL 上下文`

const pixiCode = `import * as PIXI from 'pixi.js'
import { ShaderGraphRuntime } from '@xifu/shader-graph-glsl/runtime'

// PixiJS v8 WebGL2 模式
const app = new PIXI.Application({
  width: 800, height: 600,
  preference: 'webgl2',
})
document.body.appendChild(app.canvas)

// 从 PixiJS canvas 创建运行时
const runtime = new ShaderGraphRuntime(app.canvas as HTMLCanvasElement)

// 在 PixiJS ticker 中渲染自定义着色器
app.ticker.add(() => {
  // 保存/恢复 PixiJS 的 GL 状态
  runtime.draw(mesh)
})`

const nativeCode = `const runtime = new ShaderGraphRuntime(canvas)
const program = runtime.load(shaderConfig)

// 四边形 (位置 + UV)
const geometry = {
  attributes: {
    aPosition: { data: vertices, size: 2, stride: 16, offset: 0 },
    aUV: { data: vertices, size: 2, stride: 16, offset: 8 },
  },
  index: new Uint16Array([0,1,2,0,2,3]),
  vertexCount: 6,
}

runtime.play((time) => {
  runtime.uniforms(program)
    .set('uTime', time)
    .set('uResolution', [800, 600])
    .commit()
  runtime.draw({ geometry, program, uniforms: {} })
})`

const playcanvasCode = `import * as pc from 'playcanvas'
import { ShaderGraphRuntime } from '@xifu/shader-graph-glsl/runtime'

// 方式一: 从 PlayCanvas canvas 创建运行时
const canvas = app.graphicsDevice.canvas
const runtime = new ShaderGraphRuntime(canvas)

// 方式二: ShaderConfig 的 GLSL 源码直接用于 pc.ShaderMaterial
const material = new pc.ShaderMaterial()
material.setVertexCode(shaderConfig.vertCode)
material.setFragmentCode(shaderConfig.fragCode)
material.update()`

const workflowCode = `// === 编辑器侧 ===
import { ShaderGraphEditor } from '@xifu/shader-graph-glsl/editor'

const editor = new ShaderGraphEditor(container)
await editor.createGraph()
// ... 用户编辑节点 ...
const config = await editor.compile()
// config 可 JSON 序列化

// === 运行时侧 (独立部署) ===
import { ShaderGraphRuntime } from '@xifu/shader-graph-glsl/runtime'

const runtime = new ShaderGraphRuntime(canvas)
const program = runtime.load(config)

runtime.play((time) => {
  runtime.uniforms(program)
    .set('uTime', time)
    .commit()
  runtime.draw(mesh)
})`
</script>

<template>
  <div class="examples-page">
    <h2>🧪 消费者用例</h2>
    <p class="subtitle">各类渲染环境下使用 @xifu/shader-graph-glsl/runtime 的示例，自动运行</p>

    <!-- 滚动导航 -->
    <ScrollNav :items="navItems" />

    <!-- Demo 1: 最小三角形 -->
    <DemoPanel
      section-id="demo-minimal"
      title="🎯 最小三角形"
      description="无需编辑器，直接手写 GLSL 加载到运行时渲染彩色三角形。着色器中的位置坐标直接映射为颜色。"
      :tags="['WebGL2', 'Native']"
      :shader-config="demo1_config"
      :js-code="demo1_jsCode"
      :vert-code="demo1_vertCode"
      :frag-code="demo1_fragCode"
      :init="demo1_init"
    />

    <!-- Demo 2: 动画三角形 -->
    <DemoPanel
      section-id="demo-animated"
      title="🎨 动画三角形"
      description="uniform 随帧更新的动画示例。uTime 传入时间，两种颜色随时间混合变化。"
      :tags="['Uniform', 'Animation']"
      :shader-config="demo2_config"
      :js-code="demo2_jsCode"
      :vert-code="demo2_vertCode"
      :frag-code="demo2_fragCode"
      :init="demo2_init"
    />

    <!-- Demo 3: 纹理渲染 -->
    <DemoPanel
      section-id="demo-texture"
      title="🖼️ 纹理渲染"
      description="棋盘格纹理 + UV 扭曲动画。展示 sampler2D uniform 和纹理坐标的使用。"
      :tags="['Texture', 'Sampler2D']"
      :shader-config="demo3_config"
      :js-code="demo3_jsCode"
      :vert-code="demo3_vertCode"
      :frag-code="demo3_fragCode"
      :init="demo3_init"
    />

    <!-- Demo 4: 多材质 -->
    <DemoPanel
      section-id="demo-multi"
      title="🔴🔵 多材质"
      description="同一个几何体用不同的着色器程序渲染。展示多个 program 切换。"
      :tags="['Multi-Program']"
      :shader-config="demo4_redConfig"
      :js-code="demo4_jsCode"
      :vert-code="demo4_vertCode"
      :frag-code="demo4_vertCode"
      :init="demo4_init"
    />

    <!-- Demo 5: 子图关联 -->
    <DemoPanel
      section-id="demo-subgraph"
      title="🔗 子图关联"
      description="主图和子图是两个独立的 ShaderConfig，通过 linkSubGraph() 或 loadWithSubGraphs() 关联。运行时自动管理所有 uniform。"
      :tags="['SubGraph', 'API']"
      :shader-config="demo5_mainConfig"
      :js-code="demo5_jsCode"
      :vert-code="demo5_vertCode"
      :frag-code="demo5_mainFrag"
      :init="demo5_init"
    />

    <!-- ===== 集成示例 (代码展示) ===== -->
    <section id="demo-three" class="section code-only">
      <h2>🔷 Three.js 集成</h2>
      <div class="card">
        <p><span class="tag">Three.js</span> ShaderConfig 的 GLSL 源码可直接用于 <code>THREE.RawShaderMaterial</code>。</p>
        <pre><code>{{ threeCode }}</code></pre>
      </div>
    </section>

    <section id="demo-pixi" class="section code-only">
      <h2>🧩 PixiJS 集成</h2>
      <div class="card">
        <p><span class="tag green">PixiJS</span> v8 支持 WebGL2，可与运行时共享上下文。</p>
        <pre><code>{{ pixiCode }}</code></pre>
      </div>
    </section>

    <section id="demo-native" class="section code-only">
      <h2>⚡ 原生 WebGL2</h2>
      <div class="card">
        <p><span class="tag orange">WebGL2</span> 最直接的使用方式。运行时封装了所有 GL 样板代码。</p>
        <pre><code>{{ nativeCode }}</code></pre>
      </div>
    </section>

    <section id="demo-playcanvas" class="section code-only">
      <h2>🎮 PlayCanvas 集成</h2>
      <div class="card">
        <p><span class="tag">PlayCanvas</span> 从 PlayCanvas canvas 创建运行时，或直接使用 GLSL 源码。</p>
        <pre><code>{{ playcanvasCode }}</code></pre>
      </div>
    </section>

    <section id="demo-workflow" class="section code-only">
      <h2>🔄 编辑器 + 运行时完整流程</h2>
      <div class="card">
        <p>编辑器可视化编辑 → 编译 ShaderConfig → 运行时加载渲染。两端独立部署。</p>
        <pre><code>{{ workflowCode }}</code></pre>
      </div>
    </section>
  </div>
</template>

<style scoped>
.subtitle {
  color: var(--c-text-dim);
  font-size: 0.9rem;
  margin-top: -0.5rem;
  margin-bottom: 2rem;
}

.section { margin: 3rem 0; }
.section.code-only { scroll-margin-top: 72px; }

.section.code-only h2 {
  font-size: 1.3rem;
  margin-bottom: 0.75rem;
}

.section.code-only .card p {
  margin-bottom: 0.75rem;
}

pre code {
  font-size: 0.82rem;
  line-height: 1.5;
}
</style>
