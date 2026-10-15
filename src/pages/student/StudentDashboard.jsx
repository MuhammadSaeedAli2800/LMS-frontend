import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../../components/EmptyState';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageHeader } from '../../components/PageHeader';
import { Spinner } from '../../components/Spinner';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { fetchStudentDashboard } from '../../services/academicService';
import { formatDateTime } from '../../utils/format';

export function StudentDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useDocumentTitle('Dashboard');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchStudentDashboard();
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

  const upcomingAssignments = (summary?.upcomingAssignments || []).filter((item) => new Date(item.dueDate).getTime() > Date.now());

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="What is due next, what was graded, and how your attendance stands." />
      {loading ? <div className="panel flex min-h-40 items-center justify-center"><Spinner className="h-6 w-6 text-primary" label="Loading dashboard" /></div> : null}
      {!loading && error ? <ErrorMessage message={error} onRetry={load} /> : null}
      {!loading && !error && summary ? (
        <>
          <section className="grid gap-4 lg:grid-cols-2">
            <div className="panel overflow-hidden">
              <h2 className="border-b border-line px-5 py-4 text-base font-semibold text-ink">Upcoming assignments</h2>
              {upcomingAssignments.length === 0 ? <EmptyState title="Nothing due soon" /> : (
                <ul className="max-h-72 divide-y divide-gray-200 overflow-y-auto overscroll-contain">
                  {upcomingAssignments.map((item) => {
                    const when = formatDateTime(item.dueDate);
                    return <li key={item.id} className="px-5 py-3 text-sm"><p className="font-medium">{item.title}</p><p className="text-gray-600">{item.courseTitle} · {when.label}</p></li>;
                  })}
                </ul>
              )}
            </div>
            <div className="panel overflow-hidden">
              <h2 className="border-b border-line px-5 py-4 text-base font-semibold text-ink">Recent grades</h2>
              {summary.recentGrades.length === 0 ? <EmptyState title="No grades yet" /> : (
                <ul className="scroll-panel divide-y divide-gray-200">
                  {summary.recentGrades.map((item) => (
                    <li key={item.id} className="px-5 py-3 text-sm"><p className="font-medium">{item.title}</p><p className="text-gray-600">{item.marks} / {item.maxMarks}</p></li>
                  ))}
                </ul>
              )}
            </div>
          </section>
          <p className="rounded-xl bg-white px-4 py-3 text-sm text-ink-muted ring-1 ring-line">Attendance this term: {summary.attendance.present} present, {summary.attendance.late} late, {summary.attendance.leave || 0} leave, {summary.attendance.absent} absent. <Link className="font-medium text-primary hover:underline" to="/student/courses">View courses</Link></p>
        </>
      ) : null}
    </div>
  );
}
