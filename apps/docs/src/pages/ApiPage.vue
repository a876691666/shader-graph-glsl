<script setup lang="ts">
</script>

<template>
  <div class="api-page">
    <h2>📖 API 文档</h2>
    <p class="subtitle">@shader-graph-glsl/runtime · @shader-graph-glsl/editor</p>

    <!-- ===== Runtime ===== -->
    <section class="section">
      <h2>@shader-graph-glsl/runtime</h2>
      <p>轻量、独立的 WebGL2 运行时引擎，无第三方框架依赖。</p>

      <!-- ShaderGraphRuntime -->
      <div class="card api-card">
        <div class="api-header">
          <code class="api-symbol">class</code>
          <h3>ShaderGraphRuntime</h3>
        </div>
        <p class="api-desc">运行时引擎主类。管理着色器程序、uniform、纹理和渲染循环。</p>

        <h4>Constructor</h4>
        <table>
          <tr><td><code>constructor(canvas, options?)</code></td><td>创建运行时实例，绑定 WebGL2 上下文</td></tr>
        </table>

        <h4>Methods</h4>
        <table>
          <tr>
            <td><code>load(config, key?)</code></td>
            <td>加载 ShaderConfig，返回 ProgramHandle</td>
          </tr>
          <tr>
            <td><code>get(key)</code></td>
            <td>从缓存获取已加载的程序</td>
          </tr>
          <tr>
            <td><code>unload(handle)</code></td>
            <td>卸载着色器程序</td>
          </tr>
          <tr>
            <td><code>uniforms(handle)</code></td>
            <td>获取 UniformBinder 链式 API</td>
          </tr>
          <tr>
            <td><code>draw(mesh)</code></td>
            <td>绘制网格 (几何体 + 程序 + uniforms)</td>
          </tr>
          <tr>
            <td><code>clear()</code></td>
            <td>清除颜色/深度缓冲区</td>
          </tr>
          <tr>
            <td><code>setClearColor(r, g, b, a)</code></td>
            <td>设置清除颜色</td>
          </tr>
          <tr>
            <td><code>play(callback?)</code></td>
            <td>启动动画循环</td>
          </tr>
          <tr>
            <td><code>stop()</code></td>
            <td>停止动画循环</td>
          </tr>
          <tr>
            <td><code>resize(w, h)</code></td>
            <td>调整画布尺寸 (自动同步 viewport)</td>
          </tr>
          <tr>
            <td><code>dispose()</code></td>
            <td>释放所有资源</td>
          </tr>
        </table>

        <h4>Properties</h4>
        <table>
          <tr><td><code>readonly renderer</code></td><td>底层 RuntimeRenderer 实例</td></tr>
          <tr><td><code>readonly gl</code></td><td>WebGL2RenderingContext</td></tr>
          <tr><td><code>readonly canvas</code></td><td>HTMLCanvasElement</td></tr>
          <tr><td><code>readonly isPlaying</code></td><td>是否正在播放动画</td></tr>
        </table>
      </div>

      <!-- UniformBinder -->
      <div class="card api-card">
        <div class="api-header">
          <code class="api-symbol">interface</code>
          <h3>UniformBinder</h3>
        </div>
        <p class="api-desc">链式 uniform 设置 API。</p>
        <table>
          <tr><td><code>.set(name, value)</code></td><td>设置 uniform 值 (支持 number / number[])</td></tr>
          <tr><td><code>.setMany(values)</code></td><td>批量设置 uniform</td></tr>
          <tr><td><code>.texture(name, source, unit?)</code></td><td>绑定纹理</td></tr>
          <tr><td><code>.commit()</code></td><td>提交所有待处理的 uniform 更新</td></tr>
        </table>
      </div>

      <!-- Key Types -->
      <div class="card api-card">
        <div class="api-header">
          <code class="api-symbol">types</code>
          <h3>核心类型</h3>
        </div>

        <h4>ShaderConfig</h4>
        <p>编辑器编译产生的着色器配置，是编辑器与运行时之间的契约。</p>
        <pre><code><span class="hl kw">interface</span> <span class="hl t">ShaderConfig</span> {
  version: <span class="hl num">1</span>
  id: <span class="hl t">string</span>
  name?: <span class="hl t">string</span>
  vertCode: <span class="hl t">string</span>      <span class="hl c">// 完整顶点 GLSL</span>
  fragCode: <span class="hl t">string</span>      <span class="hl c">// 完整片段 GLSL</span>
  uniforms: <span class="hl t">UniformMeta</span>[]
  textures: <span class="hl t">TextureBinding</span>[]
  parameters: <span class="hl t">ParameterConfig</span>[]
  renderState?: { ... }
  subGraphs?: Record&lt;<span class="hl t">string</span>, <span class="hl t">SubGraphConfig</span>&gt;
}</code></pre>

        <h4>GeometryDescriptor</h4>
        <p>无框架依赖的几何体描述。</p>
        <pre><code><span class="hl kw">interface</span> <span class="hl t">GeometryDescriptor</span> {
  attributes: Record&lt;<span class="hl t">string</span>, <span class="hl t">VertexAttribute</span>&gt;
  index?: <span class="hl t">Uint16Array</span> | <span class="hl t">Uint32Array</span>
  vertexCount: <span class="hl t">number</span>
}

