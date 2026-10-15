import { Loader2 } from 'lucide-react';

export function Spinner({ className = 'h-5 w-5', label = 'Loading' }) {
  return (
    <span role="status" className="inline-flex items-center justify-center">
      <Loader2 className={`animate-spin ${className}`} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function FullPageSpinner({ label = 'Loading' }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <Spinner className="h-8 w-8 text-primary" label={label} />
    </div>
  );
}
