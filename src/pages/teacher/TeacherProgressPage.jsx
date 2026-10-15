import { useCallback, useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { PageHeader } from '../../components/PageHeader';
import { EmptyState } from '../../components/EmptyState';
import { ErrorMessage } from '../../components/ErrorMessage';
import { FormField, inputClassName } from '../../components/FormField';
import { ScheduleText } from '../../components/ScheduleText';
import { Spinner } from '../../components/Spinner';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { fetchTeacherProgress } from '../../services/academicService';
import { downloadCsv } from '../../utils/csv';

export function TeacherProgressPage() {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useDocumentTitle('Student progress');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchTeacherProgress();
      setCourses(result.data.courses || []);
    } catch (err) {
      setError(err.message || 'Could not load student progress.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visibleCourses = courses.filter((course) => courseId === 'all' || course.id === courseId);
  const needle = query.trim().toLowerCase();

  function onExport() {
    const rows = [['Course', 'Student', 'Student ID', 'Assigned', 'Submitted', 'Missing', 'Released grades', 'Marks', 'Possible marks', 'Average percent', 'Present', 'Absent', 'Late']];
    visibleCourses.forEach((course) => {
      course.students.filter((student) => !needle || student.name.toLowerCase().includes(needle) || String(student.studentId).toLowerCase().includes(needle)).forEach((student) => {
        rows.push([course.title, student.name, student.studentId, student.assigned, student.submitted, student.missing, student.graded, student.marks, student.possible, student.average ?? '', student.attendance.present, student.attendance.absent, student.attendance.late]);
      });
    });
    downloadCsv('student-progress.csv', rows);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Student progress" description="The average is released marks out of every published assignment and quiz. Missing or ungraded work counts as zero.">
        <Button type="button" variant="secondary" onClick={onExport} disabled={courses.length === 0}>Export grades</Button>
      </PageHeader>
      {loading ? <div className="flex min-h-40 items-center justify-center"><Spinner className="h-6 w-6 text-primary" label="Loading progress" /></div> : null}
      {!loading && error ? <ErrorMessage message={error} onRetry={load} /> : null}
      {!loading && !error && courses.length === 0 ? <div className="panel"><EmptyState title="No assigned courses" /></div> : null}
      {!loading && !error && courses.length > 0 ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField id="progress-course" label="Course">
              <select id="progress-course" className={inputClassName} value={courseId} onChange={(event) => setCourseId(event.target.value)}>
                <option value="all">All assigned courses</option>
                {courses.map((course) => <option key={course.id} value={course.id}>{course.title} · {course.courseCode}</option>)}
              </select>
            </FormField>
            <FormField id="progress-student" label="Student">
              <input id="progress-student" className={inputClassName} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter by name or ID" />
            </FormField>
          </div>
          {visibleCourses.map((course) => {
            const students = course.students.filter((student) => !needle || student.name.toLowerCase().includes(needle) || String(student.studentId).toLowerCase().includes(needle));
            return (
              <section key={course.id} className="space-y-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{course.title}</h2>
                  <p className="text-sm text-gray-500">{course.courseCode}</p>
                  <ScheduleText course={course} />
                </div>
                {students.length === 0 ? <p className="panel px-5 py-4 text-sm text-gray-600">No students match this filter.</p> : (
                  <div className="panel overflow-x-auto">
                    <table className="min-w-[48rem] text-left text-sm">
                      <thead className="border-b border-gray-200 text-gray-500">
                        <tr>
                          <th className="px-4 py-3 font-medium">Student</th>
                          <th className="px-4 py-3 font-medium">Submitted</th>
                          <th className="px-4 py-3 font-medium">Missing</th>
                          <th className="px-4 py-3 font-medium">Released grades</th>
                          <th className="px-4 py-3 font-medium">Average</th>
                          <th className="px-4 py-3 font-medium">Present</th>
                          <th className="px-4 py-3 font-medium">Absent</th>
                          <th className="px-4 py-3 font-medium">Late</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student) => (
                          <tr key={student.id} className="border-t border-gray-100">
                            <td className="px-4 py-3 font-medium text-gray-900">{student.name}<div className="font-normal text-gray-500">{student.studentId}</div></td>
                            <td className="px-4 py-3">{student.submitted}/{student.assigned}</td>
                            <td className="px-4 py-3">{student.missing}</td>
                            <td className="px-4 py-3">{student.graded}</td>
                            <td className="px-4 py-3">{student.average === null ? '—' : `${student.average}%`}</td>
                            <td className="px-4 py-3">{student.attendance.present}</td>
                            <td className="px-4 py-3">{student.attendance.absent}</td>
                            <td className="px-4 py-3">{student.attendance.late}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            );
          })}
        </>
      ) : null}
    </div>
  );
}
