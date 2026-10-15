import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityFeed, activityKind } from '../../components/ActivityFeed';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageHeader } from '../../components/PageHeader';
import { Spinner } from '../../components/Spinner';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { fetchAuditLogs } from '../../services/academicService';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'create', label: 'Added' },
  { id: 'delete', label: 'Removed' },
  { id: 'status', label: 'Status' },
  { id: 'course', label: 'Courses' },
  { id: 'work', label: 'Work' },
];

export function ActivityPage() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useDocumentTitle('Activity');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchAuditLogs();
      setLogs(result.data.logs || []);
    } catch (err) {
      setError(err.message || 'Could not load activity.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return logs.filter((log) => {
      if (filter !== 'all' && activityKind(log.action) !== filter) return false;
      if (!needle) return true;
      const text = `${log.summary || ''} ${log.actorName || ''} ${log.action || ''}`.toLowerCase();
      return text.includes(needle);
    });
  }, [logs, filter, query]);

  return (
    <div className="space-y-5">
      <PageHeader title="Activity" description="A chronological record of account, course, and grading actions." />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Activity type">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${filter === item.id ? 'bg-slate-900 text-white' : 'bg-white text-ink-muted ring-1 ring-line hover:text-ink'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <label className="sr-only" htmlFor="activity-search">Search activity</label>
        <input id="activity-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search activity" className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm sm:max-w-xs" />
      </div>
      {loading ? <div className="panel flex min-h-40 items-center justify-center"><Spinner className="h-6 w-6 text-primary" label="Loading activity" /></div> : null}
      {!loading && error ? <ErrorMessage message={error} onRetry={load} /> : null}
      {!loading && !error ? (
        <section className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
          <ActivityFeed items={visible.map((log) => ({ ...log, actorName: log.actorName }))} empty={logs.length === 0 ? 'Creating accounts, courses, and grades will appear here.' : 'Nothing matches this filter.'} />
        </section>
      ) : null}
    </div>
  );
}
