import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../api/api';
import './Layout.css';

const Layout = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [theme, setTheme] = React.useState(() => localStorage.getItem('theme') || 'dark');
  const [parentChildName, setParentChildName] = React.useState('');

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  React.useEffect(() => {
    const loadParentChild = async () => {
      if (user?.role !== 'parent' || !user?.child_ids?.length) {
        setParentChildName('');
        return;
      }
      try {
        const childRes = await usersAPI.getUser(user.child_ids[0]);
        setParentChildName(childRes.data?.full_name || '');
      } catch {
        setParentChildName('');
      }
    };
    loadParentChild();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;
  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="layout">
      {/* Боковая панель */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <svg className="sidebar-logo" viewBox="0 0 100 100">
            <rect x="20" y="30" width="25" height="50" rx="2" fill="#3498db" />
            <rect x="55" y="30" width="25" height="50" rx="2" fill="#2980b9" />
            <rect x="45" y="30" width="10" height="50" fill="#ffffff" opacity="0.2" />
            <line x1="25" y1="40" x2="40" y2="40" stroke="#ffffff" strokeWidth="1" opacity="0.3" />
            <line x1="25" y1="48" x2="38" y2="48" stroke="#ffffff" strokeWidth="1" opacity="0.3" />
            <line x1="25" y1="56" x2="40" y2="56" stroke="#ffffff" strokeWidth="1" opacity="0.3" />
            <line x1="60" y1="40" x2="75" y2="40" stroke="#ffffff" strokeWidth="1" opacity="0.3" />
            <line x1="60" y1="48" x2="73" y2="48" stroke="#ffffff" strokeWidth="1" opacity="0.3" />
            <line x1="60" y1="56" x2="75" y2="56" stroke="#ffffff" strokeWidth="1" opacity="0.3" />
          </svg>
          <h2>Дневник</h2>
        </div>
        
        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.full_name}</div>
            <div className="user-role">
              {user?.role === 'student' ? 'Ученик' : user?.role === 'teacher' ? 'Учитель' : user?.role === 'parent' ? (parentChildName ? `Родитель: ${parentChildName}` : 'Родитель') : 'Администратор'}
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className={isActive('/admin') ? 'nav-item active' : 'nav-item'}
            >
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" />
              </svg>
              <span>Администрирование</span>
            </Link>
          )}
          {user?.role === 'teacher' && (
            <Link
              to="/teacher"
              className={isActive('/teacher') ? 'nav-item active' : 'nav-item'}
            >
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              <span>Кабинет учителя</span>
            </Link>
          )}
          {(user?.role === 'student' || user?.role === 'parent') && (
            <Link
              to="/dashboard"
              className={isActive('/dashboard') ? 'nav-item active' : 'nav-item'}
            >
              <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <span>Главная</span>
            </Link>
          )}
        </nav>

        <div className="sidebar-footer">
          <button onClick={toggleTheme} className="sidebar-theme-toggle">
            {theme === 'dark' ? '☀️ Светлая тема' : '🌙 Тёмная тема'}
          </button>
          <button onClick={handleLogout} className="sidebar-logout">
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Выход</span>
          </button>
        </div>
      </aside>

      {/* Основной контент */}
      <div className="layout-content">
        <main className="main-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
