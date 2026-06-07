/**
 * ShaderDialect — GLSL 方言配置
 *
 * 此模块集中管理 GLSL 着色器代码生成的所有语法差异，
 * 生成的 GLSL 可在任意渲染器上使用（Three.js, PlayCanvas, PixiJS, 原生 WebGL2）。
 *
 * 目标: GLSL ES 3.00 (WebGL2)
 */

import { ValueType } from '../types';

// ============================================================
// 类型映射
// ============================================================

/** ValueType → GLSL 类型名 */
export const GLSL_TYPE_MAP: Record<string, string> = {
  [ValueType.float]: 'float',
  [ValueType.vec2]: 'vec2',
  [ValueType.vec3]: 'vec3',
  [ValueType.vec4]: 'vec4',
  [ValueType.mat2]: 'mat2',
  [ValueType.mat3]: 'mat3',
  [ValueType.mat4]: 'mat4',
  [ValueType.texture2d]: 'sampler2D',
  [ValueType.bool]: 'bool',
};

/** ValueType → GLSL 构造函数前缀 */
export const GLSL_CTOR_PREFIX: Record<string, string> = {
  [ValueType.float]: 'float',
  [ValueType.vec2]: 'vec2',
  [ValueType.vec3]: 'vec3',
  [ValueType.vec4]: 'vec4',
  [ValueType.mat2]: 'mat2',
  [ValueType.mat3]: 'mat3',
  [ValueType.mat4]: 'mat4',
};

// ============================================================
// 内置函数名映射
// ============================================================

export const GLSL_BUILTIN_MAP: Record<string, string> = {
  dpdx: 'dFdx',
  dpdy: 'dFdy',
  inverseSqrt: 'inversesqrt',
  textureSample: 'texture',
  textureDimensions: 'textureSize',
  atan2: 'atan',

};

// ============================================================
// 语法片段
// ============================================================

/** 顶点着色器入口 (GLSL main 无需装饰器) */
export const GLSL_VERTEX_ENTRY = 'void main()';
export const GLSL_FRAGMENT_ENTRY = 'void main()';

/** 顶点着色器属性声明格式 */
export const glslAttribute = (location: number, type: string, name: string) =>
  `layout(location = ${location}) in ${type} ${name};`;

/** 顶点着色器输出 (varying) 声明格式 */
export const glslVaryingOut = (location: number, type: string, name: string) =>
  `layout(location = ${location}) out ${type} ${name};`;

/** 片段着色器输入 (varying) 声明格式 */
export const glslVaryingIn = (location: number, type: string, name: string) =>
  `layout(location = ${location}) in ${type} ${name};`;

/** uniform 声明 (不指定 binding，由外层模板处理) */
export const glslUniform = (type: string, name: string) =>
  `uniform ${type} ${name};`;

/** 纹理 uniform 声明 */
export const glslTextureUniform = (name: string) =>
  `uniform sampler2D ${name};`;

/** Uniform Block 声明 */
export const glslUniformBlock = (blockName: string, members: string[]) =>
  `layout(std140) uniform ${blockName} {\n${members.map(m => `  ${m};`).join('\n')}\n};`;

/** 片段着色器输出 */
export const glslFragOutput = (location: number, type: string, name: string) =>
  `layout(location = ${location}) out ${type} ${name};`;

// ============================================================
// 辅助函数
// ============================================================

/** 获取 ValueType 对应的 GLSL 类型 */
export function getGLSLType(type: ValueType): string {
  return GLSL_TYPE_MAP[type] || type;
}

/** 将代码中的特定内置函数名替换为 GLSL 版本 */
export function applyGLSLBuiltinMap(code: string): string {
  let result = code;
  for (const [fn, glslFn] of Object.entries(GLSL_BUILTIN_MAP)) {
    // 只替换函数调用（后面跟括号的）
    result = result.replace(new RegExp(`\\b${fn}\\(`, 'g'), `${glslFn}(`);
  }
  return result;
}

// ============================================================
// GLSL 版本头
// ============================================================

export const GLSL_VERSION_HEADER = `#version 300 es
precision highp float;
precision highp int;
`;

// ============================================================
// 默认的顶点属性布局 (可被外层覆盖)
// ============================================================

export const DEFAULT_VERTEX_ATTRIBUTES = {
  position: { location: 0, type: 'vec3', name: 'aPosition' },
  uv: { location: 1, type: 'vec2', name: 'aUV' },
  normal: { location: 2, type: 'vec3', name: 'aNormal' },
  tangent: { location: 3, type: 'vec4', name: 'aTangent' },
} as const;

export type VertexAttributeLayout = typeof DEFAULT_VERTEX_ATTRIBUTES;
