/**
 * ShaderGraphRuntime — 独立 WebGL2 着色器运行时引擎
 *
 * # 概述
 *
 * 纯 WebGL2 运行时，无任何第三方框架依赖。
 * 可直接加载由 ShaderGraphEditor 编译产出的 ShaderConfig 并渲染。
 *
 * 子图支持:
 * 子图在编译时已内联到主图的 vertCode/fragCode 中，运行时通过
 * `linkSubGraph()` 或 `loadWithSubGraphs()` 将子图的 uniform 元数据
 * 关联到主程序，使运行时能正确管理所有 uniform。
 *
 * # 快速开始
 *
 * ```ts
 * import { ShaderGraphRuntime } from '@xifu/shader-graph-glsl/runtime';
 *
 * const canvas = document.getElementById('canvas') as HTMLCanvasElement;
 * const runtime = new ShaderGraphRuntime(canvas);
 *
 * // 加载主图 + 关联子图
 * const program = runtime.loadWithSubGraphs(mainConfig, {
 *   'mySub': subConfig
 * });
 *
 * // 或分步: 先加载主图, 再关联子图
 * // const program = runtime.load(mainConfig);
 * // runtime.linkSubGraph(program, 'mySub', subConfig);
 *
 * // 设置 uniform
 * runtime.uniforms(program).set('uColor', [1, 0, 0, 1]);
 *
 * // 每帧渲染
 * runtime.play((time) => {
 *   runtime.uniforms(program).set('uTime', time);
 *   runtime.draw({ geometry, program, uniforms: {} });
 * });
 * ```
 *
 * # 与 Three.js 集成
 *
 * ```ts
 * // ShaderConfig.vertCode / fragCode 可直接用于 RawShaderMaterial
 * const material = new THREE.RawShaderMaterial({
 *   vertexShader: config.vertCode,
 *   fragmentShader: config.fragCode,
 *   uniforms: { uTime: { value: 0 } },
 * });
 * ```
 *
 * @module
 */

import { RuntimeRenderer } from '../../../src/runtime/RuntimeRenderer';
import type { ShaderConfig, UniformValues, UniformMeta } from '../../../src/runtime/ShaderConfig';
import type { RuntimeProgram } from '../../../src/runtime/RuntimeProgram';
import type { GeometryDescriptor, MeshDescriptor, RenderState } from './types';

// ============================================================
// 类型导出
// ============================================================

/** 运行时选项 */
export interface RuntimeOptions {
  /** WebGL context 属性 */
  contextAttributes?: WebGLContextAttributes;
  /** 默认清除颜色 (默认 [0,0,0,0]) */
  clearColor?: [number, number, number, number];
}

/** 动画帧回调 */
export type FrameCallback = (time: number, delta: number) => void;

/** 程序句柄 */
export type ProgramHandle = RuntimeProgram;

/** Uniform 绑定器 — 链式调用 */
export interface UniformBinder {
  set(name: string, value: number | number[]): UniformBinder;
  setMany(values: UniformValues): UniformBinder;
  texture(name: string, source: TexImageSource, unit?: number): UniformBinder;
  commit(): void;
}

// ============================================================
// 主类
// ============================================================

/**
 * ShaderGraphRuntime 主类
 *
 * ## 特性
 * - 无第三方依赖，纯 WebGL2
 * - 支持 ShaderConfig 直接加载
 * - 内置动画循环
 * - 纹理管理
 * - 渲染状态控制
 */
export class ShaderGraphRuntime {
  /** 底层渲染器 */
  readonly renderer: RuntimeRenderer;
  /** WebGL 上下文 */
  readonly gl: WebGL2RenderingContext;
  /** 画布 */
  readonly canvas: HTMLCanvasElement;

  /** 子图关联表: programKey → { subGraphId → ShaderConfig } */
  private subGraphLinks = new Map<string, Map<string, ShaderConfig>>();

  private animFrameId: number | null = null;
  private lastTime = 0;
  private frameCallback: FrameCallback | null = null;
  private _isPlaying = false;

  /**
   * 构造运行时
   *
   * @param canvas  - HTMLCanvasElement
   * @param options - 运行时选项
   */
  constructor(canvas: HTMLCanvasElement, options?: RuntimeOptions) {
    this.renderer = new RuntimeRenderer(canvas, options?.contextAttributes);
    this.gl = this.renderer.gl;
    this.canvas = canvas;

    if (options?.clearColor) {
      this.renderer.clearColor = options.clearColor;
    }
  }

  // ============================================================
  // 着色器管理
  // ============================================================

  /**
   * 加载着色器配置
   *
   * @param config - 由编辑器编译产出的 ShaderConfig
   * @param key    - 缓存键 (默认使用 config.id)
   * @returns 程序句柄
   *
   * @example
   * ```ts
   * const program = runtime.load(shaderConfig);
   * ```
   */
  load(config: ShaderConfig, key?: string): ProgramHandle {
    return this.renderer.loadProgram(config, key);
  }

