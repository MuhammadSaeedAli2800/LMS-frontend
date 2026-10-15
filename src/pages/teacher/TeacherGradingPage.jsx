import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../../components/Button';
import { PageHeader } from '../../components/PageHeader';
import { EmptyState } from '../../components/EmptyState';
import { ErrorMessage } from '../../components/ErrorMessage';
import { FormField, inputClassName } from '../../components/FormField';
import { Spinner } from '../../components/Spinner';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { ScheduleText } from '../../components/ScheduleText';
import { fetchTeacherCourses, fetchTeacherSubmissions } from '../../services/academicService';
import { downloadCsv } from '../../utils/csv';
import { assignmentTitle, formatDateTime } from '../../utils/format';

const TONES = {
  onTime: { title: 'text-green-800', list: 'divide-green-200 border-green-200', row: 'bg-green-50', name: 'text-green-900', card: 'border-green-200 bg-green-50 hover:bg-green-100' },
  late: { title: 'text-red-800', list: 'divide-red-200 border-red-200', row: 'bg-red-50', name: 'text-red-900', card: 'border-red-200 bg-red-50 hover:bg-red-100' },
  missing: { title: 'text-gray-600', list: 'divide-gray-200 border-gray-200', row: 'bg-gray-100', name: 'text-gray-700', card: 'border-gray-200 bg-gray-100 hover:bg-gray-200' },
};

const TIMING = {
  'on-time': { key: 'onTime', label: 'On time', tone: TONES.onTime, empty: 'Nobody submitted on time.' },
  late: { key: 'late', label: 'Late submission', tone: TONES.late, empty: 'No late submissions.' },
  missing: { key: 'missing', label: 'No submission', tone: TONES.missing, empty: 'Every enrolled student has submitted.' },
};

function CountLink({ assignment, timing, count }) {
  const tone = TIMING[timing];
  return (
    <Link className={`block rounded-xl border px-4 py-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${tone.tone.card} ${tone.tone.title}`} to={`/teacher/grading/${assignment.id}/${timing}`}>
      {tone.label} ({count})
    </Link>
  );
}

export function TeacherGradingPage() {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('all');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useDocumentTitle('Submissions and grading');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [courseResult, submissionResult] = await Promise.all([fetchTeacherCourses(), fetchTeacherSubmissions()]);
      setCourses(courseResult.data.courses || []);
      setAssignments(submissionResult.data.assignments || []);
    } catch (err) {
      setError(err.message || 'Could not load submissions.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = assignments.filter((item) => courseId === 'all' || item.courseId === courseId);

  function onExport() {
    const rows = [['Course', 'Assignment', 'Student', 'Student ID', 'Timing', 'Marks', 'Submitted']];
    visible.forEach((assignment) => {
      assignment.onTime.forEach((item) => rows.push([assignment.courseTitle, assignment.title, item.studentName, item.studentCode || '', 'On time', item.marks ?? '', formatDateTime(item.submittedAt).label]));
      assignment.late.forEach((item) => rows.push([assignment.courseTitle, assignment.title, item.studentName, item.studentCode || '', 'Late', item.marks ?? '', formatDateTime(item.submittedAt).label]));
      assignment.missing.forEach((item) => rows.push([assignment.courseTitle, assignment.title, item.studentName, item.studentCode || '', 'No submission', '', '']));
    });
    downloadCsv('assignment-records.csv', rows);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Submissions and grading" description="Open On time, Late submission, or No submission to see the students and their IDs.">
        <Button type="button" variant="secondary" onClick={onExport} disabled={visible.length === 0}>Export records</Button>
      </PageHeader>
      {loading ? <div className="flex min-h-40 items-center justify-center"><Spinner className="h-6 w-6 text-primary" label="Loading submissions" /></div> : null}
      {!loading && error ? <ErrorMessage message={error} onRetry={load} /> : null}
      {!loading && !error ? (
        <>
          <FormField id="grading-course" label="Course">
            <select id="grading-course" className={inputClassName} value={courseId} onChange={(event) => setCourseId(event.target.value)}>
              <option value="all">All assigned courses</option>
              {courses.map((course) => <option key={course.id} value={course.id}>{course.title} · {course.courseCode}</option>)}
            </select>
          </FormField>
          {visible.length === 0 ? <div className="panel"><EmptyState title="No assignments yet" /></div> : visible.map((assignment) => (
            <section key={assignment.id} className="panel space-y-4 p-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{assignmentTitle(assignment)}</h2>
                <p className="text-sm text-gray-600">{assignment.courseTitle} · {assignment.courseCode} · Due {formatDateTime(assignment.dueDate).label}</p>
                <ScheduleText course={assignment} />
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <CountLink assignment={assignment} timing="on-time" count={assignment.onTime.length} />
                <CountLink assignment={assignment} timing="late" count={assignment.late.length} />
                <CountLink assignment={assignment} timing="missing" count={assignment.missing.length} />
              </div>
            </section>
          ))}
        </>
      ) : null}
    </div>
  );
}

export function TeacherTimingPage() {
  const { assignmentId, timing } = useParams();
  const kind = TIMING[timing];
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useDocumentTitle(kind ? kind.label : 'Submissions');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchTeacherSubmissions();
      const found = (result.data.assignments || []).find((item) => item.id === assignmentId) || null;
      setAssignment(found);
    } catch (err) {
      setError(err.message || 'Could not load students.');
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => { load(); }, [load]);

  const students = assignment && kind ? assignment[kind.key] || [] : [];

  return (
    <div className="space-y-6">
      <div>
        {assignment ? (
          <>
            <PageHeader
              back={{ to: '/teacher/grading', label: 'Submissions and grading' }}
              title={assignmentTitle(assignment)}
              description={`${assignment.courseTitle} · ${assignment.courseCode} · Due ${formatDateTime(assignment.dueDate).label}`}
            />
            <div className="mt-2"><ScheduleText course={assignment} /></div>
          </>
        ) : (
          <PageHeader back={{ to: '/teacher/grading', label: 'Submissions and grading' }} title="Submissions" />
        )}
      </div>
      {loading ? <div className="flex min-h-40 items-center justify-center"><Spinner className="h-6 w-6 text-primary" label="Loading students" /></div> : null}
      {!loading && error ? <ErrorMessage message={error} onRetry={load} /> : null}
      {!loading && !error && (!assignment || !kind) ? <div className="panel"><EmptyState title="Group not found" description="This submission group is not on an assignment assigned to you." /></div> : null}
      {!loading && !error && assignment && kind ? (
        <section className="space-y-3">
          <h2 className={`text-lg font-semibold ${kind.tone.title}`}>{kind.label} ({students.length})</h2>
          {students.length === 0 ? <p className={`rounded-xl border px-4 py-3 text-sm ${kind.tone.list} ${kind.tone.row} ${kind.tone.name}`}>{kind.empty}</p> : (
            <ul className={`divide-y overflow-hidden rounded-xl border ${kind.tone.list}`}>
              {students.map((item) => (
                <li key={item.id} className={`flex flex-col gap-2 px-5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between ${kind.tone.row}`}>
                  <div>
                    <p className={`font-medium ${kind.tone.name}`}>{item.studentName}</p>
                    <p className="text-gray-600">ID {item.studentCode || '—'}</p>
                  </div>
                  {timing === 'missing' ? null : <Link className="font-medium text-primary hover:underline" to={`/teacher/grading/${item.id}`}>Grade</Link>}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
