import { useNavigate } from 'react-router-dom';
import { AuthCard } from '../components/AuthCard';
import { SignInForm } from '../components/SignInForm';
import { INSTITUTION_NAME, homePathForRole } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  useDocumentTitle('Sign in');

  async function handleSubmit(values) {
    const nextUser = await login(values);
    const destination = nextUser?.mustChangePassword
      ? '/change-password'
      : homePathForRole(nextUser?.role) || '/login';
    navigate(destination, { replace: true });
  }

  return (
    <AuthCard title={INSTITUTION_NAME} subtitle="Sign in with the account your school created.">
      <SignInForm onSubmit={handleSubmit} roleChoices />
    </AuthCard>
  );
}
