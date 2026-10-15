import { Navigate, useLocation } from 'react-router-dom';
import { homePathForRole } from '../constants';
import { useAuth } from '../context/AuthContext';
import { Button } from './Button';
import { FullPageSpinner } from './Spinner';

function UnsupportedRole() {
  const { logout } = useAuth();
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="panel w-full max-w-md p-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Account not available</h1>
        <p className="mt-2 text-sm text-ink-muted">This account role cannot open the learning portal.</p>
        <Button type="button" className="mt-5" onClick={() => logout().catch(() => {})}>
          Log out
        </Button>
      </div>
    </main>
  );
}

export function ProtectedRoute({ children, roles, loginPath = '/login', allowDuringPasswordChange = false }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner />;
  if (!user) return <Navigate to={loginPath} replace state={{ from: location }} />;

  if (user.mustChangePassword && !allowDuringPasswordChange) {
    return <Navigate to="/change-password" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    const target = user.mustChangePassword ? '/change-password' : homePathForRole(user.role);
    if (!target) return <UnsupportedRole />;
    return <Navigate to={target} replace />;
  }

  return children;
}

export function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullPageSpinner />;
  if (!user) return children;
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;
  const target = homePathForRole(user.role);
  if (!target) return <UnsupportedRole />;
  return <Navigate to={target} replace />;
}
