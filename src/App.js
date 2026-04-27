import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import Grades from './pages/Grades';
import Homework from './pages/Homework';
import Schedule from './pages/Schedule';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import './App.css';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Загрузка...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

const RoleHomeRoute = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'admin') return <Navigate to="/admin" />;
  if (user.role === 'teacher') return <Navigate to="/teacher" />;
  return <Navigate to="/dashboard" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/grades"
            element={
              <PrivateRoute>
                <Layout>
                  <Grades />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/homework"
            element={
              <PrivateRoute>
                <Layout>
                  <Homework />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/schedule"
            element={
              <PrivateRoute>
                <Layout>
                  <Schedule />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <Layout>
                  <AdminDashboard />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/teacher"
            element={
              <PrivateRoute>
                <Layout>
                  <TeacherDashboard />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route path="/" element={<PrivateRoute><RoleHomeRoute /></PrivateRoute>} />
          <Route path="*" element={<PrivateRoute><RoleHomeRoute /></PrivateRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
