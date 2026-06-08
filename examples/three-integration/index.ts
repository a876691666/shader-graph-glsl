/**
 * ============================================================
 * Three.js 集成示例
 * ============================================================
 *
 * 展示如何将 @xifu/shader-graph-glsl/runtime 与 Three.js 结合使用。
 *
 * 两种集成方式:
 * 1. 使用 ShaderConfig 驱动 THREE.RawShaderMaterial
 * 2. 共享 WebGL 上下文混合渲染
 *
 * @packageDocumentation
 */

import * as THREE from 'three';
import { ShaderGraphRuntime } from '@xifu/shader-graph-glsl/runtime';

/**
 * 方式一: RawShaderMaterial 集成
 *
 * 使用编辑器编译出的 ShaderConfig 直接创建 Three.js 材质。
 * 这是最推荐的方式 — 干净、无侵入。
 */
function rawShaderMaterialExample() {
  // 假设这是编辑器编译产出的配置
  const shaderConfig = {
    version: 1 as const,
    id: 'three-shader',
    vertCode: `#version 300 es
precision highp float;
in vec3 position;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
    fragCode: `#version 300 es
precision highp float;
uniform vec3 uColor;
uniform float uTime;
out vec4 fragColor;
void main() {
  vec3 color = uColor * (0.8 + 0.2 * sin(uTime));
  fragColor = vec4(color, 1.0);
}`,
    uniforms: [
      { name: 'uColor', type: 'vec3' as const, default: [1, 0.3, 0.1] },
      { name: 'uTime', type: 'float' as const, default: 0 },
    ],
    textures: [],
    parameters: [],
  };

  // 创建 Three.js 材质
  const material = new THREE.RawShaderMaterial({
    vertexShader: shaderConfig.vertCode,
    fragmentShader: shaderConfig.fragCode,
    uniforms: {
      uColor: { value: new THREE.Color(1, 0.3, 0.1) },
      uTime: { value: 0 },
    },
    transparent: true,
    side: THREE.DoubleSide,
  });

  // 在 Three.js 场景中使用
  const scene = new THREE.Scene();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);
  scene.add(mesh);

  // 动画更新 uniform
  function animate(time: number) {
    material.uniforms.uTime.value = time * 0.001;
    requestAnimationFrame(animate);
  }

  console.log('✅ Three.js RawShaderMaterial created from ShaderConfig');
  console.log('✅ 可直接在 Three.js 场景中使用');
}

/**
 * 方式二: 共享 WebGL 上下文
 *
 * 在 Three.js 渲染器的 canvas 上创建运行时。
 * 适用于需要混合编辑器预览和 Three.js 场景的场景。
 */
function sharedContextExample() {
  // Three.js 渲染器
  const renderer = new THREE.WebGLRenderer({
    canvas: document.createElement('canvas'),
    alpha: true,
  });

  // 使用 Three.js 的 canvas 创建运行时
  const runtime = new ShaderGraphRuntime(renderer.domElement);

  // 现在 runtime 和 Three.js 共享同一个 WebGL 上下文
  // 需要在渲染时正确管理状态

  console.log('✅ WebGL context shared with THREE.WebGLRenderer');
  console.log('⚠️ 注意: 共享上下文时需手动管理 GL 状态');
}

// 导出
export { rawShaderMaterialExample, sharedContextExample };
