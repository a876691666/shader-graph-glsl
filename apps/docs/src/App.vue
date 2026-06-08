<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const navItems = [
  { path: '/', label: '首页' },
  { path: '/api', label: 'API 文档' },
  { path: '/examples', label: '用例' },
  { path: '/editor', label: '编辑器' },
]

function navigate(path: string) {
  router.push(path)
}
</script>

<template>
  <div class="app">
    <header class="header">
      <div class="header-inner">
        <h1 class="logo" @click="navigate('/')">
          <span class="logo-icon">◆</span>
          Shader Graph GLSL
        </h1>
        <nav class="nav">
          <button
            v-for="item in navItems"
            :key="item.path"
            :class="['nav-btn', { active: route.path === item.path }]"
            @click="navigate(item.path)"
          >
            {{ item.label }}
          </button>
        </nav>
        <a
          class="github-link"
          href="https://github.com/a876691666/shader-graph-glsl"
          target="_blank"
        >
          GitHub
        </a>
      </div>
    </header>

    <main class="main">
      <router-view />
    </main>

    <footer class="footer">
      <p>MIT License · a876691666/shader-graph-glsl</p>
    </footer>
  </div>
</template>

<style>
/* ===== Reset & Base ===== */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:root {
  --c-bg: #0f1117;
  --c-surface: #1a1c25;
  --c-border: #2a2d3a;
  --c-text: #e1e4ed;
  --c-text-dim: #8b8fa3;
  --c-primary: #6c8cff;
  --c-primary-dim: #4a6ae0;
  --c-accent: #5ce0b0;
  --c-code-bg: #151820;
  --radius: 8px;
  --font-mono: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace;
}

html {
  font-size: 16px;
  scroll-behavior: smooth;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--c-bg);
  color: var(--c-text);
  line-height: 1.6;
  min-height: 100vh;
}

a { color: var(--c-primary); text-decoration: none; }
a:hover { color: var(--c-accent); }

code, pre {
  font-family: var(--font-mono);
  font-size: 0.9em;
}

pre {
  background: var(--c-code-bg);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  padding: 1rem;
  overflow-x: auto;
  line-height: 1.5;
}

code { color: var(--c-accent); }
pre code { color: var(--c-text); }

/* ===== Layout ===== */
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--c-surface);
  border-bottom: 1px solid var(--c-border);
  backdrop-filter: blur(8px);
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
  height: 56px;
  display: flex;
  align-items: center;
  gap: 2rem;
}

.logo {
  font-size: 1.15rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: var(--c-text);
  user-select: none;
}

.logo-icon { color: var(--c-primary); }

.nav {
  display: flex;
  gap: 0.25rem;
  flex: 1;
}

.nav-btn {
  background: none;
  border: none;
  color: var(--c-text-dim);
  font-size: 0.9rem;
  padding: 0.4rem 0.8rem;
  border-radius: var(--radius);
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover { color: var(--c-text); background: rgba(255,255,255,0.05); }
.nav-btn.active { color: var(--c-primary); background: rgba(108,140,255,0.1); }

.github-link {
  font-size: 0.85rem;
  padding: 0.35rem 0.8rem;
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  transition: all 0.2s;
}

.github-link:hover {
  border-color: var(--c-primary);
  background: rgba(108,140,255,0.1);
}

.main {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.footer {
  text-align: center;
  padding: 2rem;
  color: var(--c-text-dim);
  font-size: 0.85rem;
  border-top: 1px solid var(--c-border);
}

/* ===== Common ===== */
.card {
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  padding: 1.5rem;
}

.card + .card { margin-top: 1rem; }

h2 {
  font-size: 1.5rem;
  margin: 2rem 0 1rem;
  color: var(--c-text);
}

h3 {
  font-size: 1.15rem;
  margin: 1.5rem 0 0.75rem;
  color: var(--c-text);
}

p { margin: 0.5rem 0; color: var(--c-text-dim); }

.tag {
  display: inline-block;
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  background: rgba(108,140,255,0.15);
  color: var(--c-primary);
  margin-right: 0.35rem;
}

.tag.green { background: rgba(92,224,176,0.15); color: var(--c-accent); }
.tag.orange { background: rgba(255,170,80,0.15); color: #ffaa50; }

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

th, td {
  text-align: left;
  padding: 0.6rem 0.8rem;
  border-bottom: 1px solid var(--c-border);
}

th { color: var(--c-text-dim); font-weight: 600; }
td { color: var(--c-text); }
</style>
