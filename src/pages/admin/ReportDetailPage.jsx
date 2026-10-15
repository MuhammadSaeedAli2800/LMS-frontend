import { useCallback, useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { CourseStatus } from '../../components/CourseStatus';
import { EmptyState } from '../../components/EmptyState';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageHeader } from '../../components/PageHeader';
import { ScheduleText } from '../../components/ScheduleText';
import { Spinner } from '../../components/Spinner';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { fetchCourseReport, fetchReportWork, fetchTeacherReport } from '../../services/academicService';
import { formatStatus } from '../../utils/format';

const SECTIONS = {
  enrollments: {
    title: 'Students in each course',
    description: 'Every enrolled student, listed under the course they belong to.',
  },
  submissions: {
    title: 'Assignment submissions',
    description: 'Each student is marked submitted, late, or not submitted for every published assignment.',
  },
  late: {
    title: 'Late submissions',
    description: 'Work that was turned in after the due time.',
  },
  attendance: {
    title: 'Student attendance',
    description: 'Present, absent, late, and leave for each student, with the day of each mark.',
  },
};

const WORK_LABEL = {
  submitted: 'Submitted',
  late: 'Late',
  missing: 'Not submitted',
};

function formatDay(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(date);
}

function CourseHeading({ course, level = 2 }) {
  const Title = level === 1 ? 'h1' : 'h2';
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Title className={level === 1 ? 'text-2xl font-semibold tracking-tight text-ink' : 'text-base font-semibold text-ink'}>{course.title}</Title>
        <CourseStatus status={course.status} />
      </div>
      <p className="mt-0.5 text-sm text-gray-500">{course.courseCode}</p>
      <ScheduleText course={course} empty="No class days or time set" />
    </div>
  );
}

function AssignmentLine({ assignment }) {
  const mark = assignment.marks === null || assignment.marks === undefined ? '' : ` · ${assignment.marks}/${assignment.maxMarks}`;
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm">
      <span className="text-gray-900">{assignment.title}</span>
      <span className="whitespace-nowrap text-gray-600">{WORK_LABEL[assignment.state] || formatStatus(assignment.state)}{mark}</span>
    </li>
  );
}

function StudentWork({ student }) {
  return (
    <div className="border-b border-gray-100 py-4 last:border-b-0">
      <p className="font-medium text-gray-900">{student.name}</p>
      <p className="whitespace-nowrap text-sm text-gray-500">{student.email}{student.studentNumber ? ` · ${student.studentNumber}` : ''}</p>
      {student.assignments.length === 0 ? <p className="mt-2 text-sm text-gray-600">No published assignments.</p> : (
        <ul className="mt-2 divide-y divide-gray-100">{student.assignments.map((assignment) => <AssignmentLine key={assignment.id} assignment={assignment} />)}</ul>
      )}
    </div>
  );
}

function StudentAttendance({ student, hideIdentity = false }) {
  const attendance = student.attendance || {};
  return (
    <div className="border-b border-gray-100 py-4 last:border-b-0">
      {hideIdentity ? null : (
        <>
          <p className="font-medium text-gray-900">{student.name}</p>
          <p className="whitespace-nowrap text-sm text-gray-500">{student.email}{student.studentNumber ? ` · ${student.studentNumber}` : ''}</p>
        </>
      )}
      <p className={`${hideIdentity ? '' : 'mt-2 '}text-sm text-gray-700`}>Present {attendance.present || 0} · Absent {attendance.absent || 0} · Late {attendance.late || 0} · Leave {attendance.leave || 0}</p>
      {student.records?.length ? (
        <ul className="mt-2 space-y-1 text-sm text-gray-600">
          {student.records.map((record) => (
            <li key={`${record.sessionDate}-${record.status}`}>{formatDay(record.sessionDate)} · {formatStatus(record.status)}</li>
          ))}
        </ul>
      ) : <p className="mt-2 text-sm text-gray-600">No attendance marked.</p>}
    </div>
  );
}

