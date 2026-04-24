import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { changeAdminPassword, getAdminProfile, updateAdminProfile } from '../../services/api';

export default function AdminProfilePage() {
  const { user } = useAuth();
  const adminId = user?.userId;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [profile, setProfile] = useState({ name: '', email: '', phoneNumber: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!adminId) return;
      setIsLoading(true);
      try {
        const data = await getAdminProfile(adminId);
        if (!isMounted) return;
        setProfile({
          name: data?.name || '',
          email: data?.email || user?.email || '',
          phoneNumber: data?.phoneNumber || '',
        });
      } catch {
        toast.error('Failed to load profile');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [adminId, user?.email]);

  const onSave = async () => {
    if (!adminId) return toast.error('Not logged in');
    if (!profile.name.trim()) return toast.error('Name is required');

    const wantsPasswordChange = Boolean(
      passwords.currentPassword || passwords.newPassword || passwords.confirmPassword
    );

    if (wantsPasswordChange) {
      if (!passwords.currentPassword) return toast.error('Current password is required');
      if (!passwords.newPassword) return toast.error('New password is required');
      if (passwords.newPassword.length < 6) return toast.error('New password must be at least 6 characters');
      if (passwords.newPassword !== passwords.confirmPassword) return toast.error('Passwords do not match');
    }

    setIsSaving(true);
    try {
      await updateAdminProfile(adminId, {
        name: profile.name.trim(),
        phoneNumber: profile.phoneNumber?.trim() || null,
      });

      if (wantsPasswordChange) {
        await changeAdminPassword(adminId, {
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        });
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }

      toast.success('Profile updated');
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="card max-w-3xl">
      <h3 className="text-xl font-semibold text-white">Admin Profile</h3>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="label">Email</label>
          <input className="field" value={profile.email} disabled />
        </div>

        <div>
          <label className="label">Name</label>
          <input
            className="field"
            placeholder="Name"
            value={profile.name}
            disabled={isLoading}
            onChange={(e) => setProfile((s) => ({ ...s, name: e.target.value }))}
          />
        </div>

        <div>
          <label className="label">Phone Number</label>
          <input
            className="field"
            placeholder="Phone Number"
            value={profile.phoneNumber}
            disabled={isLoading}
            onChange={(e) => setProfile((s) => ({ ...s, phoneNumber: e.target.value }))}
          />
        </div>

        <div className="md:col-span-2">
          <label className="label">Current Password</label>
          <input
            className="field"
            placeholder="Current password"
            type="password"
            value={passwords.currentPassword}
            onChange={(e) => setPasswords((s) => ({ ...s, currentPassword: e.target.value }))}
          />
        </div>

        <div>
          <label className="label">New Password</label>
          <input
            className="field"
            placeholder="New password"
            type="password"
            value={passwords.newPassword}
            onChange={(e) => setPasswords((s) => ({ ...s, newPassword: e.target.value }))}
          />
        </div>

        <div>
          <label className="label">Confirm Password</label>
          <input
            className="field"
            placeholder="Confirm password"
            type="password"
            value={passwords.confirmPassword}
            onChange={(e) => setPasswords((s) => ({ ...s, confirmPassword: e.target.value }))}
          />
        </div>
      </div>

      <button disabled={isSaving || isLoading} onClick={onSave} className="btn btn-primary mt-6">
        {isSaving ? 'Saving...' : 'Save changes'}
      </button>
    </div>
  );
}
