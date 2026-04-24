import { Navigate, Route, Routes } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import FeaturesPage from './pages/FeaturesPage';
import SecurityPage from './pages/SecurityPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFoundPage from './pages/NotFoundPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProfilePage from './pages/admin/AdminProfilePage';
import StudentsPage from './pages/admin/StudentsPage';
import TeachersPage from './pages/admin/TeachersPage';
import SubjectsPage from './pages/admin/SubjectsPage';
import AttendanceReportsPage from './pages/admin/AttendanceReportsPage';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfilePage from './pages/student/StudentProfilePage';
import RegisterFacePage from './pages/student/RegisterFacePage';
import MarkAttendancePage from './pages/student/MarkAttendancePage';
import AttendanceHistoryPage from './pages/student/AttendanceHistoryPage';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherProfilePage from './pages/teacher/TeacherProfilePage';
import TeacherSubjectsPage from './pages/teacher/TeacherSubjectsPage';
import GenerateQRPage from './pages/teacher/GenerateQRPage';
import ManualAttendancePage from './pages/teacher/ManualAttendancePage';
import TeacherReportsPage from './pages/teacher/TeacherReportsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/security" element={<SecurityPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
      </Route>

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <DashboardLayout role="ADMIN" />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="profile" element={<AdminProfilePage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="teachers" element={<TeachersPage />} />
        <Route path="subjects" element={<SubjectsPage />} />
        <Route path="attendance-reports" element={<AttendanceReportsPage />} />
      </Route>

      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <DashboardLayout role="STUDENT" />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="profile" element={<StudentProfilePage />} />
        <Route path="register-face" element={<RegisterFacePage />} />
        <Route path="mark-attendance" element={<MarkAttendancePage />} />
        <Route path="attendance-history" element={<AttendanceHistoryPage />} />
      </Route>

      <Route
        path="/teacher"
        element={
          <ProtectedRoute allowedRoles={['TEACHER']}>
            <DashboardLayout role="TEACHER" />
          </ProtectedRoute>
        }
      >
        <Route index element={<TeacherDashboard />} />
        <Route path="profile" element={<TeacherProfilePage />} />
        <Route path="subjects" element={<TeacherSubjectsPage />} />
        <Route path="generate-qr" element={<GenerateQRPage />} />
        <Route path="manual-attendance" element={<ManualAttendancePage />} />
        <Route path="attendance-reports" element={<TeacherReportsPage />} />
      </Route>

      <Route path="/403" element={<UnauthorizedPage />} />
      <Route path="*" element={<NotFoundPage />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
