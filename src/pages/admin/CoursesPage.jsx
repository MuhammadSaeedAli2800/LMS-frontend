import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { CourseStatus } from '../../components/CourseStatus';
import { EmptyState } from '../../components/EmptyState';
import { ErrorMessage } from '../../components/ErrorMessage';
import { FormField, fieldAria, inputClassName } from '../../components/FormField';
import { Modal } from '../../components/Modal';
import { Spinner } from '../../components/Spinner';
import { useToast } from '../../context/ToastContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { listTeachers } from '../../services/adminService';
import { createCourse, deleteCourse, listCourses, updateCourse, updateCourseStatus } from '../../services/academicService';
import { PageHeader } from '../../components/PageHeader';
import { ScheduleFields } from '../../components/ScheduleFields';
import { ScheduleText } from '../../components/ScheduleText';

const EMPTY = {
  title: '',
  courseCode: '',
  academicTerm: '',
  department: '',
  description: '',
  status: 'draft',
  teacherIds: [],
  days: [],
  startTime: '',
  endTime: '',
};

function courseToForm(course) {
  return {
    title: course.title || '',
    courseCode: course.courseCode || '',
    academicTerm: course.academicTerm || '',
    department: course.department || '',
    description: course.description || '',
    status: course.status || 'draft',
    teacherIds: course.teacherIds || [],
    days: course.days || [],
    startTime: course.startTime || '',
    endTime: course.endTime || '',
  };
}

