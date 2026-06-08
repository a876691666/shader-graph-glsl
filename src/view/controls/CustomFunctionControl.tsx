import './CustomFunctionControl.less';
import React, { FC, useEffect, useRef, useState } from 'react';
import { ReteCustomFunctionNode } from '../../components';
import { Rete } from '../../types';
import ReactDOM from 'react-dom';
import { stopPropagation } from '../utils';
import { getOffset } from '../../rete/view/utils';

const External = { isExternal: true };

interface CustomFunctionViewProps {
  node: ReteCustomFunctionNode;
  editor: Rete.NodeEditor;
  onChange: (prefix: string, v: string) => void;
}

const ExampleCode = `// Custom Function 示例

// 注意事项: 
// 本代码将直接写入到GLSL内, 需注意复制后导致函数重复定义
// 但会复用完全相同的代码片段

float myOtherFn2() {
  return 0.2;
}

// FnName 填写的函数名 主函数入口 可以定义所需要辅助函数
// 数据获取, 如UV Position 均可由有SG对应节点提供
// FN_ARGS 会被替换为: float A, float B, out float Out
void myAdd2(FN_ARGS) {
  Out = A + B + myOtherFn2();
}`;

const ExampleNode = {
  typeValue: 'code',
  typeValueType: 'string',
  nameValue: 'myAdd2',
  nameValueType: 'string',
  bodyValue: '',
  bodyValueType: 'string',
  fileValueType: 'string',
  expanded: true,
  preview: true,
  defineValue: '',
  defineValueType: 'string',
  codeValue: ExampleCode,
  codeValueType: 'string',
  editingCodeValue: true,
  editingCodeValueType: 'bool',
  fnInAValue: '0.5',
  fnInAValueType: 'float',
  fnInBValue: '0.5',
  fnInBValueType: 'float',
  fnOutOutValue: 0,
  fnOutOutValueType: 'float',
};

