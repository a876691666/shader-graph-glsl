import { useNavigate } from 'react-router-dom'

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">v0.1.0 · WebGL2 · MIT</div>
        <h1 className="hero-title">
          Shader Graph <span className="highlight">GLSL</span>
        </h1>
        <p className="hero-desc">
          高性能、渲染器无关的着色器图运行时与编辑器。<br />
          可视化编辑着色器图，编译为纯 GLSL，在任意 WebGL2 环境中运行。
        </p>
        <div className="hero-actions">
          <button className="btn primary" onClick={() => navigate('/api')}>API 文档</button>
          <button className="btn" onClick={() => navigate('/examples')}>查看用例</button>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="feature-card">
          <div className="feature-icon">◆</div>
          <h3>双包架构</h3>
          <p>编辑器 + 运行时分离，按需引入。编辑器依赖 React/Rete，运行时零外部依赖。</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <h3>纯 GLSL 输出</h3>
          <p>编译产出标准 GLSL ES 3.00，可在 Three.js、PixiJS、原生 WebGL2 等任意环境使用。</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔌</div>
          <h3>渲染器无关</h3>
          <p>运行时引擎不绑定任何框架。提供适配层可轻松集成 Three.js / PixiJS / PlayCanvas。</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📦</div>
          <h3>类 Unity 体验</h3>
          <p>类似 Unity ShaderGraph 的节点编辑体验，支持子图、参数面板、实时预览。</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🎨</div>
          <h3>丰富节点库</h3>
          <p>内置数学运算、输入输出、UV、通道、艺术效果、程序化生成等 90+ 节点。</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📐</div>
          <h3>类型安全</h3>
          <p>完整 TypeScript 类型定义，编辑器与运行时之间通过 ShaderConfig 契约对接。</p>
        </div>
      </section>

      {/* Quick Start */}
      <section className="section">
        <h2>⚡ 快速开始</h2>

        <div className="card">
          <h3>安装</h3>
          <pre><code>{`# 运行时 (轻量，无依赖)
pnpm add @xifu/shader-graph-glsl

# 编辑器 (需要 React + Three.js)
pnpm add @xifu/shader-graph-glsl`}</code></pre>
        </div>

        <div className="card">
          <h3>运行时最小用例</h3>
          <pre><code>{/* eslint-disable-next-line */}
{`import { ShaderGraphRuntime } from '@xifu/shader-graph-glsl/runtime'

// 创建运行时
const runtime = new ShaderGraphRuntime(document.getElementById('canvas') as HTMLCanvasElement)
runtime.resize(800, 600)

// 加载着色器配置
const program = runtime.load(shaderConfig)

// 设置 uniform
runtime.uniforms(program)
  .set('uColor', [1, 0, 0, 1])
  .set('uTime', 0.5)
  .commit()

// 绘制网格
runtime.draw({
  geometry: { attributes: { aPosition: { data, size: 3 } }, vertexCount: 3 },
  program,
  uniforms: {},
})

// 动画循环
runtime.play((time) => {
  runtime.uniforms(program).set('uTime', time).commit()
  runtime.draw(mesh)
})`}</code></pre>
        </div>
      </section>

      {/* Architecture */}
      <section className="section">
        <h2>🏗️ 架构</h2>
        <div className="card">
          <pre className="arch-diagram"><code>{`┌─────────────────────────────────────────────────┐
│                Shader Graph GLSL                 │
├───────────────────────┬─────────────────────────┤
│   @editor             │   @runtime              │
│                       │                         │
│  ┌─────────────────┐  │  ┌───────────────────┐  │
│  │ ShaderGraphEditor│  │  │ ShaderGraphRuntime│  │
│  │ (可视化节点编辑)   │  │  │ (轻量渲染引擎)     │  │
│  ├─────────────────┤  │  ├───────────────────┤  │
│  │ Rete.js          │  │  │ WebGL2 原生       │  │
│  │ React UI         │  │  │ 无外部依赖        │  │
│  │ Three.js 预览    │  │  │ 任意框架可集成    │  │
│  └────────┬────────┘  │  └────────┬──────────┘  │
│           │           │           │             │
│           └── ShaderConfig (JSON) ──┘            │
│                       │                         │
│        编译产出: vertCode + fragCode + uniforms   │
└─────────────────────────────────────────────────┘`}</code></pre>
        </div>
      </section>
    </div>
  )
}
