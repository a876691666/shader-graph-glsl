/**
 * @shader-graph-glsl/runtime — 公共类型定义
 */

import type { UniformMeta, UniformValues } from '../../../src/runtime/ShaderConfig';
import type { RuntimeProgram } from '../../../src/runtime/RuntimeProgram';

// ============================================================
// 几何体描述 (无框架依赖)
// ============================================================

/** 顶点属性 */
export interface VertexAttribute {
  /** 顶点数据 */
  data: Float32Array;
  /** 每分量元素数 (1=float, 2=vec2, 3=vec3, 4=vec4) */
  size: number;
  /** 是否归一化 */
  normalized?: boolean;
  /** 步长 */
  stride?: number;
  /** 偏移 */
  offset?: number;
}

/** 几何体描述 */
export interface GeometryDescriptor {
  /** 顶点属性集合 */
  attributes: Record<string, VertexAttribute>;
  /** 索引缓冲区 (可选) */
  index?: Uint16Array | Uint32Array;
  /** 顶点数 */
  vertexCount: number;
}

// ============================================================
// 渲染描述
// ============================================================

/** 渲染状态 */
export interface RenderState {
  /** 清除颜色 */
  clearColor?: [number, number, number, number];
  /** 是否启用深度测试 */
  depthTest?: boolean;
  /** 深度测试函数 */
  depthFunc?: 'never' | 'less' | 'equal' | 'lequal' | 'greater' | 'notequal' | 'gequal' | 'always';
  /** 是否启用混合 */
  blend?: boolean;
  /** 混合源因子 */
  blendSrc?: number;
  /** 混合目标因子 */
  blendDst?: number;
  /** 视口 */
  viewport?: [number, number, number, number];
}

/** 网格渲染描述 */
export interface MeshDescriptor {
  /** 几何体 */
  geometry: GeometryDescriptor;
  /** 着色器程序句柄 */
  program: RuntimeProgram;
  /** uniform 值 */
  uniforms: UniformValues;
  /** 绘制模式 (gl.TRIANGLES / gl.LINES 等，默认 gl.TRIANGLES) */
  mode?: number;
  /** 渲染状态覆盖 */
  renderState?: RenderState;
}
