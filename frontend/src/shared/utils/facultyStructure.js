// Locked Department -> Designation cascade for Faculty Signup.
// "Business Academics" has designations: null, meaning render a free-text input
// instead of a dropdown (no fixed designation list for that department).
export const DEPARTMENT_DESIGNATIONS = {
  'SSD (Student Service Department)': ['Manager', 'Officer'],
  'PAT (Personal Academic Tutor)': ['Assistant Liaison Officer', 'Manager', 'Officer'],
  'Registry, Timetable & Examination Department': ['Manager', 'Officer'],
  'IT Academics': ['Module Leader', 'Lecturer', 'Tutor', 'GTA'],
  'Business Academics': ['Module Leader', 'Lecturer', 'Tutor', 'GTA'],
  'DevCorps': ['DevCorps Head'],
};

// BIC DevCorps community — optional field on Faculty Signup, also used as
// "Organizing Community" on Create Event and the Browse Events filter.
export const COMMUNITIES = ['DevCorps Core', 'Devsphere', 'AI Horizon', 'BIC Converge', 'Incognitus', 'N/A'];