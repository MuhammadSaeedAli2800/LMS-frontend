import { formatStatus, isActiveStatus } from '../utils/format';

export function StatusBadge({ status }) {
  const active = isActiveStatus(status);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
        active ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-red-50 text-red-700 ring-red-600/20'
      }`}
    >
      {formatStatus(status)}
    </span>
  );
}
