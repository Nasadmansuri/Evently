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
import FeedbackBuilder from './features/faculty/pages/FeedbackBuilder';
import Registration from './features/events/pages/Registration';
import StudentDashboard from './features/student/pages/StudentDashboard';
import MyRegistrations from './features/student/pages/MyRegistrations';
import FeedbackForm from './features/events/pages/FeedbackForm';
import MyFeedback from './features/student/pages/MyFeedback';
import ManageEvents from './features/admin/pages/ManageEvents';


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
        path="/faculty/events/:eventId/feedback"
        element={
          <ProtectedRoute allowedRoles={['faculty']}>
            <Layout>
              <FeedbackBuilder />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/events"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <ManageEvents />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/events/:eventId/feedback"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <FeedbackBuilder />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/events/:eventId/edit"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <CreateEvent />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/create-event"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <Layout>
              <CreateEvent />
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
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Layout>
              <StudentDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/my-registrations"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Layout>
              <MyRegistrations />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/events/:id/feedback"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Layout>
              <FeedbackForm />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/my-feedback"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <Layout>
              <MyFeedback />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}