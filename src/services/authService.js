import { api } from './api';

export function login(body) {
  return api('/api/auth/login', { method: 'POST', body });
}

export function adminLogin(body) {
  return api('/api/admin/auth/login', { method: 'POST', body });
}

export function logout() {
  return api('/api/auth/logout', { method: 'POST' });
}

export function fetchCurrentUser() {
  return api('/api/auth/me');
}

export function changePassword(body) {
  return api('/api/auth/change-password', { method: 'POST', body });
}
