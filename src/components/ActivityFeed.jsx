import { Link } from 'react-router-dom';
import { formatAction, formatDateTime } from '../utils/format';

const KINDS = {
  create: { label: 'Added', dot: 'bg-emerald-500' },
  delete: { label: 'Removed', dot: 'bg-red-500' },
  status: { label: 'Status', dot: 'bg-amber-500' },
  course: { label: 'Course', dot: 'bg-primary' },
  work: { label: 'Work', dot: 'bg-violet-500' },
  other: { label: 'Update', dot: 'bg-slate-400' },
};

export function activityKind(action) {
  const value = String(action || '').toUpperCase();
  if (value.includes('DELETED') || value.includes('UNENROLLED')) return 'delete';
  if (value.includes('STATUS') || value.includes('PASSWORD')) return 'status';
  if (value.includes('GRADED') || value.includes('ASSIGNMENT') || value.includes('SUBMISSION')) return 'work';
  if (value.includes('COURSE') || value.includes('MATERIAL') || value.includes('ANNOUNCEMENT')) return 'course';
  if (value.includes('CREATED') || value.includes('ENROLLED')) return 'create';
  return 'other';
}

export function ActivityFeed({ items, empty, href }) {
  if (!items.length) {
    return <p className="px-5 py-8 text-sm text-ink-muted">{empty}</p>;
  }
  return (
    <div>
      <ol className="scroll-panel divide-y divide-line">
        {items.map((item, index) => {
          const kind = KINDS[activityKind(item.action)];
          const when = formatDateTime(item.createdAt);
          const actor = item.actorName || item.actor?.name || 'Unknown';
          return (
            <li key={item.id || `${item.action}-${index}`} className="flex gap-3 px-5 py-3">
              <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${kind.dot}`} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-5 text-ink">{item.summary || formatAction(item.action)}</p>
                <p className="mt-0.5 text-xs text-ink-faint">
                  <span className="font-medium text-ink-muted">{kind.label}</span>
                  {' · '}
                  {actor}
                </p>
              </div>
              <time className="shrink-0 text-xs text-ink-faint" dateTime={when.iso}>{when.label}</time>
            </li>
          );
        })}
      </ol>
      {href ? (
        <div className="border-t border-line px-5 py-3">
          <Link className="text-sm font-medium text-primary hover:underline" to={href}>View all activity</Link>
        </div>
      ) : null}
    </div>
  );
}
