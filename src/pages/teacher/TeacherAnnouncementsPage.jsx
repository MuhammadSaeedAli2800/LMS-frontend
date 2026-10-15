import { useCallback, useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { ErrorMessage } from '../../components/ErrorMessage';
import { FormField, inputClassName } from '../../components/FormField';
import { Spinner } from '../../components/Spinner';
import { useToast } from '../../context/ToastContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { createAnnouncement, deleteAnnouncement, fetchTeacherAdminAnnouncements, fetchTeacherAnnouncements, fetchTeacherCourses, updateAnnouncement } from '../../services/academicService';
import { formatDateTime } from '../../utils/format';

export function TeacherAnnouncementsPage() {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [items, setItems] = useState([]);
  const [notices, setNotices] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noticeLoading, setNoticeLoading] = useState(true);
  const [error, setError] = useState('');
  const [noticeError, setNoticeError] = useState('');
  const [busy, setBusy] = useState(false);
  useDocumentTitle('Announcements');

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchTeacherCourses();
      const list = result.data.courses || [];
      setCourses(list);
      setCourseId((current) => current || list[0]?.id || '');
    } catch (err) {
      setError(err.message || 'Could not load courses.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadItems = useCallback(async () => {
    if (!courseId) return;
    try {
      const result = await fetchTeacherAnnouncements(courseId);
      setItems(result.data.announcements || []);
    } catch (err) {
      toast.error(err.message || 'Could not load announcements.');
    }
  }, [courseId]);

  const loadNotices = useCallback(async () => {
    setNoticeLoading(true);
    setNoticeError('');
    try {
      const result = await fetchTeacherAdminAnnouncements();
      setNotices(result.data.announcements || []);
    } catch (err) {
      setNoticeError(err.message || 'Could not load administrator announcements.');
    } finally {
      setNoticeLoading(false);
    }
  }, []);

  useEffect(() => { loadCourses(); }, [loadCourses]);
  useEffect(() => { loadItems(); }, [loadItems]);
  useEffect(() => { loadNotices(); }, [loadNotices]);

  const course = courses.find((item) => item.id === courseId);
  const archived = course?.status === 'archived';

  async function onCreate(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setBusy(true);
    try {
      if (editing) {
        await updateAnnouncement(editing.id, { title: form.get('title'), message: form.get('message') });
        toast.success('Announcement updated.');
        setEditing(null);
      } else {
        await createAnnouncement(courseId, { title: form.get('title'), message: form.get('message') });
        toast.success('Announcement published.');
      }
      formElement.reset();
      await loadItems();
    } catch (err) {
      toast.error(err.message || 'Could not save the announcement.');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(item) {
    setBusy(true);
    try {
      await deleteAnnouncement(item.id);
      toast.success('Announcement removed.');
      await loadItems();
    } catch (err) {
      toast.error(err.message || 'Could not remove the announcement.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Announcements" description="Administrator notices appear here. You can also publish a note for students in one of your courses." />
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">From administrators</h2>
        {noticeLoading ? <div className="flex min-h-24 items-center justify-center"><Spinner className="h-6 w-6 text-primary" label="Loading administrator announcements" /></div> : null}
        {!noticeLoading && noticeError ? <ErrorMessage message={noticeError} onRetry={loadNotices} /> : null}
        {!noticeLoading && !noticeError && notices.length === 0 ? <div className="panel"><EmptyState title="No administrator announcements" /></div> : null}
        {!noticeLoading && !noticeError && notices.length > 0 ? (
          <ul className="scroll-panel space-y-3">
            {notices.map((item) => (
              <li key={item.id} className="panel p-5">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">{item.authorName || 'Administrator'} · {item.courseTitle || 'All students'} · {formatDateTime(item.publishedAt).label}</p>
                <h3 className="mt-1 text-lg font-semibold text-ink">{item.title}</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-muted">{item.message}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
      {loading ? <div className="flex min-h-40 items-center justify-center"><Spinner className="h-6 w-6 text-primary" label="Loading announcements" /></div> : null}
      {!loading && error ? <ErrorMessage message={error} onRetry={loadCourses} /> : null}
      {!loading && !error && courses.length === 0 ? <div className="panel"><EmptyState title="No assigned courses" /></div> : null}
      {!loading && !error && course ? (
        <section className="space-y-4">
          <FormField id="announcement-course" label="Course">
            <select id="announcement-course" className={inputClassName} value={courseId} onChange={(event) => { setCourseId(event.target.value); setEditing(null); }}>
              {courses.map((item) => <option key={item.id} value={item.id}>{item.title} · {item.courseCode}</option>)}
            </select>
          </FormField>
          {archived ? <p className="text-sm text-gray-600">This course is archived, so announcements cannot be changed.</p> : (
            <form key={editing?.id || 'new'} className="panel space-y-3 p-5" onSubmit={onCreate}>
              <FormField id="announcement-title" label="Title"><input id="announcement-title" name="title" className={inputClassName} required minLength={2} defaultValue={editing?.title || ''} /></FormField>
              <FormField id="announcement-message" label="Message"><textarea id="announcement-message" name="message" className={inputClassName} rows={4} required minLength={2} defaultValue={editing?.message || ''} /></FormField>
              <div className="flex gap-2">
                <Button type="submit" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save announcement' : 'Publish'}</Button>
                {editing ? <Button type="button" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button> : null}
              </div>
            </form>
          )}
          {items.length === 0 ? <EmptyState title="No announcements" /> : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.id} className="panel bg-slate-50 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="font-medium text-gray-900">{item.title}</p>
                    {archived ? null : (
                      <div className="flex gap-3 text-sm">
                        <button type="button" className="font-medium text-primary hover:underline" onClick={() => setEditing(item)}>Edit</button>
                        <button type="button" className="font-medium text-red-700 hover:underline" onClick={() => onDelete(item)}>Remove</button>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{item.message}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