<span class="hl kw">interface</span> <span class="hl t">VertexAttribute</span> {
  data: <span class="hl t">Float32Array</span>
  size: <span class="hl num">1</span> | <span class="hl num">2</span> | <span class="hl num">3</span> | <span class="hl num">4</span>
  normalized?: <span class="hl t">boolean</span>
  stride?: <span class="hl t">number</span>
  offset?: <span class="hl t">number</span>
}</code></pre>
      </div>
    </section>

    <!-- ===== Editor ===== -->
    <section class="section">
      <h2>@shader-graph-glsl/editor</h2>
      <p>基于 Rete.js 的可视化着色器图编辑器。</p>

      <div class="card api-card">
        <div class="api-header">
          <code class="api-symbol">class</code>
          <h3>ShaderGraphEditor</h3>
        </div>
        <p class="api-desc">编辑器主类。管理节点编辑、图操作、编译和预览。</p>

        <h4>Constructor</h4>
        <table>
          <tr><td><code>constructor(container, options?)</code></td><td>创建编辑器实例</td></tr>
        </table>

        <h4>EditorOptions</h4>
        <table>
          <tr><td><code>autoInit?</code></td><td>是否自动初始化基本节点 (default: true)</td></tr>
          <tr><td><code>showPreview?</code></td><td>是否显示预览面板 (default: true)</td></tr>
          <tr><td><code>autoCompile?</code></td><td>是否自动编译 (default: true)</td></tr>
          <tr><td><code>subGraphProvider?</code></td><td>子图数据提供者</td></tr>
        </table>

        <h4>Methods</h4>
        <table>
          <tr><td><code>createGraph()</code></td><td>创建新的着色器图 (async)</td></tr>
          <tr><td><code>createSubGraph()</code></td><td>创建新的子图 (async)</td></tr>
          <tr><td><code>load(data)</code></td><td>从 JSON 加载图数据</td></tr>
          <tr><td><code>save()</code></td><td>导出图为 JSON</td></tr>
          <tr><td><code>clear()</code></td><td>清空编辑器</td></tr>
          <tr><td><code>compile()</code></td><td>编译图为 ShaderConfig (async)</td></tr>
          <tr><td><code>toggleBlackboard()</code></td><td>切换参数面板</td></tr>
          <tr><td><code>togglePreview()</code></td><td>切换预览面板</td></tr>
          <tr><td><code>toggleInspector()</code></td><td>切换属性面板</td></tr>
          <tr><td><code>on(event, handler)</code></td><td>监听事件</td></tr>
          <tr><td><code>off(event, handler)</code></td><td>移除事件监听</td></tr>
          <tr><td><code>use(plugin, options?)</code></td><td>安装插件</td></tr>
          <tr><td><code>dispose()</code></td><td>释放资源</td></tr>
        </table>

        <h4>Events</h4>
        <table>
          <tr><td><code>change</code></td><td>图内容变化</td></tr>
          <tr><td><code>compiled</code></td><td>编译完成，携带 ShaderConfig</td></tr>
          <tr><td><code>settingUpdate</code></td><td>设置项更新</td></tr>
          <tr><td><code>imported</code></td><td>图被导入</td></tr>
          <tr><td><code>ready</code></td><td>编辑器就绪</td></tr>
        </table>

        <h4>Properties</h4>
        <table>
          <tr><td><code>readonly inner</code></td><td>内部编辑器实例 (底层访问)</td></tr>
          <tr><td><code>readonly ready</code></td><td>是否已就绪</td></tr>
          <tr><td><code>readonly readyPromise</code></td><td>等待就绪的 Promise</td></tr>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.subtitle {
  color: var(--c-text-dim);
  font-size: 0.9rem;
  margin-top: -0.5rem;
  margin-bottom: 2rem;
}

.section { margin: 3rem 0; }

.api-card { margin-bottom: 1rem; }

.api-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.api-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.api-symbol {
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  background: rgba(108,140,255,0.15);
  color: var(--c-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.api-desc {
  color: var(--c-text-dim);
  margin-bottom: 1rem;
}

h4 {
  font-size: 0.85rem;
  color: var(--c-text-dim);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 1.25rem 0 0.5rem;
}
</style>
