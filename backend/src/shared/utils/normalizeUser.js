function normalizeUser(row) {
  if (!row) return null;

  const {
    sp_college_name, faculty_name, course_name, academic_level, academic_semester, academic_group,
    gp_college_name, course_major,
    faculty_id_code, department, designation, community, approval_status,
    ...core
  } = row;

  const user = { ...core };

  if (core.role === 'student') {
    const isAffiliated = sp_college_name != null;
    user.is_bic_student = isAffiliated;
    user.is_affiliated = isAffiliated;
    user.is_guest = !isAffiliated;
    user.display_role = isAffiliated ? 'student' : 'guest';
    if (isAffiliated) {
      Object.assign(user, {
        college_name: sp_college_name,
        faculty_name, course_name, academic_level, academic_semester, academic_group,
      });
    } else {
      Object.assign(user, { college_name: gp_college_name, course_major });
    }
  }

  if (core.role === 'faculty') {
    Object.assign(user, { faculty_id_code, department, designation, community, approval_status });
  }

  return user;
}

module.exports = normalizeUser;