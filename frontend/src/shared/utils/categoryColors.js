export const CATEGORY_COLORS = {
  Technical: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-600' },
  Hackathon: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-600' },
  Workshop: { bg: 'bg-amber-50', text: 'text-amber-800', dot: 'bg-amber-600' },
  Competition: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-600' },
  Cultural: { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-600' },
  Seminar: { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-600' },
  Sports: { bg: 'bg-teal-50', text: 'text-teal-800', dot: 'bg-teal-600' },
  Conference: { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-600' },
  Exhibition: { bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-600' },
  'Social & Networking': { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-600' },
};

export const ALL_CATEGORIES = [
  'Technical',
  'Hackathon',
  'Workshop',
  'Competition',
  'Cultural',
  'Seminar',
  'Sports',
  'Conference',
  'Exhibition',
  'Social & Networking',
];

export function getCategoryStyle(category) {
  return CATEGORY_COLORS[category] || { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' };
}