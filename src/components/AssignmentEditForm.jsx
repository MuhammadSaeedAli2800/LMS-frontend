import { Button } from './Button';
import { FormField, inputClassName } from './FormField';

function toDateTimeLocal(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (part) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function AssignmentEditForm({ assignment, disabled, onSubmit, onCancel }) {
  function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const file = form.get('file');
    onSubmit({
      title: form.get('title'),
      assignmentNumber: form.get('assignmentNumber'),
      description: form.get('description') || '',
      dueDate: new Date(form.get('dueDate')).toISOString(),
      maxMarks: form.get('maxMarks'),
      allowResubmission: form.get('allowResubmission') === 'on',
      allowLate: form.get('allowLate') === 'on',
      file: file && file.name ? file : null,
    });
  }

  return (
    <form className="grid gap-3 rounded-lg bg-gray-50 p-3 md:grid-cols-2" onSubmit={handleSubmit}>
      <FormField id={`edit-number-${assignment.id}`} label="Assignment number">
        <input id={`edit-number-${assignment.id}`} name="assignmentNumber" type="number" min="1" max="999" className={inputClassName} defaultValue={assignment.assignmentNumber || ''} />
      </FormField>
      <FormField id={`edit-title-${assignment.id}`} label="Title">
        <input id={`edit-title-${assignment.id}`} name="title" className={inputClassName} required minLength={2} defaultValue={assignment.title} />
      </FormField>
      <FormField id={`edit-due-${assignment.id}`} label="Submission date">
        <input id={`edit-due-${assignment.id}`} name="dueDate" type="datetime-local" className={inputClassName} required defaultValue={toDateTimeLocal(assignment.dueDate)} />
      </FormField>
      <FormField id={`edit-marks-${assignment.id}`} label="Maximum marks">
        <input id={`edit-marks-${assignment.id}`} name="maxMarks" type="number" min="1" max="1000" className={inputClassName} required defaultValue={assignment.maxMarks} />
      </FormField>
      <FormField id={`edit-file-${assignment.id}`} label={assignment.originalName ? `Replace attachment (${assignment.originalName})` : 'Attachment'}>
        <input id={`edit-file-${assignment.id}`} name="file" type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,.png,.jpg,.jpeg,.txt" className={inputClassName} />
      </FormField>
      <div className="md:col-span-2">
        <FormField id={`edit-instructions-${assignment.id}`} label="Instructions">
          <textarea id={`edit-instructions-${assignment.id}`} name="description" className={inputClassName} rows={3} defaultValue={assignment.description || ''} />
        </FormField>
      </div>
      <label className="flex items-center gap-2 text-sm text-gray-800 md:col-span-2">
        <input name="allowResubmission" type="checkbox" defaultChecked={Boolean(assignment.allowResubmission)} /> Allow resubmission before grading
      </label>
      <label className="flex items-center gap-2 text-sm text-gray-800 md:col-span-2">
        <input name="allowLate" type="checkbox" defaultChecked={assignment.allowLate !== false} /> Accept late submissions
      </label>
      <div className="flex flex-wrap gap-2 md:col-span-2">
        <Button type="submit" disabled={disabled}>{disabled ? 'Saving…' : 'Save details'}</Button>
        <Button type="button" variant="secondary" disabled={disabled} onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
