import { useCallback, useEffect, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageHeader } from '../../components/PageHeader';
import { ScheduleText } from '../../components/ScheduleText';
import { Spinner } from '../../components/Spinner';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { fetchStudentMaterials } from '../../services/academicService';

export function MaterialsPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useDocumentTitle('Learning materials');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchStudentMaterials();
      setCourses(result.data.courses || []);
    } catch (err) {
      setError(err.message || 'Could not load learning materials.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader title="Learning materials" description="Files and links from the courses you are enrolled in." />
      {loading ? <div className="flex min-h-40 items-center justify-center"><Spinner className="h-6 w-6 text-primary" label="Loading learning materials" /></div> : null}
      {!loading && error ? <ErrorMessage message={error} onRetry={load} /> : null}
      {!loading && !error && courses.length === 0 ? <div className="panel"><EmptyState title="No courses yet" description="Learning materials appear after you are enrolled in a course." /></div> : null}
      {!loading && !error ? courses.map((course) => (
        <section key={course.courseId} className="panel p-5">
          <h2 className="text-base font-semibold text-ink">{course.title}</h2>
          <p className="text-sm text-gray-500">{course.courseCode}</p>
          <ScheduleText course={course} empty="No class days or time set" />
          {course.materials.length === 0 ? <p className="mt-4 text-sm text-ink-muted">No materials yet.</p> : (
            <ul className="mt-4 divide-y divide-line">
              {course.materials.map((item) => (
                <li key={item.id} className="py-3 text-sm">
                  <p className="font-medium text-ink">{item.title}</p>
                  {item.description ? <p className="mt-1 whitespace-pre-wrap text-ink-muted">{item.description}</p> : null}
                  <p className="mt-2 flex flex-wrap gap-3">
                    {item.externalUrl ? <a className="font-medium text-primary hover:underline" href={item.externalUrl} target="_blank" rel="noreferrer">Open link</a> : null}
                    {item.downloadPath ? <a className="font-medium text-primary hover:underline" href={item.downloadPath}>{item.originalName ? `Download ${item.originalName}` : 'Download'}</a> : null}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )) : null}
    </div>
  );
}
