import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { CourseStatus } from '../../components/CourseStatus';
import { ScheduleText } from '../../components/ScheduleText';
import { EmptyState } from '../../components/EmptyState';
import { ErrorMessage } from '../../components/ErrorMessage';
import { PageHeader } from '../../components/PageHeader';
import { Spinner } from '../../components/Spinner';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { fetchDashboard } from '../../services/adminService';

const SECTIONS = {
  students: {
    title: 'Students',
    description: 'Each student, with their courses listed underneath.',
  },
  teachers: {
    title: 'Teachers',
    description: 'Each teacher, with their courses listed underneath.',
  },
  courses: {
    title: 'All courses',
    description: 'Every course, with its students and teachers.',
  },
  published: {
    title: 'Published courses',
    description: 'Courses students can currently see.',
  },
  assignments: {
    title: 'Assignments in each course',
    description: 'Assignment titles grouped by course.',
  },
};

function countLabel(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function PeopleList({ people, codeKey, emptyTitle, emptyDescription }) {
  if (people.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <ul className="scroll-panel divide-y divide-gray-200">
      {people.map((person) => (
        <li key={person.id} className="px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {person.name}{person[codeKey] ? ` (${person[codeKey]})` : ''}
              </p>
              <p className="mt-0.5 break-words text-sm text-gray-600">{person.email}</p>
              {person.className ? <p className="text-sm text-gray-500">{person.className}</p> : null}
            </div>
            <p className="shrink-0 text-sm font-medium text-gray-900">{countLabel(person.courseCount, 'course')}</p>
          </div>
          {person.courses.length === 0 ? (
            <p className="mt-2 text-sm text-gray-600">No courses assigned</p>
          ) : (
            <ul className="mt-3 space-y-3 border-l border-gray-200 pl-4">
              {person.courses.map((course) => (
                <li key={course.id}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link className="text-sm text-gray-900 hover:text-primary hover:underline" to={`/admin/courses/${course.id}`}>
                      {course.title} ({course.courseCode})
                    </Link>
                    <CourseStatus status={course.status} />
                  </div>
                  <div className="mt-1"><ScheduleText course={course} empty="No class days or time set" /></div>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

function teacherNames(course) {
  if (!course.teachers.length) return 'No teacher assigned';
  return course.teachers.map((teacher) => (teacher.teacherId ? `${teacher.name} (${teacher.teacherId})` : teacher.name)).join(', ');
}

export function DashboardDetailPage() {
  const { section } = useParams();
  const config = SECTIONS[section];
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  useDocumentTitle(config?.title || 'Dashboard');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await fetchDashboard();
      setSummary(result.data || {});
    } catch (err) {
      setSummary(null);
      setError(err.message || 'Could not load this page.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!config) return;
    load();
  }, [config, load, reloadKey]);

  if (!config) return <Navigate to="/admin/dashboard" replace />;

  const courses = Array.isArray(summary?.courseBreakdown) ? summary.courseBreakdown : [];
  const teachers = Array.isArray(summary?.teacherBreakdown) ? summary.teacherBreakdown : [];
  const students = Array.isArray(summary?.studentBreakdown) ? summary.studentBreakdown : [];
  const visible = section === 'published' ? courses.filter((course) => course.status === 'published') : courses;

  return (
    <div className="space-y-6">
      <PageHeader back={{ to: '/admin/dashboard', label: 'Back to dashboard' }} title={config.title} description={config.description} />

      {loading ? (
        <div className="panel flex min-h-40 items-center justify-center">
          <Spinner className="h-6 w-6 text-primary" label="Loading details" />
        </div>
      ) : null}
      {!loading && error ? <ErrorMessage message={error} onRetry={() => setReloadKey((value) => value + 1)} /> : null}
      {!loading && !error && summary ? (
        <section className="panel overflow-hidden">
          <div className="border-b border-gray-200 px-5 py-4">
            {section === 'students' ? (
              <p className="text-sm text-gray-600">{countLabel(Number(summary.totalStudents) || 0, 'student')} in the school.</p>
            ) : null}
            {section === 'teachers' ? <p className="text-sm text-gray-600">{countLabel(Number(summary.totalTeachers) || 0, 'teacher')} in the school.</p> : null}
            {section === 'courses' ? <p className="text-sm text-gray-600">{countLabel(courses.length, 'course')} in the school.</p> : null}
            {section === 'published' ? <p className="text-sm text-gray-600">{countLabel(visible.length, 'published course')}.</p> : null}
            {section === 'assignments' ? <p className="text-sm text-gray-600">{countLabel(Number(summary.totalAssignments) || 0, 'assignment')} in total.</p> : null}
          </div>
          {section === 'students' ? (
            <PeopleList
              people={students}
              codeKey="studentId"
              emptyTitle="No students yet"
              emptyDescription="Create a student account to see it here."
            />
          ) : section === 'teachers' ? (
            <PeopleList
              people={teachers}
              codeKey="teacherId"
              emptyTitle="No teachers yet"
              emptyDescription="Create a teacher account to see it here."
            />
          ) : visible.length === 0 ? (
            <EmptyState title="Nothing to show" description="Create a course to see this breakdown." />
          ) : (
            <ul className="scroll-panel divide-y divide-gray-200">
              {visible.map((course) => (
                <li key={course.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link className="text-sm font-medium text-gray-900 hover:text-primary hover:underline" to={`/admin/courses/${course.id}`}>
                        {course.title} ({course.courseCode})
                      </Link>
                      <CourseStatus status={course.status} />
                    </div>
                    <ScheduleText course={course} />
                    {section === 'courses' || section === 'published' ? (
                      <p className="mt-1 text-sm text-gray-600">{teacherNames(course)}</p>
                    ) : null}
                    {section === 'assignments' ? (
                      course.assignments.length === 0 ? <p className="mt-1 text-sm text-gray-600">No assignments</p> : (
                        <ul className="mt-1 space-y-1">
                          {course.assignments.map((assignment) => (
                            <li key={assignment.id} className="text-sm text-gray-600">{assignment.title}</li>
                          ))}
                        </ul>
                      )
                    ) : null}
                  </div>
                  <p className="shrink-0 text-sm font-medium text-gray-900">
                    {section === 'assignments'
                        ? countLabel(course.assignmentCount, 'assignment')
                        : section === 'courses' || section === 'published'
                          ? `${countLabel(course.studentCount, 'student')} · ${countLabel(course.teacherCount, 'teacher')}`
                          : countLabel(course.studentCount, 'student')}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
