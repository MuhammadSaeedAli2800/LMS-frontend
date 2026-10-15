import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export function Pagination({ page, totalPages, total, noun = 'results', onPageChange }) {
  if (!total) return null;
  const safePages = Math.max(totalPages || 1, 1);
  const current = Math.min(Math.max(page || 1, 1), safePages);

  return (
    <nav aria-label="Pagination" className="flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-ink-muted">
        Page {current} of {safePages}
        <span className="sr-only">, {total} {noun}</span>
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => onPageChange(current - 1)}
          disabled={current <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Previous
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => onPageChange(current + 1)}
          disabled={current >= safePages}
          aria-label="Next page"
        >
          Next
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
