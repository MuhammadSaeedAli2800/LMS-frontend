import { api } from './api';

function withQuery(path, params) {
  const search = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

export function listCourses(params) {
  return api(withQuery('/api/admin/courses', params));
}

export function createCourse(body) {
  return api('/api/admin/courses', { method: 'POST', body });
}

export function getCourse(id) {
  return api(`/api/admin/courses/${encodeURIComponent(id)}`);
}

export function updateCourse(id, body) {
  return api(`/api/admin/courses/${encodeURIComponent(id)}`, { method: 'PATCH', body });
}

export function updateCourseStatus(id, status) {
  return api(`/api/admin/courses/${encodeURIComponent(id)}/status`, { method: 'PATCH', body: { status } });
}

export function deleteCourse(id) {
  return api(`/api/admin/courses/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export function listEnrollments(params) {
  return api(withQuery('/api/admin/enrollments', params));
}

export function createEnrollment(body) {
  return api('/api/admin/enrollments', { method: 'POST', body });
}

export function removeEnrollment(id) {
  return api(`/api/admin/enrollments/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export function fetchReports() {
  return api('/api/admin/reports');
}

export function fetchReportWork() {
  return api('/api/admin/reports/work');
}

export function fetchCourseReport(courseId) {
  return api(`/api/admin/reports/courses/${encodeURIComponent(courseId)}`);
}

export function fetchTeacherReport(teacherId) {
  return api(`/api/admin/reports/teachers/${encodeURIComponent(teacherId)}`);
}

export function fetchAuditLogs() {
  return api('/api/admin/audit-logs');
}

export function fetchTeacherDashboard() {
  return api('/api/teacher/dashboard');
}

export function fetchTeacherCourses() {
  return api('/api/teacher/courses');
}

export function fetchCourseStudents(courseId) {
  return api(`/api/teacher/courses/${encodeURIComponent(courseId)}/students`);
}

export function fetchMaterials(courseId) {
  return api(`/api/teacher/courses/${encodeURIComponent(courseId)}/materials`);
}

export function createMaterial(courseId, { title, description, externalUrl, file }) {
  const formData = new FormData();
  formData.set('title', title);
  if (description) formData.set('description', description);
  if (externalUrl) formData.set('externalUrl', externalUrl);
  if (file) formData.set('file', file);
  return api(`/api/teacher/courses/${encodeURIComponent(courseId)}/materials`, { method: 'POST', formData });
}

export function updateMaterial(materialId, { title, description, externalUrl, file }) {
  const formData = new FormData();
  formData.set('title', title);
  if (description) formData.set('description', description);
  if (externalUrl) formData.set('externalUrl', externalUrl);
  if (file) formData.set('file', file);
  return api(`/api/teacher/materials/${encodeURIComponent(materialId)}`, { method: 'PATCH', formData });
}

export function deleteMaterial(materialId) {
  return api(`/api/teacher/materials/${encodeURIComponent(materialId)}`, { method: 'DELETE' });
}

export function fetchTeacherAssignments(courseId) {
  return api(`/api/teacher/courses/${encodeURIComponent(courseId)}/assignments`);
}

export function createAssignment(courseId, { title, assignmentNumber, description, dueDate, maxMarks, allowResubmission, allowLate, file }) {
  const formData = new FormData();
  formData.set('title', title);
  if (assignmentNumber) formData.set('assignmentNumber', String(assignmentNumber));
  if (description) formData.set('description', description);
  formData.set('dueDate', dueDate);
  formData.set('maxMarks', String(maxMarks));
  formData.set('allowResubmission', allowResubmission ? 'true' : 'false');
  formData.set('allowLate', allowLate === false ? 'false' : 'true');
  if (file) formData.set('file', file);
  return api(`/api/teacher/courses/${encodeURIComponent(courseId)}/assignments`, { method: 'POST', formData });
}

export function updateAssignment(assignmentId, { title, assignmentNumber, description, dueDate, maxMarks, allowResubmission, allowLate, file }) {
  const formData = new FormData();
  if (title) formData.set('title', title);
  if (assignmentNumber !== undefined) formData.set('assignmentNumber', assignmentNumber === null || assignmentNumber === '' ? '' : String(assignmentNumber));
  if (description !== undefined && description !== null) formData.set('description', description);
  if (dueDate) formData.set('dueDate', dueDate);
  if (maxMarks !== undefined && maxMarks !== null && maxMarks !== '') formData.set('maxMarks', String(maxMarks));
  if (allowResubmission !== undefined) formData.set('allowResubmission', allowResubmission ? 'true' : 'false');
  if (allowLate !== undefined) formData.set('allowLate', allowLate ? 'true' : 'false');
  if (file) formData.set('file', file);
  return api(`/api/teacher/assignments/${encodeURIComponent(assignmentId)}`, { method: 'PATCH', formData });
}

export function deleteAssignment(assignmentId) {
  return api(`/api/teacher/assignments/${encodeURIComponent(assignmentId)}`, { method: 'DELETE' });
}

export function setAssignmentStatus(assignmentId, status) {
  return api(`/api/teacher/assignments/${encodeURIComponent(assignmentId)}/status`, { method: 'PATCH', body: { status } });
}

export function fetchTeacherSubmissions() {
  return api('/api/teacher/submissions');
}

export function fetchSubmissions(assignmentId) {
  return api(`/api/teacher/assignments/${encodeURIComponent(assignmentId)}/submissions`);
}

export function gradeSubmission(submissionId, body) {
  return api(`/api/teacher/submissions/${encodeURIComponent(submissionId)}/grade`, { method: 'PATCH', body });
}

export function fetchTeacherOwnAttendance() {
  return api('/api/teacher/attendance');
}

export function fetchAttendance(courseId, sessionDate) {
  return api(withQuery(`/api/teacher/courses/${encodeURIComponent(courseId)}/attendance`, { sessionDate }));
}

export function saveAttendance(courseId, body) {
  return api(`/api/teacher/courses/${encodeURIComponent(courseId)}/attendance`, { method: 'POST', body });
}

export function fetchTeacherProgress(courseId) {
  return api(withQuery('/api/teacher/progress', { courseId }));
}

export function updateTeacherProfile(name) {
  return api('/api/teacher/profile', { method: 'PATCH', body: { name } });
}

export function updateAnnouncement(announcementId, body) {
  return api(`/api/teacher/announcements/${encodeURIComponent(announcementId)}`, { method: 'PATCH', body });
}

export function deleteAnnouncement(announcementId) {
  return api(`/api/teacher/announcements/${encodeURIComponent(announcementId)}`, { method: 'DELETE' });
}

export function fetchTeacherAnnouncements(courseId) {
  return api(`/api/teacher/courses/${encodeURIComponent(courseId)}/announcements`);
}

export function fetchTeacherAdminAnnouncements() {
  return api('/api/teacher/announcements');
}

export function createAnnouncement(courseId, body) {
  return api(`/api/teacher/courses/${encodeURIComponent(courseId)}/announcements`, { method: 'POST', body });
}

export function fetchStudentDashboard() {
  return api('/api/student/dashboard');
}

export function fetchStudentCourses() {
  return api('/api/student/courses');
}

export function fetchStudentCourse(courseId) {
  return api(`/api/student/courses/${encodeURIComponent(courseId)}`);
}

export function fetchStudentAssignments() {
  return api('/api/student/assignments');
}

export function submitAssignment(assignmentId, { submissionText, file }) {
  const formData = new FormData();
  if (submissionText) formData.set('submissionText', submissionText);
  if (file) formData.set('file', file);
  return api(`/api/student/assignments/${encodeURIComponent(assignmentId)}/submissions`, { method: 'POST', formData });
}

export function fetchGrades() {
  return api('/api/student/grades');
}

export function fetchStudentAttendance() {
  return api('/api/student/attendance');
}

export function fetchStudentMaterials() {
  return api('/api/student/materials');
}

export function fetchStudentAnnouncements() {
  return api('/api/student/announcements');
}

export function fetchProfile() {
  return api('/api/student/profile');
}

export function updateProfile(name) {
  return api('/api/student/profile', { method: 'PATCH', body: { name } });
}

export function fetchAttendanceCards(audience) {
  return api(withQuery('/api/admin/attendance/summary', { audience }));
}

export function fetchAttendanceCourse(courseId, audience) {
  return api(withQuery(`/api/admin/attendance/courses/${encodeURIComponent(courseId)}`, { audience }));
}

export function fetchAdminAttendance(params) {
  return api(withQuery('/api/admin/attendance', params));
}

export function saveAdminAttendance(body) {
  return api('/api/admin/attendance', { method: 'PUT', body });
}

export function deleteAdminAttendance(audience, id) {
  return api(`/api/admin/attendance/${encodeURIComponent(audience)}/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
