import { NavLink } from 'react-router-dom';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="logo">
          <div className="logo-icon">📊</div>
          <div>
            <div className="logo-text">SteamStats</div>
            <div className="logo-sub">Analyzer v1.0</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Overview</div>
        <NavLink to="/" end>
          <span className="nav-icon">🏠</span>
          Dashboard
        </NavLink>

        <div className="nav-section-label">Analysis</div>
        <NavLink to="/descriptive">
          <span className="nav-icon">📈</span>
          Descriptive Statistics
        </NavLink>
        <NavLink to="/probability">
          <span className="nav-icon">🎲</span>
          Probability & Distribution
        </NavLink>
        <NavLink to="/regression">
          <span className="nav-icon">📐</span>
          Regression & Prediction
        </NavLink>

        <div className="nav-section-label">Data</div>
        <NavLink to="/explorer">
          <span className="nav-icon">🔍</span>
          Data Explorer
        </NavLink>

        <div className="nav-section-label">Tools</div>
        <NavLink to="/compare">
          <span className="nav-icon">⚔️</span>
          Game Compare
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        Powered by Pyodide + React<br />
        © 2026 FAST-NUCES
      </div>
    </aside>
  );
}
