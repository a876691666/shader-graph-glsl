/**
 * 导航项定义 — 供 Header 共享使用
 */
export interface NavItem {
  /** 直接跳转用绝对路径（含 base） */
  href: string
  /** 显示标签 */
  label: string
  /** HashRouter SPA 内路由路径（不含 base）。null 表示仅在独立页面模式可用 */
  route: string | null
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/shader-graph-glsl/',            label: '首页',   route: '/' },
  { href: '/shader-graph-glsl/#/api',       label: 'API 文档', route: '/api' },
  { href: '/shader-graph-glsl/#/examples',  label: '用例',    route: '/examples' },
  { href: '/shader-graph-glsl/editor/',     label: '编辑器',  route: '/editor' },
]

/** 判断指定路径是否与当前页面匹配（用于高亮） */
export function isNavActive(itemPath: string): boolean {
  const url = window.location.pathname + window.location.hash
  if (itemPath === '/shader-graph-glsl/editor/') {
    return url.startsWith('/shader-graph-glsl/editor') || url === '/shader-graph-glsl/#/editor'
  }
  if (itemPath === '/shader-graph-glsl/') {
    return url === '/shader-graph-glsl/' || url === '/shader-graph-glsl/#/'
  }
  return url === itemPath
}