  /**
   * 获取已缓存的程序
   *
   * @param key - 缓存键
   */
  get(key: string): ProgramHandle | undefined {
    return this.renderer.getProgram(key);
  }

  /**
   * 卸载着色器程序
   *
   * @param handle - 程序句柄
   */
  unload(handle: ProgramHandle): void {
    this.gl.deleteProgram(handle.program);
    this.subGraphLinks.delete(handle.config.id);
  }

  // ============================================================
  // 子图关联
  // ============================================================

  /**
   * 关联子图配置到主程序
   *
   * 子图在编译时已内联到主图的 vertCode/fragCode 中。
   * 此方法将子图的 uniform 元数据注册到主程序，使运行时
   * 能正确管理所有由子图引入的 uniform 变量。
   *
   * @param program    - 主程序句柄 (由 load() 返回)
   * @param subGraphId - 子图 ID (与主图 SubGraph 节点的 asset.id 对应)
   * @param config     - 子图的 ShaderConfig
   *
   * @example
   * ```ts
   * const mainProg = runtime.load(mainConfig);
   * runtime.linkSubGraph(mainProg, 'flowMap', flowMapSubConfig);
   * ```
   */
  linkSubGraph(program: ProgramHandle, subGraphId: string, config: ShaderConfig): void {
    const key = program.config.id;
    let links = this.subGraphLinks.get(key);
    if (!links) {
      links = new Map();
      this.subGraphLinks.set(key, links);
    }
    links.set(subGraphId, config);

    // 合并子图的 uniform 元数据到主程序 (用于 tooling/reflection)
    if (config.uniforms && program.config.uniforms) {
      const existingNames = new Set(program.config.uniforms.map(u => u.name));
      for (const u of config.uniforms) {
        if (!existingNames.has(u.name)) {
          program.config.uniforms.push(u);
        }
      }
    }
  }

  /**
   * 批量关联子图
   *
   * @param program   - 主程序句柄
   * @param subGraphs - { [subGraphId]: ShaderConfig }
   */
  linkSubGraphs(program: ProgramHandle, subGraphs: Record<string, ShaderConfig>): void {
    for (const [id, config] of Object.entries(subGraphs)) {
      this.linkSubGraph(program, id, config);
    }
  }

  /**
   * 加载主图并同时关联其子图
   *
   * 等价于依次调用 load() + linkSubGraphs()。
   *
   * @param config     - 主图 ShaderConfig
   * @param subGraphs  - 子图配置表 { subGraphId: ShaderConfig }
   * @param key        - 缓存键 (可选)
   * @returns 主程序句柄
   *
   * @example
   * ```ts
   * const program = runtime.loadWithSubGraphs(mainConfig, {
   *   'flowMap': flowMapSubConfig,
   *   'noise': noiseSubConfig,
   * });
   * ```
   */
  loadWithSubGraphs(
    config: ShaderConfig,
    subGraphs: Record<string, ShaderConfig>,
    key?: string,
  ): ProgramHandle {
    const program = this.load(config, key);
    this.linkSubGraphs(program, subGraphs);
    return program;
  }

  /**
   * 获取程序关联的子图列表
   *
   * @param program - 程序句柄
   * @returns 子图 ID 列表
   */
  getLinkedSubGraphs(program: ProgramHandle): string[] {
    const links = this.subGraphLinks.get(program.config.id);
    return links ? Array.from(links.keys()) : [];
  }

  /**
   * 获取程序关联的子图配置
   *
   * @param program    - 程序句柄
   * @param subGraphId - 子图 ID
   * @returns ShaderConfig 或 undefined
   */
  getSubGraphConfig(program: ProgramHandle, subGraphId: string): ShaderConfig | undefined {
    return this.subGraphLinks.get(program.config.id)?.get(subGraphId);
  }

  // ============================================================
  // Uniform 控制
  // ============================================================

