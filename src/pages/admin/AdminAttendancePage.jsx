import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { CourseStatus } from '../../components/CourseStatus';
import { EmptyState } from '../../components/EmptyState';
import { ErrorMessage } from '../../components/ErrorMessage';
import { FormField, inputClassName } from '../../components/FormField';
import { Spinner } from '../../components/Spinner';
import { useToast } from '../../context/ToastContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { deleteAdminAttendance, fetchAdminAttendance, fetchAttendanceCards, listCourses, saveAdminAttendance } from '../../services/academicService';
import { PageHeader } from '../../components/PageHeader';
import { ScheduleText } from '../../components/ScheduleText';

function today() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function AdminAttendancePage() {
  const toast = useToast();
  const [audience, setAudience] = useState('student');
  const [date, setDate] = useState(today);
  const [courseId, setCourseId] = useState('');
  const [courses, setCourses] = useState([]);
  const [cards, setCards] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyKey, setBusyKey] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  useDocumentTitle('Attendance');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [attendanceResult, courseResult, cardResult] = await Promise.all([
        fetchAdminAttendance({ audience, date, courseId }),
        listCourses(),
        fetchAttendanceCards(audience),
      ]);
      setCards(cardResult.data.courses || []);
      setRecords(attendanceResult.data.records || []);
      setCourses(courseResult.data.courses || []);
    } catch (err) {
      setRecords([]);
      setError(err.message || 'Could not load attendance.');
    } finally {
      setLoading(false);
    }
  }, [audience, date, courseId]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(record, status) {
    if (!status || status === record.status) return;
    const key = `${record.personId}-${record.courseId}`;
    setBusyKey(key);
    try {
      const result = await saveAdminAttendance({
        audience,
        personId: record.personId,
        courseId: record.courseId,
        sessionDate: date,
        status,
      });
      setRecords((current) => current.map((item) => (
        item.personId === record.personId && item.courseId === record.courseId ? result.data.record : item
      )));
      toast.success('Attendance updated.');
    } catch (err) {
      toast.error(err.message || 'Could not update attendance.');
    } finally {
      setBusyKey('');
    }
  }

  async function removeRecord() {
    if (!pendingDelete?.id) return;
    const key = `${pendingDelete.personId}-${pendingDelete.courseId}`;
    setBusyKey(key);
    try {
      await deleteAdminAttendance(audience, pendingDelete.id);
      setRecords((current) => current.map((item) => (
        item.id === pendingDelete.id ? { ...item, id: null, status: '' } : item
      )));
      toast.success('Attendance deleted.');
      setPendingDelete(null);
    } catch (err) {
      toast.error(err.message || 'Could not delete attendance.');
    } finally {
      setBusyKey('');
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Attendance register" description="Choose who you are marking, then set the day and course. The register below is the list you can update.">
        <div className="flex rounded-lg bg-white p-1 ring-1 ring-line" role="group" aria-label="Who to mark">
          <button type="button" className={`rounded-md px-3 py-1.5 text-sm font-medium ${audience === 'student' ? 'bg-slate-900 text-white' : 'text-ink-muted'}`} onClick={() => setAudience('student')}>Students</button>
          <button type="button" className={`rounded-md px-3 py-1.5 text-sm font-medium ${audience === 'teacher' ? 'bg-slate-900 text-white' : 'text-ink-muted'}`} onClick={() => setAudience('teacher')}>Teachers</button>
        </div>
      </PageHeader>

      <section className="grid gap-3 rounded-xl border border-line bg-white p-4 shadow-card sm:grid-cols-2">
        <FormField id="attendance-date" label="Session date">
          <input id="attendance-date" className={inputClassName} type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
        </FormField>
        <FormField id="attendance-course" label="Course">
          <select id="attendance-course" className={inputClassName} value={courseId} onChange={(event) => setCourseId(event.target.value)}>
            <option value="">All courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>{course.title} ({course.courseCode})</option>
            ))}
          </select>
        </FormField>
      </section>

      {!loading && !error && cards.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {cards.map((course) => (
            <Link key={course.courseId} to={`/admin/attendance/${course.courseId}?audience=${audience}`} className="min-w-52 shrink-0 rounded-xl border border-line bg-white px-4 py-3 shadow-card hover:border-primary/40">
              <p className="truncate text-sm font-medium text-ink">{course.title}</p>
              <p className="text-xs text-ink-faint">{course.classes} classes · {course.present} present</p>
            </Link>
          ))}
        </div>
      ) : null}

      {loading ? <div className="panel flex min-h-40 items-center justify-center"><Spinner className="h-6 w-6 text-primary" label="Loading attendance" /></div> : null}
      {!loading && error ? <ErrorMessage message={error} onRetry={load} /> : null}
      {!loading && !error && records.length === 0 ? (
        <div className="panel">
          <EmptyState title="No one to show" description={audience === 'teacher' ? 'Assign a teacher to a course to mark attendance.' : 'Enroll students to mark attendance for this day.'} />
        </div>
      ) : null}
      {!loading && !error && records.length > 0 ? (
        <ul className="scroll-panel panel divide-y divide-line shadow-sm">
          {records.map((record) => {
            const key = `${record.personId}-${record.courseId}`;
            return (
              <li key={key} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{record.personName}{record.personCode ? ` (${record.personCode})` : ''}</p>
                  <p className="text-sm text-gray-600">{record.courseTitle} ({record.courseCode})</p>
                  <ScheduleText course={record} />
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  {record.status ? <CourseStatus status={record.status} /> : <span className="text-sm text-gray-500">Not marked</span>}
                  <select
                    className={inputClassName}
                    aria-label={`Attendance for ${record.personName}`}
                    value={record.status}
                    disabled={busyKey === key}
                    onChange={(event) => changeStatus(record, event.target.value)}
                  >
                    <option value="">Not marked</option>
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                    <option value="leave">Leave</option>
                    {record.status === 'late' ? <option value="late">Late</option> : null}
                  </select>
                  <Button type="button" variant="danger" disabled={!record.id || busyKey === key} onClick={() => setPendingDelete(record)}>Delete</Button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete attendance"
        message={pendingDelete ? `Delete ${pendingDelete.personName}'s attendance for ${pendingDelete.courseTitle} on ${date}?` : ''}
        confirmLabel="Delete"
        destructive
        loading={Boolean(busyKey)}
        onConfirm={removeRecord}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}
