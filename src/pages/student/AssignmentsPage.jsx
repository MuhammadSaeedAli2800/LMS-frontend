import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '../../components/Button';
import { CourseStatus } from '../../components/CourseStatus';
import { EmptyState } from '../../components/EmptyState';
import { ErrorMessage } from '../../components/ErrorMessage';
import { FormField, inputClassName } from '../../components/FormField';
import { ScheduleText } from '../../components/ScheduleText';
import { Spinner } from '../../components/Spinner';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/PageHeader';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { fetchStudentAssignments, fetchStudentCourses, submitAssignment } from '../../services/academicService';
import { assignmentTitle, formatDateTime } from '../../utils/format';

const ACCEPT = '.pdf,.jpg,.jpeg,.pptx,.doc,.docx';
const EXTENSIONS = new Set(['pdf', 'jpg', 'jpeg', 'pptx', 'doc', 'docx']);

function acceptedFile(file) {
  const extension = String(file?.name || '').split('.').pop().toLowerCase();
  return EXTENSIONS.has(extension);
}

function canSubmit(assignment) {
  if (assignment.status === 'closed') return false;
  if (assignment.submissionStatus === 'Graded') return false;
  if (assignment.submissionStatus !== 'Not Submitted' && !assignment.allowResubmission) return false;
  return true;
}

function courseCards(courses, assignments) {
  return courses.map((course) => {
    const rows = assignments.filter((item) => item.courseId === course.id);
    const submitted = rows.filter((item) => item.submissionStatus !== 'Not Submitted').length;
    return {
      ...course,
      total: rows.length,
      submitted,
      unsubmitted: rows.length - submitted,
    };
  }).sort((left, right) => left.title.localeCompare(right.title) || String(left.startTime).localeCompare(String(right.startTime)));
}

