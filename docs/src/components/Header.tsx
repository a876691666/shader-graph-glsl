import { NAV_ITEMS } from "./nav";

/**
 * Header — 共享顶部导航栏
 */
interface HeaderProps {
  /** 当前路径（用于高亮），默认从 window.location 自动获取 */
  activePath?: string;
  /** 导航回调，接收 NavItem。不传则使用 window.location.href 跳转 */
  onNavigate?: (item: (typeof NAV_ITEMS)[number]) => void;
}

export default function Header({ activePath, onNavigate }: HeaderProps) {
  const currentUrl = activePath ?? window.location.pathname + window.location.hash;

  function handleClick(item: (typeof NAV_ITEMS)[number]) {
    if (onNavigate) {
      onNavigate(item);
    } else {
      window.location.href = item.href;
    }
  }

  function isActive(item: (typeof NAV_ITEMS)[number]): boolean {
    if (item.href === "/shader-graph-glsl/editor/") {
      return currentUrl.startsWith("/shader-graph-glsl/editor");
    }
    if (item.href === "/shader-graph-glsl/") {
      return currentUrl === "/shader-graph-glsl/" || currentUrl === "/shader-graph-glsl/#/";
    }
    return currentUrl === item.href;
  }

  return (
    <header className="header">
      <div className="header-inner">
        <h1 className="logo" onClick={() => handleClick(NAV_ITEMS[0])}>
          <span className="logo-icon">◆</span>
          Shader Graph GLSL
        </h1>
        <nav className="nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.href}
              className={`nav-btn${isActive(item) ? " active" : ""}`}
              onClick={() => handleClick(item)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <a
          className="github-link"
          href="https://github.com/a876691666/shader-graph-glsl"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
      </div>
    </header>
  );
}
