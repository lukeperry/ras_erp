import { AuthProvider, useAuth } from './auth/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <div className="center-message">Loading…</div>;
  return user ? <DashboardPage /> : <LoginPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