export function AssignmentsPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useDocumentTitle('Assignments');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [courseResult, assignmentResult] = await Promise.all([fetchStudentCourses(), fetchStudentAssignments()]);
      setCourses(courseCards(courseResult.data.courses || [], assignmentResult.data.assignments || []));
    } catch (err) {
      setError(err.message || 'Could not load assignments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader title="Assignments" description="One card for each course you are enrolled in. The number is submitted assignments out of the total." />
      {loading ? <div className="flex min-h-40 items-center justify-center"><Spinner className="h-6 w-6 text-primary" label="Loading assignments" /></div> : null}
      {!loading && error ? <ErrorMessage message={error} onRetry={load} /> : null}
      {!loading && !error && courses.length === 0 ? <div className="panel"><EmptyState title="No courses yet" description="Assignments appear after you are enrolled in a course." /></div> : null}
      {!loading && !error && courses.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {courses.map((course) => (
            <li key={course.id}>
              <Link to={`/student/assignments/courses/${course.id}`} className="panel block h-full p-5 transition hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">{course.courseCode}</p>
                <h2 className="mt-1 text-base font-semibold text-ink">{course.title}</h2>
                <ScheduleText course={course} empty="No class days or time set" />
                <p className="mt-4 text-3xl font-semibold tracking-tight text-ink">{course.submitted}/{course.total}</p>
                <p className="mt-1 text-sm text-ink-muted">Submitted / total assignments</p>
                <p className="mt-3 text-sm font-medium text-primary">View assignments</p>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function SubmitForm({ assignment, onSubmitted }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const file = new FormData(formElement).get('file');
    if (!file || !file.name) {
      toast.error('Choose a PDF, JPG, JPEG, PPTX, DOC, or DOCX file.');
      return;
    }
    if (!acceptedFile(file)) {
      toast.error('Upload a PDF, JPG, JPEG, PPTX, DOC, or DOCX file.');
      return;
    }
    setBusy(true);
    try {
      await submitAssignment(assignment.id, { file });
      toast.success('Submission received.');
      formElement.reset();
      await onSubmitted();
    } catch (err) {
      toast.error(err.message || 'Could not submit.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="mt-3 space-y-3" onSubmit={onSubmit}>
      <FormField id={`file-${assignment.id}`} label="Your file">
        <input id={`file-${assignment.id}`} name="file" type="file" accept={ACCEPT} className={inputClassName} required />
      </FormField>
      <p className="text-sm text-gray-600">PDF, JPG, JPEG, PPTX, DOC, or DOCX. Maximum size is 10 MB.</p>
      <Button type="submit" disabled={busy}>{busy ? 'Submitting…' : 'Submit'}</Button>
    </form>
  );
}

export function StudentCourseAssignmentsPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useDocumentTitle(course?.title ? `${course.title} assignments` : 'Assignments');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [courseResult, assignmentResult] = await Promise.all([fetchStudentCourses(), fetchStudentAssignments()]);
      const match = (courseResult.data.courses || []).find((item) => item.id === courseId) || null;
      setCourse(match);
      setRows((assignmentResult.data.assignments || []).filter((item) => item.courseId === courseId));
    } catch (err) {
      setError(err.message || 'Could not load assignments.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div className="flex min-h-40 items-center justify-center"><Spinner className="h-6 w-6 text-primary" label="Loading assignments" /></div>;
  }
  if (error) return <ErrorMessage message={error} onRetry={load} />;
  if (!course) {
    return (
      <div className="space-y-4">
        <PageHeader back={{ to: '/student/assignments', label: 'All assignments' }} title="Assignments" />
        <div className="panel"><EmptyState title="Course not found" description="This course is not on your assignment list." /></div>
      </div>
    );
  }

  const unsubmitted = rows.filter((item) => item.submissionStatus === 'Not Submitted');
  const submitted = rows.filter((item) => item.submissionStatus !== 'Not Submitted');

  return (
    <div className="space-y-6">
      <div>
        <PageHeader back={{ to: '/student/assignments', label: 'All assignments' }} title={course.title} description={course.courseCode} />
        <div className="mt-2"><ScheduleText course={course} empty="No class days or time set" /></div>
        <p className="mt-3 text-3xl font-semibold tracking-tight text-ink">{submitted.length}/{rows.length}</p>
        <p className="text-sm text-ink-muted">Submitted / total assignments</p>
      </div>
      <section className="grid gap-4 sm:grid-cols-2">
        <article className="panel p-5">
          <h2 className="text-sm font-medium text-ink-muted">Assignments</h2>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">{rows.length}</p>
        </article>
        <article className="panel border-l-4 border-l-warning p-5">
          <h2 className="text-sm font-medium text-ink-muted">Unsubmitted</h2>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-ink">{unsubmitted.length}</p>
        </article>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-ink">Unsubmitted assignments</h2>
        {unsubmitted.length === 0 ? <p className="panel px-5 py-4 text-sm text-ink-muted">Every assignment has been submitted.</p> : (
          <ul className="space-y-3">
            {unsubmitted.map((assignment) => (
              <li key={assignment.id} className="panel border-l-4 border-l-warning p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <CourseStatus status={assignment.submissionStatus} />
                  <h3 className="font-semibold text-gray-900">{assignmentTitle(assignment)}</h3>
                </div>
                <p className="mt-2 text-sm text-gray-600">Due {formatDateTime(assignment.dueDate).label} · {assignment.maxMarks} marks</p>
                {assignment.description ? <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{assignment.description}</p> : null}
                {assignment.downloadPath ? <a className="mt-2 inline-flex text-sm text-primary hover:underline" href={assignment.downloadPath}>Assignment file</a> : null}
                {canSubmit(assignment) ? <SubmitForm assignment={assignment} onSubmitted={load} /> : <p className="mt-3 text-sm text-gray-600">This assignment is closed.</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
      {submitted.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-ink">Submitted</h2>
          <ul className="panel divide-y divide-line">
            {submitted.map((assignment) => (
              <li key={assignment.id} className="flex flex-col gap-2 px-5 py-4 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-gray-900">{assignmentTitle(assignment)}</p>
                  <p className="text-gray-600">Due {formatDateTime(assignment.dueDate).label}</p>
                </div>
                <div className="flex items-center gap-3">
                  <CourseStatus status={assignment.submissionStatus} />
                  <Link className="font-medium text-primary hover:underline" to={`/student/assignments/${assignment.id}`}>View</Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