export const CustomFunctionView: FC<CustomFunctionViewProps> = ({ node, onChange, editor }) => {
  const [show, setShow] = useState(node.getValue('editingCode'));
  const rootRef = useRef<HTMLDivElement>();
  const canRef = useRef<HTMLDivElement>();
  const cmCanRef = useRef<HTMLDivElement>();
  const cmViewRef = useRef<any>();
  const [cmContainer, setCmContainer] = useState<HTMLDivElement>();

  const onExampleClick = async () => {
    const com = editor.components.get('CustomFunction') as Rete.Component | undefined;
    if (com && rootRef.current) {
      const node = await com.createNode(ExampleNode);
      const { left, top } = rootRef.current.getBoundingClientRect();
      const [gx, gy] = editor.view.area.convertToGraphSpace([left, top]);
      node.position[0] = gx + 300;
      node.position[1] = gy - 320;
      editor.addNode(node);
    }
  };

  // 初始化 monaco editor（当容器就绪且 show 时）
  useEffect(() => {
    if (!cmContainer || !show) return;
    let viewer: any = null;
    let cancelled = false;

    // 动态加载 monaco-editor（可选依赖）
    const initMonaco = async () => {
      try {
        const monaco = await import('monaco-editor');

        if (cancelled || !cmContainer) return;

        // 注册 GLSL 语言
        const existing = monaco.languages.getLanguages().find((l: any) => l.id === 'glsl');
        if (!existing) {
          monaco.languages.register({ id: 'glsl' });
          monaco.languages.setMonarchTokensProvider('glsl', {
            tokenizer: {
              root: [
                [/#version.*$/, 'comment'],
                [/\/\/.*$/, 'comment'],
                [/\/\*[\s\S]*?\*\//, 'comment'],
                [/\b(version|precision|highp|mediump|lowp)\b/, 'keyword'],
                [/\b(float|int|bool|void|double)\b/, 'type'],
                [/\b(vec[234]|mat[234]|sampler2D|samplerCube)\b/, 'type'],
                [/\b(attribute|varying|uniform|in|out|inout)\b/, 'keyword'],
                [/\b(const|struct|if|else|for|while|do|return|break|continue|discard)\b/, 'keyword'],
                [/\b(true|false)\b/, 'constant'],
                [/\b(gl_Position|gl_FragCoord|gl_FragColor|gl_PointSize|gl_FrontFacing)\b/, 'predefined'],
                [/\b(sin|cos|tan|asin|acos|atan|pow|exp|log|sqrt|abs|sign|floor|ceil|fract|mod|min|max|clamp|mix|step|smoothstep|length|distance|dot|cross|normalize|reflect|refract|texture|texture2D|textureCube|radians|degrees)\b/, 'function'],
                [/[a-zA-Z_]\w*/, 'identifier'],
                [/\d+\.?\d*/, 'number'],
                [/[{}()\[\]]/, '@brackets'],
              ],
            },
          });
        }

        cmContainer.innerHTML = '';

        viewer = monaco.editor.create(cmContainer, {
          value: node.data.codeValue || '',
          language: 'glsl',
          theme: 'vs-dark',
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
        });

        viewer.onDidChangeModelContent(() => {
          onChange('code', viewer.getValue());
        });

        cmViewRef.current = viewer;
      } catch {
        // monaco-editor 未安装，降级显示 textarea
        if (cmContainer) {
          cmContainer.innerHTML =
            '<textarea class="sg-custom-fn-textarea-fallback" placeholder="monaco-editor not installed. Install it as optional dependency to enable code editing." style="width:100%;height:300px;background:#1e1e1e;color:#ccc;border:1px solid #333;padding:8px;font-family:monospace;font-size:13px"></textarea>';
          const ta = cmContainer.querySelector('textarea');
          if (ta) {
            ta.value = node.data.codeValue || '';
            ta.oninput = () => onChange('code', ta.value);
          }
        }
      }
    };

    initMonaco();

    return () => {
      cancelled = true;
      if (viewer) {
        viewer.dispose();
        viewer = null;
        cmViewRef.current = null;
      }
    };
  }, [cmContainer, show]);

  // 位置同步
  useEffect(() => {
    if (node.data.typeValue === 'code') {
      const syncPos = (e?: any) => {
        if (e && e.node && e.node !== node) return;
        if (rootRef.current && canRef.current) {
          const root = rootRef.current;
          const can = canRef.current;
          const { left, top } = root.getBoundingClientRect();
          const { x: offsetLeft, y: offsetTop } = getOffset(editor.view.container, document.body, 100);
          can.style.transform = `translate(${left - offsetLeft}px, ${top - offsetTop}px) scale(${editor.view.area.transform.k})`;
        }
      };
      syncPos();
      return editor.on(['zoomed', 'translated', 'translatenode'], syncPos);
    }
  }, [node.data.typeValue]);

  // 监听编译报错
  // useEffect(
  //   () =>
  //     editor.on('previewclientcompileerror', ({ node: tartgetNode, errorInCode, errorOther }) => {
  //       if (node !== tartgetNode) return;
  //       cmDiagnosticRef.current = errorInCode.map(({ from, to, error: message }) => ({
  //         to,
  //         from,
  //         message,
  //         severity: 'error',
  //       }));
  //       errorOther.forEach(({ error, context }) => {
  //         cmDiagnosticRef.current.push({ to: 0, from: 0, message: error + '\n\n' + context, severity: 'error' });
  //       });
  //     }),
  //   [],
  // );

  return (
    <div className="sg-custom-fn" ref={el => (rootRef.current = el!)}>
      {/* 为了层叠关系 transform 会创建一个stacking context */}
      {ReactDOM.createPortal(
        <div
          style={{ display: node.data.typeValue === 'code' ? 'block' : 'none' }}
          className="sg-custom-fn-can"
          onContextMenuCapture={stopPropagation}
          ref={el => (canRef.current = el!)}
        >
          <div
            className="sg-custom-fn-btn sg-custom-fn-btn-toogle"
            onClick={() => {
              setShow(!show);
              node.data.editingCodeValue = !show;
            }}
          >
            ✍️
          </div>

          <div style={{ display: show ? 'block' : 'none' }}>
            <div className="sg-custom-fn-head">
              <div className="sg-custom-fn-name">FnName</div>
              <input
                className="sg-custom-fn-input-name"
                value={node.data.nameValue}
                onChange={e => {
                  node.meta.label = e.target.value + '(Custom Function)';
                  onChange('name', e.target.value);
                  node.update?.();
                }}
              />
              <button className="sg-custom-fn-btn" onClick={onExampleClick}>
                示例
              </button>
            </div>
            <div className="sg-custom-fn-body sg-custom-fn-editor" ref={el => { if (el) { cmCanRef.current = el; setCmContainer(el!); } }} />
          </div>
        </div>,
        editor.view.container,
      )}
    </div>
  );
};

export class CustomFunctionControl extends Rete.Control {
  props: CustomFunctionViewProps;
  component = CustomFunctionView;

  constructor(node: ReteCustomFunctionNode, editor: Rete.NodeEditor) {
    super('unused');
    this.props = { node, onChange: this.onChange, editor };
  }

  onChange = (prefix: string, val: any) => {
    this.setNodeValue(prefix, val);
    this.update();
  };
}
