/**
 * ShaderGraphEditor — 可视化着色器图编辑器
 *
 * # 概述
 *
 * 基于 Rete.js 的节点编辑器，提供类似 Unity ShaderGraph 的编辑体验。
 * 支持创建、编辑、编译着色器图，并可导出 ShaderConfig 供运行时使用。
 *
 * # 快速开始
 *
 * ```ts
 * import { ShaderGraphEditor } from '@shader-graph-glsl/editor';
 *
 * const container = document.getElementById('editor')!;
 * const editor = new ShaderGraphEditor(container);
 *
 * // 初始化新图
 * await editor.createGraph();
 *
 * // 编译
 * const config = await editor.compile();
 * console.log(config.vertCode, config.fragCode);
 * ```
 *
 * # 导入/导出
 *
 * ```ts
 * // 保存
 * const json = editor.save();
 * localStorage.setItem('graph', JSON.stringify(json));
 *
 * // 加载
 * const data = JSON.parse(localStorage.getItem('graph')!);
 * editor.load(data);
 * ```
 *
 * @module
 */

import { ShaderGraphEditor as InnerEditor } from '../../../src/editors/ShaderGraphEditor';
import { createRoot } from 'react-dom/client';
import type { ShaderGraphData, SGSetting, SGSettingValueCfg } from '../../../src/editors/ShaderGraphTypes';
import type { ShaderConfig } from '../../../src/runtime/ShaderConfig';
import type { SubGraphProvider } from '../../../src/editors/SubGraphProvider';

// ============================================================
// 类型导出
// ============================================================

/** 编辑器选项 */
export interface EditorOptions {
  /** 是否自动初始化基本节点 (默认 true) */
  autoInit?: boolean;
  /** 是否显示预览面板 (默认 true) */
  showPreview?: boolean;
  /** 子图提供者 */
  subGraphProvider?: SubGraphProvider;
  /** 自动编译 (默认 true) */
  autoCompile?: boolean;
}

/** 编辑器事件映射 */
export interface EditorEventMap {
  /** 图发生变化时触发 */
  change: () => void;
  /** 编译完成时触发 */
  compiled: (config: ShaderConfig) => void;
  /** 设置更新时触发 */
  settingUpdate: (name: string, value: any) => void;
  /** 图被导入时触发 */
  imported: () => void;
  /** 编辑器就绪时触发 */
  ready: () => void;
}

/** 编辑器插件 */
export interface EditorPlugin {
  /** 插件名称 */
  name: string;
  /** 安装钩子 */
  install?: (editor: ShaderGraphEditor) => void;
  /** 初始化钩子 */
  init?: (editor: ShaderGraphEditor) => void;
}

// ============================================================
// 编辑器主类
// ============================================================

/**
 * ShaderGraphEditor 主类
 *
 * ## 特性
 * - 可视化节点编辑 (Rete.js)
 * - 支持 Unlit / Lit / SubGraph 模板
 * - 实时预览
 * - 参数面板 (Inspector)
 * - 黑板视图 (Blackboard)
 * - 子图支持
 * - 编译导出 ShaderConfig
 */
export class ShaderGraphEditor {
  /** 内部编辑器实例 */
  readonly inner: InnerEditor;
  /** 选项 */
  readonly options: Required<EditorOptions>;

  private _ready = false;
  private _readyPromise: Promise<void>;
  private _resolveReady!: () => void;
  private eventHandlers = new Map<string, Set<(...args: any[]) => void>>();

  /**
   * 构造编辑器
   *
   * @param container - 编辑器挂载的 DOM 容器
   * @param options   - 编辑器选项
   *
   * @example
   * ```ts
   * const editor = new ShaderGraphEditor(
   *   document.getElementById('editor')!,
   *   { showPreview: true }
   * );
   * await editor.createGraph();
   * ```
   */
  constructor(container: HTMLElement, options?: EditorOptions) {
    this.options = {
      autoInit: options?.autoInit ?? true,
      showPreview: options?.showPreview ?? true,
      autoCompile: options?.autoCompile ?? true,
      subGraphProvider: options?.subGraphProvider,
    };

    this._readyPromise = new Promise((resolve) => {
      this._resolveReady = resolve;
    });

    // 创建内部编辑器
    this.inner = new InnerEditor('shader-graph-editor', container);

    // 绑定内部事件
    this.bindInternalEvents();

    // 如果提供了子图提供者，注入
    if (this.options.subGraphProvider) {
      this.inner.setSubGraphProvider(this.options.subGraphProvider);
    }
  }

  /**
   * 编辑器是否已就绪
   */
  get ready(): boolean {
    return this._ready;
  }

  /**
   * 等待编辑器就绪
   */
  get readyPromise(): Promise<void> {
    return this._readyPromise;
  }

