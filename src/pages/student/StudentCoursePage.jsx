import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CourseStatus } from '../../components/CourseStatus';
import { ErrorMessage } from '../../components/ErrorMessage';
import { Spinner } from '../../components/Spinner';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { fetchStudentCourse } from '../../services/academicService';
import { PageHeader } from '../../components/PageHeader';
import { ScheduleText } from '../../components/ScheduleText';
import { assignmentTitle, formatDateTime, lateSubmissionLabel } from '../../utils/format';

export function StudentCoursePage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useDocumentTitle(course?.title || 'Course');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchStudentCourse(courseId);
      setCourse(result.data.course);
    } catch (err) {
      setError(err.message || 'Could not load this course.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex min-h-40 items-center justify-center"><Spinner className="h-6 w-6 text-primary" label="Loading course" /></div>;
  if (error || !course) return <ErrorMessage message={error || 'Course not found.'} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div>
        <PageHeader back={{ to: '/student/courses', label: 'My courses' }} title={course.title} description={`${course.courseCode} · ${course.academicTerm}`} />
        <div className="mt-2"><ScheduleText course={course} /></div>
        {course.description ? <p className="mt-3 text-sm text-ink-muted">{course.description}</p> : null}
      </div>
      <section className="panel p-5">
        <h2 className="font-semibold text-ink">Materials</h2>
        <ul className="scroll-panel mt-3 space-y-2 text-sm">
          {course.materials.length === 0 ? <li className="text-gray-600">No materials yet.</li> : course.materials.map((item) => (
            <li key={item.id}>
              <span className="font-medium">{item.title}</span>
              {item.externalUrl ? <a className="ml-2 text-primary hover:underline" href={item.externalUrl} target="_blank" rel="noreferrer">Open</a> : null}
              {item.downloadPath ? <a className="ml-2 text-primary hover:underline" href={item.downloadPath}>Download</a> : null}
            </li>
          ))}
        </ul>
      </section>
      <section className="panel border-l-4 border-l-primary p-5">
        <h2 className="font-semibold text-ink">Assignments</h2>
        <ul className="scroll-panel mt-3 space-y-3 text-sm">
          {course.assignments.length === 0 ? <li className="text-gray-600">No assignments yet.</li> : course.assignments.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">{assignmentTitle(item)}</p>
                <p className="text-gray-600">Due {formatDateTime(item.dueDate).label}</p>
                <p className="text-gray-600">{lateSubmissionLabel(item)}</p>
              </div>
              <CourseStatus status={item.submissionStatus} />
            </li>
          ))}
        </ul>
        <Link className="mt-4 inline-flex text-sm font-medium text-primary hover:underline" to="/student/assignments">Submit work</Link>
      </section>
      <section className="panel bg-slate-50 p-5">
        <h2 className="font-semibold text-ink">Announcements</h2>
        <ul className="scroll-panel mt-3 space-y-3 text-sm">
          {course.announcements.length === 0 ? <li className="text-gray-600">No announcements yet.</li> : course.announcements.map((item) => (
            <li key={item.id}>
              <p className="font-medium">{item.title}</p>
              <p className="text-gray-500">{item.authorName || 'Unknown'}</p>
              <p className="whitespace-pre-wrap text-gray-700">{item.message}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
