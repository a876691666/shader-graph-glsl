import { LitMaterialTemplate, LitSGTemplate } from './Lit';
import { UnlitMaterialTemplate, UnlitSGTemplate } from './Unlit';

export const MaterialTemplates = Object.freeze({
  unlit: UnlitMaterialTemplate,
  lit: LitMaterialTemplate,
  subgraph: UnlitMaterialTemplate,
} as const);

export const SGTemplates = Object.freeze({
  lit: LitSGTemplate,
  unlit: UnlitSGTemplate,
  subgraph: UnlitSGTemplate,
});

// GLSL 版本标记 — 由 MaterialTemplates 外层模板添加
export const SG_VERT = `// -- shader-graph vertex shader --
`;
export const SG_FRAG = ``;
export const GLSL_PRECISION = `precision highp float;\nprecision highp int;\n`;
