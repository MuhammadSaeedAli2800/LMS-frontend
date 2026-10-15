export function formatTime12(value) {
  const match = String(value || '').match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return '';
  const hours = Number(match[1]);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${match[2]} ${period}`;
}

export function scheduleParts(course) {
  const days = Array.isArray(course?.days) ? course.days.filter(Boolean) : [];
  const start = formatTime12(course?.startTime);
  const end = formatTime12(course?.endTime);
  return { days: days.join(', '), time: start && end ? `${start} – ${end}` : '' };
}

export function ScheduleText({ course, empty = '' }) {
  const { days, time } = scheduleParts(course);
  if (!days && !time) {
    return empty ? <p className="text-sm text-gray-500">{empty}</p> : null;
  }

  return (
    <div className="text-sm text-gray-600">
      {days ? <p>{days}</p> : null}
      {time ? <p>{time}</p> : null}
    </div>
  );
}
