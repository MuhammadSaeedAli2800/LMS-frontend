import { Button } from './Button';
import { Modal } from './Modal';
import { Spinner } from './Spinner';

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  error = '',
  onConfirm,
  onClose,
}) {
  return (
    <Modal open={open} title={title} onClose={onClose} dismissible={!loading}>
      <p className="text-sm leading-6 text-ink-muted">{message}</p>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      ) : null}
      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button type="button" variant={destructive ? 'danger' : 'primary'} onClick={onConfirm} disabled={loading}>
          {loading ? <Spinner className="h-4 w-4" label="Working" /> : null}
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
