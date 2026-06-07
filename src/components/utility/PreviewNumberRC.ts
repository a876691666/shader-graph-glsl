import { ShaderGraphCompiler, SGNodeOutput } from '../../compilers';
import { SGNodeData } from '../../editors';
import { Sockets } from '../../sockets';
import { ExtendReteNode, ValueType, Rete, VectorValueType } from '../../types';
import { NodeView, DynamicControl } from '../../view';
import { UVRC } from '../input';
import { RC } from '../ReteComponent';

export type RetePreviewNumberNode = ExtendReteNode<
  'PreviewNumber',
  {
    inValue: number | number[];
    inValueType: VectorValueType;
    outValue: number | number[];
    outValueType: VectorValueType;
  }
>;

export class PreviewNumberRC extends RC {
  constructor() {
    super('PreviewNumber');
    this.data.component = NodeView;
  }

  initNode(node: RetePreviewNumberNode) {
    const { data, meta } = node;
    node.initValueType('in', 0, ValueType.float);
    node.initValueType('out', [0, 0, 0], ValueType.vec3);
    data.expanded ??= true;
    data.preview ??= true;

    meta.previewDisabled = false;
    meta.category = 'utility';
    meta.label = 'Preview Number';
  }

  async builder(node: RetePreviewNumberNode) {
    this.initNode(node);
    const a = new Rete.Input('in', 'In', Sockets.dynamicVector);
    const out = new Rete.Output('out', 'Out', Sockets.vec3);

    a.addControl(new DynamicControl('in', node));
    node.addOutput(out).addInput(a);
  }

  compileSG(compiler: ShaderGraphCompiler, node: SGNodeData<RetePreviewNumberNode>): SGNodeOutput {
    const fnBaseVar = compiler.setContext(
      'defines',
      node,
      'base',
      varName => `
// Smaller Number Printing - @P_Malin
// Creative Commons CC0 1.0 Universal (CC-0)
// https://www.shadertoy.com/view/4sBSWW

const float ${varName}_DigitBin0 = 480599.0;
const float ${varName}_DigitBin1 = 139810.0;
const float ${varName}_DigitBin2 = 476951.0;
const float ${varName}_DigitBin3 = 476999.0;
const float ${varName}_DigitBin4 = 350020.0;
const float ${varName}_DigitBin5 = 464711.0;
const float ${varName}_DigitBin6 = 464727.0;
const float ${varName}_DigitBin7 = 476228.0;
const float ${varName}_DigitBin8 = 481111.0;
const float ${varName}_DigitBin9 = 481095.0;

float ${varName}_GetDigitBin(int digit) {
  if (digit == 0) return ${varName}_DigitBin0;
  if (digit == 1) return ${varName}_DigitBin1;
  if (digit == 2) return ${varName}_DigitBin2;
  if (digit == 3) return ${varName}_DigitBin3;
  if (digit == 4) return ${varName}_DigitBin4;
  if (digit == 5) return ${varName}_DigitBin5;
  if (digit == 6) return ${varName}_DigitBin6;
  if (digit == 7) return ${varName}_DigitBin7;
  if (digit == 8) return ${varName}_DigitBin8;
  return ${varName}_DigitBin9;
}
float ${varName}_PrintValue(vec2 vStringCoords, float fValue_, float fMaxDigits, float fDecimalPlaces) {       
  if ((vStringCoords.y < 0.0) || (vStringCoords.y >= 1.0)) { 
    return 0.0;
  }
  
  float bNeg = (fValue_ < 0.0) ? 1.0 : 0.0;
  float fValue = abs(fValue_);
    
  float fLog10Value = log2(abs(fValue)) / log2(10.0);
  float fBiggestIndex = max(floor(fLog10Value), 0.0);
  float fDigitIndex = fMaxDigits - floor(vStringCoords.x);
  float fCharBin = 0.0;
  if (fDigitIndex > (-fDecimalPlaces - 1.01)) {
    if (fDigitIndex > fBiggestIndex) {
      if ((bNeg > 0.5) && (fDigitIndex < (fBiggestIndex+1.5))) { 
        fCharBin = 1792.0;
      }
    } else {
      if (fDigitIndex == -1.0) {
        if (fDecimalPlaces > 0.0) { 
          fCharBin = 2.0;
        }
      } else {
        float fReducedRangeValue = fValue;
        if (fDigitIndex < 0.0) {
          fReducedRangeValue = fract(fValue); fDigitIndex += 1.0;
        }
        float fDigitValue = (abs(fReducedRangeValue / (pow(10.0, fDigitIndex))));
        fCharBin = ${varName}_GetDigitBin(int(floor(mod(fDigitValue, 10.0))));
      }
    }
  }
  return floor((fCharBin / pow(2.0, floor(fract(vStringCoords.x) * 4.0) + (floor(vStringCoords.y * 5.0) * 4.0)) - floor(fCharBin / pow(2.0, floor(fract(vStringCoords.x) * 4.0) + (floor(vStringCoords.y * 5.0) * 4.0)) / 2.0) * 2.0));
}`,
    );
    const colorMap = {
      [ValueType.float]: 'vec3(0.6627450980392157, 0.8784313725490196, 0.8941176470588236)',
      [ValueType.vec2]: 'vec3(0.7294117647058823, 0.9137254901960784, 0.6392156862745098)',
      [ValueType.vec3]: 'vec3(0.9764705882352941, 0.9882352941176471, 0.6901960784313725)',
      [ValueType.vec4]: 'vec3(0.9294117647058824, 0.807843137254902, 0.9372549019607843)',
    };

    const print = (offset: string, suffix: string) =>
      `vColour = mix( vColour, fontColor, ${fnBaseVar}_PrintValue( (fragCoord - vec2(${offset})) / vFontSize, value${suffix}, fDigits, fDecimalPlaces));`;
    // prettier-ignore
    const printCodeMap = {
      [ValueType.float]: print('-40, 45.0', ''),
      [ValueType.vec2]: print('-40, 55.0', '.x') + print('-40, 35.0', '.y'),
      [ValueType.vec3]: print('-40, 65.0', '.x') + print('-40, 45.0', '.y') + print('-40, 25.0', '.z'),
      [ValueType.vec4]: print('-40, 75.0', '.x') + print('-40, 55.0', '.y') + print('-40, 35.0', '.z') + print('-40, 15.0', '.w'),
    };
    const fnVar = compiler.setContext(
      'defines',
      node,
      node.data.inValueType,
      varName => `
vec3 ${varName}(vec2 _uv, ${compiler.getTypeClass(node.data.inValueType)} value) {
  vec2 fragCoord = _uv * 100.0;
  vec3 vColour = vec3(0.0);
  vec3 fontColor = ${colorMap[node.data.inValueType]};
  vec2 vFontSize = vec2(10.0, 15.0);
  float fDecimalPlaces = 3.0;
  float fDigits = 7.0;

  ${printCodeMap[node.data.inValueType]}

  return vColour;
}`,
    );
    const inVar = compiler.getInputVarConverted(node, 'in');
    const outVar = compiler.getOutVarName(node, 'out');
    const uvVar = UVRC.initUVContext(compiler);
    return {
      outputs: { out: outVar },
      code: `${outVar} = ${fnVar}(${uvVar}, ${inVar});`,
    };
  }
}
