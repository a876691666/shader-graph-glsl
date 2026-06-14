import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import { NAV_ITEMS } from './components/nav'

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const isEditor = location.pathname.startsWith('/editor');

  function onNavigate(item: (typeof NAV_ITEMS)[number]) {
    if (item.route !== null) {
      navigate(item.route)
    } else {
      window.location.href = item.href
    }
  }

  return (
    <div className="app">
      <Header
        activePath={location.pathname + location.hash}
        onNavigate={onNavigate}
      />
      <main className={`main${isEditor ? ' main--editor' : ''}`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
