import { Link } from 'react-router-dom';

export function PageHeader({ title, description, meta, back, children }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back ? (
          <Link className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" to={back.to}>
            {back.label}
          </Link>
        ) : null}
        <h1 className={`text-2xl font-semibold tracking-tight text-ink ${back ? 'mt-2' : ''}`}>{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-muted">{description}</p> : null}
        {meta ? <p className="mt-2 text-xs font-medium uppercase tracking-wide text-ink-faint">{meta}</p> : null}
      </div>
      {children ? <div className="flex shrink-0 flex-wrap items-center gap-2">{children}</div> : null}
    </div>
  );
}
