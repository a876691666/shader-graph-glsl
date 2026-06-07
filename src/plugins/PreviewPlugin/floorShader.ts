export const FloorShader = {
  vert: `#version 300 es
  layout(location = 0) in vec3 position;
  layout(location = 1) in vec2 uv;
  out vec2 v_uv;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;

  void main() {
    v_uv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`,

  frag: `#version 300 es
  precision highp float;
  in vec2 v_uv;
  layout(location = 0) out vec4 fragColor;

  void main() {
    fragColor = vec4(0.07, 0.2, 0.34, 1.0);
  }`,
};
