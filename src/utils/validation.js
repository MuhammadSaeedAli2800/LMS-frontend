export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

export function validateCredentials({ email, password }) {
  const errors = {};
  if (!String(email || '').trim()) errors.email = 'Email is required.';
  else if (!isValidEmail(email)) errors.email = 'Enter a valid email address.';
  if (!password) errors.password = 'Password is required.';
  return errors;
}

export function validatePasswordChange({ currentPassword, newPassword, confirmPassword }) {
  const errors = {};
  if (!currentPassword) errors.currentPassword = 'Current password is required.';
  if (!newPassword) {
    errors.newPassword = 'New password is required.';
  } else if (newPassword.length < 8) {
    errors.newPassword = 'Password must be at least 8 characters.';
  } else if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    errors.newPassword = 'Password must include at least one letter and one number.';
  } else if (currentPassword && newPassword === currentPassword) {
    errors.newPassword = 'New password must be different from the current password.';
  }
  if (!confirmPassword) errors.confirmPassword = 'Confirm your new password.';
  else if (newPassword && confirmPassword !== newPassword) errors.confirmPassword = 'Passwords do not match.';
  return errors;
}

export function validatePersonForm(values, fields) {
  const errors = {};
  fields.forEach((field) => {
    const value = String(values[field.name] ?? '').trim();
    if (field.required && !value) {
      errors[field.name] = `${field.label} is required.`;
      return;
    }
    if (field.name === 'email' && value && !isValidEmail(value)) {
      errors[field.name] = 'Enter a valid email address.';
    }
  });
  return errors;
}

export function mapFieldErrors(error) {
  const fields = {};
  const list = Array.isArray(error?.errors) ? error.errors : [];
  list.forEach((item) => {
    if (item?.field) fields[item.field] = item.message || 'Invalid value.';
  });
  return fields;
}

export function hasErrors(errors) {
  return Object.values(errors).some(Boolean);
}
