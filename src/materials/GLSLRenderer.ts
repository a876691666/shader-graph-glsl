/**
 * GLSLRenderer — 轻量级 WebGL2 渲染器
 *
 * 可以在独立 WebGL2 环境或配合 Three.js 使用。
 * 核心功能：编译 GLSL、管理 uniform/attribute/texture、渲染 Mesh。
 *
 * 设计目标：
 * - 生成的 GLSL 可在任意渲染器上使用（Three.js, PlayCanvas, PixiJS, 原生 WebGL2）
 * - 最小依赖，不绑定任何特定框架
 */

export interface GLSLProgram {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
  attribLocations: Record<string, number>;
}

export interface GLSLTextureSlot {
  texture: WebGLTexture | null;
  unit: number; // GL.TEXTURE0 + unit
  target?: number; // GL.TEXTURE_2D (default)
}

export interface GLSLDrawCall {
  program: GLSLProgram;
  geometry: {
    vao: WebGLVertexArrayObject | null;
    attributes: Record<string, { buffer: WebGLBuffer; size: number; type: number; normalized: boolean; stride: number; offset: number }>;
    indexBuffer?: WebGLBuffer;
    indexCount?: number;
    indexType?: number;
    vertexCount: number;
    mode: number; // GL.TRIANGLES default
  };
  uniforms: Record<string, any>;
  textures: Record<string, GLSLTextureSlot>;
  depthTest: boolean;
  depthWrite: boolean;
  blend: boolean;
  blendSrc?: number;
  blendDst?: number;
  cullFace?: number; // GL.FRONT, GL.BACK, or 0 for none
}

export class GLSLRenderer {
  gl: WebGL2RenderingContext;
  private programs = new Map<string, GLSLProgram>();
  private currentProgram: GLSLProgram | null = null;
  private defaultVAO: WebGLVertexArrayObject | null = null;

  clearColor: [number, number, number, number] = [0, 0, 0, 1];

