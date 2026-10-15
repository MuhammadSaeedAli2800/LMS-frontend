import { useCallback, useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { CourseStatus } from '../../components/CourseStatus';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { ErrorMessage } from '../../components/ErrorMessage';
import { FormField, inputClassName } from '../../components/FormField';
import { ScheduleText } from '../../components/ScheduleText';
import { Spinner } from '../../components/Spinner';
import { useToast } from '../../context/ToastContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { fetchAttendance, fetchTeacherCourses, saveAttendance } from '../../services/academicService';
import { downloadCsv } from '../../utils/csv';

function formatDay(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(date);
}

export function TeacherAttendancePage() {
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [marks, setMarks] = useState({});
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useDocumentTitle('Attendance');

  const loadCourses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchTeacherCourses();
      const list = (result.data.courses || []).filter((course) => course.status !== 'archived');
      setCourses(result.data.courses || []);
      setCourseId((current) => current || list[0]?.id || result.data.courses?.[0]?.id || '');
    } catch (err) {
      setError(err.message || 'Could not load courses.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDay = useCallback(async () => {
    if (!courseId || !sessionDate) return;
    try {
      const result = await fetchAttendance(courseId, sessionDate);
      const course = courses.find((item) => item.id === courseId);
      const next = {};
      (course?.students || []).forEach((student) => { next[student.id] = 'present'; });
      (result.data.records || []).forEach((record) => {
        if (['present', 'absent', 'late'].includes(record.status)) next[record.studentId] = record.status;
      });
      setMarks(next);
      const history = await fetchAttendance(courseId);
      setRecords(history.data.records || []);
    } catch (err) {
      toast.error(err.message || 'Could not load attendance.');
    }
  }, [courseId, courses, sessionDate]);

  useEffect(() => { loadCourses(); }, [loadCourses]);
  useEffect(() => { loadDay(); }, [loadDay]);

  const course = courses.find((item) => item.id === courseId);
  const students = course?.students || [];

  async function onSave(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await saveAttendance(courseId, {
        sessionDate,
        records: students.map((student) => ({ studentId: student.id, status: marks[student.id] || 'present' })),
      });
      toast.success('Attendance saved.');
      await loadDay();
    } catch (err) {
      toast.error(err.message || 'Could not save attendance.');
    } finally {
      setBusy(false);
    }
  }

  function onExport() {
    downloadCsv(`${course?.courseCode || 'attendance'}-attendance.csv`, [
      ['Student', 'Student ID', 'Date', 'Status'],
      ...records.map((record) => [record.studentName, record.studentNumber, formatDay(record.sessionDate), record.status]),
    ]);
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" description="Choose one of your courses and a class day, then mark each enrolled student present, absent, or late." />
      {loading ? <div className="flex min-h-40 items-center justify-center"><Spinner className="h-6 w-6 text-primary" label="Loading attendance" /></div> : null}
      {!loading && error ? <ErrorMessage message={error} onRetry={loadCourses} /> : null}
      {!loading && !error && courses.length === 0 ? <div className="panel"><EmptyState title="No assigned courses" /></div> : null}
      {!loading && !error && course ? (
        <>
          <form className="panel space-y-4 p-5" onSubmit={onSave}>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField id="attendance-course" label="Course">
                <select id="attendance-course" className={inputClassName} value={courseId} onChange={(event) => setCourseId(event.target.value)}>
                  {courses.map((item) => <option key={item.id} value={item.id}>{item.title} · {item.courseCode}</option>)}
                </select>
              </FormField>
              <FormField id="attendance-date" label="Session date">
                <input id="attendance-date" type="date" className={inputClassName} value={sessionDate} onChange={(event) => setSessionDate(event.target.value)} required />
              </FormField>
            </div>
            <ScheduleText course={course} />
            {course.status === 'archived' ? <p className="text-sm text-gray-600">This course is archived, so attendance cannot be changed.</p> : null}
            {students.length === 0 ? <EmptyState title="No enrolled students" /> : students.map((student) => (
              <label key={student.id} className="flex flex-col gap-2 border-t border-gray-100 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <span className="font-medium text-gray-900">{student.name} <span className="font-normal text-gray-500">{student.studentId}</span></span>
                <select className={inputClassName} value={marks[student.id] || 'present'} onChange={(event) => setMarks((current) => ({ ...current, [student.id]: event.target.value }))} disabled={course.status === 'archived'}>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                </select>
              </label>
            ))}
            <Button type="submit" disabled={busy || course.status === 'archived' || students.length === 0}>{busy ? 'Saving…' : 'Save attendance'}</Button>
          </form>
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-gray-900">Saved records</h2>
              <Button type="button" variant="secondary" onClick={onExport} disabled={records.length === 0}>Export attendance</Button>
            </div>
            {records.length === 0 ? <p className="panel px-5 py-4 text-sm text-gray-600">No attendance has been marked for this course.</p> : (
              <ul className="scroll-panel panel divide-y divide-line">
                {[...records].sort((left, right) => String(right.sessionDate).localeCompare(String(left.sessionDate)) || String(left.studentName).localeCompare(String(right.studentName))).map((record) => (
                  <li key={record.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                    <CourseStatus status={record.status} />
                    <p className="font-medium text-gray-900">{formatDay(record.sessionDate)}</p>
                    <p className="text-gray-700">{record.studentName}{record.studentNumber ? ` (${record.studentNumber})` : ''}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
