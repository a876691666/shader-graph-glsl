# WGSL→GLSL 迁移任务追踪 ✅ 已完成

| 阶段 | 任务 | 状态 | 文件数 |
|------|------|------|--------|
| **Phase 0** | 新建 ShaderDialect 方言抽象层 | ✅ | 1 |
| **Phase 1** | 编译器核心：getTypeClass/compileValue/compileHeadCode/setParameter/setAutoVaryings | ✅ | 2 |
| **Phase 2** | ShaderGraphFns.ts 内置函数模板 | ✅ | 1 |
| **Phase 3** | templates/Lit.ts + Unlit.ts GLSL重写 | ✅ | 2 |
| **Phase 4** | 批量改写 components 层 compileSG (~90文件) | ✅ | ~90 |
| **Phase 5a** | 渲染器 WebGL2 适配 (GLSL ES 3.00) | ✅ | 3 |
| **Phase 5b** | SGController 适配 GLSL uniform/binding | ✅ | 1 |
| **Phase 6** | WebGPU 完全移除，纯 GLSL 实现 | ✅ | 6 |
| **Phase 7** | package.json 更新依赖 | ✅ | 1 |
| **验证** | 37/37 演示页面通过编译检查 + 功能验证 | ✅ | - |

## 额外完成

- [x] 移除 `wgslToGLSL()` 运行时转换，所有模板直接输出纯 GLSL
- [x] `wgsl` namespace 重命名为 `glsl`
- [x] `vite.config.ts` base 改为 `/shader-graph-glsl/`
- [x] `tsconfig.json` 移除 `@webgpu/types` 引用
- [x] 删除 WebGPURenderer / OpaquePass / WebGPUMaterial
- [x] 新建 SGMaterial / dispose.ts

---

> **迁移完成日期**：2024-06  
> **版本**：v0.2.0  
> **当前状态**：项目已完全迁移至纯 GLSL ES 3.00，无任何 WebGPU/WGSL 残留。37 个演示页面全部通过编译验证。
