export const CATEGORY_COLORS = {
  Technical: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-600' },
  Cultural: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' },
  Workshop: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  Competition: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-600' },
  Seminar: { bg: 'bg-amber-50', text: 'text-amber-800', dot: 'bg-amber-700' },
  Sports: { bg: 'bg-pink-50', text: 'text-pink-700', dot: 'bg-pink-500' },
  Conference: { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-600' },
};

export function getCategoryStyle(category) {
  return CATEGORY_COLORS[category] || { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' };
}