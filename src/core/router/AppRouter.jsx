import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

// Páginas Públicas
import LandingPage from '../../features/landing/pages/LandingPage';
import Login from '../../features/auth/pages/Login';
import Register from '../../features/auth/pages/Register';

// Layout
import DashboardLayout from '../../features/dashboard/layouts/DashboardLayout';

// Páginas privadas
import Dashboard from '../../features/dashboard/pages/Dashboard';
import ClientsList from '../../features/clients/pages/ClientsList';
import BudgetsList from '../../features/budgets/pages/BudgetsList';
import BudgetEditor from '../../features/budgets/pages/BudgetEditor';
import TemplatesList from '../../features/templates/pages/TemplatesList';
import SettingsPage from '../../features/settings/pages/SettingsPage';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, token } = useAuthStore();
  return (isAuthenticated && token) ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, token } = useAuthStore();
  return (isAuthenticated && token) ? <Navigate to="/dashboard" replace /> : children;
};

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Privadas */}
        <Route path="/" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
          <Route path="dashboard"      element={<Dashboard />} />
          <Route path="clients"        element={<ClientsList />} />
          <Route path="budgets"        element={<BudgetsList />} />
          <Route path="budgets/:id"    element={<BudgetEditor />} />
          <Route path="templates"      element={<TemplatesList />} />
          <Route path="settings"       element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
