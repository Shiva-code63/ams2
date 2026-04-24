import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { changeTeacherPassword, getTeacherProfile, updateTeacherProfile } from '../../services/api';

export default function TeacherProfilePage() {
  const { user } = useAuth();
  const teacherId = user?.userId;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [profile, setProfile] = useState({
    name: '',
    email: '',
    employeeId: '',
    phoneNumber: '',
    dob: '',
    address: '',
  });

  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!teacherId) return;
      setIsLoading(true);
      try {
        const data = await getTeacherProfile(teacherId);
        if (!isMounted) return;
        setProfile({
          name: data?.name || '',
          email: data?.email || user?.email || '',
          employeeId: data?.employeeId || '',
          phoneNumber: data?.phoneNumber || '',
          dob: data?.dob || '',
          address: data?.address || '',
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
  }, [teacherId, user?.email]);

  const onSave = async () => {
    if (!teacherId) return toast.error('Not logged in');

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
      await updateTeacherProfile(teacherId, {
        phoneNumber: profile.phoneNumber?.trim() || null,
        dob: profile.dob || null,
        address: profile.address?.trim() || null,
      });

      if (wantsPasswordChange) {
        await changeTeacherPassword(teacherId, {
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
      <h3 className="text-xl font-semibold text-white">Teacher Profile</h3>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">Name</label>
          <input className="field" value={profile.name} disabled />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="field" value={profile.email} disabled />
        </div>
        <div>
          <label className="label">Employee ID</label>
          <input className="field" value={profile.employeeId} disabled />
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
          <label className="label">DOB</label>
          <input
            className="field"
            placeholder="DOB"
            type="date"
            value={profile.dob}
            disabled={isLoading}
            onChange={(e) => setProfile((s) => ({ ...s, dob: e.target.value }))}
          />
        </div>
        <div className="md:col-span-2">
          <label className="label">Address</label>
          <textarea
            className="field md:col-span-2"
            rows="4"
            placeholder="Address"
            value={profile.address}
            disabled={isLoading}
            onChange={(e) => setProfile((s) => ({ ...s, address: e.target.value }))}
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
