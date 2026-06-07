/**
 * runtime — 独立运行时引擎
 *
 * 可脱离 Three.js 和编辑器独立使用。
 * 编辑器也基于此引擎实现渲染功能。
 *
 * 用法:
 * ```
 * import { RuntimeRenderer, type ShaderConfig } from 'shader-graph-glsl/runtime';
 *
 * const renderer = new RuntimeRenderer(canvas);
 * const program = renderer.loadProgram(shaderConfig);
 * renderer.drawMesh({ geometry, program, uniforms });
 * ```
 */

// 核心类型
export type { ShaderConfig, UniformMeta, UniformDataType, UniformValue, UniformValues } from './ShaderConfig';
export type { ParameterConfig, TextureBinding, SubGraphConfig, ShaderCompileOptions } from './ShaderConfig';

// 运行时引擎
export { RuntimeRenderer } from './RuntimeRenderer';
export type { RuntimeGeometry, VertexAttribute, RuntimeMesh } from './RuntimeRenderer';

// 着色器编译
export { createRuntimeProgram, compileShader, createProgram, applyUniforms, destroyRuntimeProgram } from './RuntimeProgram';
export type { RuntimeProgram } from './RuntimeProgram';

// 子图支持
export { RuntimeSubGraphProvider, exportToShaderConfig } from './RuntimeSubGraphProvider';

// Three.js 适配层 (当需要与 Three.js 互操作时)
export { applyShaderConfig, compilationToShaderConfig } from './ThreeAdapter';
