import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, Pencil, Plus, Trash2, UserCheck, UserX } from 'lucide-react';
import { Button } from '../../components/Button';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { EmptyState } from '../../components/EmptyState';
import { ErrorMessage } from '../../components/ErrorMessage';
import { FormField, fieldAria, inputClassName } from '../../components/FormField';
import { Modal } from '../../components/Modal';
import { PageHeader } from '../../components/PageHeader';
import { Pagination } from '../../components/Pagination';
import { Spinner } from '../../components/Spinner';
import { StatusBadge } from '../../components/StatusBadge';
import { TemporaryPasswordDialog } from '../../components/TemporaryPasswordDialog';
import { PAGE_SIZE } from '../../constants';
import { useToast } from '../../context/ToastContext';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { ScheduleText, scheduleParts } from '../../components/ScheduleText';
import { displayValue, isActiveStatus } from '../../utils/format';
import { hasErrors, mapFieldErrors, validatePersonForm } from '../../utils/validation';

function courseOptionLabel(course) {
  const { days, time } = scheduleParts(course);
  const schedule = [days, time].filter(Boolean).join(' ');
  return `${course.title} · ${course.courseCode}${schedule ? ` · ${schedule}` : ''}`;
}

function availableCourses(list, current = []) {
  const byId = new Map();
  [...list, ...current].forEach((course) => {
    if (!course?.id) return;
    if (course.status === 'archived' && !current.some((item) => item.id === course.id)) return;
    byId.set(course.id, course);
  });
  return [...byId.values()].sort((left, right) => String(left.title || '').localeCompare(String(right.title || '')));
}

function TeacherProgram({ courses, teacherId }) {
  const list = Array.isArray(courses) ? courses : [];
  if (list.length === 0) return <p className="text-ink-muted">No course assigned</p>;
  return (
    <div className="space-y-3">
      {list.map((course) => {
        const { days, time } = scheduleParts(course);
        const editPath = course.id ? `/admin/courses/${course.id}?teacher=${teacherId || ''}` : '';
        return (
          <div key={course.id || `${course.courseCode}-${course.title}`} className="space-y-0.5">
            {editPath ? (
              <Link className="font-medium text-primary hover:underline" to={editPath}>
                {course.title}{course.courseCode ? ` (${course.courseCode})` : ''}
              </Link>
            ) : (
              <p className="font-medium text-ink">{course.title}{course.courseCode ? ` (${course.courseCode})` : ''}</p>
            )}
            {days ? <p className="text-ink-muted">{days}</p> : null}
            {time ? <p className="text-ink-muted">{time}</p> : null}
            {!days && !time ? <p className="text-ink-muted">No class days or time set</p> : null}
          </div>
        );
      })}
    </div>
  );
}

