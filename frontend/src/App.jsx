import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './features/auth/pages/Login';
import StudentSignup from './features/auth/pages/StudentSignup';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup/student" element={<StudentSignup />} />
    </Routes>
  );
}