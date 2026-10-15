import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CourseStatus } from '../../components/CourseStatus';
import { EmptyState } from '../../components/EmptyState';
import { ErrorMessage } from '../../components/ErrorMessage';
import { Spinner } from '../../components/Spinner';
import { PageHeader } from '../../components/PageHeader';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { fetchStudentCourses } from '../../services/academicService';
import { ScheduleText } from '../../components/ScheduleText';

export function StudentCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useDocumentTitle('Courses');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchStudentCourses();
      setCourses(result.data.courses || []);
    } catch (err) {
      setError(err.message || 'Could not load courses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader title="My courses" description="Open a course to read materials, assignments, and announcements." />
      {loading ? <div className="panel flex min-h-40 items-center justify-center"><Spinner className="h-6 w-6 text-primary" label="Loading courses" /></div> : null}
      {!loading && error ? <ErrorMessage message={error} onRetry={load} /> : null}
      {!loading && !error && courses.length === 0 ? <div className="panel"><EmptyState title="No courses yet" description="Your school enrolls you. Draft courses stay hidden." /></div> : null}
      {!loading && !error && courses.length > 0 ? (
        <ul className="scroll-panel grid gap-4 sm:grid-cols-2">
          {courses.map((course) => (
            <li key={course.id} className="panel p-5">
              <div className="flex items-start justify-between gap-3">
                <Link className="text-base font-semibold text-gray-900 hover:text-primary" to={`/student/courses/${course.id}`}>{course.title}</Link>
                <CourseStatus status={course.status} />
              </div>
              <p className="mt-2 text-sm text-gray-600">{course.courseCode} · {course.academicTerm}</p>
              <ScheduleText course={course} />
              <p className="mt-1 text-sm text-gray-600">{(course.teachers || []).map((teacher) => teacher.name).join(', ') || 'Teacher to be announced'}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
