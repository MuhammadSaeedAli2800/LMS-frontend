import { useState } from 'react';
import { hasErrors, mapFieldErrors, validateCredentials } from '../utils/validation';
import { Button } from './Button';
import { FormField, fieldAria, inputClassName } from './FormField';
import { PasswordField } from './PasswordField';
import { Spinner } from './Spinner';

export function SignInForm({ onSubmit, roleChoices = false }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittingAs, setSubmittingAs] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = validateCredentials({ email, password });
    setErrors(nextErrors);
    setFormError('');
    if (hasErrors(nextErrors)) return;

    const loginAs = roleChoices ? event.nativeEvent.submitter?.value : undefined;
    setSubmitting(true);
    setSubmittingAs(loginAs || '');
    try {
      await onSubmit({
        email: email.trim(),
        password,
        rememberMe,
        ...(loginAs ? { loginAs } : {}),
      });
    } catch (error) {
      const fieldErrors = mapFieldErrors(error);
      if (hasErrors(fieldErrors)) setErrors((current) => ({ ...current, ...fieldErrors }));
      const message = error.status === 401 || error.message === 'Invalid email or password.'
        ? 'The email or password is incorrect.'
        : (error.message || 'Sign in failed.');
      setFormError(message);
    } finally {
      setSubmitting(false);
      setSubmittingAs('');
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      {formError ? (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {formError}
        </div>
      ) : null}
      <FormField id="email" label="Email" error={errors.email}>
        <input
          {...fieldAria('email', errors.email)}
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={inputClassName}
          disabled={submitting}
        />
      </FormField>
      <PasswordField
        id="password"
        label="Password"
        name="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={errors.password}
        disabled={submitting}
      />
      <div className="flex items-center gap-2">
        <input
          id="remember-me"
          name="rememberMe"
          type="checkbox"
          checked={rememberMe}
          onChange={(event) => setRememberMe(event.target.checked)}
          disabled={submitting}
          className="h-4 w-4 rounded border-gray-300 accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
        <label htmlFor="remember-me" className="text-sm text-gray-700">
          Remember me
        </label>
      </div>
      {roleChoices ? (
        <div className="grid gap-2">
          <Button type="submit" name="loginAs" value="student" className="w-full" disabled={submitting}>
            {submittingAs === 'student' ? <Spinner className="h-4 w-4 text-white" label="Signing in" /> : null}
            Login as Student
          </Button>
          <Button type="submit" name="loginAs" value="teacher" variant="secondary" className="w-full" disabled={submitting}>
            {submittingAs === 'teacher' ? <Spinner className="h-4 w-4" label="Signing in" /> : null}
            Login as Teacher
          </Button>
        </div>
      ) : (
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? <Spinner className="h-4 w-4 text-white" label="Signing in" /> : null}
          Sign in
        </Button>
      )}
    </form>
  );
}
