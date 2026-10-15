import { useEffect } from 'react';
import { INSTITUTION_NAME } from '../constants';

export function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · ${INSTITUTION_NAME}` : INSTITUTION_NAME;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
