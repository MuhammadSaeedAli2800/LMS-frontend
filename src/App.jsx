import { useEffect } from 'react';
import { Activity, BarChart3, BookOpen, CalendarCheck, ClipboardList, FileText, GraduationCap, LayoutDashboard, Megaphone, Shield, UserRound, Users } from 'lucide-react';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { DashboardLayout } from './components/DashboardLayout';
import { GuestRoute, ProtectedRoute } from './components/ProtectedRoute';
import { FullPageSpinner } from './components/Spinner';
import { ToastViewport } from './components/ToastViewport';
import { homePathForRole } from './constants';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ActivityPage } from './pages/admin/ActivityPage';
import { AdminAnnouncementsPage } from './pages/admin/AdminAnnouncementsPage';
import { AdminAttendancePage } from './pages/admin/AdminAttendancePage';
import { AttendanceCoursePage } from './pages/admin/AttendanceCoursePage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { DashboardDetailPage } from './pages/admin/DashboardDetailPage';
import { AdminProfilePage } from './pages/admin/AdminProfilePage';
import { AdministratorsPage } from './pages/admin/AdministratorsPage';
import { CourseDetailPage } from './pages/admin/CourseDetailPage';
import { CoursesPage } from './pages/admin/CoursesPage';
import { ReportsPage } from './pages/admin/ReportsPage';
import { CourseReportPage, ReportSectionPage, TeacherReportPage } from './pages/admin/ReportDetailPage';
import { StudentsPage } from './pages/admin/StudentsPage';
import { TeachersPage } from './pages/admin/TeachersPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { LoginPage } from './pages/LoginPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AnnouncementsPage } from './pages/student/AnnouncementsPage';
import { MaterialsPage } from './pages/student/MaterialsPage';
import { AssignmentSubmitPage } from './pages/student/AssignmentSubmitPage';
import { AssignmentsPage, StudentCourseAssignmentsPage } from './pages/student/AssignmentsPage';
import { AttendancePage, StudentAttendanceCoursePage } from './pages/student/AttendancePage';
import { GradesPage } from './pages/student/GradesPage';
import { ProfilePage } from './pages/student/ProfilePage';
import { StudentCoursePage } from './pages/student/StudentCoursePage';
import { StudentCoursesPage } from './pages/student/StudentCoursesPage';
import { StudentDashboard } from './pages/student/StudentDashboard';
import { GradePage, StudentGradePage } from './pages/teacher/GradePage';
import { TeacherAnnouncementsPage } from './pages/teacher/TeacherAnnouncementsPage';
import { TeacherAssignmentsPage } from './pages/teacher/TeacherAssignmentsPage';
import { TeacherAttendancePage } from './pages/teacher/TeacherAttendancePage';
import { TeacherOwnAttendanceCoursePage, TeacherOwnAttendancePage } from './pages/teacher/TeacherOwnAttendancePage';
import { TeacherGradingPage, TeacherTimingPage } from './pages/teacher/TeacherGradingPage';
import { TeacherMaterialsPage } from './pages/teacher/TeacherMaterialsPage';
import { TeacherProfilePage } from './pages/teacher/TeacherProfilePage';
import { TeacherProgressPage } from './pages/teacher/TeacherProgressPage';
import { TeacherCoursePage } from './pages/teacher/TeacherCoursePage';
import { TeacherCoursesPage } from './pages/teacher/TeacherCoursesPage';
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';

const studentNav = [
  { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/student/courses', label: 'Courses', icon: BookOpen },
  { to: '/student/materials', label: 'Learning Materials', icon: FileText },
  { to: '/student/assignments', label: 'Assignments', icon: ClipboardList, end: false },
  { to: '/student/grades', label: 'Grades', icon: GraduationCap },
  { to: '/student/attendance', label: 'Attendance', icon: CalendarCheck, end: false },
  { to: '/student/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/student/profile', label: 'Profile', icon: UserRound },
];
const teacherNav = [
  { to: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/teacher/courses', label: 'My Courses', icon: BookOpen, end: false },
  { to: '/teacher/materials', label: 'Learning Materials', icon: FileText },
  { to: '/teacher/assignments', label: 'Assignments', icon: ClipboardList, end: false },
  { to: '/teacher/grading', label: 'Submissions & Grading', icon: ClipboardList, end: false },
  { to: '/teacher/attendance', label: 'Attendance', icon: CalendarCheck },
  { to: '/teacher/my-attendance', label: 'My Attendance', icon: CalendarCheck, end: false },
  { to: '/teacher/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/teacher/progress', label: 'Student Progress', icon: BarChart3 },
  { to: '/teacher/profile', label: 'My Profile', icon: UserRound },
];
const adminNav = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: false },
  { to: '/admin/students', label: 'Students', icon: Users },
  { to: '/admin/teachers', label: 'Teachers', icon: BookOpen },
  { to: '/admin/courses', label: 'Courses', icon: GraduationCap },
  { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/admin/attendance', label: 'Attendance', icon: CalendarCheck, end: false },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3, end: false },
  { to: '/admin/activity', label: 'Activity', icon: Activity },
  { to: '/admin/administrators', label: 'Administrators', icon: Shield },
  { to: '/admin/profile', label: 'Profile', icon: UserRound },
];

function MustChangeListener() {
  const navigate = useNavigate();
  const { markMustChangePassword } = useAuth();

  useEffect(() => {
    function onMustChange() {
      markMustChangePassword();
      if (window.location.pathname !== '/change-password') {
        navigate('/change-password', { replace: true });
      }
    }
    window.addEventListener('lms:must-change-password', onMustChange);
    return () => window.removeEventListener('lms:must-change-password', onMustChange);
  }, [markMustChangePassword, navigate]);

  return null;
}

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;
  const destination = homePathForRole(user.role);
  if (!destination) return <Navigate to="/login" replace />;
  return <Navigate to={destination} replace />;
}

