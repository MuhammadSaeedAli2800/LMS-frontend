import { api } from './api';

function withQuery(path, params) {
  const search = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === 'all') return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

export function fetchDashboard() {
  return api('/api/admin/dashboard');
}

export function updateAdminProfile(name) {
  return api('/api/admin/profile', { method: 'PATCH', body: { name } });
}

export function listStudents(params) {
  return api(withQuery('/api/admin/students', params));
}

export function getStudent(id) {
  return api(`/api/admin/students/${encodeURIComponent(id)}`);
}

export function createStudent(body) {
  return api('/api/admin/students', { method: 'POST', body });
}

export function updateStudent(id, body) {
  return api(`/api/admin/students/${encodeURIComponent(id)}`, { method: 'PATCH', body });
}

export function updateStudentStatus(id, accountStatus) {
  return api(`/api/admin/students/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: { accountStatus },
  });
}

export function deleteStudent(id) {
  return api(`/api/admin/students/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export function resetStudentPassword(id) {
  return api(`/api/admin/students/${encodeURIComponent(id)}/reset-password`, { method: 'POST' });
}

export function listTeachers(params) {
  return api(withQuery('/api/admin/teachers', params));
}

export function getTeacher(id) {
  return api(`/api/admin/teachers/${encodeURIComponent(id)}`);
}

export function createTeacher(body) {
  return api('/api/admin/teachers', { method: 'POST', body });
}

export function updateTeacher(id, body) {
  return api(`/api/admin/teachers/${encodeURIComponent(id)}`, { method: 'PATCH', body });
}

export function updateTeacherStatus(id, accountStatus) {
  return api(`/api/admin/teachers/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: { accountStatus },
  });
}

export function deleteTeacher(id) {
  return api(`/api/admin/teachers/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export function resetTeacherPassword(id) {
  return api(`/api/admin/teachers/${encodeURIComponent(id)}/reset-password`, { method: 'POST' });
}

export function listAdmins(params) {
  return api(withQuery('/api/admin/admins', params));
}

export function createAdmin(body) {
  return api('/api/admin/admins', { method: 'POST', body });
}

export function listAdminAnnouncements() {
  return api('/api/admin/announcements');
}

export function createAdminAnnouncement(body) {
  return api('/api/admin/announcements', { method: 'POST', body });
}

export function deleteAdminAnnouncement(id) {
  return api(`/api/admin/announcements/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
