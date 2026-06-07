/**
 * RuntimeProgram — 着色器程序编译与管理 (无 Three.js 依赖)
 */

import type { ShaderConfig, UniformMeta, UniformValues } from './ShaderConfig';

/** 编译后的着色器程序 */
export interface RuntimeProgram {
  /** WebGL 程序 */
  program: WebGLProgram;
  /** uniform location 缓存 */
  uniforms: Record<string, WebGLUniformLocation | null>;
  /** attribute location 缓存 */
  attribs: Record<string, number>;
  /** 关联的 ShaderConfig */
  config: ShaderConfig;
  /** 纹理单元追踪 */
  textureUnitMap: Record<string, number>;
}

/** GL 类型大小映射 */
export const GLSL_TYPE_SIZE: Record<string, 1 | 2 | 3 | 4 | 9 | 16> = {
  float: 1, int: 1, bool: 1,
  vec2: 2, vec3: 3, vec4: 4,
  mat2: 4, mat3: 9, mat4: 16,
};

/**
 * 编译 GLSL 着色器
 */
export function compileShader(gl: WebGL2RenderingContext, source: string, type: number): WebGLShader {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    const stage = type === gl.VERTEX_SHADER ? 'VERTEX' : 'FRAGMENT';
    gl.deleteShader(shader);
    throw new Error(`GLSL ${stage} compile error:\n${log}\n\n--- Source ---\n${source}`);
  }
  return shader;
}

/**
 * 创建着色器程序
 */
export function createProgram(gl: WebGL2RenderingContext, vertSrc: string, fragSrc: string): WebGLProgram {
  const vs = compileShader(gl, vertSrc, gl.VERTEX_SHADER);
  const fs = compileShader(gl, fragSrc, gl.FRAGMENT_SHADER);
  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`GLSL program link error:\n${log}`);
  }
  return program;
}

/**
 * 从 ShaderConfig 创建 RuntimeProgram
 */
export function createRuntimeProgram(gl: WebGL2RenderingContext, config: ShaderConfig): RuntimeProgram {
  const program = createProgram(gl, config.vertCode, config.fragCode);
  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  const attribs: Record<string, number> = {};

  // 收集所有 uniform location
  for (const meta of config.uniforms) {
    uniforms[meta.name] = gl.getUniformLocation(program, meta.name);
  }

  // 收集所有 attribute location
  const numAttribs = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
  for (let i = 0; i < numAttribs; i++) {
    const info = gl.getActiveAttrib(program, i);
    if (info) {
      attribs[info.name] = gl.getAttribLocation(program, info.name);
    }
  }

  return { program, uniforms, attribs, config, textureUnitMap: {} };
}

/**
 * 应用 uniform 值到 GPU
 */
export function applyUniforms(
  gl: WebGL2RenderingContext,
  program: RuntimeProgram,
  values: UniformValues,
): void {
  const { uniforms, config } = program;

  for (const meta of config.uniforms) {
    const loc = uniforms[meta.name];
    if (loc === undefined || loc === null) continue;

    const value = values[meta.name] ?? meta.default;
    if (value === undefined || value === null) continue;

    applyUniformValue(gl, loc, meta.type, value);
  }
}

function applyUniformValue(
  gl: WebGL2RenderingContext,
  loc: WebGLUniformLocation,
  type: string,
  value: any,
): void {
  switch (type) {
    case 'float': gl.uniform1f(loc, value as number); break;
    case 'int': gl.uniform1i(loc, value as number); break;
    case 'bool': gl.uniform1i(loc, value ? 1 : 0); break;
    case 'vec2': gl.uniform2fv(loc, value as Float32List); break;
    case 'vec3': gl.uniform3fv(loc, value as Float32List); break;
    case 'vec4': gl.uniform4fv(loc, value as Float32List); break;
    case 'mat2': gl.uniformMatrix2fv(loc, false, value as Float32List); break;
    case 'mat3': gl.uniformMatrix3fv(loc, false, value as Float32List); break;
    case 'mat4': gl.uniformMatrix4fv(loc, false, value as Float32List); break;
    case 'sampler2D': gl.uniform1i(loc, value as number); break;
  }
}

/**
 * 销毁 RuntimeProgram
 */
export function destroyRuntimeProgram(gl: WebGL2RenderingContext, program: RuntimeProgram): void {
  gl.deleteProgram(program.program);
}
