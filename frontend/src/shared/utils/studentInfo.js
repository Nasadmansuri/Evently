export function getStudentCourseLabel(user) {
  if (!user) return '';
  if (user.is_bic_student) {
    return `${user.course_name} · Level ${user.academic_level}`;
  }
  return user.course_major || '';
}