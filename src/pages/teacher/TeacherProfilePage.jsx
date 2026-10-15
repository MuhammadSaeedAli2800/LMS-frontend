import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/Button';
import { FormField, inputClassName } from '../../components/FormField';
import { ProfileSummary } from '../../components/ProfileSummary';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/PageHeader';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { updateTeacherProfile } from '../../services/academicService';

export function TeacherProfilePage() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  useDocumentTitle('My profile');

  useEffect(() => {
    setName(user?.name || '');
  }, [user?.name]);

  async function onSubmit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await updateTeacherProfile(name.trim());
      await refreshUser();
      toast.success('Name updated.');
    } catch (err) {
      toast.error(err.message || 'Could not update your name.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My profile" description="You can update your name. Email and teacher ID are managed by the school." />
      <ProfileSummary
        rows={[
          { label: 'Email', text: user?.email },
          { label: 'Teacher ID', text: user?.teacherId },
          { label: 'Department', text: user?.department },
          { label: 'Account status', value: <StatusBadge status={user?.accountStatus} /> },
        ]}
      />
      <form className="panel space-y-4 p-5" onSubmit={onSubmit}>
        <FormField id="teacher-name" label="Name">
          <input id="teacher-name" className={inputClassName} value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={120} />
        </FormField>
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save name'}</Button>
      </form>
      <p className="text-sm text-gray-600">
        <Link className="font-medium text-primary hover:underline" to="/change-password">Change password</Link>
      </p>
    </div>
  );
}
