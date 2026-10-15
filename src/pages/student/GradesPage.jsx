import { useCallback, useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../../components/EmptyState';
import { ErrorMessage } from '../../components/ErrorMessage';
import { Spinner } from '../../components/Spinner';
import { PageHeader } from '../../components/PageHeader';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { fetchGrades, fetchStudentAssignments } from '../../services/academicService';
import { formatDateTime } from '../../utils/format';

function percent(marks, max) {
  if (!max) return null;
  return Math.round((marks / max) * 1000) / 10;
}

export function GradesPage() {
  const [grades, setGrades] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useDocumentTitle('Grades');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [gradeResult, assignmentResult] = await Promise.all([
        fetchGrades(),
        fetchStudentAssignments(),
      ]);
      setGrades(gradeResult.data.grades || []);
      setAssignments(assignmentResult.data.assignments || []);
    } catch (err) {
      setError(err.message || 'Could not load grades.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const progress = useMemo(() => {
    const gradesByAssignment = new Map(grades.filter((grade) => grade.assignmentId).map((grade) => [grade.assignmentId, grade]));
    const courses = new Map();
    assignments.forEach((assignment) => {
      const key = assignment.courseId || assignment.courseTitle || 'Course';
      const row = courses.get(key) || { title: assignment.courseTitle || 'Course', total: 0, graded: 0, marks: 0, max: 0 };
      row.total += 1;
      row.max += Number(assignment.maxMarks) || 0;
      const grade = gradesByAssignment.get(assignment.id);
      if (grade) {
        row.graded += 1;
        row.marks += Number(grade.marks) || 0;
      }
      courses.set(key, row);
    });
    const rows = [...courses.values()];
    const marks = rows.reduce((sum, row) => sum + row.marks, 0);
    const max = rows.reduce((sum, row) => sum + row.max, 0);
    const graded = rows.reduce((sum, row) => sum + row.graded, 0);
    const total = rows.reduce((sum, row) => sum + row.total, 0);
    return { rows, marks, max, graded, total, overall: percent(marks, max) };
  }, [assignments, grades]);

  return (
    <div className="space-y-6">
      <PageHeader title="Grades" description="Your percentage is released marks out of every published assignment and quiz. Missing or ungraded work counts as zero." />
      {loading ? <div className="flex min-h-40 items-center justify-center"><Spinner className="h-6 w-6 text-primary" label="Loading grades" /></div> : null}
      {!loading && error ? <ErrorMessage message={error} onRetry={load} /> : null}
      {!loading && !error ? (
        <>
          <section className="panel bg-primary-soft px-5 py-6">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Overall</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight text-ink">{progress.overall === null ? '—' : `${progress.overall}%`}</p>
            <p className="mt-2 text-sm text-ink-muted">{progress.max ? `${progress.graded} of ${progress.total} assessments graded across ${progress.rows.length} ${progress.rows.length === 1 ? 'course' : 'courses'}` : 'No assessments yet'}</p>
          </section>
          {progress.rows.length > 0 ? (
            <ul className="panel divide-y divide-line">
              {progress.rows.map((row) => (
                <li key={row.title} className="flex items-center justify-between gap-4 px-5 py-3 text-sm">
                  <p className="font-medium text-ink">{row.title}</p>
                  <p className="shrink-0 text-ink-muted">{row.max ? `${percent(row.marks, row.max)}%` : '—'} · {row.graded}/{row.total}</p>
                </li>
              ))}
            </ul>
          ) : null}
          {grades.length === 0 ? <div className="panel"><EmptyState title="No grades yet" description="Your overall percentage appears after the first assignment is graded." /></div> : (
            <ul className="scroll-panel panel divide-y divide-line">
              {grades.map((grade) => (
                <li key={grade.id} className="px-5 py-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-medium text-ink">{grade.title}</p>
                    <p className="text-sm font-semibold text-ink">{grade.marks} / {grade.maxMarks}</p>
                  </div>
                  <p className="text-sm text-ink-muted">{grade.courseTitle} · {formatDateTime(grade.gradedAt).label}</p>
                  {grade.feedback ? <p className="mt-2 whitespace-pre-wrap text-sm text-ink-muted">{grade.feedback}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </div>
  );
}
