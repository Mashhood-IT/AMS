import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import UsersList from './pages/UserLogs/UsersList';
import AddUser from './pages/UserLogs/AddUser';
import EditProfile from './pages/UserLogs/EditProfile';
import Courses from './pages/Courses/Courses';
import CoursesList from './pages/Courses/CoursesList';
import AddCourse from './pages/Courses/AddCourse';
import AddInstitute from './pages/Institutes/AddInstitute';
import InstitutesList from './pages/Institutes/InstitutesList';
import StudentsList from './pages/Students/StudentsList';

import Attendance from './pages/Attendance/Attendance';
import MarkAttendance from './pages/Attendance/MarkAttendance';

// Placeholder components for future development
const Reports = () => <div className="stat-card"><h2>System Reports</h2><p>Feature coming soon...</p></div>;
const Settings = () => <div className="stat-card"><h2>Settings</h2><p>Feature coming soon...</p></div>;

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<AuthLayout />}>
            <Route index element={<LoginPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
            <Route path="forgot-password" element={<ForgotPassword />} />
            <Route path="reset-password/:token" element={<ResetPassword />} />
          </Route>

          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />

            <Route path="attendance" element={<Attendance />}>
              <Route index element={<Navigate to="mark" replace />} />
              <Route path="mark" element={<MarkAttendance />} />
            </Route>

            <Route path="students" element={<StudentsList />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<EditProfile />} />
            <Route path="user-logs">
              <Route index element={<Navigate to="users-list" replace />} />
              <Route path="users-list" element={<UsersList />} />
              <Route path="add-user" element={<AddUser />} />
              <Route path="edit-user/:id" element={<AddUser />} />
            </Route>

            <Route path="courses" element={<Courses />} >
              <Route index element={<Navigate to="courses-list" replace />} />
              <Route path="courses-list" element={<CoursesList />} />
              <Route path="add-course" element={<AddCourse />} />
              <Route path="edit-course/:id" element={<AddCourse />} />
            </Route>

            <Route path="institutes">
              <Route index element={<Navigate to="list" replace />} />
              <Route path="list" element={<InstitutesList />} />
              <Route path="add" element={<AddInstitute />} />
              <Route path="edit/:id" element={<AddInstitute />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </>
  );
}


export default App;