  constructor(
    canvas: HTMLCanvasElement,
    options?: WebGLContextAttributes,
  ) {
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: true,
      premultipliedAlpha: false,
      ...options,
    });
    if (!gl) throw new Error('WebGL2 not supported');
    this.gl = gl;
    this.defaultVAO = gl.createVertexArray();
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
  }

  /** 编译 GLSL 着色器程序 */
  compileShader(vertSrc: string, fragSrc: string, key?: string): GLSLProgram {
    const cacheKey = key || `${vertSrc.length}_${fragSrc.length}`;
    const existing = this.programs.get(cacheKey);
    if (existing) return existing;

    const gl = this.gl;
    // 添加版本头（如果未提供）
    const fullVert = vertSrc.startsWith('#version') ? vertSrc : `#version 300 es\nprecision highp float;\nprecision highp int;\n${vertSrc}`;
    const fullFrag = fragSrc.startsWith('#version') ? fragSrc : `#version 300 es\nprecision highp float;\nprecision highp int;\n${fragSrc}`;

    const vs = this.compileStage(gl.VERTEX_SHADER, fullVert);
    const fs = this.compileStage(gl.FRAGMENT_SHADER, fullFrag);
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(program);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      throw new Error(`Program link failed: ${log}`);
    }

    gl.deleteShader(vs);
    gl.deleteShader(fs);

    // 收集 uniform 位置
    const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    const uniforms: Record<string, WebGLUniformLocation | null> = {};
    for (let i = 0; i < numUniforms; i++) {
      const info = gl.getActiveUniform(program, i);
      if (info) {
        uniforms[info.name] = gl.getUniformLocation(program, info.name);
      }
    }

    // 收集 attribute 位置
    const numAttribs = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
    const attribLocations: Record<string, number> = {};
    for (let i = 0; i < numAttribs; i++) {
      const info = gl.getActiveAttrib(program, i);
      if (info) {
        attribLocations[info.name] = gl.getAttribLocation(program, info.name);
      }
    }

    const result: GLSLProgram = { program, uniforms, attribLocations };
    this.programs.set(cacheKey, result);
    return result;
  }

  private compileStage(type: number, source: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`Shader compile failed (${type === gl.VERTEX_SHADER ? 'vert' : 'frag'}): ${log}\n\nSource:\n${source}`);
    }

    return shader;
  }

  /** 创建 VAO + buffer */
  createGeometry(config: {
    attributes: Record<string, { data: Float32Array | Uint16Array | Uint32Array; size: number; type?: number; normalized?: boolean }>;
    index?: { data: Uint16Array | Uint32Array };
    mode?: number;
  }): GLSLDrawCall['geometry'] {
    const gl = this.gl;
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    const attributes: GLSLDrawCall['geometry']['attributes'] = {};
    let vertexCount = 0;

    for (const [name, attr] of Object.entries(config.attributes)) {
      const buffer = gl.createBuffer()!;
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, attr.data, gl.STATIC_DRAW);
      attributes[name] = {
        buffer,
        size: attr.size,
        type: attr.type || gl.FLOAT,
        normalized: attr.normalized || false,
        stride: 0,
        offset: 0,
      };

      if (name === 'aPosition' || name === 'position') {
        vertexCount = attr.data.length / attr.size;
      }
    }

    let indexBuffer: WebGLBuffer | undefined;
    let indexCount: number | undefined;
    if (config.index) {
      indexBuffer = gl.createBuffer()!;
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, config.index.data, gl.STATIC_DRAW);
      indexCount = config.index.data.length;
    }

    gl.bindVertexArray(null);
    return {
      vao,
      attributes,
      indexBuffer,
      indexCount,
      indexType: config.index?.data instanceof Uint32Array ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT,
      vertexCount,
      mode: config.mode || gl.TRIANGLES,
    };
  }

  /** 创建纹理 */
  createTexture(
    source: TexImageSource | { width: number; height: number; data?: ArrayBufferView | null },
    options?: {
      minFilter?: number;
      magFilter?: number;
      wrapS?: number;
      wrapT?: number;
      format?: number;
      internalFormat?: number;
      type?: number;
    },
  ): WebGLTexture {
    const gl = this.gl;
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const minFilter = options?.minFilter || gl.LINEAR_MIPMAP_LINEAR;
    const magFilter = options?.magFilter || gl.LINEAR;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, options?.wrapS || gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, options?.wrapT || gl.REPEAT);

    const internalFormat = options?.internalFormat || gl.RGBA8;
    const format = options?.format || gl.RGBA;
    const type = options?.type || gl.UNSIGNED_BYTE;

    if ('width' in source && 'height' in source) {
      const pixelSrc = source as { width: number; height: number; data?: ArrayBufferView | null };
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, pixelSrc.width, pixelSrc.height, 0, format, type, pixelSrc.data || null);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, format, type, source as TexImageSource);
    }

    if (minFilter === gl.LINEAR_MIPMAP_LINEAR || minFilter === gl.NEAREST_MIPMAP_LINEAR) {
      gl.generateMipmap(gl.TEXTURE_2D);
    }

    return texture;
  }

  /** 执行绘制调用 */
  draw(drawCall: GLSLDrawCall): void {
    const gl = this.gl;
    const { program, geometry, uniforms, textures, depthTest, depthWrite, blend, blendSrc, blendDst, cullFace } = drawCall;

    // 状态管理
    gl.depthMask(depthWrite);
    if (depthTest) gl.enable(gl.DEPTH_TEST); else gl.disable(gl.DEPTH_TEST);

    if (blend) {
      gl.enable(gl.BLEND);
      gl.blendFunc(blendSrc || gl.SRC_ALPHA, blendDst || gl.ONE_MINUS_SRC_ALPHA);
    } else {
      gl.disable(gl.BLEND);
    }

    if (cullFace) {
      gl.enable(gl.CULL_FACE);
      gl.cullFace(cullFace);
    } else {
      gl.disable(gl.CULL_FACE);
    }

    // 使用程序
    if (this.currentProgram !== program) {
      gl.useProgram(program.program);
      this.currentProgram = program;
    }

    // 绑定纹理
    let texUnit = 0;
    for (const [name, slot] of Object.entries(textures)) {
      const loc = program.uniforms[name];
      if (loc !== undefined && loc !== null) {
        gl.activeTexture(gl.TEXTURE0 + texUnit);
        gl.bindTexture(slot.target || gl.TEXTURE_2D, slot.texture);
        gl.uniform1i(loc, texUnit);
        texUnit++;
      }
    }

    // 设置 uniform
    for (const [name, value] of Object.entries(uniforms)) {
      const loc = program.uniforms[name];
      if (loc === undefined || loc === null) continue;

      if (typeof value === 'number') {
        gl.uniform1f(loc, value);
      } else if (Array.isArray(value)) {
        switch (value.length) {
          case 2: gl.uniform2fv(loc, value); break;
          case 3: gl.uniform3fv(loc, value); break;
          case 4: gl.uniform4fv(loc, value); break;
          case 9: gl.uniformMatrix3fv(loc, false, value); break;
          case 16: gl.uniformMatrix4fv(loc, false, value); break;
          default: gl.uniform1fv(loc, value); break;
        }
      } else if (value instanceof Float32Array) {
        switch (value.length) {
          case 9: gl.uniformMatrix3fv(loc, false, value); break;
          case 16: gl.uniformMatrix4fv(loc, false, value); break;
          default: gl.uniform1fv(loc, value); break;
        }
      }
    }

    // 绑定 VAO 和 attribute
    gl.bindVertexArray(geometry.vao || this.defaultVAO);
    for (const [name, attr] of Object.entries(geometry.attributes)) {
      const loc = program.attribLocations[name];
      if (loc !== undefined && loc >= 0) {
        gl.bindBuffer(gl.ARRAY_BUFFER, attr.buffer);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, attr.size, attr.type, attr.normalized, attr.stride, attr.offset);
      }
    }

    // 绘制
    if (geometry.indexBuffer && geometry.indexCount) {
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geometry.indexBuffer);
      gl.drawElements(geometry.mode, geometry.indexCount, geometry.indexType || gl.UNSIGNED_SHORT, 0);
    } else {
      gl.drawArrays(geometry.mode, 0, geometry.vertexCount);
    }

    gl.bindVertexArray(null);
  }

  /** 清除屏幕 */
  clear(): void {
    const gl = this.gl;
    gl.clearColor(...this.clearColor);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }

  /** 调整视口 */
  setViewport(x: number, y: number, w: number, h: number): void {
    this.gl.viewport(x, y, w, h);
  }

  /** 删除纹理 */
  deleteTexture(texture: WebGLTexture | null): void {
    if (texture) this.gl.deleteTexture(texture);
  }

  /** 删除程序 */
  deleteProgram(key: string): void {
    const program = this.programs.get(key);
    if (program) {
      this.gl.deleteProgram(program.program);
      this.programs.delete(key);
    }
  }

  /** 销毁 */
  dispose(): void {
    for (const [, program] of this.programs) {
      this.gl.deleteProgram(program.program);
    }
    this.programs.clear();
    this.currentProgram = null;
  }
}
