import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';

const AUDIENCE_LABEL = {
  student: 'student',
  teacher: 'teacher',
  administrator: 'administrator',
};

export function TemporaryPasswordDialog({ open, password, audience = 'student', onClose }) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  const person = AUDIENCE_LABEL[audience] || 'person';

  useEffect(() => {
    if (!open) {
      setCopied(false);
      setCopyError('');
    }
  }, [open]);

  async function copyPassword() {
    setCopyError('');
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
    } catch {
      setCopied(false);
      setCopyError('Clipboard access was blocked. Select the password and copy it manually.');
    }
  }

  return (
    <Modal open={open} title="Temporary password" onClose={onClose} dismissible={false}>
      <div className="space-y-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
          This password is shown only once and cannot be retrieved again. Share it securely with the {person}. They must change it at first login.
        </div>
        <div>
          <label htmlFor="temporary-password" className="mb-1.5 block text-sm font-medium text-gray-800">
            Temporary password
          </label>
          <input
            id="temporary-password"
            readOnly
            value={password || ''}
            autoComplete="off"
            spellCheck="false"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            onFocus={(event) => event.target.select()}
          />
        </div>
        {copyError ? (
          <p role="alert" className="text-sm text-red-600">
            {copyError}
          </p>
        ) : null}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={copyPassword}>
            {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
            {copied ? 'Copied' : 'Copy password'}
          </Button>
          <Button type="button" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
