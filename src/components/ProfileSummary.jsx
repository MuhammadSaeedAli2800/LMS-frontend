import { displayValue } from '../utils/format';

export function ProfileSummary({ rows }) {
  return (
    <dl className="panel grid gap-px overflow-hidden sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label} className="bg-white p-4">
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">{row.label}</dt>
          <dd className="mt-1 text-sm font-medium text-ink">{row.value ?? displayValue(row.text)}</dd>
        </div>
      ))}
    </dl>
  );
}
