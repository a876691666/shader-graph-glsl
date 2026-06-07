import { ShaderGraphCompiler, SGNodeOutput, initRandContext } from '../../../compilers';
import { SGNodeData } from '../../../editors';
import { Sockets } from '../../../sockets';
import { ExtendReteNode, ValueType, Rete, UV_OPTIONS } from '../../../types';
import { NodeView, SelectControl, FloatControl } from '../../../view';
import { UVRC } from '../../input';
import { RC } from '../../ReteComponent';

export type ReteSimpleNoiseNode = ExtendReteNode<
  'SimpleNoise',
  {
    uvValue: 'UV0' | 'UV1' | 'UV2' | 'UV3' | number[];
    uvValueType: ValueType.vec2;
    scaleValue: number;
    scaleValueType: ValueType.float;
    outValue: number;
    outValueType: ValueType.float;
  }
>;

export class SimpleNoiseRC extends RC {
  constructor() {
    super('SimpleNoise');
    this.data.component = NodeView;
  }

  initNode(node: ReteSimpleNoiseNode) {
    const { data, meta } = node;
    node.initValueType('uv', 'UV0', ValueType.vec2);
    node.initValueType('scale', 500, ValueType.float);
    node.initValueType('out', 0, ValueType.float);
    data.expanded ??= true;
    data.preview ??= true;

    meta.previewDisabled = false;
    meta.category = 'procedural/noise';
  }

  async builder(node: ReteSimpleNoiseNode) {
    this.initNode(node);
    node
      .addInput(new Rete.Input('uv', 'UV', Sockets.vec2).addControl(new SelectControl('uv', node, '', UV_OPTIONS)))
      .addInput(new Rete.Input('scale', 'Scale', Sockets.float).addControl(new FloatControl('scale', node)))
      .addOutput(new Rete.Output('out', 'Out', Sockets.float));
  }

  compileSG(compiler: ShaderGraphCompiler, node: SGNodeData<ReteSimpleNoiseNode>): SGNodeOutput {
    const outVar = compiler.getOutVarName(node, 'out', 'simple_noise');
    const scaleVar = compiler.getInputVarConverted(node, 'scale');
    let uvVar = compiler.getInputVarConverted(node, 'uv', false);

    if (!uvVar) uvVar = UVRC.initUVContext(compiler);

    const randFn = initRandContext(compiler);
    const codeFn = (varName: string) => `
float ${varName}_interpolate (float a, float b, float t) {
  return (1.0-t)*a + (t*b);
}
float ${varName}_valueNoise (vec2 uv_) {
  vec2 i = floor(uv_);
  vec2 f = fract(uv_);
  f = f * f * (3.0 - 2.0 * f);

  vec2 uv = abs(fract(uv_) - 0.5);
  vec2 c0 = i + vec2(0.0, 0.0);
  vec2 c1 = i + vec2(1.0, 0.0);
  vec2 c2 = i + vec2(0.0, 1.0);
  vec2 c3 = i + vec2(1.0, 1.0);
  float r0 = ${randFn}(c0);
  float r1 = ${randFn}(c1);
  float r2 = ${randFn}(c2);
  float r3 = ${randFn}(c3);

  float bottomOfGrid = ${varName}_interpolate(r0, r1, f.x);
  float topOfGrid = ${varName}_interpolate(r2, r3, f.x);
  float t = ${varName}_interpolate(bottomOfGrid, topOfGrid, f.y);
  return t;
}
float ${varName}(vec2 UV, float Scale) {
  float t = 0.0;

  float freq = pow(2.0, 0.0);
  float amp = pow(0.5, 3.0-0.0);
  t += ${varName}_valueNoise(vec2(UV.x*Scale/freq, UV.y*Scale/freq))*amp;

  freq = pow(2.0, 1.0);
  amp = pow(0.5, 3.0-1.0);
  t += ${varName}_valueNoise(vec2(UV.x*Scale/freq, UV.y*Scale/freq))*amp;

  freq = pow(2.0, 2.0);
  amp = pow(0.5, 3.0-2.0);
  t += ${varName}_valueNoise(vec2(UV.x*Scale/freq, UV.y*Scale/freq))*amp;

  return t;
}`;
    const fnVar = compiler.setContext('defines', node, 'fn', codeFn);

    return {
      outputs: { out: outVar },
      code: `${outVar} = ${fnVar}(${uvVar}, ${scaleVar});`,
    };
  }
}
