import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthCard } from '../components/AuthCard';
import { SignInForm } from '../components/SignInForm';
import { homePathForRole } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function AdminLoginPage() {
  const { adminLogin } = useAuth();
  const navigate = useNavigate();
  useDocumentTitle('Administrator sign in');

  useEffect(() => {
    const existing = document.querySelector('meta[name="robots"]');
    const created = !existing;
    const meta = existing || document.createElement('meta');
    if (created) {
      meta.setAttribute('name', 'robots');
      document.head.appendChild(meta);
    }
    const previous = meta.getAttribute('content');
    meta.setAttribute('content', 'noindex, nofollow');
    return () => {
      if (created) meta.remove();
      else if (previous == null) meta.removeAttribute('content');
      else meta.setAttribute('content', previous);
    };
  }, []);

  async function handleSubmit(values) {
    const nextUser = await adminLogin(values);
    const destination = nextUser?.mustChangePassword
      ? '/change-password'
      : homePathForRole(nextUser?.role) || '/secure-admin-portal';
    navigate(destination, { replace: true });
  }

  return (
    <AuthCard title="Administrator sign in" subtitle="Authorized personnel only" showInstitution>
      <SignInForm onSubmit={handleSubmit} />
    </AuthCard>
  );
}
