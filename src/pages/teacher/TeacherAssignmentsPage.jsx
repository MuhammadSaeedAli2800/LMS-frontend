import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AssignmentEditForm } from '../../components/AssignmentEditForm';
import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { CourseStatus } from '../../components/CourseStatus';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { ErrorMessage } from '../../components/ErrorMessage';
import { FormField, inputClassName } from '../../components/FormField';
import { ScheduleText, scheduleParts } from '../../components/ScheduleText';
import { Spinner } from '../../components/Spinner';
import { useToast } from '../../context/ToastContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { createAssignment, deleteAssignment, fetchTeacherAssignments, fetchTeacherCourses, setAssignmentStatus, updateAssignment } from '../../services/academicService';
import { assignmentTitle, formatDateTime, lateSubmissionLabel } from '../../utils/format';

function courseLabel(course) {
  const { days, time } = scheduleParts(course);
  return [course.title, course.courseCode, days, time].filter(Boolean).join(' · ');
}

export function TeacherAssignmentsPage() {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [editingId, setEditingId] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  useDocumentTitle('Assignments');

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchTeacherCourses();
      const list = result.data.courses || [];
      setCourses(list);
      setCourseId((current) => current || list[0]?.id || '');
    } catch (err) {
      setError(err.message || 'Could not load assignments.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAssignments = useCallback(async () => {
    if (!courseId) {
      setAssignments([]);
      return;
    }
    try {
      const result = await fetchTeacherAssignments(courseId);
      setAssignments(result.data.assignments || []);
    } catch (err) {
      setAssignments([]);
      setError(err.message || 'Could not load assignments.');
    }
  }, [courseId]);

  useEffect(() => { loadCourses(); }, [loadCourses]);
  useEffect(() => {
    setEditingId('');
    loadAssignments();
  }, [loadAssignments]);

  async function onPublish(event, course) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const file = form.get('file');
    setBusyId(course.id);
    try {
      await createAssignment(course.id, {
        title: form.get('title'),
        assignmentNumber: form.get('assignmentNumber'),
        description: form.get('description'),
        dueDate: new Date(form.get('dueDate')).toISOString(),
        maxMarks: form.get('maxMarks'),
        allowResubmission: form.get('allowResubmission') === 'on',
        allowLate: form.get('allowLate') === 'on',
        file: file && file.name ? file : null,
      });
      toast.success('Assignment published.');
      formElement.reset();
      await loadAssignments();
    } catch (err) {
      toast.error(err.message || 'Could not publish the assignment.');
    } finally {
      setBusyId('');
    }
  }

  async function onSaveDetails(assignment, details) {
    setBusyId(assignment.id);
    try {
      await updateAssignment(assignment.id, details);
      toast.success('Assignment details updated.');
      setEditingId('');
      await loadAssignments();
    } catch (err) {
      toast.error(err.message || 'Could not update the assignment.');
    } finally {
      setBusyId('');
    }
  }

  async function onDelete() {
    if (!pendingDelete) return;
    setBusyId(pendingDelete.id);
    try {
      await deleteAssignment(pendingDelete.id);
      toast.success('Assignment deleted.');
      setPendingDelete(null);
      if (editingId === pendingDelete.id) setEditingId('');
      await loadAssignments();
    } catch (err) {
      toast.error(err.message || 'Could not delete the assignment.');
    } finally {
      setBusyId('');
    }
  }

  async function onStatus(assignment, status) {
    setBusyId(assignment.id);
    try {
      await setAssignmentStatus(assignment.id, status);
      toast.success(status === 'closed' ? 'Assignment closed.' : 'Assignment published.');
      await loadAssignments();
    } catch (err) {
      toast.error(err.message || 'Could not update the assignment.');
    } finally {
      setBusyId('');
    }
  }

  const course = courses.find((item) => item.id === courseId);
  const archived = course?.status === 'archived';

  return (
    <div className="space-y-6">
      <PageHeader title="Assignments" description="Choose a course, then publish or edit work. A new date updates who is on time and who is late." />
      {loading ? <div className="flex min-h-40 items-center justify-center"><Spinner className="h-6 w-6 text-primary" label="Loading assignments" /></div> : null}
      {!loading && error ? <ErrorMessage message={error} onRetry={loadCourses} /> : null}
      {!loading && !error && courses.length === 0 ? <div className="panel"><EmptyState title="No assigned courses" description="An administrator assigns courses to you." /></div> : null}
      {!loading && !error && course ? (
          <section className="panel space-y-4 border-l-4 border-l-primary p-5">
            <FormField id="assignment-course" label="Course">
              <select id="assignment-course" className={inputClassName} value={courseId} onChange={(event) => setCourseId(event.target.value)}>
                {courses.map((item) => <option key={item.id} value={item.id}>{courseLabel(item)}</option>)}
              </select>
            </FormField>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <ScheduleText course={course} empty="No class days or time set" />
              <CourseStatus status={course.status} />
            </div>
            {archived ? <p className="text-sm text-gray-600">This course is archived, so new assignments cannot be published.</p> : (
              <form key={course.id} className="grid gap-3 border-t border-gray-100 pt-4 md:grid-cols-2" onSubmit={(event) => onPublish(event, course)}>
                <FormField id={`number-${course.id}`} label="Assignment number"><input id={`number-${course.id}`} name="assignmentNumber" type="number" min="1" max="999" className={inputClassName} /></FormField>
                <FormField id={`title-${course.id}`} label="Title"><input id={`title-${course.id}`} name="title" className={inputClassName} required minLength={2} /></FormField>
                <FormField id={`due-${course.id}`} label="Deadline"><input id={`due-${course.id}`} name="dueDate" type="datetime-local" className={inputClassName} required /></FormField>
                <FormField id={`marks-${course.id}`} label="Maximum marks"><input id={`marks-${course.id}`} name="maxMarks" type="number" min="1" max="1000" defaultValue="100" className={inputClassName} required /></FormField>
                <FormField id={`file-${course.id}`} label="Attachment"><input id={`file-${course.id}`} name="file" type="file" className={inputClassName} /></FormField>
                <div className="md:col-span-2">
                  <FormField id={`instructions-${course.id}`} label="Instructions"><textarea id={`instructions-${course.id}`} name="description" className={inputClassName} rows={3} /></FormField>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-800 md:col-span-2"><input name="allowResubmission" type="checkbox" /> Allow resubmission before grading</label>
                <label className="flex items-center gap-2 text-sm text-gray-800 md:col-span-2"><input name="allowLate" type="checkbox" defaultChecked /> Accept late submissions</label>
                <div className="md:col-span-2">
                  <Button type="submit" disabled={busyId === course.id}>{busyId === course.id ? 'Publishing…' : 'Publish assignment'}</Button>
                </div>
              </form>
            )}
            {assignments.length === 0 ? <p className="text-sm text-gray-600">No assignments yet.</p> : (
              <ul className="divide-y divide-gray-200 rounded-xl border border-gray-200">
                {assignments.map((item) => (
                  <li key={item.id} className="flex flex-col gap-3 px-4 py-3 text-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{assignmentTitle(item)}</p>
                      <p className="text-gray-600">Due {formatDateTime(item.dueDate).label} · {item.maxMarks} marks</p>
                      <p className="text-gray-600">{lateSubmissionLabel(item)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <CourseStatus status={item.status} />
                      {archived ? null : <button type="button" className="font-medium text-primary hover:underline" onClick={() => setEditingId(editingId === item.id ? '' : item.id)}>{editingId === item.id ? 'Close edit' : 'Edit'}</button>}
                      {archived ? null : <button type="button" className="font-medium text-red-700 hover:underline disabled:opacity-60" disabled={busyId === item.id} onClick={() => setPendingDelete(item)}>Delete</button>}
                      <button type="button" className="font-medium text-primary hover:underline disabled:opacity-60" disabled={busyId === item.id} onClick={() => onStatus(item, item.status === 'closed' ? 'published' : 'closed')}>{item.status === 'closed' ? 'Publish' : 'Close'}</button>
                      <Link className="font-medium text-primary hover:underline" to={`/teacher/assignments/${item.id}`}>Grade</Link>
                    </div>
                    </div>
                    {!archived && editingId === item.id ? (
                      <AssignmentEditForm assignment={item} disabled={busyId === item.id} onSubmit={(details) => onSaveDetails(item, details)} onCancel={() => setEditingId('')} />
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
      ) : null}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete assignment"
        message={pendingDelete ? `Delete ${assignmentTitle(pendingDelete)}? Student submissions for this assignment will be removed.` : ''}
        confirmLabel="Delete"
        destructive
        loading={busyId === pendingDelete?.id}
        onConfirm={onDelete}
        onClose={() => { if (busyId !== pendingDelete?.id) setPendingDelete(null); }}
      />
    </div>
  );
}
