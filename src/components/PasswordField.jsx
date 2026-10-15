import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { FormField, fieldAria, inputClassName } from './FormField';

export function PasswordField({
  id,
  label,
  value,
  onChange,
  error,
  autoComplete,
  name,
  disabled = false,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <FormField id={id} label={label} error={error}>
      <div className="relative">
        <input
          {...fieldAria(id, error)}
          name={name || id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          disabled={disabled}
          className={`${inputClassName} pr-11`}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex items-center rounded-r-lg px-3 text-gray-500 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-pressed={visible}
          aria-label={visible ? 'Hide password' : 'Show password'}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
    </FormField>
  );
}
