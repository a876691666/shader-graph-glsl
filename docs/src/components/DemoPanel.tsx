import { useRef, useEffect, useMemo } from 'react'
import hljs from 'highlight.js'
import 'highlight.js/styles/atom-one-dark.css'

interface DemoPanelProps {
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
}

/** 使用 highlight.js 高亮代码，返回 HTML 字符串 */
function highlight(code: string, language: string): string {
  if (!code) return ''
  try {
    const result = hljs.highlight(code, { language, ignoreIllegals: true })
    return result.value
  } catch {
    // fallback: escape HTML
    return code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
}

export default function DemoPanel({
  title,
  description,
  shaderConfig,
  jsCode,
  vertCode,
  fragCode,
  init,
  tags,
  sectionId,
}: DemoPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const cleanup = init(canvas)
    return () => {
      if (cleanup) cleanup()
    }
  }, [init])

  // ===== JSON 格式化 =====
  const configJson = useMemo(() => {
    const clone = JSON.parse(JSON.stringify(shaderConfig))
    if (clone.vertCode) clone.vertCode = clone.vertCode.length > 60 ? clone.vertCode.slice(0, 56) + '...' : clone.vertCode
    if (clone.fragCode) clone.fragCode = clone.fragCode.length > 60 ? clone.fragCode.slice(0, 56) + '...' : clone.fragCode
    return JSON.stringify(clone, null, 2)
  }, [shaderConfig])

  const hasGlsl = !!(vertCode || fragCode)

  return (
    <section id={sectionId} className="demo-section">
      <div className="demo-header">
        <h3 className="demo-title">{title}</h3>
        {tags && (
          <div className="demo-tags">
            {tags.map((tag) => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        )}
      </div>
      {description && <p className="demo-desc">{description}</p>}

      {/* 2x2 四栏布局 */}
      <div className="demo-grid">
        {/* 左上: ShaderConfig */}
        <div className="cell cell-config">
          <div className="cell-label">ShaderConfig</div>
          <div className="cell-body">
            <pre className="code-block">
              <code dangerouslySetInnerHTML={{ __html: highlight(configJson, 'json') }} />
            </pre>
          </div>
        </div>

        {/* 右上: GLSL */}
        <div className="cell cell-glsl">
          <div className="cell-label">GLSL (Vertex / Fragment)</div>
          <div className="cell-body">
            {vertCode && (
              <pre className="code-block">
                <code dangerouslySetInnerHTML={{ __html: highlight('// ---- 顶点着色器 ----\n' + vertCode, 'glsl') }} />
              </pre>
            )}
            {fragCode && (
              <pre className="code-block">
                <code dangerouslySetInnerHTML={{ __html: highlight('// ---- 片段着色器 ----\n' + fragCode, 'glsl') }} />
              </pre>
            )}
            {!hasGlsl && <div className="cell-empty">无 GLSL 源码</div>}
          </div>
        </div>

        {/* 左下: JavaScript */}
        <div className="cell cell-js">
          <div className="cell-label">JavaScript</div>
          <div className="cell-body">
            <pre className="code-block">
              <code dangerouslySetInnerHTML={{ __html: highlight(jsCode, 'javascript') }} />
            </pre>
          </div>
        </div>

        {/* 右下: Rendered */}
        <div className="cell cell-canvas">
          <div className="cell-label">Rendered</div>
          <div className="cell-body canvas-wrap">
            <canvas ref={canvasRef} className="demo-canvas" />
          </div>
        </div>
      </div>
    </section>
  )
}
