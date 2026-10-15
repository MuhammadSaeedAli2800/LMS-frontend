import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { CourseStatus } from '../../components/CourseStatus';
import { EmptyState } from '../../components/EmptyState';
import { ErrorMessage } from '../../components/ErrorMessage';
import { FormField, inputClassName } from '../../components/FormField';
import { ScheduleFields } from '../../components/ScheduleFields';
import { ScheduleText } from '../../components/ScheduleText';
import { Spinner } from '../../components/Spinner';
import { useToast } from '../../context/ToastContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { listTeachers } from '../../services/adminService';
import {
  getCourse,
  listEnrollments,
  removeEnrollment,
  updateCourse,
  updateCourseStatus,
  deleteCourse,
} from '../../services/academicService';

export function CourseDetailPage() {
  const { courseId } = useParams();
  const [searchParams] = useSearchParams();
  const focusTeacherId = searchParams.get('teacher');
  const navigate = useNavigate();
  const toast = useToast();
  const [course, setCourse] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [studentQuery, setStudentQuery] = useState('');
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [schedule, setSchedule] = useState({ days: [], startTime: '', endTime: '' });
  const [details, setDetails] = useState({
    title: '',
    courseCode: '',
    academicTerm: '',
    department: '',
    description: '',
  });
  useDocumentTitle(course?.title || 'Course');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [courseResult, enrollmentResult, teacherResult] = await Promise.all([
        getCourse(courseId),
        listEnrollments({ courseId }),
        listTeachers({ limit: 50, status: 'active' }),
      ]);
      const loaded = courseResult.data.course;
      setCourse(loaded);
      setDetails({
        title: loaded.title || '',
        courseCode: loaded.courseCode || '',
        academicTerm: loaded.academicTerm || '',
        department: loaded.department || '',
        description: loaded.description || '',
      });
      setSchedule({
        days: loaded.days || [],
        startTime: loaded.startTime || '',
        endTime: loaded.endTime || '',
      });
      setSelectedTeachers(loaded.teacherIds || []);
      setEnrollments(enrollmentResult.data.enrollments || []);
      setTeachers(teacherResult.data.teachers || []);
    } catch (err) {
      setError(err.message || 'Could not load this course.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!focusTeacherId || loading) return;
    document.getElementById(`assigned-teacher-${focusTeacherId}`)?.scrollIntoView({ block: 'center' });
  }, [focusTeacherId, loading, teachers]);

  async function changeStatus(status) {
    setBusy(true);
    try {
      const result = await updateCourseStatus(courseId, status);
      setCourse(result.data.course);
      toast.success(`Course marked ${status}.`);
    } catch (err) {
      toast.error(err.message || 'Could not update status.');
    } finally {
      setBusy(false);
      setConfirmArchive(false);
    }
  }

  async function removeCourse() {
    setBusy(true);
    try {
      await deleteCourse(courseId);
      toast.success('Course deleted.');
      navigate('/admin/courses');
    } catch (err) {
      toast.error(err.message || 'Could not delete this course.');
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  function updateDetail(event) {
    const { name, value } = event.target;
    setDetails((current) => ({ ...current, [name]: value }));
  }

  async function saveDetails(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const result = await updateCourse(courseId, {
        title: details.title.trim(),
        courseCode: details.courseCode.trim(),
        academicTerm: details.academicTerm.trim(),
        department: details.department.trim(),
        description: details.description,
      });
      setCourse(result.data.course);
      toast.success('Course updated.');
    } catch (err) {
      toast.error(err.message || 'Could not update the course.');
    } finally {
      setBusy(false);
    }
  }

  async function saveSchedule() {
    setBusy(true);
    try {
      const result = await updateCourse(courseId, schedule);
      setCourse(result.data.course);
      toast.success('Class schedule saved.');
    } catch (err) {
      toast.error(err.message || 'Could not save the schedule.');
    } finally {
      setBusy(false);
    }
  }

  async function saveTeachers() {
    setBusy(true);
    try {
      const result = await updateCourse(courseId, { teacherIds: selectedTeachers });
      setCourse(result.data.course);
      toast.success('Teachers updated.');
    } catch (err) {
      toast.error(err.message || 'Could not update teachers.');
    } finally {
      setBusy(false);
    }
  }

  async function unenroll() {
    if (!pendingRemoval) return;
    setBusy(true);
    try {
      await removeEnrollment(pendingRemoval.id);
      setEnrollments((current) => current.filter((item) => item.id !== pendingRemoval.id));
      toast.success('Enrollment removed.');
      setPendingRemoval(null);
    } catch (err) {
      toast.error(err.message || 'Could not remove the enrollment.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <Spinner className="h-6 w-6 text-primary" label="Loading course" />
      </div>
    );
  }
  if (error || !course) return <ErrorMessage message={error || 'Course not found.'} onRetry={load} />;

  const needle = studentQuery.trim().toLowerCase();
  const visibleEnrollments = needle
    ? enrollments.filter((item) => [item.studentName, item.studentEmail, item.studentNumber].some((value) => String(value || '').toLowerCase().includes(needle)))
    : enrollments;

  return (
    <div className="space-y-6">
      <div>
        <Link className="text-sm text-primary hover:underline" to="/admin/courses">All courses</Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-ink">{course.title}</h1>
          <CourseStatus status={course.status} />
        </div>
        <p className="mt-1 text-sm text-gray-600">{course.courseCode} · {course.academicTerm}{course.department ? ` · ${course.department}` : ''}</p>
        <div className="mt-1"><ScheduleText course={course} empty="No class days or time set yet." /></div>
      </div>

      <section className="panel p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Settings</p>
        <h2 className="mt-1 text-base font-semibold text-ink">Course details</h2>
        <p className="mt-1 text-sm text-ink-muted">Correct the name, code, term, or description if something was entered by mistake.</p>
        <form className="mt-4 space-y-4" onSubmit={saveDetails}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="detail-title" label="Title">
              <input id="detail-title" className={inputClassName} name="title" value={details.title} onChange={updateDetail} required minLength={2} />
            </FormField>
            <FormField id="detail-code" label="Course code">
              <input id="detail-code" className={inputClassName} name="courseCode" value={details.courseCode} onChange={updateDetail} required minLength={2} />
            </FormField>
            <FormField id="detail-term" label="Academic term">
              <input id="detail-term" className={inputClassName} name="academicTerm" value={details.academicTerm} onChange={updateDetail} required minLength={2} />
            </FormField>
            <FormField id="detail-department" label="Department">
              <input id="detail-department" className={inputClassName} name="department" value={details.department} onChange={updateDetail} />
            </FormField>
          </div>
          <FormField id="detail-description" label="Description">
            <textarea id="detail-description" className={inputClassName} name="description" value={details.description} onChange={updateDetail} rows={3} />
          </FormField>
          <Button type="submit" disabled={busy}>Save details</Button>
        </form>
      </section>

      <section className="panel p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Settings</p>
            <h2 className="mt-1 text-base font-semibold text-ink">Status</h2>
            <p className="mt-1 max-w-2xl text-sm text-ink-muted">Students see published and archived courses they are enrolled in. Draft courses stay hidden. Teachers cannot change an archived course.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {['draft', 'published', 'archived'].map((status) => (
              <Button
                key={status}
                type="button"
                variant={course.status === status ? 'primary' : 'secondary'}
                disabled={busy}
                onClick={() => (status === 'archived' ? setConfirmArchive(true) : changeStatus(status))}
              >
                {status}
              </Button>
            ))}
            <Button type="button" variant="danger" disabled={busy} onClick={() => setConfirmDelete(true)}>Delete course</Button>
          </div>
        </div>
      </section>

      <section className="panel p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Schedule</p>
        <h2 className="mt-1 text-base font-semibold text-ink">Class days and time</h2>
        <div className="mt-4">
          <ScheduleFields showLegend={false} days={schedule.days} startTime={schedule.startTime} endTime={schedule.endTime} onChange={setSchedule} />
        </div>
        <Button className="mt-4" type="button" onClick={saveSchedule} disabled={busy}>Save schedule</Button>
      </section>

      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <section className="panel min-w-0 p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold text-ink">Enrolled students ({enrollments.length})</h2>
          <p className="text-xs text-ink-faint">{course.academicTerm}</p>
        </div>
        <div className="mt-3">
          <FormField id="student-search" label="Find a student">
            <input id="student-search" className={inputClassName} value={studentQuery} onChange={(event) => setStudentQuery(event.target.value)} placeholder="Name, email, or student ID" />
          </FormField>
        </div>
        {visibleEnrollments.length === 0 ? (
          <EmptyState
            title={needle ? 'No students match this search' : 'No students enrolled'}
            description={needle ? 'Try a different name, email, or student ID.' : 'Students appear here after they are enrolled in this course.'}
          />
        ) : (
          <div className="scroll-panel mt-4 min-w-0 overflow-x-auto">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="sticky top-0 z-10 bg-white text-ink-muted">
                <tr className="border-b border-line">
                  <th scope="col" className="w-[28%] px-3 py-3 font-medium">Name</th>
                  <th scope="col" className="w-[18%] px-3 py-3 font-medium">ID</th>
                  <th scope="col" className="px-3 py-3 font-medium">Email</th>
                  <th scope="col" className="sticky right-0 w-16 bg-white px-3 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleEnrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="border-b border-line last:border-b-0">
                    <td className="px-3 py-3 font-medium text-ink">
                      <span className="block truncate" title={enrollment.studentName}>{enrollment.studentName}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-ink">{enrollment.studentNumber || '—'}</td>
                    <td className="px-3 py-3 text-ink-muted">
                      <span className="block truncate" title={enrollment.studentEmail}>{enrollment.studentEmail}</span>
                    </td>
                    <td className="sticky right-0 w-16 bg-white px-3 py-3">
                      <div className="flex flex-nowrap items-center">
                        <Button type="button" variant="danger" icon className="shrink-0" aria-label="Remove" title="Remove" disabled={busy} onClick={() => setPendingRemoval(enrollment)}>
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section className="panel min-w-0 p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Roster</p>
        <h2 className="mt-1 text-base font-semibold text-ink">Assigned teachers</h2>
        <div className="mt-3 divide-y divide-line">
          {teachers.map((teacher) => (
            <label id={`assigned-teacher-${teacher.id}`} key={teacher.id} className={`flex items-start gap-3 rounded-lg py-2.5 text-sm text-ink focus-within:bg-primary-soft/40 ${focusTeacherId === teacher.id ? 'bg-primary-soft px-2' : ''}`}>
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 shrink-0"
                checked={selectedTeachers.includes(teacher.id)}
                onChange={() => {
                  setSelectedTeachers((current) => (
                    current.includes(teacher.id) ? current.filter((id) => id !== teacher.id) : [...current, teacher.id]
                  ));
                }}
              />
              <span className="min-w-0">
                <span className="block font-medium">{teacher.name}</span>
                <span className="block break-all text-ink-muted">{teacher.email}</span>
              </span>
            </label>
          ))}
        </div>
        <Button className="mt-4" type="button" onClick={saveTeachers} disabled={busy}>Save teachers</Button>
      </section>
      </div>
      <ConfirmDialog
        open={Boolean(pendingRemoval)}
        title="Remove enrollment"
        message={pendingRemoval ? `Remove ${pendingRemoval.studentName} from ${course.title}?` : ''}
        confirmLabel="Remove"
        destructive
        loading={busy}
        onConfirm={unenroll}
        onClose={() => { if (!busy) setPendingRemoval(null); }}
      />
      <ConfirmDialog
        open={confirmArchive}
        title="Archive course"
        message="Archived courses stay visible to enrolled students, and teachers can no longer change them."
        confirmLabel="Archive"
        destructive
        loading={busy}
        onConfirm={() => changeStatus('archived')}
        onClose={() => { if (!busy) setConfirmArchive(false); }}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="Delete course"
        message={course ? `Delete ${course.title}? Enrollments, assignments, files, and attendance for this course will be removed.` : ''}
        confirmLabel="Delete"
        destructive
        loading={busy}
        onConfirm={removeCourse}
        onClose={() => { if (!busy) setConfirmDelete(false); }}
      />
    </div>
  );
}
