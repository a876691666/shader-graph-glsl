<script setup lang="ts">
/**
 * DemoPanel — 四栏演示组件
 *
 * 布局 (2x2):
 * ┌──────────────────────────┬──────────────────────────┐
 * │ ShaderConfig (JSON)      │ GLSL (Vertex / Fragment) │
 * ├──────────────────────────┼──────────────────────────┤
 * │ JavaScript (源码)         │ Rendered (Canvas)        │
 * └──────────────────────────┴──────────────────────────┘
 */

import { ref, onMounted, onUnmounted, nextTick, computed } from 'vue'

const props = defineProps<{
  /** 演示标题 */
  title: string
  /** 演示副标题/描述 */
  description?: string
  /** ShaderConfig (显示为 JSON) */
  shaderConfig: Record<string, any>
  /** JS 源码 */
  jsCode: string
  /** 顶点着色器源码 (可选) */
  vertCode?: string
  /** 片段着色器源码 (可选) */
  fragCode?: string
  /** 初始化函数: 接收 canvas, 返回 cleanup 函数 */
  init: (canvas: HTMLCanvasElement) => (() => void) | void
  /** 标签 */
  tags?: string[]
  /** 唯一 ID (用于滚动导航) */
  sectionId: string
}>()

const canvasRef = ref<HTMLCanvasElement>()
let cleanup: (() => void) | void = undefined

onMounted(async () => {
  await nextTick()
  if (canvasRef.value) {
    cleanup = props.init(canvasRef.value)
  }
})

onUnmounted(() => {
  if (cleanup) cleanup()
})

// ===== JSON 格式化 =====
const configJson = computed(() => {
  // 简化显示: 省略长代码字段
  const clone = JSON.parse(JSON.stringify(props.shaderConfig))
  if (clone.vertCode) clone.vertCode = clone.vertCode.length > 60 ? clone.vertCode.slice(0, 56) + '...' : clone.vertCode
  if (clone.fragCode) clone.fragCode = clone.fragCode.length > 60 ? clone.fragCode.slice(0, 56) + '...' : clone.fragCode
  return JSON.stringify(clone, null, 2)
})

