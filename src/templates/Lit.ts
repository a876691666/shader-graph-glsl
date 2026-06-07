export const LitSGTemplate = Object.freeze({
  vert: (body: string) => `void sg_vert(
  inout vec3 positionOS,
  inout vec3 normalOS,
  inout vec3 tangentOS
) {
${body}
}`,
  frag: (body: string) => `void sg_frag(
  inout vec3 baseColor,
  inout float alpha,
  inout float metallic,
  inout float smoothness,
  inout vec3 emission,
  inout float ao,
  inout vec3 normalTS
) {
${body}
}`,
} as const);

export const LitMaterialTemplate = {
  vert: (sgCode: string) => `#version 300 es

// -- 内置 uniform (用于 gl_Position 计算) --
uniform mat4 sg_Matrix_ModelView;
uniform mat4 sg_Matrix_Proj;

layout(location = 0) in vec3 position;
layout(location = 1) in vec2 uv;
layout(location = 2) in vec3 normal;

${sgCode}

void main() {
  vec3 sg_position = position;
  vec3 sg_normal = normal;
  vec3 sg_tangent = vec3(0.0);
  sg_vert(sg_position, sg_normal, sg_tangent);
  gl_Position = sg_Matrix_Proj * sg_Matrix_ModelView * vec4(sg_position, 1.0);
}`,

  frag: (sgCode: string) => `#version 300 es
precision highp float;

${sgCode}

vec3 LinearToGammaSpace(vec3 linRGB) {
  return max(vec3(1.055) * pow(max(linRGB, vec3(0.0)), vec3(0.416666667)) - 0.055, vec3(0.0));
}

layout(location = 0) out vec4 fragColor;

void main() {
  vec3 sg_baseColor = vec3(0.0);
  float sg_alpha = 1.0;
  float sg_metallic = 0.0;
  float sg_smoothness = 0.5;
  vec3 sg_emission = vec3(0.0);
  float sg_ao = 1.0;
  vec3 sg_normalTS = vec3(0.0, 0.0, 1.0);
  sg_frag(sg_baseColor, sg_alpha, sg_metallic, sg_smoothness, sg_emission, sg_ao, sg_normalTS);
  fragColor = vec4(LinearToGammaSpace(sg_baseColor), sg_alpha);
}`,
};