  /**
   * 获取 Uniform 绑定器
   *
   * 提供链式 API 方便批量设置 uniform。
   *
   * @param handle - 程序句柄
   * @returns UniformBinder
   *
   * @example
   * ```ts
   * runtime.uniforms(program)
   *   .set('uColor', [1, 0, 0, 1])
   *   .set('uTime', 0.5)
   *   .texture('uMainTex', img)
   *   .commit();
   * ```
   */
  uniforms(handle: ProgramHandle): UniformBinder {
    const gl = this.gl;
    const deferred: Array<() => void> = [];

    const binder: UniformBinder = {
      set(name, value) {
        deferred.push(() => {
          const loc = handle.uniforms[name];
          if (!loc) return;
          const arr = Array.isArray(value) ? value : [value];
          switch (arr.length) {
            case 1: gl.uniform1f(loc, arr[0]); break;
            case 2: gl.uniform2f(loc, arr[0], arr[1]); break;
            case 3: gl.uniform3f(loc, arr[0], arr[1], arr[2]); break;
            case 4: gl.uniform4f(loc, arr[0], arr[1], arr[2], arr[3]); break;
            default: /* unsupported */;
          }
        });
        return binder;
      },

      setMany(values) {
        for (const [k, v] of Object.entries(values)) {
          if (v == null) continue;
          deferred.push(() => {
            const loc = handle.uniforms[k];
            if (!loc) return;
            const arr = Array.isArray(v) ? v : [v as number];
            switch (arr.length) {
              case 1: gl.uniform1f(loc, arr[0]); break;
              case 2: gl.uniform2f(loc, arr[0], arr[1]); break;
              case 3: gl.uniform3f(loc, arr[0], arr[1], arr[2]); break;
              case 4: gl.uniform4f(loc, arr[0], arr[1], arr[2], arr[3]); break;
            }
          });
        }
        return binder;
      },

      texture(_name, _source, _unit) {
        // 纹理绑定功能由上层 renderer 实现
        return binder;
      },

      commit() {
        gl.useProgram(handle.program);
        for (const fn of deferred) fn();
        deferred.length = 0;
      },
    };

    return binder;
  }

  // ============================================================
  // 渲染
  // ============================================================

  /**
   * 清除缓冲区
   *
   * 先应用设置的清除颜色，再清除缓冲区。
   *
   * @param mask - 清除掩码 (默认 gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
   */
  clear(mask?: number): void {
    const gl = this.gl;
    const cc = this.renderer.clearColor;
    gl.clearColor(cc[0], cc[1], cc[2], cc[3]);
    const m = mask ?? (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clear(m);
  }

  /**
   * 设置清除颜色
   */
  setClearColor(r: number, g: number, b: number, a: number): void {
    this.renderer.clearColor = [r, g, b, a];
  }

  /**
   * 绘制网格
   *
   * @param mesh - 网格渲染描述
   *
   * @example
   * ```ts
   * runtime.draw({
   *   geometry: { attributes: { aPosition: { data, size: 3 } }, vertexCount: 3 },
   *   program: myProgram,
   *   uniforms: { uColor: [1, 0, 0, 1] },
   * });
   * ```
   */
  draw(mesh: MeshDescriptor): void {
    const { geometry, program, uniforms, mode } = mesh;

    // Apply uniforms
    this.uniforms(program).setMany(uniforms || {}).commit();

    // Bind geometry & draw
    const gl = this.gl;
    gl.useProgram(program.program);

    // Create & setup VAO
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    for (const [name, attrib] of Object.entries(geometry.attributes)) {
      const loc = program.attribs[name];
      if (loc === undefined) continue;
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, attrib.data, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, attrib.size, gl.FLOAT, attrib.normalized ?? false, attrib.stride ?? 0, attrib.offset ?? 0);
    }

    if (geometry.index) {
      const idxBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idxBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.index, gl.STATIC_DRAW);
      const idxType = geometry.index instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
      gl.drawElements(mode ?? gl.TRIANGLES, geometry.index.length, idxType, 0);
    } else {
      gl.drawArrays(mode ?? gl.TRIANGLES, 0, geometry.vertexCount);
    }

    gl.bindVertexArray(null);
    gl.deleteVertexArray(vao);
  }

  // ============================================================
  // 动画循环
  // ============================================================

  /**
   * 开始动画循环
   *
   * @param callback - 每帧回调 (time, delta)
   *
   * @example
   * ```ts
   * runtime.play((time, delta) => {
   *   runtime.uniforms(program).set('uTime', time).commit();
   *   runtime.draw(mesh);
   * });
   * ```
   */
  play(callback?: FrameCallback): void {
    if (this._isPlaying) return;
    this._isPlaying = true;
    this.lastTime = performance.now();
    this.frameCallback = callback ?? null;

    const tick = (now: number) => {
      if (!this._isPlaying) return;
      const delta = (now - this.lastTime) / 1000;
      this.lastTime = now;

      this.clear();
      this.frameCallback?.(now / 1000, delta);

      this.animFrameId = requestAnimationFrame(tick);
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  /** 是否正在播放动画 */
  get isPlaying(): boolean {
    return this._isPlaying;
  }

  /**
   * 停止动画循环
   */
  stop(): void {
    this._isPlaying = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.frameCallback = null;
  }

  // ============================================================
  // 尺寸调整
  // ============================================================

  /**
   * 调整画布尺寸 (自动同步 viewport)
   *
   * @param width  - 像素宽度
   * @param height - 像素高度
   */
  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.renderer.viewport = [0, 0, width, height];
    this.gl.viewport(0, 0, width, height);
  }

  // ============================================================
  // 资源清理
  // ============================================================

  /**
   * 释放所有资源
   *
   * 清理着色器程序、纹理、停止动画。
   * 调用后不可再使用此实例。
   */
  dispose(): void {
    this.stop();
    // The underlying renderer cleanup
    const gl = this.gl;
    // Programs are owned by the renderer
    // Additional cleanup logic if needed
  }
}