// ===== 语法高亮 =====
function highlightJS(code: string): string {
  return code
    .replace(/(\/\/[^\n]*)/g, '<span class="hl-c">$1</span>')
    .replace(/\b(import|from|const|let|var|function|return|if|else|for|of|in|as|new|class|extends|async|await|export|default|type|interface)\b/g, '<span class="hl-k">$1</span>')
    .replace(/\b(string|number|boolean|void|Record|Float32Array|Uint16Array|Promise)\b/g, '<span class="hl-t">$1</span>')
    .replace(/'[^']*'/g, '<span class="hl-s">$&</span>')
    .replace(/`[^`]*`/g, '<span class="hl-s">$&</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-n">$1</span>')
}

function highlightGLSL(code: string): string {
  if (!code) return ''
  return code
    .replace(/(\/\/[^\n]*)/g, '<span class="hl-c">$1</span>')
    .replace(/\b(version|precision|highp|mediump|lowp|float|int|bool|vec[234]|mat[234]|sampler2D|uniform|in|out|inout|void|return|if|else|for|struct|discard|const)\b/g, '<span class="hl-k">$1</span>')
    .replace(/\b(main|texture|sin|cos|mix|clamp|normalize|length|pow|abs|mod|floor|ceil|fract|step|smoothstep|dot|cross|reflect|refract)\b/g, '<span class="hl-fu">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-n">$1</span>')
}

function highlightJSON(json: string): string {
  return json
    .replace(/"([^"]+)":/g, '<span class="hl-json-key">"$1"</span>:')
    .replace(/: "([^"]+)"/g, ': <span class="hl-s">"$1"</span>')
    .replace(/: (\d+\.?\d*)/g, ': <span class="hl-n">$1</span>')
    .replace(/: (true|false)/g, ': <span class="hl-k">$1</span>')
    .replace(/: (null)/g, ': <span class="hl-k">$1</span>')
}
</script>

<template>
  <section :id="sectionId" class="demo-section">
    <div class="demo-header">
      <h3 class="demo-title">{{ title }}</h3>
      <div class="demo-tags" v-if="tags">
        <span v-for="tag in tags" :key="tag" class="tag">{{ tag }}</span>
      </div>
    </div>
    <p v-if="description" class="demo-desc">{{ description }}</p>

    <!-- 2x2 四栏布局 -->
    <div class="demo-grid">
      <!-- 左上: ShaderConfig -->
      <div class="cell cell-config">
        <div class="cell-label">ShaderConfig</div>
        <div class="cell-body">
          <pre class="code-block"><code v-html="highlightJSON(configJson)"></code></pre>
        </div>
      </div>

      <!-- 右上: GLSL -->
      <div class="cell cell-glsl">
        <div class="cell-label">GLSL (Vertex / Fragment)</div>
        <div class="cell-body">
          <pre class="code-block" v-if="vertCode"><span class="hl-c">// ---- 顶点着色器 ----</span>
<code v-html="highlightGLSL(vertCode)"></code></pre>
          <pre class="code-block" v-if="fragCode"><span class="hl-c">// ---- 片段着色器 ----</span>
<code v-html="highlightGLSL(fragCode)"></code></pre>
          <div v-if="!vertCode && !fragCode" class="cell-empty">无 GLSL 源码</div>
        </div>
      </div>

      <!-- 左下: JavaScript -->
      <div class="cell cell-js">
        <div class="cell-label">JavaScript</div>
        <div class="cell-body">
          <pre class="code-block"><code v-html="highlightJS(jsCode)"></code></pre>
        </div>
      </div>

      <!-- 右下: Rendered -->
      <div class="cell cell-canvas">
        <div class="cell-label">Rendered</div>
        <div class="cell-body canvas-wrap">
          <canvas ref="canvasRef" class="demo-canvas"></canvas>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.demo-section {
  scroll-margin-top: 72px;
  margin-bottom: 2rem;
}

.demo-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
}

.demo-title {
  font-size: 1.1rem;
  margin: 0;
  color: var(--c-text);
}

.demo-tags { display: flex; gap: 0.35rem; }

.tag {
  font-size: 0.7rem;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  background: rgba(108,140,255,0.15);
  color: var(--c-primary);
}

.demo-desc {
  font-size: 0.85rem;
  color: var(--c-text-dim);
  margin: 0.25rem 0 0.75rem;
}

/* ===== 2x2 网格 ===== */
.demo-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 1px;
  background: var(--c-border);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  overflow: hidden;
  height: 480px;
  min-height: 400px;
}

.cell {
  background: var(--c-code-bg);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
}

.cell-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--c-text-dim);
  padding: 0.3rem 0.7rem;
  background: rgba(255,255,255,0.03);
  border-bottom: 1px solid var(--c-border);
  flex-shrink: 0;
}

.cell-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
}

/* ===== 自定义滚动条 (暗色主题可见) ===== */
.cell-body::-webkit-scrollbar,
.code-block::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.cell-body::-webkit-scrollbar-track,
.code-block::-webkit-scrollbar-track {
  background: transparent;
}

.cell-body::-webkit-scrollbar-thumb,
.code-block::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 4px;
}

.cell-body::-webkit-scrollbar-thumb:hover,
.code-block::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}

.cell-body::-webkit-scrollbar-corner,
.code-block::-webkit-scrollbar-corner {
  background: transparent;
}

/* Firefox scrollbar */
.cell-body,
.code-block {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.12) transparent;
}

.cell-empty {
  padding: 1rem;
  color: var(--c-text-dim);
  font-style: italic;
  font-size: 0.85rem;
}

.code-block {
  font-size: 0.72rem;
  line-height: 1.5;
  padding: 0.6rem;
  margin: 0;
  white-space: pre;
  tab-size: 2;
  overflow-x: auto;
  overflow-y: hidden;
  width: 100%;
  min-width: 0;
}

.code-block + .code-block {
  border-top: 1px solid var(--c-border);
}

.canvas-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
  padding: 0;
}

.demo-canvas {
  display: block;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
}

/* ===== 语法高亮 ===== */
:deep(.hl-c) { color: #546e7a; font-style: italic; }
:deep(.hl-k) { color: #c792ea; font-weight: 500; }
:deep(.hl-t) { color: #82aaff; }
:deep(.hl-s) { color: #c3e88d; }
:deep(.hl-n) { color: #f78c6c; }
:deep(.hl-fu) { color: #82aaff; }
:deep(.hl-json-key) { color: #89ddff; }

/* ===== 移动端 ===== */
@media (max-width: 768px) {
  .demo-grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    height: auto;
  }
}
</style>
