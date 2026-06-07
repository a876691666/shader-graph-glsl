import { ShaderGraphCompiler, SGNodeOutput } from '../../../compilers';
import { SGNodeData } from '../../../editors';
import { Sockets } from '../../../sockets';
import { ExtendReteNode, ValueType, Rete, UV_OPTIONS } from '../../../types';
import { NodeView, SelectControl, FloatControl } from '../../../view';
import { UVRC } from '../../input';
import { RC } from '../../ReteComponent';

export type RetePolygonNode = ExtendReteNode<
  'Polygon',
  {
    uvValue: 'UV0' | 'UV1' | 'UV2' | 'UV3' | number[];
    uvValueType: ValueType.vec2;
    sidesValue: number;
    sidesValueType: ValueType.float;
    widthValue: number;
    widthValueType: ValueType.float;
    heightValue: number;
    heightValueType: ValueType.float;
    outValue: number;
    outValueType: ValueType.float;
  }
>;

export class PolygonRC extends RC {
  constructor() {
    super('Polygon');
    this.data.component = NodeView;
  }

  initNode(node: RetePolygonNode) {
    const { data, meta } = node;
    node.initValueType('uv', 'UV0', ValueType.vec2);
    node.initValueType('sides', 6, ValueType.float);
    node.initValueType('width', 0.5, ValueType.float);
    node.initValueType('height', 0.5, ValueType.float);
    node.initValueType('out', 0, ValueType.float);
    data.expanded ??= true;
    data.preview ??= true;

    meta.previewDisabled = false;
    meta.category = 'procedural/shape';
  }

  async builder(node: RetePolygonNode) {
    this.initNode(node);
    // prettier-ignore
    node
      .addInput(new Rete.Input('uv', 'UV', Sockets.vec2).addControl(new SelectControl('uv', node, '', UV_OPTIONS)))
      .addInput(new Rete.Input('sides', 'Sides', Sockets.float).addControl(new FloatControl('sides', node)))
      .addInput(new Rete.Input('width', 'Width', Sockets.float).addControl(new FloatControl('width', node)))
      .addInput(new Rete.Input('height', 'Height', Sockets.float).addControl(new FloatControl('height', node)))
      .addOutput(new Rete.Output('out', 'Out', Sockets.float));
  }

  compileSG(compiler: ShaderGraphCompiler, node: SGNodeData<RetePolygonNode>): SGNodeOutput {
    const outVar = compiler.getOutVarName(node, 'out', 'polygon');
    const sidesVar = compiler.getInputVarConverted(node, 'sides');
    const widthVar = compiler.getInputVarConverted(node, 'width');
    const heightVar = compiler.getInputVarConverted(node, 'height');
    let uvVar = compiler.getInputVarConverted(node, 'uv', false);
    if (!uvVar) uvVar = UVRC.initUVContext(compiler);

    const codeFn = (varName: string) => `
float ${varName}(vec2 UV, float Sides, float Width, float Height) {
  float pi = 3.14159265359;
  float aWidth = Width * cos(pi / Sides);
  float aHeight = Height * cos(pi / Sides);
  vec2 uv = (UV * 2.0 - 1.0) / vec2(aWidth, aHeight);
  uv.y *= -1.0;
  float pCoord = atan(uv.x, uv.y);
  float r = 2.0 * pi / Sides;
  float d = cos(floor(0.5 + pCoord / r) * r - pCoord) * length(uv);
  return clamp((1.0 - d) / fwidth(d), 0.0, 1.0);
}`;
    const fnVar = compiler.setContext('defines', node, 'fn', codeFn);

    return {
      outputs: { out: outVar },
      code: `${outVar} = ${fnVar}(${uvVar}, ${sidesVar}, ${widthVar}, ${heightVar});`,
    };
  }
}
