// Locked Department -> Designation cascade for Faculty Signup.
// "Business Academics" has designations: null, meaning render a free-text input
// instead of a dropdown (no fixed designation list for that department).
export const DEPARTMENT_DESIGNATIONS = {
  'IT Academics': ['Module Leader', 'Lecturer', 'Tutor', 'GTA'],
  'Business Academics': ['Module Leader', 'Lecturer', 'Tutor', 'GTA'],
  'SSD (Student Service Department)': ['Manager', 'Officer'],
  'PAT (Personal Academic Tutor)': ['Assistant Liaison Officer', 'Manager', 'Officer'],
  'Registry, Timetable & Examination Department': ['Manager', 'Officer'],
  'DevCorps': ['Faculty Advisor', 'Faculty Coordinator', 'Community Lead', 'Chapter Head', 'Student Lead'],
};

// BIC DevCorps communities — 4 primary specialized chapters + DevCorps Core (Main).
export const COMMUNITIES = [
  'DevCorps Core',
  'DevSphere',
  'AI Horizon',
  'BIC Converge',
  'inCognitus',
];

export const COMMUNITY_DETAILS = {
  'DevCorps Core': {
    name: 'DevCorps Core',
    label: 'DevCorps Core (Main Campus Chapter)',
    badge: 'Campus Flagship',
    tagline: 'Flagship Campus Events & All-Chapter Summits',
  },
  'DevSphere': {
    name: 'DevSphere',
    label: 'DevSphere (Web Development & Open-Source)',
    badge: 'Web & Open-Source',
    tagline: 'Web Development & Open-Source Engineering',
  },
  'AI Horizon': {
    name: 'AI Horizon',
    label: 'AI Horizon (AI & Intelligent Systems)',
    badge: 'AI & Data Science',
    tagline: 'Artificial Intelligence & Intelligent Systems',
  },
  'BIC Converge': {
    name: 'BIC Converge',
    label: 'BIC Converge (Business & Incubation)',
    badge: 'Business & Incubation',
    tagline: 'Business, Applied Learning & Incubation',
  },
  'inCognitus': {
    name: 'inCognitus',
    label: 'inCognitus (Cybersecurity & Ethical Hacking)',
    badge: 'Cybersecurity & CTF',
    tagline: '<Identity is a Variable> • Cybersecurity',
  },
};