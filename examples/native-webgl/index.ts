/**
 * ============================================================
 * 原生 WebGL2 — 完整自定义渲染示例
 * ============================================================
 *
 * 展示如何使用 @shader-graph-glsl/runtime 在原生 WebGL2 环境中
 * 进行完整的渲染管线控制。
 *
 * 包含:
 * - 纹理渲染
 * - 多材质渲染
 * - 离屏渲染
 *
 * @packageDocumentation
 */

import { ShaderGraphRuntime } from '@shader-graph-glsl/runtime';
import type { ShaderConfig } from '@shader-graph-glsl/runtime';

/**
 * 纹理渲染示例
 *
 * 加载纹理 + 着色器，渲染带纹理的四边形。
 */
async function textureExample() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  document.body.appendChild(canvas);

  const runtime = new ShaderGraphRuntime(canvas);

  // 创建纹理
  const texture = createCheckerTexture();

  // 纹理着色器配置
  const config: ShaderConfig = {
    version: 1,
    id: 'texture-example',
    vertCode: `#version 300 es
precision highp float;
in vec2 aPosition;
in vec2 aUV;
out vec2 vUV;
void main() {
  vUV = aUV;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`,
    fragCode: `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uTexture;
uniform float uTime;
out vec4 fragColor;
void main() {
  vec2 uv = vUV + 0.05 * vec2(sin(uTime + vUV.y * 10.0), cos(uTime + vUV.x * 10.0));
  fragColor = texture(uTexture, uv);
}`,
    uniforms: [
      { name: 'uTexture', type: 'sampler2D' as const },
      { name: 'uTime', type: 'float' as const, default: 0 },
    ],
    textures: [],
    parameters: [],
  };

  const program = runtime.load(config);

  // 全屏四边形
  const vertices = new Float32Array([
    -1, -1,  0, 0,
     1, -1,  1, 0,
     1,  1,  1, 1,
    -1,  1,  0, 1,
  ]);
  const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);

  const mesh = {
    geometry: {
      attributes: {
        aPosition: { data: vertices, size: 2 as const, stride: 16, offset: 0 },
        aUV: { data: vertices, size: 2 as const, stride: 16, offset: 8 },
      },
      index: indices,
      vertexCount: 6,
    },
    program,
    uniforms: {} as Record<string, any>,
  };

  // 运行
  runtime.play((time) => {
    runtime.uniforms(program)
      .set('uTime', time)
      .commit();
    runtime.draw(mesh);
  });

  console.log('✅ Texture example running');
}

/**
 * 创建棋盘格纹理
 */
function createCheckerTexture(): HTMLCanvasElement {
  const size = 256;
  const cellSize = 32;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d')!;

  for (let y = 0; y < size / cellSize; y++) {
    for (let x = 0; x < size / cellSize; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#ffffff' : '#333333';
      ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
    }
  }
  return c;
}

/**
 * 多材质渲染示例
 */
function multiMaterialExample() {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 400;
  document.body.appendChild(canvas);

  const runtime = new ShaderGraphRuntime(canvas);

  // 红色三角形
  const redProgram = runtime.load({
    version: 1,
    id: 'red',
    vertCode: `#version 300 es
precision highp float;
in vec3 aPosition;
void main() { gl_Position = vec4(aPosition, 1.0); }`,
    fragCode: `#version 300 es
precision highp float;
out vec4 fragColor;
void main() { fragColor = vec4(1.0, 0.0, 0.0, 1.0); }`,
    uniforms: [], textures: [], parameters: [],
  });

  // 蓝色三角形
  const blueProgram = runtime.load({
    version: 1,
    id: 'blue',
    vertCode: `#version 300 es
precision highp float;
in vec3 aPosition;
void main() { gl_Position = vec4(aPosition, 1.0); }`,
    fragCode: `#version 300 es
precision highp float;
out vec4 fragColor;
void main() { fragColor = vec4(0.0, 0.0, 1.0, 1.0); }`,
    uniforms: [], textures: [], parameters: [],
  });

  const data1 = new Float32Array([-0.6, -0.5, 0, -0.2, 0.5, 0, 0.4, -0.5, 0]);
  const data2 = new Float32Array([-0.4, -0.5, 0, 0.0, 0.5, 0, 0.6, -0.5, 0]);

  const mesh1 = { geometry: { attributes: { aPosition: { data: data1, size: 3 as const } }, vertexCount: 3 }, program: redProgram, uniforms: {} };
  const mesh2 = { geometry: { attributes: { aPosition: { data: data2, size: 3 as const } }, vertexCount: 3 }, program: blueProgram, uniforms: {} };

  runtime.clear();
  runtime.draw(mesh1);
  runtime.draw(mesh2);

  console.log('✅ Multi-material rendered');
}

export { textureExample, multiMaterialExample, createCheckerTexture };
