import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../../components/Button';
import { CourseStatus } from '../../components/CourseStatus';
import { EmptyState } from '../../components/EmptyState';
import { ErrorMessage } from '../../components/ErrorMessage';
import { FormField, inputClassName } from '../../components/FormField';
import { PageHeader } from '../../components/PageHeader';
import { ScheduleText } from '../../components/ScheduleText';
import { Spinner } from '../../components/Spinner';
import { useToast } from '../../context/ToastContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { fetchStudentAssignments, submitAssignment } from '../../services/academicService';
import { assignmentDescription, assignmentTitle, formatDateTime, lateSubmissionLabel } from '../../utils/format';

const ACCEPT = '.pdf,.jpg,.jpeg,.pptx,.doc,.docx';
const EXTENSIONS = new Set(['pdf', 'jpg', 'jpeg', 'pptx', 'doc', 'docx']);

function acceptedFile(file) {
  const extension = String(file?.name || '').split('.').pop().toLowerCase();
  return EXTENSIONS.has(extension);
}

export function AssignmentSubmitPage() {
  const { assignmentId } = useParams();
  const toast = useToast();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  useDocumentTitle(assignment?.title || 'Submit assignment');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setMissing(false);
    try {
      const result = await fetchStudentAssignments();
      const match = (result.data.assignments || []).find((item) => item.id === assignmentId);
      setAssignment(match || null);
      setMissing(!match);
    } catch (err) {
      setError(err.message || 'Could not load this assignment.');
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => { load(); }, [load]);

  const pastDue = assignment && new Date(assignment.dueDate).getTime() < Date.now();
  const lateClosed = assignment && assignment.allowLate === false && pastDue;
  const locked = assignment && (assignment.status === 'closed' || lateClosed || assignment.submissionStatus === 'Graded' || (assignment.submissionStatus !== 'Not Submitted' && !assignment.allowResubmission));
  const notice = !locked ? '' : assignment.status === 'closed' ? 'This assignment is closed.' : lateClosed ? 'Late submissions are not accepted.' : 'This submission is closed.';
  const description = assignment ? assignmentDescription(assignment.description, notice) : '';

  async function onSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get('file');
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
      await load();
    } catch (err) {
      toast.error(err.message || 'Could not submit.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {assignment ? (
        <PageHeader
          back={{ to: assignment.courseId ? `/student/assignments/courses/${assignment.courseId}` : '/student/assignments', label: 'Back to assignments' }}
          title={assignmentTitle(assignment)}
          description={`${assignment.courseTitle} · ${assignment.courseCode}`}
        />
      ) : (
        <PageHeader back={{ to: '/student/assignments', label: 'Back to assignments' }} title="Assignment" />
      )}
      {loading ? <div className="flex min-h-40 items-center justify-center"><Spinner className="h-6 w-6 text-primary" label="Loading assignment" /></div> : null}
      {!loading && error ? <ErrorMessage message={error} onRetry={load} /> : null}
      {!loading && !error && missing ? <div className="panel"><EmptyState title="Assignment not found" description="This assignment is not available in your courses." /></div> : null}
      {!loading && !error && assignment ? (
        <section className="panel space-y-4 p-5">
          <CourseStatus status={assignment.submissionStatus} />
          <ScheduleText course={assignment} empty="No class days or time set" />
          <p className="text-sm text-gray-600">Due {formatDateTime(assignment.dueDate).label} · {assignment.maxMarks} marks</p>
          <p className="text-sm text-gray-600">{lateSubmissionLabel(assignment)}</p>
          {description ? <p className="whitespace-pre-wrap text-sm text-gray-700">{description}</p> : null}
          {assignment.downloadPath ? <a className="text-sm text-primary hover:underline" href={assignment.downloadPath}>Assignment file</a> : null}
          {assignment.submission?.downloadPath ? <a className="block text-sm text-primary hover:underline" href={assignment.submission.downloadPath}>Your file{assignment.submission.originalName ? `: ${assignment.submission.originalName}` : ''}</a> : null}
          {locked ? <p className="text-sm text-gray-600">{notice}</p> : (
            <form className="space-y-3" onSubmit={onSubmit}>
              <FormField id="submission-file" label="Your file">
                <input id="submission-file" name="file" type="file" accept={ACCEPT} className={inputClassName} required />
              </FormField>
              <p className="text-sm text-gray-600">PDF, JPG, JPEG, PPTX, DOC, or DOCX. Maximum size is 10 MB.</p>
              <Button type="submit" disabled={busy}>{busy ? 'Submitting…' : 'Submit'}</Button>
            </form>
          )}
        </section>
      ) : null}
    </div>
  );
}
