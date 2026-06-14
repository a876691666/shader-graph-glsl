/**
 * useEditor — React hook: 使用 @xifu/shader-graph-glsl/editor 公共 API
 *
 * 替代 example/graph.tsx 中的 useRete，不依赖内部 src/ 或 example/ 模块。
 * 初始化流程与 dev 模式（example/graph.tsx createEditor）保持一致。
 */
import { useState, useEffect, useRef } from 'react'
import { ShaderGraphEditor } from '@xifu/shader-graph-glsl/editor'
import type { GraphData, SubGraphProvider } from '@xifu/shader-graph-glsl/editor'
import { Presets } from './presets'

export interface UseEditorResult {
  /** 编辑器容器 ref setter */
  setContainer: React.Dispatch<React.SetStateAction<HTMLElement | undefined>>
  /** 编辑器实例引用 */
  editorRef: React.MutableRefObject<ShaderGraphEditor | undefined>
  /** 编辑器是否已就绪（可用于触发初始预设加载等操作） */
  editorReady: boolean
}

/**
 * 创建子图提供者，使用 example/presets 中的子图数据
 */
function createSubGraphProvider(): SubGraphProvider {
  return {
    getList: () =>
      Object.keys(Presets)
        .map(name => {
          const cfg = (Presets as any)[name]
          if (cfg?.type === 'SubGraph') return { id: name, label: name }
          return undefined
        })
        .filter(Boolean) as { id: string; label: string }[],
    getGraphData: (asset) => {
      const data = (Presets as any)[asset!.id]
      return data ? Promise.resolve(data) : Promise.reject(new Error(`preset not found: ${asset!.id}`))
    },
  }
}

export function useEditor(): UseEditorResult {
  const [container, setContainer] = useState<HTMLElement>()
  const [editorReady, setEditorReady] = useState(false)
  const editorRef = useRef<ShaderGraphEditor>()

  useEffect(() => {
    if (!container) return
    let disposed = false

    const init = async () => {
      // 创建编辑器实例，传入子图提供者
      const editor = new ShaderGraphEditor(container, {
        autoInit: true,
        showPreview: true,
        autoCompile: true,
        subGraphProvider: createSubGraphProvider(),
      })
      editorRef.current = editor

      // 初始化图（与 dev 模式的 initShaderGraphNodes 对应）
      await editor.createGraph()

      if (disposed) {
        editor.dispose()
        return
      }

      // 等待编辑器完全就绪后调整视图
      await editor.readyPromise

      if (!disposed) {
        try {
          editor.inner.view?.resize()
          editor.inner.trigger?.('process')
        } catch {
          // 忽略调整时的异常
        }
        setEditorReady(true)
      }
    }

    init()

    return () => {
      disposed = true
      if (editorRef.current) {
        editorRef.current.dispose()
        editorRef.current = undefined
      }
    }
  }, [container])

  return { setContainer, editorRef, editorReady }
}

/** 加载预设图到编辑器 */
export function loadPreset(editor: ShaderGraphEditor, data: GraphData) {
  editor.load(data as any)
}

/** 编译并打印结果（匹配 dev 模式 printCompile 行为） */
export async function compileAndPrint(editor: ShaderGraphEditor | undefined) {
  if (!editor) return
  try {
    const config = await editor.compile()
    console.groupCollapsed('===== Compile Result =====')
    console.log('Vertex Shader:')
    console.log(config.vertCode)
    console.log('Fragment Shader:')
    console.log(config.fragCode)
    console.log('Uniforms:', config.uniforms)
    console.groupEnd()
    return config
  } catch (err) {
    console.error('Compile error:', err)
  }
}
