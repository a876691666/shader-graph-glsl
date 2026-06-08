<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<template>
  <div class="home">
    <!-- Hero -->
    <section class="hero">
      <div class="hero-badge">v0.1.0 · WebGL2 · MIT</div>
      <h1 class="hero-title">
        Shader Graph <span class="highlight">GLSL</span>
      </h1>
      <p class="hero-desc">
        高性能、渲染器无关的着色器图运行时与编辑器。<br>
        可视化编辑着色器图，编译为纯 GLSL，在任意 WebGL2 环境中运行。
      </p>
      <div class="hero-actions">
        <button class="btn primary" @click="router.push('/api')">API 文档</button>
        <button class="btn" @click="router.push('/examples')">查看用例</button>
      </div>
    </section>

    <!-- Features -->
    <section class="features">
      <div class="feature-card">
        <div class="feature-icon">◆</div>
        <h3>双包架构</h3>
        <p>编辑器 + 运行时分离，按需引入。编辑器依赖 React/Rete，运行时零外部依赖。</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">⚡</div>
        <h3>纯 GLSL 输出</h3>
        <p>编译产出标准 GLSL ES 3.00，可在 Three.js、PixiJS、原生 WebGL2 等任意环境使用。</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🔌</div>
        <h3>渲染器无关</h3>
        <p>运行时引擎不绑定任何框架。提供适配层可轻松集成 Three.js / PixiJS / PlayCanvas。</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">📦</div>
        <h3>类 Unity 体验</h3>
        <p>类似 Unity ShaderGraph 的节点编辑体验，支持子图、参数面板、实时预览。</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🎨</div>
        <h3>丰富节点库</h3>
        <p>内置数学运算、输入输出、UV、通道、艺术效果、程序化生成等 90+ 节点。</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">📐</div>
        <h3>类型安全</h3>
        <p>完整 TypeScript 类型定义，编辑器与运行时之间通过 ShaderConfig 契约对接。</p>
      </div>
    </section>

    <!-- Quick Start -->
    <section class="section">
      <h2>⚡ 快速开始</h2>

      <div class="card">
        <h3>安装</h3>
        <pre><code># 运行时 (轻量，无依赖)
pnpm add @xifu/shader-graph-glsl

# 编辑器 (需要 React + Three.js)
pnpm add @xifu/shader-graph-glsl</code></pre>
      </div>

      <div class="card">
        <h3>运行时最小用例</h3>
        <pre><code><span class="hl kw">import</span> <span class="hl">{ ShaderGraphRuntime }</span> <span class="hl">from</span> <span class="hl s">'@xifu/shader-graph-glsl/runtime'</span>

<span class="hl c">// 创建运行时</span>
<span class="hl kw">const</span> runtime <span class="hl op">=</span> <span class="hl kw">new</span> <span class="hl t">ShaderGraphRuntime</span>(<span class="hl builtin">document</span>.<span class="hl fu">getElementById</span>(<span class="hl s">'canvas'</span>) <span class="hl kw">as</span> HTMLCanvasElement)
runtime.<span class="hl fu">resize</span>(<span class="hl num">800</span>, <span class="hl num">600</span>)

<span class="hl c">// 加载着色器配置</span>
<span class="hl kw">const</span> program <span class="hl op">=</span> runtime.<span class="hl fu">load</span>(shaderConfig)

<span class="hl c">// 设置 uniform</span>
runtime.<span class="hl fu">uniforms</span>(program)
  .<span class="hl fu">set</span>(<span class="hl s">'uColor'</span>, [<span class="hl num">1</span>, <span class="hl num">0</span>, <span class="hl num">0</span>, <span class="hl num">1</span>])
  .<span class="hl fu">set</span>(<span class="hl s">'uTime'</span>, <span class="hl num">0.5</span>)
  .<span class="hl fu">commit</span>()

<span class="hl c">// 绘制网格</span>
runtime.<span class="hl fu">draw</span>({
  geometry: { attributes: { aPosition: { data, size: <span class="hl num">3</span> } }, vertexCount: <span class="hl num">3</span> },
  program,
  uniforms: {},
})

<span class="hl c">// 动画循环</span>
runtime.<span class="hl fu">play</span>((time) => {
  runtime.<span class="hl fu">uniforms</span>(program).<span class="hl fu">set</span>(<span class="hl s">'uTime'</span>, time).<span class="hl fu">commit</span>()
  runtime.<span class="hl fu">draw</span>(mesh)
})</code></pre>
      </div>
    </section>

    <!-- Architecture -->
    <section class="section">
      <h2>🏗️ 架构</h2>
      <div class="card">
        <pre class="arch-diagram"><code>┌─────────────────────────────────────────────────┐
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
└─────────────────────────────────────────────────┘</code></pre>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home {}

.hero {
  text-align: center;
  padding: 4rem 1rem 3rem;
}

.hero-badge {
  display: inline-block;
  font-size: 0.8rem;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  background: rgba(108,140,255,0.1);
  color: var(--c-primary);
  border: 1px solid rgba(108,140,255,0.2);
  margin-bottom: 1.5rem;
}

.hero-title {
  font-size: 2.8rem;
  font-weight: 800;
  letter-spacing: -0.5px;
}

.highlight {
  color: var(--c-primary);
  background: linear-gradient(135deg, var(--c-primary), var(--c-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-desc {
  font-size: 1.1rem;
  max-width: 600px;
  margin: 1rem auto 2rem;
  color: var(--c-text-dim);
  line-height: 1.7;
}

.hero-actions { display: flex; gap: 0.75rem; justify-content: center; }

.btn {
  font-size: 0.95rem;
  padding: 0.6rem 1.5rem;
  border-radius: var(--radius);
  border: 1px solid var(--c-border);
  background: var(--c-surface);
  color: var(--c-text);
  cursor: pointer;
  transition: all 0.2s;
}

.btn:hover {
  border-color: var(--c-primary);
  background: rgba(108,140,255,0.08);
}

.btn.primary {
  background: var(--c-primary);
  border-color: var(--c-primary);
  color: #fff;
}

.btn.primary:hover {
  background: var(--c-primary-dim);
  border-color: var(--c-primary-dim);
}

/* Features */
.features {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
  margin: 3rem 0;
}

.feature-card {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  padding: 1.5rem;
  transition: border-color 0.2s;
}

.feature-card:hover { border-color: var(--c-primary); }

.feature-icon {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.feature-card h3 {
  font-size: 1.05rem;
  margin: 0 0 0.5rem;
}

.feature-card p {
  font-size: 0.9rem;
  margin: 0;
  color: var(--c-text-dim);
}

.section { margin: 2rem 0; }

.arch-diagram code {
  font-size: 0.8rem;
  line-height: 1.4;
}

/* Syntax highlight simulation */
:deep(.hl) { color: var(--c-text); }
:deep(.hl.kw) { color: #c792ea; }
:deep(.hl.t) { color: #82aaff; }
:deep(.hl.fu) { color: #82aaff; }
:deep(.hl.s) { color: #c3e88d; }
:deep(.hl.num) { color: #f78c6c; }
:deep(.hl.op) { color: #89ddff; }
:deep(.hl.c) { color: #546e7a; font-style: italic; }
:deep(.hl.builtin) { color: #ffcb6b; }
</style>
