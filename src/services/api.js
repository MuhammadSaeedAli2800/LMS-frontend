export async function api(path, { method = 'GET', body, formData } = {}) {
  const headers = {};
  if (body !== undefined && !formData) headers['Content-Type'] = 'application/json';
  const unsafe = !['GET', 'HEAD', 'OPTIONS'].includes(String(method).toUpperCase());
  if (unsafe) {
    const row = document.cookie.split('; ').find((entry) => entry.startsWith('lms_csrf='));
    const csrf = row ? row.slice('lms_csrf='.length) : '';
    if (csrf) headers['X-CSRF-Token'] = decodeURIComponent(csrf);
  }
  const response = await fetch(path, {
    method,
    headers,
    credentials: 'include',
    body: formData || (body !== undefined ? JSON.stringify(body) : undefined),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || 'Request failed');
    error.status = response.status;
    error.code = payload.code;
    error.errors = payload.errors || [];
    if (error.code === 'MUST_CHANGE_PASSWORD' && window.location.pathname !== '/change-password') {
      window.dispatchEvent(new CustomEvent('lms:must-change-password'));
    }
    throw error;
  }
  const data = payload && Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload;
  return { data: data === undefined || data === null ? {} : data, message: payload.message };
}
