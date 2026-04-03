import { Routes, Route } from 'react-router-dom';
import { App as AntApp, ConfigProvider } from 'antd';
import MainLayout from './layouts/MainLayout';
import LandingPage from './pages/LandingPage';
import JobDetailPage from './pages/JobDetailPage';
import ApplicationSuccessPage from './pages/ApplicationSuccessPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ApplicationDetailPage from './pages/ApplicationDetailPage';
import ProtectedRoute from './components/ProtectedRoute';
import { useTheme } from './context/ThemeContext';

function App() {
  const { themeConfig } = useTheme();

  return (
    <ConfigProvider theme={themeConfig}>
    <AntApp>
      <Routes>
        {/* Public pages */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/jobs/:uuid" element={<JobDetailPage />} />
          <Route path="/application-success" element={<ApplicationSuccessPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Authenticated pages */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/applications/:uuid" element={<ApplicationDetailPage />} />
          </Route>
        </Route>
      </Routes>
    </AntApp>
    </ConfigProvider>
  );
}

export default App;
