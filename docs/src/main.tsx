import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import HomePage from './pages/HomePage'
import ApiPage from './pages/ApiPage'
import ExamplesPage from './pages/ExamplesPage'
import EditorPage from './pages/EditorPage'
import './index.css'

ReactDOM.createRoot(document.getElementById('app')!).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<HomePage />} />
          <Route path="api" element={<ApiPage />} />
          <Route path="examples" element={<ExamplesPage />} />
          <Route path="editor/:graph?" element={<EditorPage />} />
        </Route>
      </Routes>
    </HashRouter>
  </React.StrictMode>
)