export function ReportSectionPage() {
  const { section } = useParams();
  const config = SECTIONS[section];
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useDocumentTitle(config?.title || 'Reports');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchReportWork();
      setCourses(result.data.courses || []);
    } catch (err) {
      setError(err.message || 'Could not load this report.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (config) load();
  }, [config, load]);

  if (!config) return <Navigate to="/admin/reports" replace />;
  if (loading) {
    return <div className="flex min-h-40 items-center justify-center"><Spinner className="h-6 w-6 text-primary" label="Loading report" /></div>;
  }
  if (error) return <ErrorMessage message={error} onRetry={load} />;

  const lateRows = courses.flatMap((course) => course.students.flatMap((student) => (
    student.assignments.filter((assignment) => assignment.state === 'late').map((assignment) => ({
      key: `${course.courseId}-${student.id}-${assignment.id}`,
      course,
      student,
      assignment,
    }))
  )));

  return (
    <div className="space-y-6">
      <PageHeader back={{ to: '/admin/reports', label: 'All reports' }} title={config.title} description={config.description} />
      {courses.length === 0 ? <div className="panel"><EmptyState title="Nothing to show" description="Create a course to see this report." /></div> : null}
      {section === 'late' && courses.length > 0 && lateRows.length === 0 ? <div className="panel"><EmptyState title="No late submissions" description="Late work will be listed here after a student turns something in past the due time." /></div> : null}
      {section === 'late' ? lateRows.map((row) => (
        <article key={row.key} className="panel p-5">
          <p className="font-medium text-gray-900">{row.student.name}</p>
          <p className="text-sm text-gray-600">{row.assignment.title} · {row.course.title} ({row.course.courseCode})</p>
          <ScheduleText course={row.course} />
          <p className="mt-1 text-sm text-gray-600">Turned in {formatDay(row.assignment.submittedAt)}</p>
        </article>
      )) : null}
      {section !== 'late' ? courses.map((course) => (
        <article key={course.courseId} className="panel p-5">
          <CourseHeading course={course} />
          {course.students.length === 0 ? <p className="mt-4 text-sm text-gray-600">No students enrolled.</p> : (
            <div className="scroll-panel mt-4">
              {section === 'enrollments' ? course.students.map((student) => (
                <div key={student.id} className="border-b border-gray-100 py-3 last:border-b-0">
                  <p className="font-medium text-gray-900">{student.name}</p>
                  <p className="whitespace-nowrap text-sm text-gray-500">{student.email}{student.studentNumber ? ` · ${student.studentNumber}` : ''}</p>
                </div>
              )) : null}
              {section === 'submissions' ? course.students.map((student) => <StudentWork key={student.id} student={student} />) : null}
              {section === 'attendance' ? course.students.map((student) => <StudentAttendance key={student.id} student={student} />) : null}
            </div>
          )}
        </article>
      )) : null}
    </div>
  );
}

export function CourseReportPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useDocumentTitle(course?.title || 'Course report');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchCourseReport(courseId);
      setCourse(result.data.course);
    } catch (err) {
      setError(err.message || 'Could not load this course report.');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <div className="flex min-h-40 items-center justify-center"><Spinner className="h-6 w-6 text-primary" label="Loading course report" /></div>;
  }
  if (error || !course) return <ErrorMessage message={error || 'Course report not found.'} onRetry={load} />;

  return (
    <div className="space-y-6">
      <div>
        <PageHeader back={{ to: '/admin/reports', label: 'All reports' }} title={course.title} description={`${course.students.length} ${course.students.length === 1 ? 'student' : 'students'} enrolled.`}>
          <CourseStatus status={course.status} />
        </PageHeader>
        <div className="mt-2"><ScheduleText course={course} empty="No class days or time set" /></div>
      </div>
      {course.students.length === 0 ? <div className="panel"><EmptyState title="No students enrolled" description="Enroll students to see their submissions and attendance." /></div> : (
        <ul className="space-y-4">
          {course.students.map((student) => (
            <li key={student.id} className="panel p-5">
              <p className="font-medium text-gray-900">{student.name}</p>
              <p className="whitespace-nowrap text-sm text-gray-500">{student.email}{student.studentNumber ? ` · ${student.studentNumber}` : ''}</p>
              <h3 className="mt-4 text-sm font-semibold text-gray-900">Assignments</h3>
              {student.assignments.length === 0 ? <p className="mt-2 text-sm text-gray-600">No published assignments.</p> : (
                <ul className="divide-y divide-gray-100">{student.assignments.map((assignment) => <AssignmentLine key={assignment.id} assignment={assignment} />)}</ul>
              )}
              <h3 className="mt-4 text-sm font-semibold text-gray-900">Attendance</h3>
              <StudentAttendance student={student} hideIdentity />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function TeacherReportPage() {
  const { teacherId } = useParams();
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useDocumentTitle(teacher?.name || 'Teacher report');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchTeacherReport(teacherId);
      setTeacher(result.data.teacher);
    } catch (err) {
      setError(err.message || 'Could not load this teacher report.');
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <div className="flex min-h-40 items-center justify-center"><Spinner className="h-6 w-6 text-primary" label="Loading teacher report" /></div>;
  }
  if (error || !teacher) return <ErrorMessage message={error || 'Teacher report not found.'} onRetry={load} />;

  const attendance = teacher.attendance || {};

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ to: '/admin/reports', label: 'All reports' }}
        title={teacher.name}
        description={`${teacher.email}${teacher.teacherCode ? ` · ${teacher.teacherCode}` : ''}. Present ${attendance.present || 0} · Absent ${attendance.absent || 0} · Leave ${attendance.leave || 0}.`}
      />
      {teacher.courses.length === 0 ? <div className="panel"><EmptyState title="No courses assigned" description="Assign this teacher to a course to see attendance here." /></div> : teacher.courses.map((course) => (
        <article key={course.courseId} className="panel p-5">
          <CourseHeading course={course} />
          <p className="mt-2 text-sm text-gray-600">{course.students} {course.students === 1 ? 'student' : 'students'}</p>
          <h3 className="mt-4 text-sm font-semibold text-gray-900">Attendance</h3>
          {course.records.length === 0 ? <p className="mt-2 text-sm text-gray-600">No attendance marked.</p> : (
            <ul className="scroll-panel mt-2 space-y-1 text-sm text-gray-700">
              {course.records.map((record) => (
                <li key={`${record.sessionDate}-${record.status}`}>{formatDay(record.sessionDate)} · {formatStatus(record.status)}</li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </div>
  );
}
