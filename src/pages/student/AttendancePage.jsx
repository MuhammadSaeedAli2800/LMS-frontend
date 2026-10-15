import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CourseStatus } from '../../components/CourseStatus';
import { EmptyState } from '../../components/EmptyState';
import { ErrorMessage } from '../../components/ErrorMessage';
import { ScheduleText } from '../../components/ScheduleText';
import { Spinner } from '../../components/Spinner';
import { PageHeader } from '../../components/PageHeader';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { fetchStudentAttendance } from '../../services/academicService';

function formatDay(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(date);
}

function AttendanceCard({ to, label, value, detail }) {
  return (
    <Link to={to} className="panel block p-4 transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
      <p className="text-sm font-medium text-ink-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">{value}</p>
      <p className="mt-1 text-sm text-ink-faint">{detail}</p>
      <p className="mt-3 text-sm font-medium text-primary">View details</p>
    </Link>
  );
}

export function AttendancePage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useDocumentTitle('Attendance');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const attendance = await fetchStudentAttendance();
      setCourses(attendance.data.courses || []);
    } catch (err) {
      setError(err.message || 'Could not load attendance.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" description="Each course shows class attendance. Open a card to see the marked days." />
      {loading ? <div className="flex min-h-40 items-center justify-center"><Spinner className="h-6 w-6 text-primary" label="Loading attendance" /></div> : null}
      {!loading && error ? <ErrorMessage message={error} onRetry={load} /> : null}
      {!loading && !error && courses.length === 0 ? <div className="panel"><EmptyState title="No courses yet" description="Your attendance appears after you are enrolled." /></div> : null}
      {!loading && !error ? courses.map((course) => (
        <section key={course.courseId} className="panel p-5">
          <h2 className="text-base font-semibold text-ink">{course.title}</h2>
          <p className="text-sm text-gray-500">{course.courseCode}</p>
          <ScheduleText course={course} empty="No class days or time set" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <AttendanceCard to={`/student/attendance/${course.courseId}`} label="Total classes" value={course.classes} detail="Class days with attendance" />
            <AttendanceCard to={`/student/attendance/${course.courseId}`} label="Present" value={course.present} detail="Days you were present" />
            <AttendanceCard to={`/student/attendance/${course.courseId}`} label="Absent" value={course.absent} detail="Days you were absent" />
            <AttendanceCard to={`/student/attendance/${course.courseId}`} label="Late" value={course.late} detail="Days you arrived late" />
            <AttendanceCard to={`/student/attendance/${course.courseId}`} label="Leave" value={course.leave} detail="Days marked as leave" />
          </div>
        </section>
      )) : null}
    </div>
  );
}

export function StudentAttendanceCoursePage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useDocumentTitle(course?.title || 'Attendance');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchStudentAttendance();
      setCourse((result.data.courses || []).find((item) => item.courseId === courseId) || null);
    } catch (err) {
      setError(err.message || 'Could not load attendance.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="flex min-h-40 items-center justify-center"><Spinner className="h-6 w-6 text-primary" label="Loading attendance" /></div>;
  }
  if (error) return <ErrorMessage message={error} onRetry={load} />;
  if (!course) {
    return (
      <div className="space-y-4">
        <PageHeader back={{ to: '/student/attendance', label: 'All attendance' }} title="Attendance" />
        <div className="panel"><EmptyState title="Course not found" description="This course is not on your attendance list." /></div>
      </div>
    );
  }

  const records = [...(course.records || [])].sort((left, right) => String(right.sessionDate).localeCompare(String(left.sessionDate)));
  const present = records.filter((record) => record.status === 'present').length;
  const absent = records.filter((record) => record.status === 'absent').length;
  const late = records.filter((record) => record.status === 'late').length;
  const leave = records.filter((record) => record.status === 'leave').length;

  return (
    <div className="space-y-6">
      <div>
        <PageHeader back={{ to: '/student/attendance', label: 'All attendance' }} title={course.title} description={course.courseCode} />
        <div className="mt-2"><ScheduleText course={course} empty="No class days or time set" /></div>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <article className="panel p-5"><h2 className="text-sm font-medium text-ink-muted">Total classes</h2><p className="mt-2 text-3xl font-semibold tracking-tight text-ink">{course.classes || 0}</p></article>
        <article className="panel p-5"><h2 className="text-sm font-medium text-success">Present</h2><p className="mt-2 text-3xl font-semibold tracking-tight text-ink">{present}</p></article>
        <article className="panel p-5"><h2 className="text-sm font-medium text-danger">Absent</h2><p className="mt-2 text-3xl font-semibold tracking-tight text-ink">{absent}</p></article>
        <article className="panel p-5"><h2 className="text-sm font-medium text-warning">Late</h2><p className="mt-2 text-3xl font-semibold tracking-tight text-ink">{late}</p></article>
        <article className="panel p-5"><h2 className="text-sm font-medium text-ink-muted">Leave</h2><p className="mt-2 text-3xl font-semibold tracking-tight text-ink">{leave}</p></article>
      </section>
      {records.length === 0 ? (
        <p className="panel px-5 py-4 text-sm text-gray-600">No attendance has been marked for this course.</p>
      ) : (
        <ul className="scroll-panel panel divide-y divide-line">
          {records.map((record) => (
            <li key={record.id} className="flex items-center gap-3 px-5 py-3 text-sm">
              <CourseStatus status={record.status} />
              <p className="font-medium text-gray-900">{formatDay(record.sessionDate)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
