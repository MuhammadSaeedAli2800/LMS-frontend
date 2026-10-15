import { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CourseStatus } from '../../components/CourseStatus';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageHeader } from '../../components/PageHeader';
import { ScheduleText } from '../../components/ScheduleText';
import { Spinner } from '../../components/Spinner';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { fetchAttendanceCourse } from '../../services/academicService';

function formatDay(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(date);
}

function CountCard({ label, value }) {
  return (
    <article className="min-w-36 shrink-0 panel px-4 py-3">
      <h2 className="text-xs font-medium uppercase tracking-wide text-ink-faint">{label}</h2>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-ink">{value}</p>
    </article>
  );
}

export function AttendanceCoursePage() {
  const { courseId } = useParams();
  const [searchParams] = useSearchParams();
  const audience = searchParams.get('audience') === 'teacher' ? 'teacher' : 'student';
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useDocumentTitle(detail?.course?.title || 'Attendance');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchAttendanceCourse(courseId, audience);
      setDetail(result.data);
    } catch (err) {
      setError(err.message || 'Could not load attendance.');
    } finally {
      setLoading(false);
    }
  }, [audience, courseId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <div className="flex min-h-40 items-center justify-center"><Spinner className="h-6 w-6 text-primary" label="Loading attendance" /></div>;
  }
  if (error || !detail?.course) return <ErrorMessage message={error || 'Attendance not found.'} onRetry={load} />;

  const course = detail.course;
  const records = [...(detail.records || [])].sort((left, right) => String(right.sessionDate).localeCompare(String(left.sessionDate)) || left.personName.localeCompare(right.personName));
  const present = records.filter((record) => record.status === 'present').length;
  const absent = records.filter((record) => record.status === 'absent').length;
  const leave = records.filter((record) => record.status === 'leave').length;

  return (
    <div className="space-y-6">
      <div>
        <PageHeader back={{ to: '/admin/attendance', label: 'All attendance' }} title={course.title} description={`${course.courseCode} · ${audience === 'teacher' ? 'Teachers' : 'Students'}`} />
        <div className="mt-2"><ScheduleText course={course} empty="No class days or time set" /></div>
      </div>
      <section className="flex gap-3 overflow-x-auto pb-1">
        <CountCard label="Total classes" value={course.classes || 0} />
        <CountCard label="Present" value={present} />
        <CountCard label="Absent" value={absent} />
        <CountCard label="Leave" value={leave} />
      </section>
      {records.length === 0 ? (
        <p className="panel px-5 py-4 text-sm text-gray-600">No attendance has been marked for this course.</p>
      ) : (
        <ul className="scroll-panel panel divide-y divide-line">
          {records.map((record) => (
            <li key={record.id} className="flex items-center gap-3 px-5 py-3 text-sm">
              <CourseStatus status={record.status} />
              <div className="min-w-0">
                <p className="font-medium text-gray-900">{formatDay(record.sessionDate)}</p>
                <p className="text-gray-600">{record.personName}{record.personCode ? ` (${record.personCode})` : ''}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
