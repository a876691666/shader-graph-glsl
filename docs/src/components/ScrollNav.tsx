import { useState, useEffect, useRef } from 'react'

interface ScrollNavProps {
  /** 导航项列表 */
  items: { id: string; label: string }[]
  /** 导航事件回调 */
  onNavigate?: (id: string) => void
}

/**
 * ScrollNav — 滚动导航组件
 *
 * 跟随页面滚动，高亮当前可见的章节。
 */
export default function ScrollNav({ items, onNavigate }: ScrollNavProps) {
  const [activeId, setActiveId] = useState('')
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    )

    observerRef.current = observer

    // 观察所有 demo-section
    for (const item of items) {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
    }

    return () => {
      observer.disconnect()
    }
  }, [items])

  function scrollTo(id: string) {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveId(id)
      onNavigate?.(id)
    }
  }

  return (
    <nav className="scroll-nav">
      <div className="scroll-nav-title">📋 示例列表</div>
      <ul className="scroll-nav-list">
        {items.map((item) => (
          <li key={item.id}>
            <button
              className={`scroll-nav-btn${activeId === item.id ? ' active' : ''}`}
              onClick={() => scrollTo(item.id)}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
