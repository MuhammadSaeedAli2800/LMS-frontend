import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { CourseStatus } from '../../components/CourseStatus';
import { EmptyState } from '../../components/EmptyState';
import { ErrorMessage } from '../../components/ErrorMessage';
import { ScheduleText } from '../../components/ScheduleText';
import { Spinner } from '../../components/Spinner';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { fetchReports } from '../../services/academicService';

const TEACHER_ATTENDANCE = [
  { key: 'present', label: 'Present' },
  { key: 'absent', label: 'Absent' },
  { key: 'leave', label: 'Leave' },
];

export function ReportsPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useDocumentTitle('Reports');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchReports();
      setReport(result.data);
    } catch (err) {
      setError(err.message || 'Could not load reports.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <Spinner className="h-6 w-6 text-primary" label="Loading reports" />
      </div>
    );
  }
  if (error || !report) return <ErrorMessage message={error || 'Reports are unavailable.'} onRetry={load} />;

  const summary = report.summary || {};
  const courses = report.courses || [];
  const teachers = report.teachers || [];

  return (
    <div className="space-y-8">
      <PageHeader title="Reports" description="Compare courses by enrollment and submitted work. Open a row for the student-level detail." />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Summary to="/admin/reports/enrollments" label="Courses" value={summary.courses || 0} detail={`${summary.enrollments || 0} enrollments`} />
        <Summary to="/admin/reports/submissions" label="Submitted" value={summary.submitted || 0} detail={`${summary.notSubmitted || 0} not submitted`} />
        <Summary to="/admin/reports/late" label="Late submissions" value={summary.lateSubmissions || 0} detail="Turned in after the due time" />
        <Summary to="/admin/reports/attendance" label="Total present" value={summary.attendance?.present || 0} detail="Students marked present" />
      </section>

      <section className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
        <div className="border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold text-ink">Course comparison</h2>
          <p className="mt-1 text-sm text-ink-muted">The bar shows submitted work against work that is still missing.</p>
        </div>
        {courses.length === 0 ? <EmptyState title="No courses yet" description="Create a course to see its report." /> : (
          <div className="overflow-x-auto">
            <table className="min-w-[36rem] text-left text-sm">
              <thead className="bg-slate-50 text-ink-faint">
                <tr>
                  <th className="px-4 py-3 font-medium">Course</th>
                  <th className="px-4 py-3 font-medium">Students</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                  <th className="min-w-40 px-4 py-3 font-medium">Completion</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => {
                  const submitted = Number(course.submitted) || 0;
                  const missing = Number(course.notSubmitted) || 0;
                  const total = submitted + missing;
                  const width = total ? Math.round((submitted / total) * 100) : 0;
                  return (
                    <tr key={course.courseId} className="border-t border-line">
                      <td className="px-4 py-3">
                        <Link className="font-medium text-ink hover:text-primary" to={`/admin/reports/courses/${course.courseId}`}>{course.title}</Link>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs text-ink-faint">{course.courseCode}</span>
                          <CourseStatus status={course.status} />
                        </div>
                      </td>
                      <td className="px-4 py-3 tabular-nums">{course.students}</td>
                      <td className="px-4 py-3 tabular-nums">{submitted}<span className="text-ink-faint"> / {total}</span></td>
                      <td className="px-4 py-3">
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
                        </div>
                        <p className="mt-1 text-xs text-ink-faint">{width}% submitted · {course.lateSubmissions || 0} late</p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Teachers</h2>
          <p className="mt-1 text-sm text-gray-600">Each teacher is listed with the courses they teach and their own attendance on those courses.</p>
        </div>
        {teachers.length === 0 ? <div className="panel"><EmptyState title="No teachers yet" description="Add a teacher to see their report." /></div> : teachers.map((teacher) => (
          <Link key={teacher.id} to={`/admin/reports/teachers/${teacher.id}`} className={cardLinkClass}>
            <h3 className="text-base font-semibold text-gray-900">{teacher.name}</h3>
            <p className="mt-0.5 break-all text-sm text-gray-500">{teacher.email}</p>
            {teacher.teacherCode ? <p className="text-sm text-gray-500">{teacher.teacherCode}</p> : null}
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Courses" value={teacher.courseCount} />
              <Stat label="Students" value={teacher.students} note="Across the courses they teach" />
              {TEACHER_ATTENDANCE.map((item) => (
                <Stat key={item.key} label={item.label} value={teacher.attendance?.[item.key] || 0} note="Teacher attendance" />
              ))}
            </div>
            {teacher.courses.length === 0 ? (
              <p className="mt-4 text-sm text-gray-600">No courses assigned.</p>
            ) : (
              <ul className="mt-4 divide-y divide-gray-200 border-t border-gray-200">
                {teacher.courses.map((course) => (
                  <li key={course.courseId} className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{course.title} <span className="font-normal text-gray-500">({course.courseCode})</span></p>
                      <ScheduleText course={course} empty="No class days or time set" />
                      <p className="mt-1 text-sm text-gray-600">{course.students} {course.students === 1 ? 'student' : 'students'}</p>
                    </div>
                    <dl className="grid grid-cols-3 gap-3 text-sm">
                      {TEACHER_ATTENDANCE.map((item) => (
                        <div key={item.key}>
                          <dt className="text-gray-500">{item.label}</dt>
                          <dd className="text-lg font-semibold text-gray-900">{course.attendance?.[item.key] || 0}</dd>
                        </div>
                      ))}
                    </dl>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-sm font-medium text-primary">View details</p>
          </Link>
        ))}
      </section>
    </div>
  );
}

const cardLinkClass = 'block rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

function Summary({ to, label, value, detail }) {
  return (
    <Link to={to} className={cardLinkClass}>
      <h2 className="text-sm font-medium text-gray-600">{label}</h2>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{detail}</p>
      <p className="mt-3 text-sm font-medium text-primary">View details</p>
    </Link>
  );
}

function Stat({ label, value, note }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-3">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-ink">{value}</p>
      {note ? <p className="mt-1 text-xs text-gray-500">{note}</p> : null}
    </div>
  );
}
