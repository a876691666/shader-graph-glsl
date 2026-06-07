// SG function templates — 内层节点函数
export const UnlitSGTemplate = Object.freeze({
  vert: (body: string) => `void sg_vert(
  inout vec3 positionOS,
  inout vec3 normalOS,
  inout vec4 tangentOS,
  vec2 uv
) {
${body}
}`,
  frag: (body: string) => `void sg_frag(
  inout vec3 baseColor,
  inout float alpha
) {
${body}
}`,
} as const);

// Material templates — 外层着色器包装 (GLSL ES 3.00, WebGL2)
export const UnlitMaterialTemplate = {
  vert: (sgCode: string) => `#version 300 es

// -- 内置 uniform (用于 gl_Position 计算) --
uniform mat4 sg_Matrix_ModelView;
uniform mat4 sg_Matrix_Proj;

// -- Three.js 标准属性 (带 layout 以便独立使用) --
layout(location = 0) in vec3 position;
layout(location = 1) in vec2 uv;
layout(location = 2) in vec3 normal;
layout(location = 3) in vec4 tangent;

// -- 编译生成的 uniform / varying / define --
${sgCode}

void main() {
  vec3 sg_position = position;
  vec3 sg_normal = normal;
  vec4 sg_tangent = tangent;
  sg_vert(sg_position, sg_normal, sg_tangent, uv);
  gl_Position = sg_Matrix_Proj * sg_Matrix_ModelView * vec4(sg_position, 1.0);
}`,

  frag: (sgCode: string) => `#version 300 es
precision highp float;

// -- 编译生成的 uniform / varying / define --
${sgCode}

vec3 LinearToGammaSpace(vec3 linRGB) {
  return max(vec3(1.055) * pow(max(linRGB, vec3(0.0)), vec3(0.416666667)) - 0.055, vec3(0.0));
}

layout(location = 0) out vec4 fragColor;

void main() {
  vec3 sg_baseColor = vec3(0.0);
  float sg_alpha = 1.0;
  sg_frag(sg_baseColor, sg_alpha);
  fragColor = vec4(LinearToGammaSpace(sg_baseColor), sg_alpha);
}`,
};
