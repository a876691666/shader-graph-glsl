import { Matrix4 } from 'three';

const OpaqueShader = {
  uniforms: {
    modelViewMatrix: { value: new Matrix4(), type: 'm4' },
    projectionMatrix: { value: new Matrix4(), type: 'm4' },
    colorTexture: { value: null, type: 't' },
    depthTexture: { value: null, type: 't' },
  },

  vertexShader: `#version 300 es
  layout(location = 0) in vec3 aPosition;
  layout(location = 1) in vec2 aUV;
  out vec2 v_uv;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;

  void main() {
    v_uv = aUV;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(aPosition, 1.0);
  }`,

  fragmentShader: `#version 300 es
  precision highp float;
  in vec2 v_uv;
  uniform sampler2D colorTexture;
  uniform sampler2D depthTexture;
  layout(location = 0) out vec4 fragColor;

  void main() {
    fragColor = texture(colorTexture, v_uv);
  }`,
};

export { OpaqueShader };
