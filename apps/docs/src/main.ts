import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import App from './App.vue'
import HomePage from './pages/HomePage.vue'
import ApiPage from './pages/ApiPage.vue'
import ExamplesPage from './pages/ExamplesPage.vue'
import EditorPage from './pages/EditorPage.vue'

const router = createRouter({
  history: createWebHashHistory('/shader-graph-glsl/'),
  routes: [
    { path: '/', component: HomePage },
    { path: '/api', component: ApiPage },
    { path: '/examples', component: ExamplesPage },
    { path: '/editor', component: EditorPage },
  ],
})

const app = createApp(App)
app.use(router)
app.mount('#app')