function titleCase(value) {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function createBlankForm(idField) {
  return {
    name: '',
    email: '',
    [idField]: '',
    department: '',
    className: '',
    academicProgram: '',
    accountStatus: 'active',
  };
}

function personFromResponse(result) {
  const data = result?.data;
  if (!data || typeof data !== 'object') return null;
  if (data.user && typeof data.user === 'object') return data.user;
  if (data.student && typeof data.student === 'object') return data.student;
  if (data.teacher && typeof data.teacher === 'object') return data.teacher;
  if (data.name || data.email) return data;
  return null;
}

export function PeopleDirectory({
  title,
  description,
  noun,
  plural,
  listKey,
  idField,
  idLabel,
  includeClass = false,
  showSchedule = false,
  presentation = 'records',
  load,
  loadCourses,
  getRecord,
  createRecord,
  updateRecord,
  setStatus,
  deleteRecord,
  resetPassword,
}) {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('');
  const [className, setClassName] = useState('');
  const [status, setStatusFilter] = useState('all');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedDepartment, setAppliedDepartment] = useState('');
  const [appliedClass, setAppliedClass] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(() => createBlankForm(idField));
  const [formErrors, setFormErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [courseTouched, setCourseTouched] = useState(false);
  const [coursesReady, setCoursesReady] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 400);
  const debouncedDepartment = useDebouncedValue(department, 400);
  const debouncedClass = useDebouncedValue(className, 400);
  useDocumentTitle(title);

  useEffect(() => {
    setAppliedSearch(debouncedSearch);
  }, [debouncedSearch]);

  useEffect(() => {
    setAppliedDepartment(debouncedDepartment);
  }, [debouncedDepartment]);

  useEffect(() => {
    setAppliedClass(debouncedClass);
  }, [debouncedClass]);

  const queryKey = `${appliedSearch}|${appliedDepartment}|${includeClass ? appliedClass : ''}|${status}`;
  const [seenQuery, setSeenQuery] = useState(queryKey);
  if (seenQuery !== queryKey) {
    setSeenQuery(queryKey);
    if (page !== 1) setPage(1);
  }

  const formFields = [
    { name: 'name', label: 'Full name', required: true, autoComplete: 'name' },
    { name: 'email', label: 'Email', type: 'email', required: true, autoComplete: 'email' },
    { name: idField, label: idLabel, required: true, autoComplete: 'off' },
    { name: 'department', label: 'Department', required: true, autoComplete: 'organization' },
  ];

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: idField, label: idLabel },
    { key: 'department', label: 'Department' },
    ...(showSchedule ? [{ key: 'programSchedule', label: 'Program & Schedule' }] : []),
  ];

  function ProgramScheduleCell({ row }) {
    const courses = Array.isArray(row?.courses) ? row.courses : [];
    return (
      <div className="space-y-2">
        {courses.length === 0 ? <p className="text-sm text-gray-500">No course assigned</p> : courses.map((course) => (
          <div key={course.id || course.courseCode}>
            <p className="text-sm text-gray-800">{course.title} ({course.courseCode})</p>
            <ScheduleText course={course} empty="No class days or time set" />
          </div>
        ))}
      </div>
    );
  }

  function fromRow(row) {
    const active = !row?.accountStatus || isActiveStatus(row.accountStatus);
    return {
      name: row?.name || '',
      email: row?.email || '',
      [idField]: row?.[idField] || '',
      department: row?.department || '',
      className: row?.className || '',
      academicProgram: row?.academicProgram || '',
      accountStatus: active ? 'active' : 'inactive',
    };
  }

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setListError('');
    const params = {
      search: appliedSearch.trim(),
      status,
      department: appliedDepartment.trim(),
      page,
      limit: PAGE_SIZE,
    };
    if (includeClass) params.className = appliedClass.trim();

    load(params)
      .then((result) => {
        if (ignore) return;
        const data = result.data || {};
        let list = Array.isArray(data[listKey]) ? data[listKey] : [];
        const departmentQuery = appliedDepartment.trim().toLowerCase();
        const classQuery = appliedClass.trim().toLowerCase();
        if (departmentQuery) {
          list = list.filter((row) => String(row.department || '').toLowerCase().includes(departmentQuery));
        }
        if (classQuery) {
          list = list.filter((row) => String(row.className || '').toLowerCase().includes(classQuery));
        }
        if (status === 'active' || status === 'inactive') {
          list = list.filter((row) => row.accountStatus === status);
        }
        const total = list.length;
        const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        const start = (Math.max(page, 1) - 1) * PAGE_SIZE;
        setRows(list.slice(start, start + PAGE_SIZE));
        setPagination({ page, limit: PAGE_SIZE, total, totalPages });
      })
      .catch((error) => {
        if (ignore || error.code === 'MUST_CHANGE_PASSWORD') return;
        setRows([]);
        setListError(error.message || `Could not load ${plural}.`);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [load, listKey, plural, includeClass, appliedSearch, appliedDepartment, appliedClass, status, page, reloadKey]);

  function updateField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
    setFormErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function loadCourseOptions(current = []) {
    if (!loadCourses) return;
    setCoursesReady(false);
    loadCourses({})
      .then((result) => {
        setCourses(availableCourses(result.data.courses || [], current));
        setCoursesReady(true);
      })
      .catch(() => {
        setCourses(availableCourses([], current));
        setCoursesReady(false);
        toast.error('Could not load courses.');
      });
  }

  function openCreate() {
    setFormMode('create');
    setEditingId(null);
    setCourseId('');
    setCourseTouched(false);
    setForm(createBlankForm(idField));
    setFormErrors({});
    setFormError('');
    setDetailLoading(false);
    setFormOpen(true);
    loadCourseOptions();
  }

  async function openEdit(row) {
    if (!row?.id) {
      toast.error('This record is missing an id.');
      return;
    }
    setFormMode('edit');
    setEditingId(row.id);
    const enrolledIds = (Array.isArray(row.courses) ? row.courses : []).map((course) => course.id).filter(Boolean);
    setCourseId(enrolledIds.length === 1 ? enrolledIds[0] : '');
    setCourseTouched(false);
    setForm(fromRow(row));
    setFormErrors({});
    setFormError('');
    setFormOpen(true);
    loadCourseOptions(Array.isArray(row.courses) ? row.courses : []);
    if (!getRecord) return;
    setDetailLoading(true);
    try {
      const result = await getRecord(row.id);
      const fresh = personFromResponse(result);
      if (fresh) setForm(fromRow({ ...row, ...fresh }));
    } catch (error) {
      if (error.code !== 'MUST_CHANGE_PASSWORD') {
        toast.error(error.message || 'Could not refresh this record. Showing the list details.');
      }
    } finally {
      setDetailLoading(false);
    }
  }

  function closeForm() {
    if (saving) return;
    setFormOpen(false);
  }

  async function handleSave(event) {
    event.preventDefault();
    const nextErrors = validatePersonForm(form, formFields);
    setFormErrors(nextErrors);
    setFormError('');
    if (hasErrors(nextErrors)) return;

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      [idField]: String(form[idField] || '').trim(),
      department: form.department.trim(),
    };
    if (formMode === 'create') {
      payload.accountStatus = form.accountStatus;
      if (courseId) payload.courseId = courseId;
    }
    if (formMode === 'edit' && loadCourses && coursesReady && courseTouched) {
      payload.courseIds = courseId ? [courseId] : [];
    }

    setSaving(true);
    try {
      if (formMode === 'create') {
        const result = await createRecord(payload);
        if (result.data?.enrolledExisting) {
          setFormOpen(false);
          setReloadKey((value) => value + 1);
          toast.success('This student already has an account and was enrolled in the selected course.');
          return;
        }
        const password = result.data?.temporaryPassword;
        setFormOpen(false);
        setReloadKey((value) => value + 1);
        if (!password) {
          toast.error(`The ${noun} was created, but no temporary password was returned.`);
          return;
        }
        setTemporaryPassword(password);
        toast.success(courseId ? `${titleCase(noun)} created and enrolled in the selected course.` : `${titleCase(noun)} created.`);
        return;
      }
      await updateRecord(editingId, payload);
      setFormOpen(false);
      setReloadKey((value) => value + 1);
      toast.success(`${titleCase(noun)} updated.`);
    } catch (error) {
      if (error.code === 'MUST_CHANGE_PASSWORD') return;
      const fieldErrors = mapFieldErrors(error);
      if (hasErrors(fieldErrors)) setFormErrors(fieldErrors);
      setFormError(error.message || `Could not save this ${noun}.`);
      toast.error(error.message || `Could not save this ${noun}.`);
    } finally {
      setSaving(false);
    }
  }

  function askConfirm(type, row) {
    if (!row?.id) {
      toast.error('This record is missing an id.');
      return;
    }
    setConfirmError('');
    setConfirm({ type, row });
  }

  async function handleConfirm() {
    if (!confirm?.row?.id) return;
    setConfirming(true);
    setConfirmError('');
    try {
      if (confirm.type === 'reset') {
        const result = await resetPassword(confirm.row.id);
        const password = result.data?.temporaryPassword;
        if (!password) throw new Error('The server did not return a temporary password.');
        setConfirm(null);
        setTemporaryPassword(password);
        toast.success('Temporary password created.');
        return;
      }
      if (confirm.type === 'delete') {
        await deleteRecord(confirm.row.id);
        setConfirm(null);
        setReloadKey((value) => value + 1);
        toast.success(`${titleCase(noun)} deleted.`);
        return;
      }
      const nextStatus = confirm.type === 'deactivate' ? 'inactive' : 'active';
      await setStatus(confirm.row.id, nextStatus);
      setConfirm(null);
      setReloadKey((value) => value + 1);
      toast.success(nextStatus === 'active' ? `${titleCase(noun)} reactivated.` : `${titleCase(noun)} deactivated.`);
    } catch (error) {
      if (error.code === 'MUST_CHANGE_PASSWORD') return;
      const message = error.message || 'Could not complete that action.';
      setConfirmError(message);
      toast.error(message);
    } finally {
      setConfirming(false);
    }
  }

  function clearFilters() {
    setSearch('');
    setDepartment('');
    setClassName('');
    setStatusFilter('all');
    setAppliedSearch('');
    setAppliedDepartment('');
    setAppliedClass('');
  }

  const filtersActive = Boolean(
    appliedSearch.trim() || appliedDepartment.trim() || (includeClass && appliedClass.trim()) || status !== 'all',
  );
  const showClear = Boolean(search || department || className || status !== 'all' || filtersActive);

  function renderActions(row) {
    const active = isActiveStatus(row.accountStatus);
    const iconClass = 'shrink-0';
    return (
      <div className="flex flex-nowrap items-center gap-2">
        <Button type="button" variant="secondary" icon className={iconClass} aria-label="Edit" title="Edit" onClick={() => openEdit(row)}>
          <Pencil className="h-4 w-4" aria-hidden="true" />
        </Button>
        <Button type="button" variant="secondary" icon className={iconClass} aria-label={active ? 'Deactivate' : 'Reactivate'} title={active ? 'Deactivate' : 'Reactivate'} onClick={() => askConfirm(active ? 'deactivate' : 'activate', row)}>
          {active ? <UserX className="h-4 w-4" aria-hidden="true" /> : <UserCheck className="h-4 w-4" aria-hidden="true" />}
        </Button>
        <Button type="button" variant="secondary" icon className={iconClass} aria-label="Reset password" title="Reset password" onClick={() => askConfirm('reset', row)}>
          <KeyRound className="h-4 w-4" aria-hidden="true" />
        </Button>
        {deleteRecord ? (
          <Button type="button" variant="danger" icon className={iconClass} aria-label="Delete" title="Delete" onClick={() => askConfirm('delete', row)}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </Button>
        ) : null}
      </div>
    );
  }

  const confirmCopy = (() => {
    const name = confirm?.row?.name || `this ${noun}`;
    if (confirm?.type === 'deactivate') {
      return {
        title: `Deactivate ${noun}`,
        message: `Deactivate ${name}? They will not be able to sign in.`,
        confirmLabel: 'Deactivate',
        destructive: true,
      };
    }
    if (confirm?.type === 'delete') {
      return {
        title: `Delete ${noun}`,
        message: noun === 'teacher'
          ? `Delete ${name}? Their account will be removed and they will be unassigned from courses. Courses and assignments stay.`
          : `Delete ${name}? Their account, enrollments, submissions, and attendance will be removed.`,
        confirmLabel: 'Delete',
        destructive: true,
      };
    }
    if (confirm?.type === 'activate') {
      return {
        title: `Reactivate ${noun}`,
        message: `Reactivate ${name}? They will be able to sign in again.`,
        confirmLabel: 'Reactivate',
        destructive: false,
      };
    }
    return {
      title: 'Reset password',
      message: `Generate a new temporary password for ${name}? Their current password will stop working.`,
      confirmLabel: 'Reset password',
      destructive: true,
    };
  })();

  const countLabel = loading
    ? `Loading ${plural}`
    : `${pagination.total || 0} ${pagination.total === 1 ? noun : plural}`;

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader title={title} description={description}>
        <Button type="button" onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add {noun}
        </Button>
      </PageHeader>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          setAppliedSearch(search);
          setAppliedDepartment(department);
          setAppliedClass(className);
        }}
        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
      >
        <div className={`grid gap-4 ${includeClass ? 'md:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-3'}`}>
          <FormField id="directory-search" label={`Search ${plural}`}>
            <input
              {...fieldAria('directory-search', '')}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={presentation === 'staff' ? 'Search by name, teacher ID, or email...' : `Name, email, or ${idLabel.toLowerCase()}`}
              className={inputClassName}
            />
          </FormField>
          <FormField id="filter-status" label="Account status">
            <select
              {...fieldAria('filter-status', '')}
              value={status}
              onChange={(event) => setStatusFilter(event.target.value)}
              className={inputClassName}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </FormField>
          <FormField id="filter-department" label="Department">
            <input
              {...fieldAria('filter-department', '')}
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              className={inputClassName}
            />
          </FormField>
          <FormField id="filter-class" label="Class or program">
            <input
              {...fieldAria('filter-class', '')}
              value={className}
              onChange={(event) => setClassName(event.target.value)}
              className={inputClassName}
            />
          </FormField>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="submit" variant="secondary">
            Apply filters
          </Button>
          {showClear ? (
            <Button type="button" variant="ghost" onClick={clearFilters}>
              Clear
            </Button>
          ) : null}
        </div>
      </form>

      <section className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="mb-4 text-sm font-medium text-gray-700">{countLabel}</h2>

        {loading ? (
          <div className="flex min-h-40 items-center justify-center">
            <Spinner className="h-6 w-6 text-primary" label={`Loading ${plural}`} />
          </div>
        ) : null}

        {!loading && listError ? <ErrorMessage message={listError} onRetry={() => setReloadKey((value) => value + 1)} /> : null}

        {!loading && !listError && rows.length === 0 ? (
          <EmptyState
            title={filtersActive ? `No ${plural} match these filters` : `No ${plural} yet`}
            description={
              filtersActive
                ? 'Try a different search or clear the filters.'
                : `Add a ${noun} when you are ready to create an account.`
            }
          />
        ) : null}

        {!loading && !listError && rows.length > 0 ? (
          <>
            <div className={presentation === 'staff' ? 'scroll-panel min-w-0 overflow-x-auto' : 'scroll-panel hidden overflow-x-auto md:block'}>
              {presentation === 'staff' ? (
                <table className="w-full min-w-[64rem] text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-white text-ink-muted">
                    <tr className="border-b border-line">
                      <th scope="col" className="w-48 px-3 py-3 font-medium">Name</th>
                      <th scope="col" className="w-24 px-3 py-3 font-medium">ID</th>
                      <th scope="col" className="w-56 px-3 py-3 font-medium">Email</th>
                      <th scope="col" className="w-36 px-3 py-3 font-medium">Department</th>
                      <th scope="col" className="px-3 py-3 font-medium">Program & Duration</th>
                      <th scope="col" className="w-28 px-3 py-3 font-medium">Status</th>
                      <th scope="col" className="w-44 px-3 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id || row.email} className="border-b border-line align-top last:border-b-0">
                        <td className="px-3 py-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white" aria-hidden="true">
                              {String(row.name || '?').slice(0, 1).toUpperCase()}
                            </span>
                            {Array.isArray(row.courses) && row.courses[0]?.id ? (
                              <Link className="block truncate font-medium text-primary hover:underline" title={row.name || ''} to={`/admin/courses/${row.courses[0].id}?teacher=${row.id}`}>
                                {displayValue(row.name)}
                              </Link>
                            ) : (
                              <span className="block truncate font-medium text-ink" title={row.name || ''}>{displayValue(row.name)}</span>
                            )}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-ink">{displayValue(row[idField])}</td>
                        <td className="px-3 py-3 text-ink-muted">
                          <span className="block max-w-[14rem] truncate" title={row.email || ''}>{displayValue(row.email)}</span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-ink">{displayValue(row.department)}</td>
                        <td className="min-w-[16rem] px-3 py-3"><TeacherProgram courses={row.courses} teacherId={row.id} /></td>
                        <td className="px-3 py-3"><StatusBadge status={row.accountStatus} /></td>
                        <td className="whitespace-nowrap px-3 py-3">{renderActions(row)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    {columns.map((column) => (
                      <th key={column.key} scope="col" className="px-3 py-3 font-medium">
                        {column.label}
                      </th>
                    ))}
                    <th scope="col" className="px-3 py-3 font-medium">Status</th>
                    <th scope="col" className="w-44 px-3 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id || row.email} className="border-b border-gray-100 align-top">
                      {columns.map((column) => (
                        <td key={column.key} className={`px-3 py-3 text-gray-900 ${column.key === 'email' ? 'whitespace-nowrap' : ''}`}>
                          {column.key === 'programSchedule' ? <ProgramScheduleCell row={row} /> : displayValue(row[column.key])}
                        </td>
                      ))}
                      <td className="px-3 py-3">
                        <StatusBadge status={row.accountStatus} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 align-middle">{renderActions(row)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
            {presentation === 'staff' ? null : (
            <div className="scroll-panel space-y-3 md:hidden">
              {rows.map((row) => (
                <article key={row.id || row.email} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-medium text-gray-900">{displayValue(row.name)}</h3>
                      <p className="break-all text-sm text-gray-600">{displayValue(row.email)}</p>
                    </div>
                    <StatusBadge status={row.accountStatus} />
                  </div>
                  <dl className="mt-3 space-y-1 text-sm">
                    {columns
                      .filter((column) => column.key !== 'name' && column.key !== 'email')
                      .map((column) => (
                        <div key={column.key} className={column.key === 'programSchedule' ? 'space-y-1' : 'flex justify-between gap-3'}>
                          <dt className="text-gray-500">{column.label}</dt>
                          <dd className={column.key === 'programSchedule' ? 'text-gray-900' : 'text-right text-gray-900'}>
                            {column.key === 'programSchedule' ? <ProgramScheduleCell row={row} /> : displayValue(row[column.key])}
                          </dd>
                        </div>
                      ))}
                  </dl>
                  <div className="mt-4 flex flex-wrap gap-2">{renderActions(row)}</div>
                </article>
              ))}
            </div>
            )}
            <div className="mt-4">
              <Pagination
                page={pagination.page || page}
                totalPages={pagination.totalPages || 1}
                total={pagination.total || 0}
                noun={plural}
                onPageChange={setPage}
              />
            </div>
          </>
        ) : null}
      </section>

      <Modal open={formOpen} title={formMode === 'create' ? `Add ${noun}` : `Edit ${noun}`} onClose={closeForm} dismissible={!saving} size="lg">
        <form className="space-y-4" onSubmit={handleSave} noValidate>
          {formError ? <ErrorMessage message={formError} /> : null}
          {detailLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Spinner className="h-4 w-4 text-primary" label="Loading record" />
              Loading latest details
            </div>
          ) : null}
          {formFields.map((field) => (
            <FormField key={field.name} id={`record-${field.name}`} label={field.label} error={formErrors[field.name]}>
              <input
                {...fieldAria(`record-${field.name}`, formErrors[field.name])}
                type={field.type || 'text'}
                autoComplete={field.autoComplete}
                value={form[field.name] || ''}
                onChange={(event) => updateField(field.name, event.target.value)}
                disabled={saving || detailLoading}
                className={inputClassName}
              />
            </FormField>
          ))}
          {formMode === 'create' && loadCourses ? (
            <FormField id="record-course" label="Course">
              <select id="record-course" className={inputClassName} value={courseId} onChange={(event) => setCourseId(event.target.value)} disabled={saving}>
                <option value="">Select course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>{courseOptionLabel(course)}</option>
                ))}
              </select>
            </FormField>
          ) : null}
          {formMode === 'edit' && loadCourses ? (
            <FormField id="record-courses" label="Course">
              <select
                id="record-courses"
                className={inputClassName}
                value={courseId}
                onChange={(event) => {
                  setCourseId(event.target.value);
                  setCourseTouched(true);
                }}
                disabled={saving || detailLoading}
              >
                <option value="">Select course</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>{courseOptionLabel(course)}</option>
                ))}
              </select>
            </FormField>
          ) : null}
          {formMode === 'create' ? (
            <FormField id="record-accountStatus" label="Account status" error={formErrors.accountStatus}>
              <select
                {...fieldAria('record-accountStatus', formErrors.accountStatus)}
                value={form.accountStatus}
                onChange={(event) => updateField('accountStatus', event.target.value)}
                disabled={saving}
                className={inputClassName}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </FormField>
          ) : null}
          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={closeForm} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || detailLoading}>
              {saving ? <Spinner className="h-4 w-4 text-white" label="Saving" /> : null}
              {formMode === 'create' ? `Create ${noun}` : 'Save changes'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirmCopy.title}
        message={confirmCopy.message}
        confirmLabel={confirmCopy.confirmLabel}
        destructive={confirmCopy.destructive}
        loading={confirming}
        error={confirmError}
        onConfirm={handleConfirm}
        onClose={() => {
          if (!confirming) setConfirm(null);
        }}
      />

      <TemporaryPasswordDialog
        open={Boolean(temporaryPassword)}
        password={temporaryPassword}
        audience={noun}
        onClose={() => setTemporaryPassword('')}
      />
    </div>
  );
}