function StudentShell() {
  return (
    <DashboardLayout items={studentNav} sectionLabel="Learning portal">
      <Outlet />
    </DashboardLayout>
  );
}

function TeacherShell() {
  return (
    <DashboardLayout items={teacherNav} sectionLabel="Learning portal">
      <Outlet />
    </DashboardLayout>
  );
}

function AdminShell() {
  return (
    <DashboardLayout items={adminNav} sectionLabel="Administration">
      <Outlet />
    </DashboardLayout>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner />;

  if (user?.mustChangePassword && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/secure-admin-portal" element={<GuestRoute><AdminLoginPage /></GuestRoute>} />
      <Route
        path="/change-password"
        element={
          <ProtectedRoute allowDuringPasswordChange>
            <ChangePasswordPage />
          </ProtectedRoute>
        }
      />
      <Route
        element={
          <ProtectedRoute roles={['student']} loginPath="/login">
            <StudentShell />
          </ProtectedRoute>
        }
      >
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/courses" element={<StudentCoursesPage />} />
        <Route path="/student/courses/:courseId" element={<StudentCoursePage />} />
        <Route path="/student/materials" element={<MaterialsPage />} />
        <Route path="/student/assignments" element={<AssignmentsPage />} />
        <Route path="/student/assignments/courses/:courseId" element={<StudentCourseAssignmentsPage />} />
        <Route path="/student/assignments/:assignmentId" element={<AssignmentSubmitPage />} />
        <Route path="/student/grades" element={<GradesPage />} />
        <Route path="/student/attendance" element={<AttendancePage />} />
        <Route path="/student/attendance/:courseId" element={<StudentAttendanceCoursePage />} />
        <Route path="/student/announcements" element={<AnnouncementsPage />} />
        <Route path="/student/profile" element={<ProfilePage />} />
      </Route>
      <Route
        element={
          <ProtectedRoute roles={['teacher']} loginPath="/login">
            <TeacherShell />
          </ProtectedRoute>
        }
      >
        <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        <Route path="/teacher/courses" element={<TeacherCoursesPage />} />
        <Route path="/teacher/courses/:courseId" element={<TeacherCoursePage />} />
        <Route path="/teacher/materials" element={<TeacherMaterialsPage />} />
        <Route path="/teacher/assignments" element={<TeacherAssignmentsPage />} />
        <Route path="/teacher/assignments/:assignmentId" element={<GradePage />} />
        <Route path="/teacher/grading" element={<TeacherGradingPage />} />
        <Route path="/teacher/grading/:assignmentId/:timing" element={<TeacherTimingPage />} />
        <Route path="/teacher/grading/:submissionId" element={<StudentGradePage />} />
        <Route path="/teacher/attendance" element={<TeacherAttendancePage />} />
        <Route path="/teacher/my-attendance" element={<TeacherOwnAttendancePage />} />
        <Route path="/teacher/my-attendance/:courseId" element={<TeacherOwnAttendanceCoursePage />} />
        <Route path="/teacher/announcements" element={<TeacherAnnouncementsPage />} />
        <Route path="/teacher/progress" element={<TeacherProgressPage />} />
        <Route path="/teacher/profile" element={<TeacherProfilePage />} />
      </Route>
      <Route
        element={
          <ProtectedRoute roles={['admin']} loginPath="/secure-admin-portal">
            <AdminShell />
          </ProtectedRoute>
        }
      >
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/dashboard/:section" element={<DashboardDetailPage />} />
        <Route path="/admin/students" element={<StudentsPage />} />
        <Route path="/admin/teachers" element={<TeachersPage />} />
        <Route path="/admin/courses" element={<CoursesPage />} />
        <Route path="/admin/announcements" element={<AdminAnnouncementsPage />} />
        <Route path="/admin/courses/:courseId" element={<CourseDetailPage />} />
        <Route path="/admin/attendance" element={<AdminAttendancePage />} />
        <Route path="/admin/attendance/:courseId" element={<AttendanceCoursePage />} />
        <Route path="/admin/reports" element={<ReportsPage />} />
        <Route path="/admin/reports/:section" element={<ReportSectionPage />} />
        <Route path="/admin/reports/courses/:courseId" element={<CourseReportPage />} />
        <Route path="/admin/reports/teachers/:teacherId" element={<TeacherReportPage />} />
        <Route path="/admin/activity" element={<ActivityPage />} />
        <Route path="/admin/administrators" element={<AdministratorsPage />} />
        <Route path="/admin/profile" element={<AdminProfilePage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <MustChangeListener />
          <AppRoutes />
          <ToastViewport />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
