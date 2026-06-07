import { ShaderGraphCompiler, SGNodeOutput } from '../../../compilers';
import { SGNodeData } from '../../../editors';
import { Sockets } from '../../../sockets';
import { ExtendReteNode, ValueType, Rete, UV_OPTIONS } from '../../../types';
import { NodeView, SelectControl, FloatControl } from '../../../view';
import { UVRC } from '../../input';
import { RC } from '../../ReteComponent';

export type ReteGradientNoiseNode = ExtendReteNode<
  'GradientNoise',
  {
    uvValue: 'UV0' | 'UV1' | 'UV2' | 'UV3' | number[];
    uvValueType: ValueType.vec2;
    scaleValue: number;
    scaleValueType: ValueType.float;
    outValue: number;
    outValueType: ValueType.float;
  }
>;

export class GradientNoiseRC extends RC {
  constructor() {
    super('GradientNoise');
    this.data.component = NodeView;
  }

  initNode(node: ReteGradientNoiseNode) {
    const { data, meta } = node;
    node.initValueType('uv', 'UV0', ValueType.vec2);
    node.initValueType('scale', 10, ValueType.float);
    node.initValueType('out', 0, ValueType.float);
    data.expanded ??= true;
    data.preview ??= true;

    meta.previewDisabled = false;
    meta.category = 'procedural/noise';
  }

  async builder(node: ReteGradientNoiseNode) {
    this.initNode(node);
    node
      .addInput(new Rete.Input('uv', 'UV', Sockets.vec2).addControl(new SelectControl('uv', node, '', UV_OPTIONS)))
      .addInput(new Rete.Input('scale', 'Scale', Sockets.float).addControl(new FloatControl('scale', node)))
      .addOutput(new Rete.Output('out', 'Out', Sockets.float));
  }

  compileSG(compiler: ShaderGraphCompiler, node: SGNodeData<ReteGradientNoiseNode>): SGNodeOutput {
    const outVar = compiler.getOutVarName(node, 'out', 'gradient_noise');
    const scaleVar = compiler.getInputVarConverted(node, 'scale');
    let uvVar = compiler.getInputVarConverted(node, 'uv', false);

    if (!uvVar) uvVar = UVRC.initUVContext(compiler);

    const codeFn = (varName: string) => `
vec2 ${varName}_dir(vec2 p_) {
  vec2 p = mod(p_, 289.0);
  float x = (34.0 * p.x + 1.0) * mod(p.x, 289.0) + p.y;
  x = (34.0 * x + 1.0) * mod(x, 289.0);
  x = fract(x / 41.0) * 2.0 - 1.0;
  return normalize(vec2(x - floor(x + 0.5), abs(x) - 0.5));
}
float ${varName}(vec2 p) {
  vec2 ip = floor(p);
  vec2 fp = fract(p);
  float d00 = dot(${varName}_dir(ip), fp);
  float d01 = dot(${varName}_dir(ip + vec2(0, 1)), fp - vec2(0, 1));
  float d10 = dot(${varName}_dir(ip + vec2(1, 0)), fp - vec2(1, 0));
  float d11 = dot(${varName}_dir(ip + vec2(1, 1)), fp - vec2(1, 1));
  fp = fp * fp * fp * (fp * (fp * 6. - 15.) + 10.);
  return mix(mix(d00, d01, fp.y), mix(d10, d11, fp.y), fp.x);
}`;
    const fnVar = compiler.setContext('defines', node, 'fn', codeFn);

    return {
      outputs: { out: outVar },
      code: `${outVar} = ${fnVar}(${uvVar} * ${scaleVar});`,
    };
  }
}
