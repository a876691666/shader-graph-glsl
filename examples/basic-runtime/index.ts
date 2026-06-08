/**
 * ============================================================
 * 最小化运行时示例 — 纯 WebGL2 渲染彩色三角形
 * ============================================================
 *
 * 这个示例展示 @xifu/shader-graph-glsl/runtime 的最小用法。
 * 无需编辑器，直接手写 GLSL 加载到运行时渲染。
 *
 * 运行方式:
 *   pnpm tsx examples/basic-runtime/index.ts
 *   或直接在浏览器中 import
 *
 * @packageDocumentation
 */

import { ShaderGraphRuntime } from '@xifu/shader-graph-glsl/runtime';

/**
 * 最小化使用示例
 * 1. 创建运行时
 * 2. 加载手写 GLSL
 * 3. 绘制三角形
 */
function minimalExample() {
  // 1. 创建画布
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 300;
  document.body.appendChild(canvas);

  // 2. 创建运行时
  const runtime = new ShaderGraphRuntime(canvas);

  // 3. 加载着色器配置 (通常由编辑器编译产出，这里手写演示)
  const program = runtime.load({
    version: 1,
    id: 'minimal-triangle',
    vertCode: `#version 300 es
precision highp float;
in vec3 aPosition;
out vec3 vColor;
void main() {
  vColor = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 1.0);
}`,
    fragCode: `#version 300 es
precision highp float;
in vec3 vColor;
out vec4 fragColor;
void main() {
  fragColor = vec4(vColor, 1.0);
}`,
    uniforms: [],
    textures: [],
    parameters: [],
  });

  // 4. 定义几何体 — 彩色三角形
  const vertices = new Float32Array([
    0.0,  0.5, 0.0,
   -0.5, -0.5, 0.0,
    0.5, -0.5, 0.0,
  ]);

  const mesh = {
    geometry: {
      attributes: {
        aPosition: { data: vertices, size: 3 as const },
      },
      vertexCount: 3,
    },
    program,
    uniforms: {} as Record<string, any>,
  };

  // 5. 渲染一帧
  runtime.clear();
  runtime.draw(mesh);

  console.log('✅ Minimal triangle rendered!');
}

// ============================================================
// 动画示例 — 随时间变化的颜色
// ============================================================

function animationExample() {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 300;
  document.body.appendChild(canvas);

  const runtime = new ShaderGraphRuntime(canvas);

  // 带 uniform 的着色器
  const program = runtime.load({
    version: 1,
    id: 'animated-triangle',
    vertCode: `#version 300 es
precision highp float;
in vec3 aPosition;
out vec3 vColor;
void main() {
  vColor = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 1.0);
}`,
    fragCode: `#version 300 es
precision highp float;
in vec3 vColor;
uniform float uTime;
uniform vec3 uColor1;
uniform vec3 uColor2;
out vec4 fragColor;
void main() {
  vec3 color = mix(uColor1, uColor2, (sin(uTime) * 0.5 + 0.5));
  fragColor = vec4(color * vColor, 1.0);
}`,
    uniforms: [
      { name: 'uTime', type: 'float' as const, default: 0 },
      { name: 'uColor1', type: 'vec3' as const, default: [1, 0, 0] },
      { name: 'uColor2', type: 'vec3' as const, default: [0, 0, 1] },
    ],
    textures: [],
    parameters: [],
  });

  const vertices = new Float32Array([
    0.0,  0.5, 0.0,
   -0.5, -0.5, 0.0,
    0.5, -0.5, 0.0,
  ]);

  const mesh = {
    geometry: {
      attributes: {
        aPosition: { data: vertices, size: 3 as const },
      },
      vertexCount: 3,
    },
    program,
    uniforms: {} as Record<string, any>,
  };

  // 动画循环
  runtime.play((time) => {
    runtime.uniforms(program)
      .set('uTime', time)
      .setMany({ uColor1: [1, 0.5, 0], uColor2: [0, 0.5, 1] })
      .commit();
    runtime.clear();
    runtime.draw(mesh);
  });

  console.log('✅ Animation started!');
}

// ============================================================
// 导出供消费者使用
// ============================================================

export { minimalExample, animationExample };

// 如果直接运行此文件，执行示例
if (typeof document !== 'undefined') {
  minimalExample();
  // animationExample(); // 取消注释以运行动画示例
}
