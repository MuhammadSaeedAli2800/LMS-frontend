import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CourseStatus } from '../../components/CourseStatus';
import { EmptyState } from '../../components/EmptyState';
import { ErrorMessage } from '../../components/ErrorMessage';
import { Spinner } from '../../components/Spinner';
import { PageHeader } from '../../components/PageHeader';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { fetchTeacherCourses } from '../../services/academicService';
import { ScheduleText } from '../../components/ScheduleText';

export function TeacherCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useDocumentTitle('Courses');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchTeacherCourses();
      setCourses(result.data.courses || []);
    } catch (err) {
      setError(err.message || 'Could not load courses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader title="My courses" description="Open a course to publish assignments, grade work, view attendance, and post materials." />
      {loading ? <div className="panel flex min-h-40 items-center justify-center"><Spinner className="h-6 w-6 text-primary" label="Loading courses" /></div> : null}
      {!loading && error ? <ErrorMessage message={error} onRetry={load} /> : null}
      {!loading && !error && courses.length === 0 ? (
        <div className="panel"><EmptyState title="No assigned courses" description="An administrator assigns courses to you." /></div>
      ) : null}
      {!loading && !error && courses.length > 0 ? (
        <ul className="scroll-panel grid gap-4 sm:grid-cols-2">
          {courses.map((course) => (
            <li key={course.id}>
              <Link to={`/teacher/courses/${course.id}`} className="panel block p-5 transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">{course.title}</h2>
                    <p className="text-sm text-gray-600">{course.courseCode} · {course.academicTerm}</p>
                    <ScheduleText course={course} />
                  </div>
                  <CourseStatus status={course.status} />
                </div>
                <p className="mt-3 text-sm text-gray-600">{course.enrolledCount} enrolled students</p>
                {(course.students || []).length > 0 ? <p className="mt-1 text-sm text-gray-700">{course.students.map((student) => student.name).join(', ')}</p> : null}
                <p className="mt-3 text-sm font-medium text-primary">Manage course</p>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
