/**
 * @shader-graph-glsl/runtime
 * ===========================
 *
 * 轻量、独立的 WebGL2 着色器运行时引擎。
 * 不依赖 Three.js / React 等第三方框架。
 *
 * 使用场景:
 * - 原生 WebGL2 渲染
 * - Three.js / PixiJS / PlayCanvas 等渲染器集成
 * - 编辑器预览面板
 *
 * @packageDocumentation
 */

// ============================================================
// 类型导出
// ============================================================

export type {
  /** 着色器配置 - 编辑器编译产物 */
  ShaderConfig,
  /** Uniform 元数据 */
  UniformMeta,
  /** Uniform 数据类型 */
  UniformDataType,
  /** Uniform 值类型 */
  UniformValue,
  /** Uniform 值集合 */
  UniformValues,
  /** 参数配置 */
  ParameterConfig,
  /** 纹理绑定 */
  TextureBinding,
  /** 子图配置 */
  SubGraphConfig,
  /** 编译选项 */
  ShaderCompileOptions,
} from '../../../src/runtime/ShaderConfig';

export type {
  /** 运行时几何体 */
  GeometryDescriptor,
  /** 顶点属性 */
  VertexAttribute,
  /** 运行时网格 */
  MeshDescriptor,
  /** 渲染状态 */
  RenderState,
} from './types';

// ============================================================
// 类导出
// ============================================================

export { ShaderGraphRuntime } from './ShaderGraphRuntime';
export type { RuntimeOptions, FrameCallback, ProgramHandle, UniformBinder } from './ShaderGraphRuntime';
