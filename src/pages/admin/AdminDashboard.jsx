import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ClipboardList, RefreshCw, Users, UserRound } from 'lucide-react';
import { ActivityFeed } from '../../components/ActivityFeed';
import { Button } from '../../components/Button';
import { CourseStatus } from '../../components/CourseStatus';
import { DashboardCard } from '../../components/DashboardCard';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageHeader } from '../../components/PageHeader';
import { Spinner } from '../../components/Spinner';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { fetchDashboard } from '../../services/adminService';

const CARDS = [
  { key: 'totalStudents', label: 'Total students', icon: Users, to: '/admin/dashboard/students' },
  { key: 'totalTeachers', label: 'Total teachers', icon: UserRound, to: '/admin/dashboard/teachers' },
  { key: 'totalCourses', label: 'Total courses', icon: BookOpen, to: '/admin/dashboard/courses' },
  { key: 'activeCourses', label: 'Published courses', icon: BookOpen, to: '/admin/dashboard/published' },
  { key: 'totalAssignments', label: 'Assignments', icon: ClipboardList, to: '/admin/dashboard/assignments' },
];

function todayLabel() {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'full' }).format(new Date());
}

export function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  useDocumentTitle('Dashboard');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchDashboard();
      setSummary(result.data || {});
    } catch (err) {
      setSummary(null);
      setError(err.message || 'Could not load the dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  const activities = Array.isArray(summary?.recentActivities) ? summary.recentActivities : [];
  const courses = Array.isArray(summary?.courseBreakdown) ? summary.courseBreakdown : [];
  const notes = {
    totalStudents: Number(summary?.studentsNotEnrolled) > 0 ? `${summary.studentsNotEnrolled} not enrolled in a course` : 'All listed students have a course',
    totalTeachers: 'Accounts that can be assigned to a course',
    totalCourses: 'Draft, published, and archived',
    activeCourses: 'Visible to enrolled students',
    totalAssignments: 'Published and closed assignments',
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="A snapshot of accounts, courses, and what changed recently." meta={todayLabel()}>
        <Button type="button" variant="secondary" onClick={() => setReloadKey((value) => value + 1)} disabled={loading}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Refresh
        </Button>
      </PageHeader>

      {loading ? (
        <div className="panel flex min-h-40 items-center justify-center">
          <Spinner className="h-6 w-6 text-primary" label="Loading dashboard" />
        </div>
      ) : null}
      {!loading && error ? <ErrorMessage message={error} onRetry={() => setReloadKey((value) => value + 1)} /> : null}

      {!loading && !error && summary ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {CARDS.map((card) => (
              <DashboardCard
                key={card.key}
                label={card.label}
                value={Number.isFinite(Number(summary[card.key])) ? summary[card.key] : 0}
                note={notes[card.key]}
                icon={card.icon}
                to={card.to}
              />
            ))}
          </section>
          <section className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
            <div className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
              <div className="border-b border-line px-5 py-4">
                <h2 className="text-base font-semibold text-ink">Recent activity</h2>
                <p className="mt-1 text-sm text-ink-muted">Account, course, and grading events, newest first.</p>
              </div>
              <ActivityFeed items={activities.slice(0, 8)} empty="Actions taken in the portal will be listed here." href="/admin/activity" />
            </div>
            <div className="overflow-hidden rounded-xl border border-line bg-white shadow-card">
              <div className="border-b border-line px-5 py-4">
                <h2 className="text-base font-semibold text-ink">Courses</h2>
                <p className="mt-1 text-sm text-ink-muted">Enrollment at a glance.</p>
              </div>
              {courses.length === 0 ? <p className="px-5 py-8 text-sm text-ink-muted">No courses yet.</p> : (
                <ul className="divide-y divide-line">
                  {courses.slice(0, 6).map((course) => (
                    <li key={course.id}>
                      <Link className="block px-5 py-3 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary" to={`/admin/courses/${course.id}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-ink">{course.title}</p>
                            <p className="text-xs text-ink-faint">{course.courseCode} · {course.studentCount} students</p>
                          </div>
                          <CourseStatus status={course.status} />
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
