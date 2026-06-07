/**
 * ThreeAdapter — Three.js 粘合层
 *
 * 将 ShaderConfig 应用到 Three.js RawShaderMaterial，
 * 使编辑器预览能够直接使用运行时引擎的数据格式。
 */

import {
  RawShaderMaterial,
  Texture,
  TextureLoader,
  Matrix4,
  Matrix3,
  Vector2,
  Vector3,
  Vector4,
  Color,
} from 'three';
import type { ShaderConfig, UniformMeta, UniformValues, SubGraphConfig } from './ShaderConfig';
import { MaterialTemplates } from '../templates';

/** Three.js uniform 类型映射 (用于创建 Three.js IUniform) */
function toThreeType(glslType: string): string {
  switch (glslType) {
    case 'float': return 'f';
    case 'int': return 'i';
    case 'bool': return 'b';
    case 'vec2': return 'v2';
    case 'vec3': return 'v3';
    case 'vec4': return 'v4';
    case 'mat2': return 'm2';
    case 'mat3': return 'm3';
    case 'mat4': return 'm4';
    case 'sampler2D': return 't';
    default: return glslType;
  }
}

/** 默认 Three.js uniform 值 */
function defaultThreeValue(type: string): any {
  switch (type) {
    case 'mat4': return new Matrix4();
    case 'mat3': return new Matrix3();
    case 'mat2': return [1, 0, 0, 1];
    case 'vec4': return new Vector4();
    case 'vec3': return new Vector3();
    case 'vec2': return new Vector2();
    case 'float': return 0;
    case 'int': return 0;
    case 'bool': return false;
    case 'sampler2D': return null;
    default: return undefined;
  }
}

/**
 * 将 ShaderConfig 应用到 Three.js RawShaderMaterial
 */
export function applyShaderConfig(
  material: RawShaderMaterial,
  config: ShaderConfig,
  textureLoader?: TextureLoader,
): void {
  // 使用模板包装着色器代码 (若无包装)
  const template = MaterialTemplates.unlit;

  // 分配着色器
  material.vertexShader = config.vertCode;
  material.fragmentShader = config.fragCode;

  // 创建 Three.js uniforms
  const uniforms: Record<string, { value: any; type: string }> = {};

  for (const meta of config.uniforms) {
    if (meta.type === 'sampler2D') {
      uniforms[meta.name] = { value: null, type: 't' };
    } else {
      const threeType = toThreeType(meta.type);
      uniforms[meta.name] = {
        value: meta.default !== undefined ? meta.default : defaultThreeValue(meta.type),
        type: threeType,
      };
    }
  }

  material.uniforms = uniforms;

  // 应用渲染状态
  if (config.renderState) {
    const rs = config.renderState;
    material.transparent = rs.blending === 'transparent' || rs.blending === 'additive' || rs.blending === 'multiply';
    material.depthWrite = rs.depthWrite !== false;
  }

  material.needsUpdate = true;
}

/**
 * 导出编辑器编译结果为 ShaderConfig
 */
export function compilationToShaderConfig(
  compilation: {
    setting: any;
    parameters: any[];
    uniformMap: Record<string, { name: string; type: string }>;
    bindingMap: Record<string, { name: string; type: string; index: number }>;
    resource: { texture: Record<string, any>; sampler: Record<string, any> };
    vertCode: string;
    fragCode: string;
  },
  id: string,
  name?: string,
  subGraphs?: Record<string, SubGraphConfig>,
): ShaderConfig {
  const uniforms: UniformMeta[] = [];
  const textures: ShaderConfig['textures'] = [];

  // 转换 uniformMap
  for (const [contextKey, info] of Object.entries(compilation.uniformMap)) {
    uniforms.push({
      name: info.name,
      type: toUniformDataType(info.type),
      contextKey,
    });
  }

  // 转换 bindingMap (纹理)
  for (const [contextKey, info] of Object.entries(compilation.bindingMap)) {
    const uniformMeta: UniformMeta = {
      name: info.name,
      type: 'sampler2D',
      contextKey,
    };
    uniforms.push(uniformMeta);

    // 纹理资源
    const asset = compilation.resource.texture[contextKey];
    if (asset) {
      textures.push({
        name: info.name,
        assetId: asset.id,
        colorSpace: 'sRGB',
      });
    }
  }

  return {
    version: 1,
    id,
    name,
    vertCode: compilation.vertCode,
    fragCode: compilation.fragCode,
    uniforms,
    textures,
    parameters: compilation.parameters.map(p => ({
      name: p.name,
      type: toUniformDataType(p.type),
      default: p.defalutValue,
    })),
    subGraphs,
  };
}

/** 编辑器类型 → UniformDataType */
function toUniformDataType(type: string): UniformMeta['type'] {
  // 处理 mat4x4<f32> → mat4, sampler2D 等
  const clean = type
    .replace(/<.+?>/, '')
    .replace(/x.+$/, '');
  switch (clean) {
    case 'mat2': case 'mat3': case 'mat4': return clean;
    case 'vec2': case 'vec3': case 'vec4': return clean;
    case 'sampler2D': case 'sampler2DShadow': return 'sampler2D';
    case 'float': case 'int': case 'bool': return clean;
    default: return 'float';
  }
}