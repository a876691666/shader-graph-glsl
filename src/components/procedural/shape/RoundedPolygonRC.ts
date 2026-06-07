import { ShaderGraphCompiler, SGNodeOutput } from '../../../compilers';
import { SGNodeData } from '../../../editors';
import { Sockets } from '../../../sockets';
import { ExtendReteNode, ValueType, Rete, UV_OPTIONS } from '../../../types';
import { NodeView, SelectControl, FloatControl } from '../../../view';
import { ConstantRC, UVRC } from '../../input';
import { RC } from '../../ReteComponent';

export type ReteRoundedPolygonNode = ExtendReteNode<
  'RoundedPolygon',
  {
    uvValue: 'UV0' | 'UV1' | 'UV2' | 'UV3' | number[];
    uvValueType: ValueType.vec2;
    sidesValue: number;
    sidesValueType: ValueType.float;
    roundnessValue: number;
    roundnessValueType: ValueType.float;
    widthValue: number;
    widthValueType: ValueType.float;
    heightValue: number;
    heightValueType: ValueType.float;
    outValue: number;
    outValueType: ValueType.float;
  }
>;

export class RoundedPolygonRC extends RC {
  constructor() {
    super('RoundedPolygon');
    this.data.component = NodeView;
  }

  initNode(node: ReteRoundedPolygonNode) {
    const { data, meta } = node;
    node.initValueType('uv', 'UV0', ValueType.vec2);
    node.initValueType('sides', 6, ValueType.float);
    node.initValueType('roundness', 0.3, ValueType.float);
    node.initValueType('width', 0.5, ValueType.float);
    node.initValueType('height', 0.5, ValueType.float);
    node.initValueType('out', 0, ValueType.float);
    data.expanded ??= true;
    data.preview ??= true;

    meta.previewDisabled = false;
    meta.category = 'procedural/shape';
    meta.label = 'Rounded Polygon';
  }

  async builder(node: ReteRoundedPolygonNode) {
    this.initNode(node);
    // prettier-ignore
    node
      .addInput(new Rete.Input('uv', 'UV', Sockets.vec2).addControl(new SelectControl('uv', node, '', UV_OPTIONS)))
      .addInput(new Rete.Input('width', 'Width', Sockets.float).addControl(new FloatControl('width', node)))
      .addInput(new Rete.Input('height', 'Height', Sockets.float).addControl(new FloatControl('height', node)))
      .addInput(new Rete.Input('sides', 'Sides', Sockets.float).addControl(new FloatControl('sides', node)))
      .addInput(new Rete.Input('roundness', 'Roundness', Sockets.float).addControl(new FloatControl('roundness', node)))
      .addOutput(new Rete.Output('out', 'Out', Sockets.float));
  }

  compileSG(compiler: ShaderGraphCompiler, node: SGNodeData<ReteRoundedPolygonNode>): SGNodeOutput {
    const outVar = compiler.getOutVarName(node, 'out', 'roundpolygon');
    const sidesVar = compiler.getInputVarConverted(node, 'sides');
    const roundnessVar = compiler.getInputVarConverted(node, 'roundness');
    const widthVar = compiler.getInputVarConverted(node, 'width');
    const heightVar = compiler.getInputVarConverted(node, 'height');
    let uvVar = compiler.getInputVarConverted(node, 'uv', false);
    if (!uvVar) uvVar = UVRC.initUVContext(compiler);

    const piVar = ConstantRC.initConstantContext(compiler, 'PI');
    const piHalfVar = ConstantRC.initConstantContext(compiler, 'PI_HALF');
    const codeFn = (varName: string) => `
float ${varName}(vec2 UV_, float Width, float Height, float Sides, float Roundness_) {
  float Out;
  vec2 UV = UV_ * 2. + vec2(-1.,-1.);
  UV.x = UV.x / Width;
  UV.y = UV.y / Height;
  float Roundness = clamp(Roundness_, 1e-6, 1.);
  float i_sides = floor( abs( Sides ) );
  float fullAngle = 2. * ${piVar} / i_sides;
  float halfAngle = fullAngle / 2.;
  float opositeAngle = ${piHalfVar} - halfAngle;
  float diagonal = 1. / cos( halfAngle );
  // Chamfer values
  float chamferAngle = Roundness * halfAngle; // Angle taken by the chamfer
  float remainingAngle = halfAngle - chamferAngle; // Angle that remains
  float ratio = tan(remainingAngle) / tan(halfAngle); // This is the ratio between the length of the polygon's triangle and the distance of the chamfer center to the polygon center
  // Center of the chamfer arc
  vec2 chamferCenter = vec2(
      cos(halfAngle) ,
      sin(halfAngle)
  )* ratio * diagonal;
  // starting of the chamfer arc
  vec2 chamferOrigin = vec2(
      1.,
      tan(remainingAngle)
  );
  // Using Al Kashi algebra, we determine:
  // The distance distance of the center of the chamfer to the center of the polygon (side A)
  float distA = length(chamferCenter);
  // The radius of the chamfer (side B)
  float distB = 1. - chamferCenter.x;
  // The refence length of side C, which is the distance to the chamfer start
  float distCref = length(chamferOrigin);
  // This will rescale the chamfered polygon to fit the uv space
  // diagonal = length(chamferCenter) + distB;
  float uvScale = diagonal;
  UV *= uvScale;
  vec2 polaruv = vec2(
      atan( UV.y, UV.x ),
      length(UV)
  );
  polaruv.x += ${piHalfVar} + 2.*${piVar};
  polaruv.x = mod((polaruv.x + halfAngle), fullAngle);
  polaruv.x = abs(polaruv.x - halfAngle);
  UV = vec2( cos(polaruv.x), sin(polaruv.x) ) * polaruv.y;
  // Calculate the angle needed for the Al Kashi algebra
  float angleRatio = 1. - (polaruv.x-remainingAngle) / chamferAngle;
  // Calculate the distance of the polygon center to the chamfer extremity
  float distC = sqrt( distA*distA + distB*distB - 2.*distA*distB*cos( ${piVar} - halfAngle * angleRatio ) );
  Out = UV.x;
  float chamferZone = step(( halfAngle - polaruv.x ), chamferAngle); // ( halfAngle - polaruv.x ) < chamferAngle;
  Out = mix( UV.x, polaruv.y / distC, chamferZone );
  // Output this to have the shape mask instead of the distance field
  Out = clamp((1. - Out) / fwidth(Out), 0.0, 1.0);
  return Out;
}`;
    const fnVar = compiler.setContext('defines', node, 'fn', codeFn);

    return {
      outputs: { out: outVar },
      code: `${outVar} = ${fnVar}(${uvVar}, ${widthVar}, ${heightVar}, ${sidesVar}, ${roundnessVar});`,
    };
  }
}
