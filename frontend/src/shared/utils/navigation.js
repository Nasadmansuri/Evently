export function getDashboardPath(user) {
  if (!user) return '/login';
  if (user.role === 'admin') return '/admin/dashboard';
  if (user.role === 'faculty') return '/faculty/dashboard';
  if (user.role === 'student') return '/student/dashboard';
  return '/events';
}
