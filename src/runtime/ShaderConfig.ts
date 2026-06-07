/**
 * ShaderConfig — 结构化着色器配置导出格式
 *
 * 这是运行时引擎与编辑器之间的契约类型。
 * 编辑器编译导出的 ShaderConfig 可由运行时引擎直接加载渲染。
 */

// ============================================================
// 核心着色器配置
// ============================================================

/** Uniform 元数据 (用于运行时更新) */
export interface UniformMeta {
  /** GLSL 中的变量名 */
  name: string;
  /** GLSL 类型 */
  type: UniformDataType;
  /** 默认值 */
  default?: UniformValue;
  /** 编辑器上下文键 (用于编辑器映射) */
  contextKey?: string;
}

export type UniformDataType =
  | 'float' | 'int' | 'bool'
  | 'vec2' | 'vec3' | 'vec4'
  | 'mat2' | 'mat3' | 'mat4'
  | 'sampler2D';

export type UniformValue =
  | number
  | [number, number]
  | [number, number, number]
  | [number, number, number, number]
  | number[];

/** 纹理绑定配置 */
export interface TextureBinding {
  /** uniform 变量名 */
  name: string;
  /** 纹理 URL 或 asset ID */
  url?: string;
  /** 纹理 asset ID (编辑器资源引用) */
  assetId?: string;
  /** 颜色空间 */
  colorSpace?: 'sRGB' | 'Linear';
  /** 类型 (default / normal) */
  type?: 'default' | 'normal';
}

/** 参数配置 (编辑器暴露的可调参数) */
export interface ParameterConfig {
  name: string;
  type: UniformDataType;
  default: UniformValue;
}

/** 子图配置 */
export interface SubGraphConfig {
  /** 子图 ID (与主图中引用的 asset.id 对应) */
  id: string;
  /** 子图名称 */
  name?: string;
  /** 子图的完整着色器配置 */
  config: ShaderConfig;
}

/** 导出着色器配置 v1 */
export interface ShaderConfig {
  /** 配置版本 */
  version: 1;
  /** 唯一标识 */
  id: string;
  /** 可读名称 */
  name?: string;

  // ============================================================
  // 着色器代码 (已由 MaterialTemplates 包装, 可直接编译)
  // ============================================================

  /** 完整顶点着色器 GLSL ES 3.00 源码 */
  vertCode: string;
  /** 完整片段着色器 GLSL ES 3.00 源码 */
  fragCode: string;

  // ============================================================
  // Uniform 反射信息 (用于运行时按名更新)
  // ============================================================

  /** 所有 uniform 元数据 */
  uniforms: UniformMeta[];
  /** 纹理绑定信息 */
  textures: TextureBinding[];

  // ============================================================
  // 编辑器设置 (序列化保留)
  // ============================================================

  /** 暴露的参数 (可在运行时覆盖) */
  parameters: ParameterConfig[];

  /** 渲染状态 */
  renderState?: {
    /** 混合模式 */
    blending?: 'opaque' | 'transparent' | 'additive' | 'multiply';
    /** 面剔除 */
    cullMode?: 'front' | 'back' | 'none';
    /** 深度写入 */
    depthWrite?: boolean;
    /** 深度测试 */
    depthTest?: 'never' | 'less' | 'equal' | 'lequal' | 'greater' | 'notequal' | 'gequal' | 'always';
    /** 精度 */
    precision?: 'highp' | 'mediump' | 'lowp';
  };

  // ============================================================
  // 子图依赖
  // ============================================================

  /** 引用的子图 (key = asset.id) */
  subGraphs?: Record<string, SubGraphConfig>;
}

// ============================================================
// 编译选项
// ============================================================

/** 编译选项 (编辑器 → 编译器) */
export interface ShaderCompileOptions {
  /** 模板类型 */
  template: 'unlit' | 'lit' | 'subgraph';
  /** precision */
  precision?: 'single' | 'float';
  /** 表面类型 */
  surfaceType?: 'opaque' | 'transparent';
  /** 渲染面 */
  renderFace?: 'front' | 'back' | 'both';
  /** 深度写入 */
  depthWrite?: 'auto' | 'enable' | 'disable';
  /** 深度测试 */
  depthTest?: string;
  /** alpha 裁剪 */
  alphaClipping?: boolean;
  /** 投射阴影 */
  castShadows?: boolean;
  /** 混合模式 */
  blendingMode?: 'alpha' | 'additive' | 'multiply' | 'premultiply';
  /** 允许材质覆盖 */
  allowMaterialOverride?: boolean;
}

// ============================================================
// 运行时状态 (非序列化)
// ============================================================

/** Uniform 运行时值集合 */
export interface UniformValues {
  [name: string]: UniformValue | WebGLTexture | null;
}
