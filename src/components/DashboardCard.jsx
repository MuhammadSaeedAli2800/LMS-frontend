import { Link } from 'react-router-dom';

export function DashboardCard({ label, value, note, icon: Icon, to }) {
  const className = 'flex h-full flex-col rounded-xl border border-line bg-white p-4 text-left shadow-card';
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-medium text-ink-muted">{label}</h2>
        {Icon ? <Icon className="h-4 w-4 text-ink-faint" aria-hidden="true" /> : null}
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-ink">{value}</p>
      {note ? <p className="mt-2 text-xs leading-5 text-ink-faint">{note}</p> : null}
      {to ? <p className="mt-auto pt-3 text-xs font-medium text-primary">Open</p> : null}
    </>
  );
  if (!to) return <article className={className}>{body}</article>;
  return (
    <Link to={to} className={`${className} transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`}>
      {body}
    </Link>
  );
}
