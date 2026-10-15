import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../../components/Button';
import { CourseStatus } from '../../components/CourseStatus';
import { EmptyState } from '../../components/EmptyState';
import { ErrorMessage } from '../../components/ErrorMessage';
import { FormField, inputClassName } from '../../components/FormField';
import { PageHeader } from '../../components/PageHeader';
import { Spinner } from '../../components/Spinner';
import { useToast } from '../../context/ToastContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { fetchSubmissions, fetchTeacherSubmissions, gradeSubmission } from '../../services/academicService';
import { assignmentTitle, formatDateTime } from '../../utils/format';

export function GradePage() {
  const { assignmentId } = useParams();
  const toast = useToast();
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  useDocumentTitle('Grade submissions');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchSubmissions(assignmentId);
      setPayload(result.data);
    } catch (err) {
      setError(err.message || 'Could not load submissions.');
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    load();
  }, [load]);

  async function onGrade(event, submission) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusyId(submission.id);
    try {
      const release = form.get('release') === 'on';
      await gradeSubmission(submission.id, { marks: Number(form.get('marks')), feedback: form.get('feedback'), release });
      toast.success(release ? 'Grade released to the student.' : 'Grade saved. It stays hidden until you release it.');
      await load();
    } catch (err) {
      toast.error(err.message || 'Could not save the grade.');
    } finally {
      setBusyId('');
    }
  }

  if (loading) return <div className="flex min-h-40 items-center justify-center"><Spinner className="h-6 w-6 text-primary" label="Loading submissions" /></div>;
  if (error || !payload) return <ErrorMessage message={error || 'Assignment not found.'} onRetry={load} />;

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ to: `/teacher/courses/${payload.assignment.courseId}`, label: 'Back to course' }}
        title={assignmentTitle(payload.assignment)}
        description={`Maximum marks: ${payload.assignment.maxMarks}`}
      />
      {payload.submissions.length === 0 ? (
        <div className="panel"><EmptyState title="No submissions yet" /></div>
      ) : payload.submissions.map((submission) => {
        const when = formatDateTime(submission.submittedAt);
        return (
          <form key={submission.id} className="panel space-y-3 p-5" onSubmit={(event) => onGrade(event, submission)}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium text-gray-900">{submission.studentName || 'Student'}</p>
                <p className="text-sm text-gray-600">{when.label}</p>
              </div>
              <CourseStatus status={submission.status} />
            </div>
            {submission.submissionText ? <p className="whitespace-pre-wrap text-sm text-gray-800">{submission.submissionText}</p> : null}
            {submission.downloadPath ? <a className="text-sm text-primary hover:underline" href={submission.downloadPath}>Download file</a> : null}
            <FormField id={`marks-${submission.id}`} label="Marks">
              <input id={`marks-${submission.id}`} name="marks" type="number" min="0" max={payload.assignment.maxMarks} step="0.5" defaultValue={submission.marks ?? ''} className={inputClassName} required />
            </FormField>
            <FormField id={`feedback-${submission.id}`} label="Feedback">
              <textarea id={`feedback-${submission.id}`} name="feedback" className={inputClassName} rows={3} defaultValue={submission.feedback || ''} />
            </FormField>
            <label className="flex items-center gap-2 text-sm text-gray-800"><input name="release" type="checkbox" defaultChecked={submission.released !== false} /> Release this grade to the student</label>
            <Button type="submit" disabled={busyId === submission.id}>{busyId === submission.id ? 'Saving…' : 'Save grade'}</Button>
          </form>
        );
      })}
    </div>
  );
}

export function StudentGradePage() {
  const { submissionId } = useParams();
  const toast = useToast();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [missing, setMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  useDocumentTitle(submission?.studentName ? `Grade ${submission.studentName}` : 'Grade student');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    setMissing(false);
    try {
      const result = await fetchTeacherSubmissions();
      const match = (result.data.submissions || []).find((item) => item.id === submissionId) || null;
      setSubmission(match);
      setMissing(!match);
    } catch (err) {
      setError(err.message || 'Could not load this submission.');
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => { load(); }, [load]);

  async function onGrade(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const release = form.get('release') === 'on';
    setBusy(true);
    try {
      await gradeSubmission(submission.id, { marks: Number(form.get('marks')), feedback: form.get('feedback'), release });
      toast.success(release ? 'Grade released to the student.' : 'Grade saved. It stays hidden until you release it.');
      await load();
    } catch (err) {
      toast.error(err.message || 'Could not save the grade.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="flex min-h-40 items-center justify-center"><Spinner className="h-6 w-6 text-primary" label="Loading submission" /></div>;
  if (error) return <ErrorMessage message={error} onRetry={load} />;
  if (missing || !submission) {
    return (
      <div className="space-y-4">
        <PageHeader back={{ to: '/teacher/grading', label: 'All submissions' }} title="Submission" />
        <div className="panel"><EmptyState title="Submission not found" description="This submission is not in one of your courses." /></div>
      </div>
    );
  }

  const when = formatDateTime(submission.submittedAt);
  return (
    <div className="space-y-6">
      <PageHeader
        back={{ to: '/teacher/grading', label: 'All submissions' }}
        title={submission.studentName || 'Student'}
        description={`${assignmentTitle({ title: submission.assignmentTitle, assignmentNumber: submission.assignmentNumber })} · ${submission.courseTitle}${submission.courseCode ? ` · ${submission.courseCode}` : ''}. Submitted ${when.label}. Maximum marks ${submission.maxMarks}.`}
      />
      <form key={`${submission.id}-${submission.gradedAt || 'new'}`} className="panel space-y-3 p-5" onSubmit={onGrade}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CourseStatus status={submission.status} />
        </div>
        {submission.submissionText ? <p className="whitespace-pre-wrap text-sm text-gray-800">{submission.submissionText}</p> : null}
        {submission.downloadPath ? <a className="text-sm text-primary hover:underline" href={submission.downloadPath}>Download file</a> : null}
        <FormField id="student-marks" label="Marks">
          <input id="student-marks" name="marks" type="number" min="0" max={submission.maxMarks} step="0.5" defaultValue={submission.marks ?? ''} className={inputClassName} required />
        </FormField>
        <FormField id="student-feedback" label="Feedback">
          <textarea id="student-feedback" name="feedback" className={inputClassName} rows={4} defaultValue={submission.feedback || ''} />
        </FormField>
        <label className="flex items-center gap-2 text-sm text-gray-800"><input name="release" type="checkbox" defaultChecked={submission.released !== false} /> Release this grade to the student</label>
        <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save grade'}</Button>
      </form>
    </div>
  );
}
