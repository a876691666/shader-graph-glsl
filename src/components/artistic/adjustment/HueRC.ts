import { NodeView, DynamicControl, SelectControl } from '../../../view';
import { Sockets } from '../../../sockets';
import { ExtendReteNode, Rete, ValueType } from '../../../types';
import { RC } from '../../ReteComponent';
import { ShaderGraphCompiler, SGNodeOutput } from '../../../compilers';
import { SGNodeData } from '../../../editors';

export type ReteHueNode = ExtendReteNode<
  'Hue',
  {
    inValue: number[];
    inValueType: ValueType.vec3;
    outValue: number[];
    outValueType: ValueType.vec3;
    offsetValue: number;
    offsetValueType: ValueType.float;
    rangeValue: 'degrees' | 'radians';
  }
>;

const RangeOptions = ['degrees', 'radians'];

export class HueRC extends RC {
  static Name = 'Hue';
  constructor() {
    super(HueRC.Name);
    this.data.component = NodeView;
  }

  initNode(node: ReteHueNode) {
    const { data, meta } = node;
    node.initValueType('in', [0, 0, 0], ValueType.vec3);
    node.initValueType('out', [0, 0, 0], ValueType.vec3);
    node.initValueType('offset', 0, ValueType.float);
    node.initValueType('range', 'degrees', ValueType.string);
    data.expanded ??= true;

    meta.previewDisabled = false;
    meta.category = 'artistic/adjustment';
  }

  async builder(node: ReteHueNode) {
    this.initNode(node);

    node
      .addInput(new Rete.Input('in', 'In', Sockets.vec3).addControl(new DynamicControl('in', node)))
      .addInput(new Rete.Input('offset', 'Offset', Sockets.vec3).addControl(new DynamicControl('offset', node)))
      .addOutput(new Rete.Output('out', 'Out', Sockets.vec3))
      .addControl(new SelectControl('range', node, 'Range', RangeOptions, false));
  }

  compileSG(compiler: ShaderGraphCompiler, node: SGNodeData<ReteHueNode>): SGNodeOutput {
    const outVar = compiler.getOutVarName(node, 'out', 'hue');
    const [offsetVar, inVar] = compiler.getInputVarConvertedArray(node, ['offset', 'in']);

    const codeFn = (varName: string) => `
vec3 ${varName}(vec3 In, float Offset) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 P = mix(vec4(In.bg, K.wz), vec4(In.gb, K.xy), step(In.b, In.g));
  vec4 Q = mix(vec4(P.xyw, In.r), vec4(In.r, P.yzx), step(P.x, In.r));
  float D = Q.x - min(Q.w, Q.y);
  float E = 1e-10;
  vec3 hsv = vec3(abs(Q.z + (Q.w - Q.y)/(6.0 * D + E)), D / (Q.x + E), Q.x);

  float hue = hsv.x + ${node.data.rangeValue === 'degrees' ? 'Offset / 360.0' : 'Offset'};
  if (hue < 0.) {
    hsv.x = hue + 1.;
  } else if (hue > 1.) {
    hsv.x = hue - 1.;
  } else {
    hsv.x = hue;
  }

  // HSV to RGB
  vec4 K2 = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 P2 = abs(fract(hsv.xxx + K2.xyz) * 6.0 - K2.www);
  return hsv.z * mix(K2.xxx, clamp(P2 - K2.xxx, vec3(0.0), vec3(1.0)), hsv.y);
}`;
    const fnVar = compiler.setContext('defines', node, node.data.rangeValue, codeFn);

    return {
      outputs: { out: outVar },
      code: `${outVar} = ${fnVar}(${inVar}, ${offsetVar});`,
    };
  }
}
