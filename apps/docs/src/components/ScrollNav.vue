<script setup lang="ts">
/**
 * ScrollNav — 滚动导航组件
 *
 * 跟随页面滚动，高亮当前可见的章节。
 */

import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  /** 导航项列表 */
  items: { id: string; label: string }[]
}>()

const emit = defineEmits<{
  navigate: [id: string]
}>()

const activeId = ref('')
const observer = ref<IntersectionObserver | null>(null)

onMounted(() => {
  observer.value = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeId.value = entry.target.id
        }
      }
    },
    { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
  )

  // 观察所有 demo-section
  for (const item of props.items) {
    const el = document.getElementById(item.id)
    if (el) observer.value.observe(el)
  }
})

onUnmounted(() => {
  if (observer.value) observer.value.disconnect()
})

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    activeId.value = id
    emit('navigate', id)
  }
}
</script>

<template>
  <nav class="scroll-nav">
    <div class="scroll-nav-title">📋 示例列表</div>
    <ul class="scroll-nav-list">
      <li v-for="item in items" :key="item.id">
        <button
          :class="['scroll-nav-btn', { active: activeId === item.id }]"
          @click="scrollTo(item.id)"
        >
          {{ item.label }}
        </button>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.scroll-nav {
  position: fixed;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  z-index: 50;
  background: var(--c-surface);
  border: 1px solid var(--c-border);
  border-radius: var(--radius);
  padding: 0.75rem;
  min-width: 130px;
  max-width: 180px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.scroll-nav-title {
  font-size: 0.75rem;
  color: var(--c-text-dim);
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--c-border);
}

.scroll-nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.scroll-nav-btn {
  display: block;
  width: 100%;
  text-align: left;
  font-size: 0.78rem;
  padding: 0.3rem 0.5rem;
  border: none;
  border-radius: 4px;
  background: none;
  color: var(--c-text-dim);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.scroll-nav-btn:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--c-text);
}

.scroll-nav-btn.active {
  background: rgba(108, 140, 255, 0.12);
  color: var(--c-primary);
  font-weight: 500;
}

@media (max-width: 1100px) {
  .scroll-nav {
    display: none;
  }
}
</style>