  private bindInternalEvents(): void {
    // 代理内部事件
    const emit = (event: string, ...args: any[]) => {
      this.emit(event as any, ...args);
    };

    this.inner.on('imported', () => emit('imported'));
    this.inner.on('settingupdated', ({ name, value }: any) => emit('settingUpdate', name, value));
  }

  // ============================================================
  // 图操作
  // ============================================================

  /**
   * 创建新的着色器图
   *
   * 初始化 ShaderGraph 的所有必要节点 (Vertex Context, Fragment Context, 默认 Block 等)。
   *
   * @example
   * ```ts
   * await editor.createGraph();
   * ```
   */
  async createGraph(): Promise<void> {
    await this.inner.initShaderGraphNodes();
    this._ready = true;
    this._resolveReady();
    this.emit('ready');
  }

  /**
   * 创建新的子图
   *
   * @example
   * ```ts
   * await editor.createSubGraph();
   * ```
   */
  async createSubGraph(): Promise<void> {
    await this.inner.initSubGraphNodes();
    this._ready = true;
    this._resolveReady();
    this.emit('ready');
  }

  /**
   * 从 JSON 加载图数据
   *
   * @param data - 图数据 (editor.save() 的产物)
   *
   * @example
   * ```ts
   * const data = editor.save();
   * localStorage.setItem('graph', JSON.stringify(data));
   *
   * // 恢复
   * const saved = JSON.parse(localStorage.getItem('graph')!);
   * editor.load(saved);
   * ```
   */
  load(data: ShaderGraphData): void {
    this.inner.fromJSON(data);
    this._ready = true;
    this._resolveReady();
    this.emit('imported');
  }

  /**
   * 导出图为 JSON
   *
   * @returns 图数据
   */
  save(): ShaderGraphData {
    return this.inner.toJSON() as unknown as ShaderGraphData;
  }

  /**
   * 清空编辑器
   *
   * 移除所有节点和连线。
   */
  clear(): void {
    const keepNodes = this.inner.editing !== 'SubGraph';
    this.inner.clear(keepNodes);
  }

  // ============================================================
  // 编译
  // ============================================================

  /**
   * 编译图为 ShaderConfig
   *
   * 返回的 ShaderConfig 可直接用于 ShaderGraphRuntime。
   *
   * @returns 着色器配置
   *
   * @example
   * ```ts
   * const config = await editor.compile();
   * runtime.load(config);
   * ```
   */
  async compile(): Promise<ShaderConfig> {
    const result = await this.inner.compile();
    this.emit('compiled', result);
    return result;
  }

  // ============================================================
  // UI 控制
  // ============================================================

  /**
   * 切换黑板视图 (参数列表)
   */
  toggleBlackboard(): void {
    this.inner.blackboardView.toggle();
  }

  /**
   * 切换主预览面板
   */
  togglePreview(): void {
    this.inner.mainPreviewView.toggle();
  }

  /**
   * 切换属性面板
   */
  toggleInspector(): void {
    this.inner.inspectorView.toggle();
  }

  // ============================================================
  // 事件系统
  // ============================================================

  /**
   * 监听编辑器事件
   *
   * @param event   - 事件名
   * @param handler - 处理函数
   *
   * @example
   * ```ts
   * editor.on('change', () => console.log('graph changed'));
   * editor.on('compiled', (config) => console.log(config));
   * ```
   */
  on<K extends keyof EditorEventMap>(event: K, handler: EditorEventMap[K]): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  /**
   * 移除事件监听
   */
  off<K extends keyof EditorEventMap>(event: K, handler: EditorEventMap[K]): void {
    this.eventHandlers.get(event)?.delete(handler);
  }

  private emit(event: keyof EditorEventMap, ...args: any[]): void {
    this.eventHandlers.get(event)?.forEach((handler) => {
      (handler as any)(...args);
    });
  }

  // ============================================================
  // 插件系统
  // ============================================================

  /**
   * 使用插件
   *
   * @param plugin  - 插件
   * @param options - 插件选项
   *
   * @example
   * ```ts
   * editor.use({
   *   name: 'my-plugin',
   *   init: (editor) => { console.log('plugin loaded'); }
   * });
   * ```
   */
  use(plugin: EditorPlugin, options?: any): void {
    plugin.install?.(this);
    plugin.init?.(this);
  }

  // ============================================================
  // 资源清理
  // ============================================================

  /**
   * 释放编辑器资源
   *
   * 清理 DOM、事件监听、取消编译任务。
   */
  dispose(): void {
    this.eventHandlers.clear();
    this.inner.disposables.forEach((d: () => void) => d());
    this.inner.disposables = [];
  }
}
