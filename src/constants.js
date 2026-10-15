export const INSTITUTION_NAME = import.meta.env.VITE_INSTITUTION_NAME || 'SMIT LMS';

export const PAGE_SIZE = 10;

export function homePathForRole(role) {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'teacher') return '/teacher/dashboard';
  if (role === 'student') return '/student/dashboard';
  return null;
}

export function normalizeUser(user) {
  if (!user || typeof user !== 'object') return null;
  return {
    ...user,
    role: typeof user.role === 'string' ? user.role.trim().toLowerCase() : user.role,
  };
}
