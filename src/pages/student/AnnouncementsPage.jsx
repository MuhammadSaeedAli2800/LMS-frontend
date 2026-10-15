import { useCallback, useEffect, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { ErrorMessage } from '../../components/ErrorMessage';
import { Spinner } from '../../components/Spinner';
import { PageHeader } from '../../components/PageHeader';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { fetchStudentAnnouncements } from '../../services/academicService';
import { formatDateTime } from '../../utils/format';

export function AnnouncementsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useDocumentTitle('Announcements');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchStudentAnnouncements();
      setItems(result.data.announcements || []);
    } catch (err) {
      setError(err.message || 'Could not load announcements.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader title="Announcements" description="Messages from your teachers and administrators, newest first." />
      {loading ? <div className="flex min-h-40 items-center justify-center"><Spinner className="h-6 w-6 text-primary" label="Loading announcements" /></div> : null}
      {!loading && error ? <ErrorMessage message={error} onRetry={load} /> : null}
      {!loading && !error && items.length === 0 ? <div className="panel"><EmptyState title="No announcements" /></div> : null}
      {!loading && !error && items.length > 0 ? (
        <ul className="scroll-panel space-y-3">
          {items.map((item) => (
            <li key={item.id} className="panel p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">{item.authorName || 'Unknown'} · {item.courseTitle || 'All students'} · {formatDateTime(item.publishedAt).label}</p>
              <h2 className="mt-1 text-lg font-semibold text-ink">{item.title}</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-muted">{item.message}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
