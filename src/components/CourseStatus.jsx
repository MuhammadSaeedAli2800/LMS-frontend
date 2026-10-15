import { formatStatus } from '../utils/format';

const STYLES = {
  published: 'bg-green-50 text-green-700 ring-green-600/20',
  draft: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  archived: 'bg-gray-100 text-gray-700 ring-gray-500/20',
  present: 'bg-green-50 text-green-700 ring-green-600/20',
  absent: 'bg-red-50 text-red-700 ring-red-600/20',
  late: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  leave: 'bg-violet-50 text-violet-800 ring-violet-600/20',
  graded: 'bg-green-50 text-green-700 ring-green-600/20',
  submitted: 'bg-blue-50 text-blue-700 ring-blue-600/20',
};

export function CourseStatus({ status }) {
  const key = String(status || '').toLowerCase();
  const style = STYLES[key] || 'bg-gray-100 text-gray-700 ring-gray-500/20';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}>
      {formatStatus(status)}
    </span>
  );
}
