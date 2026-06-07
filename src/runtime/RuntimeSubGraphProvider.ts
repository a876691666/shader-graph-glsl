/**
 * RuntimeSubGraphProvider — 运行时子图提供者
 *
 * 当 ShaderConfig 中嵌入了 subGraphs 时，此提供者将
 * 子图配置转换为编译器可用的数据结构，使得运行时也能
 * 正确编译包含子图的 ShaderGraph。
 *
 * 子图流程:
 * 1. 编辑器编译主图 → 发现 SubGraph 节点
 * 2. 编辑器递归编译子图 → 得到 SubShaderConfig
 * 3. 导出时将子图嵌入主图的 ShaderConfig.subGraphs
 * 4. 运行时/编辑器加载时，SubGraphProvider 返回子图配置
 */

import { ShaderGraphData } from '../editors/ShaderGraphTypes';
import type { SubGraphProvider } from '../editors/SubGraphProvider';
import type { AssetValue } from '../types';
import type { ShaderConfig, SubGraphConfig } from './ShaderConfig';

/**
 * 运行时子图提供者
 * 将 ShaderConfig.subGraphs 中的子图数据暴露给编译器
 */
export class RuntimeSubGraphProvider implements SubGraphProvider {
  private subGraphs: Map<string, SubGraphConfig> = new Map();

  constructor(configs?: Record<string, SubGraphConfig>) {
    if (configs) {
      for (const [id, cfg] of Object.entries(configs)) {
        this.subGraphs.set(id, cfg);
      }
    }
  }

  /** 注册子图 */
  register(id: string, config: SubGraphConfig): void {
    this.subGraphs.set(id, config);
  }

  /** 批量注册 */
  registerAll(configs: Record<string, SubGraphConfig>): void {
    for (const [id, cfg] of Object.entries(configs)) {
      this.subGraphs.set(id, cfg);
    }
  }

  /** 获取子图列表 (编辑器用) */
  getList(): AssetValue[] {
    return Array.from(this.subGraphs.keys()).map(id => ({
      id,
      label: this.subGraphs.get(id)?.name || id,
    }));
  }

  /** 获取子图数据 (编译器用) */
  getGraphData(asset: AssetValue): ShaderGraphData {
    if (!asset) throw new Error('SubGraph: asset is required');
    const id = asset.id;
    const cfg = this.subGraphs.get(id);
    if (!cfg) throw new Error(`SubGraph not found: ${id}`);

    // 将子图的 ShaderConfig 还原为 ShaderGraphData
    // 注意: 此处返回的是已编译的子图，编译器需要用它生成函数体
    // 实际上编译过程是:
    // 1. 编辑器编译子图 → ShaderConfig
    // 2. 导出到主图的 subGraphs
    // 3. 运行时加载主图时，通过此方法获取子图的节点代码
    //
    // 对于运行时直接加载预编译子图，编译器需要的是
    // ShaderGraphData 来重新编译生成内联函数。
    // 但更高效的方式是直接使用预编译结果。
    //
    // 这里抛出错误以提示需要使用预编译模式
    throw new Error(
      `RuntimeSubGraphProvider.getGraphData: 子图 "${id}" 已预编译，` +
      '需要 ShaderGraphCompiler 的预编译子图模式支持。' +
      '请确保编译器已正确设置 subGraphProvider。'
    );
  }

  /** 获取子图的 ShaderConfig (直接用于运行时) */
  getShaderConfig(assetId: string): ShaderConfig | undefined {
    return this.subGraphs.get(assetId)?.config;
  }

  /** 清理 */
  dispose(): void {
    this.subGraphs.clear();
  }
}

/**
 * 将编辑器编译结果导出为 ShaderConfig（含子图递归处理）
 */
export async function exportToShaderConfig(
  compileFn: () => Promise<{
    compilation: {
      setting: any;
      parameters: any[];
      uniformMap: Record<string, { name: string; type: string }>;
      bindingMap: Record<string, { name: string; type: string; index: number }>;
      resource: { texture: Record<string, any>; sampler: Record<string, any> };
      vertCode: string;
      fragCode: string;
    };
    getSubGraphs?: () => Promise<Record<string, ShaderConfig>>;
  }>,
  id: string,
  name?: string,
): Promise<ShaderConfig> {
  const result = await compileFn();
  const { compilation } = result;

  const subGraphConfigs: Record<string, SubGraphConfig> = {};

  // 递归处理子图
  if (result.getSubGraphs) {
    const subGraphs = await result.getSubGraphs();
    for (const [subId, subConfig] of Object.entries(subGraphs)) {
      subGraphConfigs[subId] = {
        id: subId,
        name: subConfig.name || subId,
        config: subConfig,
      };
    }
  }

  // 使用 ThreeAdapter 转换
  const { compilationToShaderConfig } = await import('./ThreeAdapter');
  return compilationToShaderConfig(compilation, id, name, subGraphConfigs);
}
