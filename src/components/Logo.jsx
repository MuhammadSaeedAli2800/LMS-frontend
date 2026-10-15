import { GraduationCap } from 'lucide-react';

export function Logo({ className = 'h-12 w-12' }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-primary text-white ${className}`}
      aria-hidden="true"
    >
      <GraduationCap className="h-6 w-6" />
    </span>
  );
}
