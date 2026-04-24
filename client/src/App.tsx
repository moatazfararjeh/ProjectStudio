import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { App as AntApp, Spin } from 'antd';
import { useAuthStore } from './stores/authStore';
import './App.css';

// Layouts
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';

// Pages - Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Pages - Dashboard
import Dashboard from './pages/Dashboard';

// Pages - Projects
import ProjectList from './pages/projects/ProjectList';
import ProjectDetail from './pages/projects/ProjectDetailNew';

// Pages - Tasks
import TaskList from './pages/tasks/TaskList';

// Pages - Reports
import ReportList from './pages/reports/ReportList';

// Pages - RAID
import RAIDLog from './pages/raid/RAIDLog';

// Pages - My Day
import MyDay from './pages/MyDay';

// Pages - Settings
import Settings from './pages/settings/Settings';
import SettingsPage from './pages/settings/SettingsPage';

// Pages - Accounts
import AccountList from './pages/accounts/AccountList';
import AccountDetail from './pages/accounts/AccountDetail';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkAuth().finally(() => setIsChecking(false));
  }, [checkAuth]);

  if (isChecking) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <AntApp>
      <Routes>
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} />
          <Route path="/register" element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} />
        </Route>

        {/* Protected Routes */}
        <Route element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route path="/" element={<Dashboard />} />
          <Route path="/my-day" element={<MyDay />} />
          <Route path="/projects" element={<ProjectList />} />
          <Route path="/projects/:id/*" element={<ProjectDetail />} />
          <Route path="/tasks" element={<TaskList />} />
          <Route path="/reports" element={<ReportList />} />
          <Route path="/raid" element={<RAIDLog />} />
          <Route path="/accounts" element={<AccountList />} />
          <Route path="/accounts/:id" element={<AccountDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/system-settings" element={<SettingsPage />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AntApp>
  );
}

export default App;
