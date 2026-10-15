import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthCard } from '../components/AuthCard';
import { Button } from '../components/Button';
import { PasswordField } from '../components/PasswordField';
import { Spinner } from '../components/Spinner';
import { homePathForRole } from '../constants';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { hasErrors, mapFieldErrors, validatePasswordChange } from '../utils/validation';

export function ChangePasswordPage() {
  const { user, changePassword, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  useDocumentTitle('Change password');

  const forced = Boolean(user?.mustChangePassword);
  const dashboardPath = homePathForRole(user?.role);

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validatePasswordChange({ currentPassword, newPassword, confirmPassword });
    setErrors(nextErrors);
    setFormError('');
    if (hasErrors(nextErrors)) return;

    setSubmitting(true);
    try {
      const nextUser = await changePassword({ currentPassword, newPassword });
      toast.success('Password updated.');
      navigate(homePathForRole(nextUser?.role) || dashboardPath || '/login', { replace: true });
    } catch (error) {
      const fieldErrors = mapFieldErrors(error);
      if (hasErrors(fieldErrors)) setErrors((current) => ({ ...current, ...fieldErrors }));
      setFormError(error.message || 'Could not change the password.');
      toast.error(error.message || 'Could not change the password.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogout() {
    const destination = user?.role === 'admin' ? '/secure-admin-portal' : '/login';
    setLoggingOut(true);
    try {
      await logout();
      navigate(destination, { replace: true });
    } catch (error) {
      toast.error(error.message || 'Could not log out.');
      setLoggingOut(false);
    }
  }

  return (
    <AuthCard
      title="Change your password"
      subtitle={
        forced
          ? 'Your account requires a new password before you can continue.'
          : 'Choose a new password for your account.'
      }
      showInstitution
    >
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        {formError ? (
          <div role="alert" className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger">
            {formError}
          </div>
        ) : null}
        <PasswordField
          id="current-password"
          name="currentPassword"
          label="Current password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          error={errors.currentPassword}
          disabled={submitting}
        />
        <PasswordField
          id="new-password"
          name="newPassword"
          label="New password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          error={errors.newPassword}
          disabled={submitting}
        />
        <p className="-mt-2 text-xs text-ink-faint">At least 8 characters, with one letter and one number.</p>
        <PasswordField
          id="confirm-password"
          name="confirmPassword"
          label="Confirm new password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={errors.confirmPassword}
          disabled={submitting}
        />
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? <Spinner className="h-4 w-4 text-white" label="Saving password" /> : null}
          Update password
        </Button>
      </form>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-between">
        {!forced && dashboardPath ? (
          <Link
            to={dashboardPath}
            className="inline-flex min-h-10 items-center justify-center rounded-lg px-3 text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Back to dashboard
          </Link>
        ) : (
          <span />
        )}
        <Button type="button" variant="ghost" onClick={handleLogout} disabled={loggingOut}>
          {loggingOut ? <Spinner className="h-4 w-4" label="Signing out" /> : null}
          Log out
        </Button>
      </div>
    </AuthCard>
  );
}
