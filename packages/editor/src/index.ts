/**
 * @xifu/shader-graph-glsl/editor
 * ==========================
 *
 * 可视化着色器图编辑器。
 * 基于 Rete.js 的节点编辑系统，提供 ShaderGraph 的图形化编辑能力。
 *
 * 使用场景:
 * - 创建和编辑着色器图
 * - 编译图为 ShaderConfig 供运行时使用
 * - 管理参数、子图、预览
 *
 * @packageDocumentation
 */

// ============================================================
// 主类导出
// ============================================================

export { ShaderGraphEditor } from './ShaderGraphEditor';
export type {
  EditorOptions,
  EditorEventMap,
  EditorPlugin,
} from './ShaderGraphEditor';

// ============================================================
// 类型导出
// ============================================================

export type {
  /** 编辑器图数据结构 */
  ShaderGraphData as GraphData,
  /** 着色器图节点数据 */
  SGNodeData,
  /** 着色器图节点集合 */
  SGNodes,
  /** 编辑器设置 */
  SGSetting,
  /** 设置配置 */
  SGSettingValueCfgs,
} from '../../../src/editors/ShaderGraphTypes';

export type {
  /** 子图提供者接口 */
  SubGraphProvider,
} from '../../../src/editors/SubGraphProvider';

// ============================================================
// 共享类型导出 (运行时)
// ============================================================

export type {
  /** 着色器配置 */
  ShaderConfig,
  /** Uniform 元数据 */
  UniformMeta,
  /** Uniform 值 */
  UniformValue,
  /** Uniform 值集合 */
  UniformValues,
} from '../../runtime/src/index';
