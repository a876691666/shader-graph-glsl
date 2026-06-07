/**
 * RuntimeRenderer — 独立运行时引擎主类
 *
 * 无 Three.js 依赖，通过 ShaderConfig 完成渲染。
 * 提供对编辑器/预览场景适配的 Three.js 粘合层。
 */

import type { ShaderConfig, UniformValues, UniformMeta } from './ShaderConfig';
import { createRuntimeProgram, applyUniforms, destroyRuntimeProgram } from './RuntimeProgram';
import type { RuntimeProgram } from './RuntimeProgram';

// ============================================================
// 几何体描述 (独立于 Three.js)
// ============================================================

export interface VertexAttribute {
  data: Float32Array;
  size: number;
  normalized?: boolean;
  stride?: number;
  offset?: number;
}

export interface RuntimeGeometry {
  attributes: Record<string, VertexAttribute>;
  index?: Uint16Array | Uint32Array;
  vertexCount: number;
}

export interface RuntimeMesh {
  geometry: RuntimeGeometry;
  program: RuntimeProgram;
  uniforms: UniformValues;
  mode?: number;
}

// ============================================================
// 渲染器
// ============================================================

export class RuntimeRenderer {
  gl: WebGL2RenderingContext;
  private programs = new Map<string, RuntimeProgram>();
  private currentProgram: RuntimeProgram | null = null;
  private defaultVAO: WebGLVertexArrayObject | null = null;
  private textureUnitCounter = 0;
  private textureCache = new Map<string, WebGLTexture>();
  private canvas: HTMLCanvasElement;

  clearColor: [number, number, number, number] = [0, 0, 0, 0];
  viewport: [number, number, number, number] = [0, 0, 0, 0];
  scissor: [number, number, number, number] = [0, 0, 0, 0];

  constructor(canvas: HTMLCanvasElement, options?: WebGLContextAttributes) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl2', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
      ...options,
    });
    if (!gl) throw new Error('WebGL2 not supported');
    this.gl = gl;
    this.defaultVAO = gl.createVertexArray();
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    this.viewport = [0, 0, canvas.width, canvas.height];
    this.scissor = [0, 0, canvas.width, canvas.height];
  }

  // ============================================================
  // 着色器程序管理
  // ============================================================

  /** 从 ShaderConfig 加载程序 */
  loadProgram(config: ShaderConfig, key?: string): RuntimeProgram {
    const cacheKey = key || config.id;
    const existing = this.programs.get(cacheKey);
    if (existing) return existing;

    const program = createRuntimeProgram(this.gl, config);
    this.programs.set(cacheKey, program);
    return program;
  }

  /** 获取已缓存的程序 */
  getProgram(key: string): RuntimeProgram | undefined {
    return this.programs.get(key);
  }

  // ============================================================
  // 纹理管理
  // ============================================================

  /** 加载纹理 (支持 URL 或 HTMLImageElement) */
  loadTexture(url: string): Promise<WebGLTexture> {
    const cached = this.textureCache.get(url);
    if (cached) return Promise.resolve(cached);

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const gl = this.gl;
        const texture = gl.createTexture()!;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
        this.textureCache.set(url, texture);
        resolve(texture);
      };
      img.onerror = () => reject(new Error(`Failed to load texture: ${url}`));
      img.src = url;
    });
  }

  /** 绑定纹理到 uniform */
  bindTexture(uniformName: string, texture: WebGLTexture, unit: number): void {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(this.gl.getUniformLocation(this.currentProgram!.program, uniformName), unit);
  }

  // ============================================================
  // 几何体管理
  // ============================================================

  /** 创建几何体 VAO */
  createGeometry(geo: RuntimeGeometry): WebGLVertexArrayObject {
    const gl = this.gl;
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);

    for (const [name, attr] of Object.entries(geo.attributes)) {
      const buffer = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, attr.data, gl.STATIC_DRAW);
      // attribute location 由 layout(location = N) 在着色器中指定
      const loc = parseInt(name.replace(/\D/g, ''), 10);
      if (!isNaN(loc)) {
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, attr.size, gl.FLOAT, attr.normalized || false, attr.stride || 0, attr.offset || 0);
      }
    }

    if (geo.index) {
      const buffer = gl.createBuffer()!;
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geo.index, gl.STATIC_DRAW);
    }

    gl.bindVertexArray(null);
    return vao;
  }

  // ============================================================
  // 渲染
  // ============================================================

  /** 清屏 */
  clear(): void {
    const gl = this.gl;
    const [r, g, b, a] = this.clearColor;
    gl.clearColor(r, g, b, a);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  /** 渲染单次绘制调用 */
  drawMesh(mesh: RuntimeMesh): void {
    const gl = this.gl;
    const { program, geometry, uniforms, mode } = mesh;

    if (this.currentProgram !== program) {
      gl.useProgram(program.program);
      this.currentProgram = program;
    }

    // 应用 uniform
    applyUniforms(gl, program, uniforms);

    // 创建并绑定 VAO
    const vao = this.createGeometry(geometry);
    gl.bindVertexArray(vao);

    // 绘制
    if (geometry.index) {
      const indexType = geometry.index instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT;
      gl.drawElements(mode || gl.TRIANGLES, geometry.index.length, indexType, 0);
    } else {
      gl.drawArrays(mode || gl.TRIANGLES, 0, geometry.vertexCount);
    }

    gl.bindVertexArray(null);
  }

  /** 调整大小 */
  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.viewport = [0, 0, width, height];
    this.scissor = [0, 0, width, height];
    this.gl.viewport(0, 0, width, height);
  }

  /** 销毁 */
  dispose(): void {
    for (const program of this.programs.values()) {
      destroyRuntimeProgram(this.gl, program);
    }
    this.programs.clear();
    for (const texture of this.textureCache.values()) {
      this.gl.deleteTexture(texture);
    }
    this.textureCache.clear();
    this.gl.bindVertexArray(null);
    if (this.defaultVAO) {
      this.gl.deleteVertexArray(this.defaultVAO);
    }
  }
}
