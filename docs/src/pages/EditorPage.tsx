import { useEffect, useState, FC, MutableRefObject } from "react";
import { useParams, useNavigate } from "react-router-dom";
import copy from "copy-to-clipboard";
import { ShaderGraphEditor } from "@xifu/shader-graph-glsl/editor";
import type { GraphData } from "@xifu/shader-graph-glsl/editor";
import { useEditor, loadPreset, compileAndPrint } from "../editor/useEditor";
import { Presets } from "../editor/presets";

let toasted = false;
const DefaultGraph = "demoFlowMap";

const Preset: FC<{
  editorRef: MutableRefObject<ShaderGraphEditor | undefined>;
  editorReady: boolean;
}> = ({ editorRef, editorReady }) => {
  const { graph: graphParam } = useParams<{ graph: string }>();
  const navigate = useNavigate();
  const [preset, setPreset] = useState<string>();

  const onChange = (name: any) => {
    const editor = editorRef.current;
    if (!editor) return;
    const data = Presets[name];
    if (!data) return;
    loadPreset(editor, data as unknown as GraphData);
    setPreset(name);
    navigate(`/editor/${name}`, { replace: true });
  };

  // 编辑器就绪后立即加载预设，无需固定延时
  useEffect(() => {
    if (!editorReady) return;
    const graph = graphParam || DefaultGraph;
    if (graph && Presets[graph]) {
      onChange(graph);
    }
  }, [editorReady, editorRef, graphParam]);

  return (
    <select value={preset} onChange={(e) => onChange(e.target.value)} style={{ margin: 2 }}>
      {Object.keys(Presets).map((name) => (
        <option key={name} value={name}>
          {name}
        </option>
      ))}
    </select>
  );
};

const Toolbar: FC<{
  editorRef: MutableRefObject<ShaderGraphEditor | undefined>;
  editorReady: boolean;
}> = ({ editorRef, editorReady }) => {
  const ed = () => editorRef.current;

  return (
    <div className="toolbar">
      <button className="btn" onClick={() => ed()?.inner?.blackboardView?.toggle()}>
        BlackBoard
      </button>
      <button className="btn" onClick={() => ed()?.inner?.mainPreviewView?.toggle()}>
        MainPreview
      </button>
      <button className="btn" onClick={() => ed()?.inner?.inspectorView?.toggle()}>
        Inspector
      </button>
      <button
        className="btn"
        onClick={() => {
          navigator.clipboard.readText().then((text) => {
            ed()?.load(JSON.parse(text));
          });
        }}
      >
        Import
      </button>
      <button
        className="btn"
        onClick={() => {
          const json = JSON.stringify(ed()?.save(), null, 2);
          copy(json);
          if (!toasted) {
            alert("已复制");
            toasted = true;
          }
        }}
      >
        Export
      </button>
      <button className="btn" onClick={() => compileAndPrint(ed())}>
        Compile
      </button>
      <button
        className="btn"
        onClick={() => {
          ed()?.clear?.(true);
          ed()?.createGraph();
        }}
      >
        NewShaderGraph
      </button>
      <button
        className="btn"
        onClick={() => {
          const inner = ed()?.inner;
          if (inner) {
            (inner as any).clear(true);
            (inner as any).initSubGraphNodes?.();
          }
        }}
      >
        NewSubGraph
      </button>
      <Preset editorRef={editorRef} editorReady={editorReady} />
    </div>
  );
};

/**
 * EditorPage — 编辑器页面
 *
 * 在 SPA 多页面两种模式下均可渲染完整的编辑器。
 * SPA 模式下填充视口高度，独立模式下通过 editor/index.html 挂载。
 */
export default function EditorPage() {
  const { setContainer, editorRef, editorReady } = useEditor();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    document.title = "Shader Graph GLSL — Editor";
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <div className="app" style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      <Toolbar editorRef={editorRef} editorReady={editorReady} />
      <div
        className="sg-editor"
        ref={(ref) => {
          if (ref) setContainer(ref);
        }}
      />
    </div>
  );
}
