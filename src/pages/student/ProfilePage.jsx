import { useEffect, useState } from 'react';
import { Button } from '../../components/Button';
import { FormField, inputClassName } from '../../components/FormField';
import { ProfileSummary } from '../../components/ProfileSummary';
import { StatusBadge } from '../../components/StatusBadge';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PageHeader } from '../../components/PageHeader';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { updateProfile } from '../../services/academicService';

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  useDocumentTitle('Profile');

  useEffect(() => {
    setName(user?.name || '');
  }, [user?.name]);

  async function onSubmit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await updateProfile(name.trim());
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
      <PageHeader title="Profile" description="You can update your name. Email, student ID, and class are managed by the school." />
      <ProfileSummary
        rows={[
          { label: 'Email', text: user?.email },
          { label: 'Student ID', text: user?.studentId },
          { label: 'Department', text: user?.department },
          { label: 'Class', text: user?.className },
          { label: 'Account status', value: <StatusBadge status={user?.accountStatus} /> },
        ]}
      />
      <form className="panel space-y-4 p-5" onSubmit={onSubmit}>
        <FormField id="profile-name" label="Name">
          <input id="profile-name" className={inputClassName} value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={120} />
        </FormField>
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save name'}</Button>
      </form>
    </div>
  );
}
