import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AssignmentEditForm } from '../../components/AssignmentEditForm';
import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { CourseStatus } from '../../components/CourseStatus';
import { EmptyState } from '../../components/EmptyState';
import { ErrorMessage } from '../../components/ErrorMessage';
import { FormField, inputClassName } from '../../components/FormField';
import { PageHeader } from '../../components/PageHeader';
import { Spinner } from '../../components/Spinner';
import { useToast } from '../../context/ToastContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import {
  createAnnouncement,
  createAssignment,
  createMaterial,
  fetchAttendance,
  fetchCourseStudents,
  fetchMaterials,
  fetchTeacherAnnouncements,
  fetchTeacherAssignments,
  fetchTeacherCourses,
  updateAssignment,
  deleteAssignment,
} from '../../services/academicService';
import { ScheduleText } from '../../components/ScheduleText';
import { assignmentTitle, formatDateTime } from '../../utils/format';

const TABS = ['Assignments', 'Students', 'Materials', 'Attendance', 'Announcements'];

function formatDay(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(date);
}

export function TeacherCoursePage() {
  const { courseId } = useParams();
  const toast = useToast();
  const [course, setCourse] = useState(null);
  const [tab, setTab] = useState('Assignments');
  const [students, setStudents] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  useDocumentTitle(course?.title || 'Course');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [courseResult, studentResult, materialResult, assignmentResult, announcementResult, attendanceResult] = await Promise.all([
        fetchTeacherCourses(),
        fetchCourseStudents(courseId),
        fetchMaterials(courseId),
        fetchTeacherAssignments(courseId),
        fetchTeacherAnnouncements(courseId),
        fetchAttendance(courseId),
      ]);
      const found = (courseResult.data.courses || []).find((item) => item.id === courseId);
      if (!found) throw new Error('You are not assigned to this course.');
      setCourse(found);
      setStudents(studentResult.data.students || []);
      setMaterials(materialResult.data.materials || []);
      setAssignments(assignmentResult.data.assignments || []);
      setAnnouncements(announcementResult.data.announcements || []);
      setAttendance(attendanceResult.data.records || []);
    } catch (err) {
      setError(err.message || 'Could not load this course.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  async function onMaterial(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setBusy(true);
    try {
      await createMaterial(courseId, {
        title: form.get('title'),
        description: form.get('description'),
        externalUrl: form.get('externalUrl'),
        file: form.get('file') && form.get('file').name ? form.get('file') : null,
      });
      toast.success('Material added.');
      formElement.reset();
      const result = await fetchMaterials(courseId);
      setMaterials(result.data.materials || []);
    } catch (err) {
      toast.error(err.message || 'Could not add the material.');
    } finally {
      setBusy(false);
    }
  }

  async function onAssignment(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setBusy(true);
    try {
      const localDue = form.get('dueDate');
      await createAssignment(courseId, {
        title: form.get('title'),
        assignmentNumber: form.get('assignmentNumber'),
        description: form.get('description'),
        dueDate: new Date(localDue).toISOString(),
        maxMarks: form.get('maxMarks'),
        allowResubmission: form.get('allowResubmission') === 'on',
        file: form.get('file') && form.get('file').name ? form.get('file') : null,
      });
      toast.success('Assignment published.');
      formElement.reset();
      const result = await fetchTeacherAssignments(courseId);
      setAssignments(result.data.assignments || []);
    } catch (err) {
      toast.error(err.message || 'Could not publish the assignment.');
    } finally {
      setBusy(false);
    }
  }

  async function onSaveDetails(assignment, details) {
    setBusy(true);
    try {
      await updateAssignment(assignment.id, details);
      toast.success('Assignment details updated.');
      setEditingId('');
      const result = await fetchTeacherAssignments(courseId);
      setAssignments(result.data.assignments || []);
    } catch (err) {
      toast.error(err.message || 'Could not update the assignment.');
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      await deleteAssignment(pendingDelete.id);
      toast.success('Assignment deleted.');
      setPendingDelete(null);
      if (editingId === pendingDelete.id) setEditingId('');
      const result = await fetchTeacherAssignments(courseId);
      setAssignments(result.data.assignments || []);
    } catch (err) {
      toast.error(err.message || 'Could not delete the assignment.');
    } finally {
      setBusy(false);
    }
  }

  async function onAnnouncement(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setBusy(true);
    try {
      await createAnnouncement(courseId, { title: form.get('title'), message: form.get('message') });
      toast.success('Announcement published.');
      formElement.reset();
      const result = await fetchTeacherAnnouncements(courseId);
      setAnnouncements(result.data.announcements || []);
    } catch (err) {
      toast.error(err.message || 'Could not publish the announcement.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="flex min-h-40 items-center justify-center"><Spinner className="h-6 w-6 text-primary" label="Loading course" /></div>;
  if (error || !course) return <ErrorMessage message={error || 'Course not found.'} onRetry={load} />;
  const archived = course.status === 'archived';

  return (
    <div className="space-y-6">
      <div>
        <PageHeader back={{ to: '/teacher/courses', label: 'My courses' }} title={course.title} description={`${course.courseCode} · ${course.academicTerm}`}>
          <CourseStatus status={course.status} />
        </PageHeader>
        <div className="mt-2"><ScheduleText course={course} /></div>
      </div>
      <div className="flex flex-wrap gap-2">
        {TABS.map((name) => (
          <Button key={name} type="button" variant={tab === name ? 'primary' : 'secondary'} onClick={() => setTab(name)}>{name}</Button>
        ))}
      </div>

      {tab === 'Students' ? (
        <section className="panel overflow-hidden">
          {students.length === 0 ? <EmptyState title="No enrolled students" /> : (
            <ul className="scroll-panel divide-y divide-gray-200">
              {students.map((student) => (
                <li key={student.id} className="px-5 py-3 text-sm">
                  <p className="font-medium text-gray-900">{student.name}</p>
                  <p className="text-gray-600">{student.studentId} · {student.email}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === 'Materials' ? (
        <section className="space-y-4">
          {archived ? <p className="text-sm text-gray-600">This course is archived, so new materials cannot be added.</p> : (
            <form className="panel space-y-3 bg-slate-50 p-5" onSubmit={onMaterial}>
              <FormField id="material-title" label="Title"><input id="material-title" name="title" className={inputClassName} required minLength={2} /></FormField>
              <FormField id="material-description" label="Description"><textarea id="material-description" name="description" className={inputClassName} rows={2} /></FormField>
              <FormField id="material-link" label="External link"><input id="material-link" name="externalUrl" className={inputClassName} placeholder="https://" /></FormField>
              <FormField id="material-file" label="Or upload a file"><input id="material-file" name="file" type="file" className={inputClassName} /></FormField>
              <Button type="submit" disabled={busy}>Add material</Button>
            </form>
          )}
          {materials.length === 0 ? <EmptyState title="No materials" /> : (
            <ul className="scroll-panel panel divide-y divide-line">
              {materials.map((item) => (
                <li key={item.id} className="px-5 py-3 text-sm">
                  <p className="font-medium text-gray-900">{item.title}</p>
                  {item.externalUrl ? <a className="text-primary hover:underline" href={item.externalUrl} target="_blank" rel="noreferrer">Open link</a> : null}
                  {item.downloadPath ? <a className="ml-3 text-primary hover:underline" href={item.downloadPath}>Download</a> : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === 'Assignments' ? (
        <section className="space-y-4">
          {archived ? <p className="text-sm text-gray-600">This course is archived, so new assignments cannot be added.</p> : (
            <form className="panel space-y-3 border-l-4 border-l-primary p-5" onSubmit={onAssignment}>
              <FormField id="assignment-number" label="Assignment number"><input id="assignment-number" name="assignmentNumber" type="number" min="1" max="999" className={inputClassName} /></FormField>
              <FormField id="assignment-title" label="Title"><input id="assignment-title" name="title" className={inputClassName} required minLength={2} /></FormField>
              <FormField id="assignment-description" label="Instructions"><textarea id="assignment-description" name="description" className={inputClassName} rows={3} /></FormField>
              <FormField id="assignment-due" label="Deadline"><input id="assignment-due" name="dueDate" type="datetime-local" className={inputClassName} required /></FormField>
              <FormField id="assignment-marks" label="Maximum marks"><input id="assignment-marks" name="maxMarks" type="number" min="1" max="1000" defaultValue="100" className={inputClassName} required /></FormField>
              <label className="flex items-center gap-2 text-sm text-gray-800"><input name="allowResubmission" type="checkbox" /> Allow resubmission before grading</label>
              <FormField id="assignment-file" label="Attachment"><input id="assignment-file" name="file" type="file" className={inputClassName} /></FormField>
              <Button type="submit" disabled={busy}>Publish assignment</Button>
            </form>
          )}
          {assignments.length === 0 ? <EmptyState title="No assignments" /> : (
            <ul className="scroll-panel panel divide-y divide-line border-l-4 border-l-primary">
              {assignments.map((item) => {
                const when = formatDateTime(item.dueDate);
                return (
                  <li key={item.id} className="flex flex-col gap-3 px-5 py-3 text-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{assignmentTitle(item)}</p>
                        <p className="text-gray-600">Due {when.label} · {item.maxMarks} marks</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        {archived ? null : <button type="button" className="font-medium text-primary hover:underline" onClick={() => setEditingId(editingId === item.id ? '' : item.id)}>{editingId === item.id ? 'Close edit' : 'Edit'}</button>}
                        {archived ? null : <button type="button" className="font-medium text-red-700 hover:underline" disabled={busy} onClick={() => setPendingDelete(item)}>Delete</button>}
                        <Link className="font-medium text-primary hover:underline" to={`/teacher/assignments/${item.id}`}>Grade</Link>
                      </div>
                    </div>
                    {!archived && editingId === item.id ? (
                      <AssignmentEditForm assignment={item} disabled={busy} onSubmit={(details) => onSaveDetails(item, details)} onCancel={() => setEditingId('')} />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      ) : null}

      {tab === 'Attendance' ? (
        <section className="space-y-3">
          <p className="text-sm text-gray-600">Mark present, absent, or late from the Attendance page. This list is the saved record for the course.</p>
          {attendance.length === 0 ? <div className="panel"><EmptyState title="No attendance yet" description="Marks appear here after an administrator records them." /></div> : (
            <ul className="scroll-panel panel divide-y divide-line">
              {[...attendance].sort((left, right) => String(right.sessionDate).localeCompare(String(left.sessionDate)) || String(left.studentName).localeCompare(String(right.studentName))).map((record) => (
                <li key={record.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <CourseStatus status={record.status} />
                  <p className="font-medium text-gray-900">{formatDay(record.sessionDate)}</p>
                  <p className="text-gray-700">{record.studentName}{record.studentNumber ? ` (${record.studentNumber})` : ''}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === 'Announcements' ? (
        <section className="space-y-4">
          {archived ? <p className="text-sm text-gray-600">This course is archived, so new announcements cannot be published.</p> : (
            <form className="panel space-y-3 p-5" onSubmit={onAnnouncement}>
              <FormField id="announcement-title" label="Title"><input id="announcement-title" name="title" className={inputClassName} required minLength={2} /></FormField>
              <FormField id="announcement-message" label="Message"><textarea id="announcement-message" name="message" className={inputClassName} rows={4} required minLength={2} /></FormField>
              <Button type="submit" disabled={busy}>Publish</Button>
            </form>
          )}
          {announcements.length === 0 ? <EmptyState title="No announcements" /> : (
            <ul className="scroll-panel space-y-3">
              {announcements.map((item) => (
                <li key={item.id} className="panel bg-slate-50 p-5">
                  <p className="text-lg font-semibold text-ink">{item.title}</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-ink-muted">{item.message}</p>
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
        loading={busy}
        onConfirm={onDelete}
        onClose={() => { if (!busy) setPendingDelete(null); }}
      />
    </div>
  );
}