export function CoursesPage() {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [view, setView] = useState('catalog');
  useDocumentTitle('Courses');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [courseResult, teacherResult] = await Promise.all([
        listCourses(),
        listTeachers({ limit: 50, status: 'active' }),
      ]);
      setCourses(courseResult.data.courses || []);
      setTeachers(teacherResult.data.teachers || []);
    } catch (err) {
      setError(err.message || 'Could not load courses.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function toggleTeacher(id) {
    setForm((current) => {
      const selected = new Set(current.teacherIds);
      if (selected.has(id)) selected.delete(id);
      else selected.add(id);
      return { ...current, teacherIds: [...selected] };
    });
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setFormError('');
    setOpen(true);
  }

  function openEdit(course) {
    setEditing(course);
    setForm(courseToForm(course));
    setFormError('');
    setOpen(true);
  }

  function closeForm() {
    if (saving) return;
    setOpen(false);
    setEditing(null);
    setFormError('');
  }

  async function onDelete() {
    if (!pendingDelete) return;
    setSaving(true);
    try {
      await deleteCourse(pendingDelete.id);
      toast.success('Course deleted.');
      setPendingDelete(null);
      await load();
    } catch (err) {
      toast.error(err.message || 'Could not delete this course.');
    } finally {
      setSaving(false);
    }
  }

  async function onSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    const payload = {
      ...form,
      courseCode: form.courseCode.trim(),
      title: form.title.trim(),
      academicTerm: form.academicTerm.trim(),
      department: form.department.trim(),
    };
    try {
      if (editing) {
        await updateCourse(editing.id, payload);
        if (form.status !== editing.status) await updateCourseStatus(editing.id, form.status);
        toast.success('Course updated.');
      } else {
        await createCourse(payload);
        toast.success('Course created.');
      }
      setOpen(false);
      setEditing(null);
      setForm(EMPTY);
      await load();
    } catch (err) {
      setFormError(err.message || (editing ? 'Could not update the course.' : 'Could not create the course.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Courses" description="A catalog of every course, with a table when you need to scan codes and status.">
        <div className="flex rounded-lg bg-white p-1 ring-1 ring-line" role="group" aria-label="Course layout">
          <button type="button" className={`rounded-md px-3 py-1.5 text-sm font-medium ${view === 'catalog' ? 'bg-slate-900 text-white' : 'text-ink-muted'}`} onClick={() => setView('catalog')}>Catalog</button>
          <button type="button" className={`rounded-md px-3 py-1.5 text-sm font-medium ${view === 'table' ? 'bg-slate-900 text-white' : 'text-ink-muted'}`} onClick={() => setView('table')}>Table</button>
        </div>
        <Button type="button" onClick={openCreate}>New course</Button>
      </PageHeader>

      {loading ? (
        <div className="panel flex min-h-40 items-center justify-center">
          <Spinner className="h-6 w-6 text-primary" label="Loading courses" />
        </div>
      ) : null}
      {!loading && error ? <ErrorMessage message={error} onRetry={load} /> : null}
      {!loading && !error && courses.length === 0 ? (
        <div className="panel">
          <EmptyState title="No courses yet" description="Create a course, then enroll students from its page." />
        </div>
      ) : null}
      {!loading && !error && courses.length > 0 && view === 'catalog' ? (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <li key={course.id} className="flex flex-col rounded-xl border border-line bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">{course.courseCode}</p>
                  <Link className="mt-1 block text-lg font-semibold text-ink hover:text-primary" to={`/admin/courses/${course.id}`}>{course.title}</Link>
                </div>
                <CourseStatus status={course.status} />
              </div>
              <p className="mt-2 text-sm text-ink-muted">{course.academicTerm}</p>
              <div className="mt-2"><ScheduleText course={course} empty="No class days or time set" /></div>
              <div className="mt-4 flex gap-2">
                <Button type="button" variant="secondary" onClick={() => openEdit(course)}>Edit</Button>
                <Button type="button" variant="danger" onClick={() => setPendingDelete(course)}>Delete</Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {!loading && !error && courses.length > 0 && view === 'table' ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="scroll-panel hidden overflow-x-auto md:block">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-3 font-medium">Course</th>
                  <th className="px-4 py-3 font-medium">Term</th>
                  <th className="w-56 px-4 py-3 font-medium">Schedule</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="w-36 px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id} className="border-b border-gray-100 align-top last:border-b-0">
                    <td className="px-4 py-3">
                      <Link className="font-medium text-primary hover:underline" to={`/admin/courses/${course.id}`}>
                        {course.title}
                      </Link>
                      <p className="mt-0.5 text-gray-500">{course.courseCode}</p>
                      {course.department ? <p className="mt-0.5 text-gray-500">{course.department}</p> : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-700">{course.academicTerm}</td>
                    <td className="w-56 px-4 py-3"><ScheduleText course={course} empty="No class days or time set" /></td>
                    <td className="whitespace-nowrap px-4 py-3"><CourseStatus status={course.status} /></td>
                    <td className="w-36 px-4 py-3">
                      <div className="flex flex-col gap-2">
                        <Button type="button" variant="secondary" className="min-h-9 w-full justify-start whitespace-nowrap px-3 py-1.5" onClick={() => openEdit(course)}>
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                          Edit
                        </Button>
                        <Button type="button" variant="danger" className="min-h-9 w-full justify-start whitespace-nowrap px-3 py-1.5" onClick={() => setPendingDelete(course)}>
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="scroll-panel space-y-3 p-3 md:hidden">
            {courses.map((course) => (
              <article key={course.id} className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link className="font-medium text-primary hover:underline" to={`/admin/courses/${course.id}`}>{course.title}</Link>
                    <p className="mt-0.5 text-sm text-gray-500">{course.courseCode}</p>
                  </div>
                  <CourseStatus status={course.status} />
                </div>
                <p className="mt-3 text-sm text-gray-700">{course.academicTerm}{course.department ? ` · ${course.department}` : ''}</p>
                <div className="mt-1"><ScheduleText course={course} empty="No class days or time set" /></div>
                <div className="mt-3 flex flex-col gap-2">
                  <Button type="button" variant="secondary" className="min-h-9 w-full justify-start whitespace-nowrap px-3 py-1.5" onClick={() => openEdit(course)}>
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                    Edit
                  </Button>
                  <Button type="button" variant="danger" className="min-h-9 w-full justify-start whitespace-nowrap px-3 py-1.5" onClick={() => setPendingDelete(course)}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Delete
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      <Modal open={open} title={editing ? 'Edit course' : 'New course'} onClose={closeForm} dismissible={!saving} size="lg">
        <form className="space-y-4" onSubmit={onSubmit}>
          <FormField id="course-title" label="Title">
            <input className={inputClassName} name="title" value={form.title} onChange={updateField} required minLength={2} {...fieldAria('course-title')} />
          </FormField>
          <FormField id="course-code" label="Course code">
            <input className={inputClassName} name="courseCode" value={form.courseCode} onChange={updateField} required minLength={2} {...fieldAria('course-code')} />
          </FormField>
          <FormField id="course-term" label="Academic term">
            <input className={inputClassName} name="academicTerm" value={form.academicTerm} onChange={updateField} required minLength={2} {...fieldAria('course-term')} />
          </FormField>
          <FormField id="course-department" label="Department">
            <input className={inputClassName} name="department" value={form.department} onChange={updateField} {...fieldAria('course-department')} />
          </FormField>
          <ScheduleFields
            days={form.days}
            startTime={form.startTime}
            endTime={form.endTime}
            onChange={(schedule) => setForm((current) => ({ ...current, ...schedule }))}
          />
          <FormField id="course-description" label="Description">
            <textarea className={inputClassName} name="description" value={form.description} onChange={updateField} rows={3} {...fieldAria('course-description')} />
          </FormField>
          <FormField id="course-status" label="Status">
            <select id="course-status" className={inputClassName} name="status" value={form.status} onChange={updateField}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </FormField>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-gray-800">Teachers</legend>
            {teachers.length === 0 ? <p className="text-sm text-gray-500">No active teachers yet.</p> : null}
            <div className="max-h-40 space-y-2 overflow-auto rounded-lg border border-gray-200 p-3">
              {teachers.map((teacher) => (
                <label key={teacher.id} className="flex items-center gap-2 text-sm text-gray-800">
                  <input
                    type="checkbox"
                    checked={form.teacherIds.includes(teacher.id)}
                    onChange={() => toggleTeacher(teacher.id)}
                  />
                  {teacher.name}
                </label>
              ))}
            </div>
          </fieldset>
          {formError ? <p role="alert" className="text-sm text-red-600">{formError}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={closeForm} disabled={saving}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create course'}</Button>
          </div>
        </form>
      </Modal>
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete course"
        message={pendingDelete ? `Delete ${pendingDelete.title}? Enrollments, assignments, files, and attendance for this course will be removed.` : ''}
        confirmLabel="Delete"
        destructive
        loading={saving}
        onConfirm={onDelete}
        onClose={() => { if (!saving) setPendingDelete(null); }}
      />
    </div>
  );
}
