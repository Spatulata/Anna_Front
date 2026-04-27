import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData);
    
    if (result.success) {
      const role = result.user?.role;
      const target = role === 'admin' ? '/admin' : role === 'teacher' ? '/teacher' : '/dashboard';
      navigate(target);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="bg-shape bg-shape-1"></div>
        <div className="bg-shape bg-shape-2"></div>
        <div className="bg-shape bg-shape-3"></div>
      </div>
      <div className="login-card">
        <div className="login-header">
          <div className="app-logo">
            <svg viewBox="0 0 100 100" className="logo-svg">
              {/* Открытая книга - плоский стиль */}
              <rect x="20" y="30" width="25" height="50" rx="2" fill="#3498db" />
              <rect x="55" y="30" width="25" height="50" rx="2" fill="#2980b9" />
              {/* Переплет */}
              <rect x="45" y="30" width="10" height="50" fill="#1a1a2e" />
              {/* Линии на страницах */}
              <line x1="25" y1="40" x2="40" y2="40" stroke="#ecf0f1" strokeWidth="1" opacity="0.4" />
              <line x1="25" y1="48" x2="38" y2="48" stroke="#ecf0f1" strokeWidth="1" opacity="0.4" />
              <line x1="25" y1="56" x2="40" y2="56" stroke="#ecf0f1" strokeWidth="1" opacity="0.4" />
              <line x1="25" y1="64" x2="35" y2="64" stroke="#ecf0f1" strokeWidth="1" opacity="0.4" />
              <line x1="60" y1="40" x2="75" y2="40" stroke="#ecf0f1" strokeWidth="1" opacity="0.4" />
              <line x1="60" y1="48" x2="73" y2="48" stroke="#ecf0f1" strokeWidth="1" opacity="0.4" />
              <line x1="60" y1="56" x2="75" y2="56" stroke="#ecf0f1" strokeWidth="1" opacity="0.4" />
              <line x1="60" y1="64" x2="70" y2="64" stroke="#ecf0f1" strokeWidth="1" opacity="0.4" />
            </svg>
          </div>
          <h1>Вход в систему</h1>
          <p className="subtitle">Электронный дневник школьника</p>
        </div>
        
        {error && (
          <div className={`error-message ${error ? 'error-show' : ''}`}>
            <svg className="error-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">
              <svg className="label-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Имя пользователя
            </label>
            <div className="input-wrapper">
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                autoComplete="username"
                placeholder="Введите имя пользователя"
              />
              <span className="input-focus-line"></span>
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="password">
              <svg className="label-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Пароль
            </label>
            <div className="input-wrapper">
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
                placeholder="Введите пароль"
              />
              <span className="input-focus-line"></span>
            </div>
          </div>
          
          <button type="submit" className={`submit-btn ${loading ? 'loading' : ''}`} disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                <span>Вход...</span>
              </>
            ) : (
              <span>Войти</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
