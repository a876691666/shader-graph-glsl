import { BiTangentVectorRC, NormalRC, TangentVectorRC } from '../components';
import { ShaderGraphCompiler } from './ShaderGraphCompiler';

export const initRandContext = (compiler: ShaderGraphCompiler) => {
  const node = { name: 'Rand', data: {} } as any;
  const codeFn = (varName: string) => `
float ${varName}(vec2 seed) {
  return fract(sin(dot(seed, vec2(12.9898, 78.233))) * 43758.5453);
}`;
  return compiler.setContext('defines', node, 'fn', codeFn);
};

export const initTBNContext = (compiler: ShaderGraphCompiler, space: 'world' = 'world') => {
  const node = { name: 'TBNMat3', data: {} } as any;

  if (space === 'world') {
    const bitangentWS = BiTangentVectorRC.initBiTangentVectorContext(compiler, 'world');
    const tangentWS = TangentVectorRC.initTangentVectorContext(compiler, 'world');
    const normalWS = NormalRC.initNormalContext(compiler, 'world');
    // GLSL version of TransformWorldToTangent
    const codeFn = (varName: string) => `
void ${varName}(mat3 tangentToWorld, out mat3 matTBN_I_T, out float sgn) {
  mat3 tangentToWorld_T = transpose(tangentToWorld);
  vec3 row0 = tangentToWorld_T[0];
  vec3 row1 = tangentToWorld_T[1];
  vec3 row2 = tangentToWorld_T[2];
  vec3 col0 = cross(row1, row2);
  vec3 col1 = cross(row2, row0);
  vec3 col2 = cross(row0, row1);
  float determinant = dot(row0, col0);
  sgn = -step(determinant, 0.0) * 2.0 + 1.0;
  matTBN_I_T = transpose(mat3(col0, col1, col2));
}`;

    const fnVar = compiler.setContext('defines', node, 'get_TBN_IT_sgn', codeFn);
    const TangentToWorldFn = (varName: string) =>
      `mat3 ${varName} = transpose(mat3(${tangentWS}, ${bitangentWS}, ${normalWS}));`;
    const TBN_TangentToWorld_ITFn = (varName: string) =>
      `mat3 ${varName}; float ${varName}_sgn; ${fnVar}(transpose(mat3(${tangentWS}, ${bitangentWS}, ${normalWS})), ${varName}, ${varName}_sgn);`;
    const vert_TBN_TangentToWorld = compiler.setContext('vertShared', node, 'TangentToWorld', TangentToWorldFn);
    const vert_TBN_TangentToWorld_IT = compiler.setContext('vertShared', node, 'TBN_TangentToWorld_IT', TBN_TangentToWorld_ITFn);
    const vert_TBN_TangentToWorld_sgn = vert_TBN_TangentToWorld_IT + '_sgn';
    const frag_TBN_TangentToWorld = compiler.setContext('fragShared', node, 'TangentToWorld', TangentToWorldFn);
    const frag_TBN_TangentToWorld_IT = compiler.setContext('fragShared', node, 'TBN_TangentToWorld_IT', TBN_TangentToWorld_ITFn);
    const frag_TBN_TangentToWorld_sgn = frag_TBN_TangentToWorld_IT + '_sgn';
    const def_TBN_TangentToWorld = compiler.setVarNameMap(node, 'TBN_TangentToWorld_def', vert_TBN_TangentToWorld, frag_TBN_TangentToWorld);
    const def_TBN_TangentToWorld_IT = compiler.setVarNameMap(
      node,
      'TBN_TangentToWorld_IT_def',
      vert_TBN_TangentToWorld_IT,
      frag_TBN_TangentToWorld_IT,
    );
    const def_TBN_TangentToWorld_IT_sgn = compiler.setVarNameMap(
      node,
      'TBN_TangentToWorld_sgn_def',
      vert_TBN_TangentToWorld_sgn,
      frag_TBN_TangentToWorld_sgn,
    );
    return {
      TBN: def_TBN_TangentToWorld,
      TBN_IT: def_TBN_TangentToWorld_IT,
      TBN_IT_sgn: def_TBN_TangentToWorld_IT_sgn,
    };
  }
};

export const initUnpackNormalContext = (compiler: ShaderGraphCompiler) => {
  const node = { name: 'Unpack', data: {} } as any;
  const codeFn = (varName: string) => `
vec3 ${varName}NormalRGB(vec4 packednormal, float bumpScale) {
  vec3 normal;
  normal.xyz = packednormal.rgb * 2.0 - 1.0;
  normal.xy *= bumpScale;
  return normal;
}
vec3 ${varName}ScaleNormalRGorAG(vec4 packednormal_, float bumpScale) {
  vec4 packednormal = packednormal_;
  packednormal.x *= packednormal.w;

  vec3 normal;
  normal.xy = (packednormal.xy * 2.0 - 1.0);
  normal.z = sqrt(1.0 - clamp(dot(normal.xy, normal.xy), 0.0, 1.0));
  return normal;
}
vec3 ${varName}ScaleNormal(vec4 packednormal, float bumpScale) {
  return ${varName}ScaleNormalRGorAG(packednormal, bumpScale);
}`;
  const varName = compiler.setContext('defines', node, 'fn', codeFn);
  return {
    UnpackNormalRGB: `${varName}NormalRGB`,
    UnpackScaleNormalRGorAG: `${varName}ScaleNormalRGorAG`,
    UnpackScaleNormal: `${varName}ScaleNormal`,
  };
};
