import { ShaderGraphData } from '../editors';
import {
  AssetValue,
  MaybePromise,
  ParameterData,
  SamplerValue,
  ValueOf,
  ValueType,
} from '../types';

export type SGNodeOutput = MaybePromise<{
  outputs: { [outputName: string]: string };
  code: string;
} | void>;

export type ContextMap = {
  [contextKey: string]: { varName: string; code: string; index?: number };
};
export type ContextItem = ValueOf<ContextMap>;
export type ResourceMap<T> = {
  [contextKey: string]: T | undefined;
};
export type ResourceItem = ValueOf<ResourceMap<AssetValue | SamplerValue>>;
export type VarNameMap = {
  [contextKey: string]: { vertName: string; fragName: string; varName: string };
};
export type VarNameItem = ValueOf<VarNameMap>;

export type Context = ReturnType<typeof initContext>;
export type ContextKeys = keyof Context;
export const initContext = () => ({
  uniforms: {} as ContextMap,
  attributes: {} as ContextMap,
  varyings: {} as ContextMap,
  defines: {} as ContextMap,
  bindings: {} as ContextMap,
  vertShared: {} as ContextMap,
  fragShared: {} as ContextMap,
  autoVaryings: {} as ContextMap,
});

export type Resource = ReturnType<typeof initResource>;
export type ResourceKeys = keyof Resource;
export const initResource = () => ({
  texture: {} as ResourceMap<AssetValue>,
  sampler: {} as ResourceMap<SamplerValue>,
});

export type CodeFn = (varName: string, index: number) => string;
export type NodeName = { name: string };

export const VectorComponetMap = Object.freeze({
  [ValueType.float]: 'x',
  [ValueType.vec2]: 'xy',
  [ValueType.vec3]: 'xyz',
  [ValueType.vec4]: 'xyzw',
} as const);

export const HeadContextItems = [
  'uniforms',
  'attributes',
  'varyings',
  'defines',
  'bindings',
] as const;

export type UniformMap = { [contextKey: string]: { name: string; type: string } };
export type BindingMap = { [contextKey: string]: { name: string; type: string; index: number } };

export interface SGCompilation {
  setting: ShaderGraphData['setting'];
  parameters: ParameterData[];
  resource: Resource;
  uniformMap: UniformMap;
  bindingMap: BindingMap;
  vertCode: string;
  fragCode: string;
}

// ============================================================
// 编译选项 — 支持自定义顶点属性 / varying / uniform 布局
// ============================================================

/** 顶点属性布局定义 */
export interface VertexAttributeDef {
  /** GLSL location */
  location: number;
  /** GLSL 类型 */
  type: string;
  /** 变量名 */
  name: string;
}

/** 默认的顶点属性布局 (兼容 Three.js BufferGeometry) */
export const DEFAULT_VERTEX_ATTRIBUTES: Record<string, VertexAttributeDef> = {
  position: { location: 0, type: 'vec3', name: 'aPosition' },
  uv: { location: 1, type: 'vec2', name: 'aUV' },
  normal: { location: 2, type: 'vec3', name: 'aNormal' },
  tangent: { location: 3, type: 'vec4', name: 'aTangent' },
};

/** 编译选项 */
export interface SGCompilationOptions {
  /** 顶点属性布局 */
  vertexAttributes?: Record<string, VertexAttributeDef>;
  /** 额外的 uniform 声明 (注入到头文件中) */
  extraUniforms?: string[];
  /** 额外的 varying out 声明 (顶点着色器) */
  extraVaryingOut?: string[];
  /** 额外的 varying in 声明 (片段着色器) */
  extraVaryingIn?: string[];
  /** GLSL 版本字符串 (默认 #version 300 es) */
  glslVersion?: string;
  /** 额外的 precision 声明 */
  extraPrecision?: string[];
  /** 注入到顶点 main() 开头的代码 */
  vertMainPreamble?: string;
  /** 注入到片段 main() 开头的代码 */
  fragMainPreamble?: string;
}
