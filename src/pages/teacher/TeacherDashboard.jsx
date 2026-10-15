import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ClipboardList, Users } from 'lucide-react';
import { DashboardCard } from '../../components/DashboardCard';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { ErrorMessage } from '../../components/ErrorMessage';
import { Spinner } from '../../components/Spinner';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { fetchTeacherDashboard } from '../../services/academicService';
import { assignmentTitle, formatDateTime } from '../../utils/format';

export function TeacherDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useDocumentTitle('Dashboard');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchTeacherDashboard();
      setSummary(result.data);
    } catch (err) {
      setError(err.message || 'Could not load the dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Courses assigned to you, upcoming deadlines, and work waiting to be graded." />
      {loading ? <div className="panel flex min-h-40 items-center justify-center"><Spinner className="h-6 w-6 text-primary" label="Loading dashboard" /></div> : null}
      {!loading && error ? <ErrorMessage message={error} onRetry={load} /> : null}
      {!loading && !error && summary ? (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <DashboardCard label="Assigned courses" value={summary.assignedCourses} icon={BookOpen} />
            <DashboardCard label="Students" value={summary.totalStudents} icon={Users} />
            <DashboardCard label="Pending grading" value={summary.pendingGrading} icon={ClipboardList} />
          </section>
          <section className="grid gap-4 lg:grid-cols-2">
            <div className="panel overflow-hidden">
              <h2 className="border-b border-gray-200 px-5 py-4 text-base font-semibold">Upcoming deadlines</h2>
              {summary.upcomingDeadlines.length === 0 ? <EmptyState title="No upcoming deadlines" /> : (
                <ul className="max-h-72 divide-y divide-gray-200 overflow-y-auto overscroll-contain">
                  {summary.upcomingDeadlines.map((item) => {
                    const when = formatDateTime(item.dueDate);
                    return (
                      <li key={item.id} className="px-5 py-3 text-sm">
                        <p className="font-medium text-gray-900">{assignmentTitle(item)}</p>
                        <p className="text-gray-600">{item.courseTitle ? `${item.courseTitle} · ` : ''}{when.label}</p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="panel overflow-hidden">
              <h2 className="border-b border-gray-200 px-5 py-4 text-base font-semibold">Recent activity</h2>
              {summary.recentSubmissions.length === 0 ? <EmptyState title="No submissions yet" /> : (
                <ul className="scroll-panel divide-y divide-gray-200">
                  {summary.recentSubmissions.map((item) => (
                    <li key={item.id} className="px-5 py-3 text-sm">
                      <p className="font-medium text-gray-900">{item.studentName}</p>
                      <p className="text-gray-600">{item.assignmentTitle} · {item.status}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
          <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <h2 className="border-b border-gray-200 px-5 py-4 text-base font-semibold">Assigned courses</h2>
            {(summary.courses || []).length === 0 ? <EmptyState title="No assigned courses" /> : (
              <ul className="divide-y divide-gray-200">
                {summary.courses.map((course) => (
                  <li key={course.id} className="px-5 py-3 text-sm">
                    <Link className="font-medium text-gray-900 hover:text-primary" to={`/teacher/courses/${course.id}`}>{course.title}</Link>
                    <p className="text-gray-600">{course.courseCode}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
