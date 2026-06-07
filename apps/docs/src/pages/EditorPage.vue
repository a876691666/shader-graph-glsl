<script setup lang="ts">
/**
 * EditorPage — 内嵌 ShaderGraph Editor 的页面
 *
 * 通过 iframe 加载独立构建的编辑器 dev 页面。
 * 编辑器构建产物位于 /editor/ 目录下。
 */
</script>

<template>
  <div class="editor-page">
    <div class="editor-header">
      <h2>🎨 ShaderGraph Editor</h2>
      <p class="editor-desc">
        可视化着色器图编辑器。拖拽节点、连线、预览，编译产出 ShaderConfig。
        <a :href="'/shader-graph-glsl/editor/'" target="_blank" class="editor-open-link">
          在新窗口打开 ↗
        </a>
      </p>
    </div>
    <div class="editor-frame-wrap">
      <iframe
        :src="'/shader-graph-glsl/editor/'"
        class="editor-frame"
        title="ShaderGraph Editor"
      />
    </div>
  </div>
</template>

<style scoped>
.editor-page {
  display: flex;
  flex-direction: column;
  position: fixed;
  inset: 56px 0 0;
  z-index: 10;
  background: var(--c-bg);
}

.editor-header {
  padding: 0.75rem 1.5rem;
  flex-shrink: 0;
  border-bottom: 1px solid var(--c-border);
  background: var(--c-surface);
}

.editor-header h2 {
  margin: 0 0 0.15rem;
  font-size: 1.15rem;
}

.editor-desc {
  margin: 0;
  font-size: 0.82rem;
  color: var(--c-text-dim);
}

.editor-open-link {
  font-size: 0.78rem;
  color: var(--c-primary);
  text-decoration: none;
  margin-left: 0.5rem;
}

.editor-open-link:hover {
  color: var(--c-accent);
  text-decoration: underline;
}

.editor-frame-wrap {
  flex: 1;
  overflow: hidden;
}

.editor-frame {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}
</style>
