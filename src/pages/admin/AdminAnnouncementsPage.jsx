import { useCallback, useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { ErrorMessage } from '../../components/ErrorMessage';
import { FormField, inputClassName } from '../../components/FormField';
import { PageHeader } from '../../components/PageHeader';
import { Spinner } from '../../components/Spinner';
import { useToast } from '../../context/ToastContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { createAdminAnnouncement, deleteAdminAnnouncement, listAdminAnnouncements } from '../../services/adminService';
import { listCourses } from '../../services/academicService';
import { formatDateTime } from '../../utils/format';

export function AdminAnnouncementsPage() {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useDocumentTitle('Announcements');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [courseResult, announcementResult] = await Promise.all([
        listCourses({}),
        listAdminAnnouncements(),
      ]);
      setCourses((courseResult.data.courses || []).filter((course) => course.status !== 'archived'));
      setItems(announcementResult.data.announcements || []);
    } catch (err) {
      setError(err.message || 'Could not load announcements.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function onCreate(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const audience = String(form.get('audience') || 'general');
    const courseId = audience.startsWith('course:') ? audience.slice('course:'.length) : '';
    setBusy(true);
    try {
      await createAdminAnnouncement({
        title: form.get('title'),
        message: form.get('message'),
        ...(courseId ? { courseId } : { audience }),
      });
      toast.success('Announcement published.');
      formElement.reset();
      await load();
    } catch (err) {
      toast.error(err.message || 'Could not publish the announcement.');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(item) {
    setBusy(true);
    try {
      await deleteAdminAnnouncement(item.id);
      toast.success('Announcement removed.');
      await load();
    } catch (err) {
      toast.error(err.message || 'Could not remove the announcement.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Announcements" description="Publish a note for everyone, for every student, for every teacher, or for one course." />
      {loading ? <div className="flex min-h-40 items-center justify-center"><Spinner className="h-6 w-6 text-primary" label="Loading announcements" /></div> : null}
      {!loading && error ? <ErrorMessage message={error} onRetry={load} /> : null}
      {!loading && !error ? (
        <>
          <form className="panel space-y-3 p-5" onSubmit={onCreate}>
            <FormField id="admin-announcement-course" label="Audience">
              <select id="admin-announcement-course" name="audience" className={inputClassName} defaultValue="general">
                <option value="general">General</option>
                <option value="students">All students</option>
                <option value="teachers">All teachers</option>
                {courses.map((course) => (
                  <option key={course.id} value={`course:${course.id}`}>{course.title} · {course.courseCode}</option>
                ))}
              </select>
            </FormField>
            <FormField id="admin-announcement-title" label="Title">
              <input id="admin-announcement-title" name="title" className={inputClassName} required minLength={2} maxLength={160} />
            </FormField>
            <FormField id="admin-announcement-message" label="Message">
              <textarea id="admin-announcement-message" name="message" className={inputClassName} rows={4} required minLength={2} maxLength={4000} />
            </FormField>
            <Button type="submit" disabled={busy}>{busy ? 'Publishing…' : 'Publish'}</Button>
          </form>
          {items.length === 0 ? <div className="panel"><EmptyState title="No announcements" /></div> : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id} className="panel p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">{item.authorName || 'Unknown'} · {item.courseTitle || 'All students'} · {formatDateTime(item.publishedAt).label}</p>
                      <h2 className="mt-1 text-lg font-semibold text-ink">{item.title}</h2>
                    </div>
                    <button type="button" className="text-sm font-medium text-red-700 hover:underline" onClick={() => onDelete(item)} disabled={busy}>Remove</button>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-muted">{item.message}</p>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </div>
  );
}
