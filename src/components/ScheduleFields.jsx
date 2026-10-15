import { fieldClassName, FormField } from './FormField';

export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOURS = Array.from({ length: 12 }, (_, index) => String(index + 1));
const MINUTES = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));

function splitTime(value) {
  const match = String(value || '').match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return { hour: '', minute: '', period: 'AM' };
  const hours = Number(match[1]);
  return {
    hour: String(hours % 12 || 12),
    minute: match[2],
    period: hours >= 12 ? 'PM' : 'AM',
  };
}

function joinTime({ hour, minute, period }) {
  let hours = Number(hour) % 12;
  if (period === 'PM') hours += 12;
  return `${String(hours).padStart(2, '0')}:${minute}`;
}

function Time12Input({ id, value, onChange }) {
  const parts = splitTime(value);

  function update(next) {
    const merged = { ...parts, ...next };
    if (merged.hour && !merged.minute) merged.minute = '00';
    onChange(merged.hour && merged.minute ? joinTime(merged) : '');
  }

  const selectClass = `${fieldClassName} box-border h-10 shrink-0`;

  return (
    <div className="inline-flex max-w-full flex-wrap items-center gap-2">
      <select id={id} className={`${selectClass} w-20`} value={parts.hour} onChange={(event) => update({ hour: event.target.value })}>
        <option value="">Hour</option>
        {HOURS.map((hour) => <option key={hour} value={hour}>{hour}</option>)}
      </select>
      <span className="text-ink-faint" aria-hidden="true">:</span>
      <select aria-label="Minutes" className={`${selectClass} w-20`} value={parts.minute} onChange={(event) => update({ minute: event.target.value })}>
        <option value="">Min</option>
        {MINUTES.map((minute) => <option key={minute} value={minute}>{minute}</option>)}
      </select>
      <select aria-label="AM or PM" className={`${selectClass} w-28`} value={parts.period} onChange={(event) => update({ period: event.target.value })}>
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}

export function ScheduleFields({ days, startTime, endTime, onChange, showLegend = true }) {
  function toggleDay(day) {
    const selected = days.includes(day) ? days.filter((item) => item !== day) : [...days, day];
    onChange({
      days: WEEKDAYS.filter((item) => selected.includes(item)),
      startTime,
      endTime,
    });
  }

  return (
    <fieldset className="min-w-0 space-y-4" aria-label={showLegend ? undefined : 'Class days and time'}>
      {showLegend ? <legend className="text-sm font-medium text-ink">Class days and time</legend> : null}
      <div className="flex flex-wrap gap-2">
        {WEEKDAYS.map((day) => (
          <label key={day} className="flex h-10 items-center gap-2 rounded-lg border border-line px-3 text-sm text-ink">
            <input type="checkbox" checked={days.includes(day)} onChange={() => toggleDay(day)} />
            {day.slice(0, 3)}
          </label>
        ))}
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <FormField id="course-start" label="Start time">
          <Time12Input id="course-start" value={startTime} onChange={(next) => onChange({ days, startTime: next, endTime })} />
        </FormField>
        <FormField id="course-end" label="End time">
          <Time12Input id="course-end" value={endTime} onChange={(next) => onChange({ days, startTime, endTime: next })} />
        </FormField>
      </div>
    </fieldset>
  );
}
