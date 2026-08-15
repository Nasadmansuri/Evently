import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './features/auth/pages/Login';
import StudentSignup from './features/auth/pages/StudentSignup';
import FacultySignup from './features/auth/pages/FacultySignup';
import ProtectedRoute from './shared/components/ProtectedRoute';
import Layout from './shared/layout/Layout';
import AdminDashboard from './features/admin/pages/AdminDashboard';
import FacultyDashboard from './features/faculty/pages/FacultyDashboard';
import CreateEvent from './features/faculty/pages/CreateEvent';
import BrowseEvents from './features/events/pages/BrowseEvents';
import EventDetail from './features/events/pages/EventDetail';
import MyEvents from './features/faculty/pages/MyEvents';
import Registration from './features/events/pages/Registration';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup/student" element={<StudentSignup />} />
      <Route path="/signup/faculty" element={<FacultySignup />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/dashboard"
        element={
          <ProtectedRoute allowedRoles={['faculty']}>
            <Layout>
              <FacultyDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/create-event"
        element={
          <ProtectedRoute allowedRoles={['faculty']}>
            <Layout>
              <CreateEvent />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/events"
        element={
          <ProtectedRoute>
            <Layout>
              <BrowseEvents />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/events/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <EventDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/faculty/my-events"
        element={
          <ProtectedRoute allowedRoles={['faculty']}>
            <Layout>
              <MyEvents />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/events/:id/register"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Layout>
              <Registration />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}