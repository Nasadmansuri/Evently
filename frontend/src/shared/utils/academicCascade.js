// Shared academic structure — all Wolverhampton-affiliated colleges use the same
// Faculty -> Course -> Level structure as BIC.
export const ACADEMIC_STRUCTURE = {
  'School of Architecture, Computing and Engineering': {
    'BSc (Hons) Computer Science': { levels: [4, 5, 6], semestersPerLevel: 2 },
    'BSc (Hons) Cybersecurity': { levels: [4, 5, 6], semestersPerLevel: 2 },
  },
  'School of Business and Law': {
    'BSc (Hons) International Business Management': { levels: [3, 4, 5, 6], semestersPerLevel: 2 },
    'International MBA': { levels: [7], semestersPerLevel: 3 },
  },
};

export const GROUPS = Array.from({ length: 10 }, (_, i) => `G${i + 1}`);

// Wolverhampton-affiliated colleges — each maps to a short display name for the badge,
// but all share ACADEMIC_STRUCTURE above.
const AFFILIATED_COLLEGES = {
  bic: 'BIC',
  'biratnagar international college': 'BIC',
  herald: 'Herald',
  'herald college': 'Herald',
  'herald college kathmandu': 'Herald',
  fishtail: 'Fishtail',
  'fishtail mountain': 'Fishtail',
  'fishtail mountain college': 'Fishtail',
};

// Given raw college-name input, returns the matched short name (e.g. "BIC", "Herald"),
// or null if it doesn't match any affiliated college — falls back to Guest Participant.
export function matchAffiliatedCollege(collegeNameInput) {
  const normalized = (collegeNameInput || '').trim().toLowerCase();
  return AFFILIATED_COLLEGES[normalized] || null;
}
// Fishtail only offers Computer Science and Cybersecurity (Faculty of Computing) —
// no Business faculty. BIC and Herald offer both faculties.
const FACULTY_RESTRICTIONS = {
  Fishtail: ['School of Architecture, Computing and Engineering'],
};

export function getFacultiesForCollege(shortName) {
  const allowed = FACULTY_RESTRICTIONS[shortName];
  return allowed || Object.keys(ACADEMIC_STRUCTURE);
}

export function getSemestersForLevel(facultyName, courseName, level) {
  const course = ACADEMIC_STRUCTURE[facultyName]?.[courseName];
  if (!course) return [];
  const levelIndex = course.levels.indexOf(Number(level));
  if (levelIndex === -1) return [];
  const start = levelIndex * course.semestersPerLevel + 1;
  return Array.from({ length: course.semestersPerLevel }, (_, i) => start + i);
}