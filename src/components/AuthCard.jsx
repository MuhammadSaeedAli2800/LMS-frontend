import { INSTITUTION_NAME } from '../constants';
import { Logo } from './Logo';

export function AuthCard({ title, subtitle, showInstitution = false, children }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <div className="panel w-full max-w-md p-6 sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo />
          {showInstitution ? <p className="mt-4 text-sm font-medium text-primary">{INSTITUTION_NAME}</p> : null}
          <h1 className={`text-2xl font-semibold tracking-tight text-ink ${showInstitution ? 'mt-1' : 'mt-4'}`}>{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-ink-muted">{subtitle}</p> : null}
        </div>
        {children}
      </div>
    </main>
  );
}
