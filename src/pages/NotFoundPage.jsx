import { Link } from 'react-router-dom';
import { AuthCard } from '../components/AuthCard';
import { homePathForRole } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function NotFoundPage() {
  const { user } = useAuth();
  useDocumentTitle('Page not found');
  const destination = user ? homePathForRole(user.role) || '/login' : '/login';
  const label = user && homePathForRole(user.role) ? 'Back to dashboard' : 'Back to sign in';

  return (
    <AuthCard title="Page not found" subtitle="That page is not part of this portal." showInstitution>
      <Link
        to={destination}
        className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        {label}
      </Link>
    </AuthCard>
  );
}
