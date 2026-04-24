import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { getStudentProfile, updateStudentProfile } from '../../services/api';

export default function StudentProfilePage() {
  const { user } = useAuth();
  const studentId = user?.userId;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [profile, setProfile] = useState({
    name: '',
    enrollmentNumber: '',
    collegeEmail: '',
    studentPhoneNumber: '',
    dob: '',
    fatherName: '',
    motherName: '',
    fatherPhoneNumber: '',
    motherPhoneNumber: '',
    address: '',
  });

  useEffect(() => {
    if (!studentId) return;
    let active = true;

    setIsLoading(true);
    getStudentProfile(studentId)
      .then((data) => {
        if (!active) return;
        setProfile({
          name: data?.name || '',
          enrollmentNumber: data?.enrollmentNumber || '',
          collegeEmail: data?.collegeEmail || user?.email || '',
          studentPhoneNumber: data?.studentPhoneNumber || '',
          dob: data?.dob || '',
          fatherName: data?.fatherName || '',
          motherName: data?.motherName || '',
          fatherPhoneNumber: data?.fatherPhoneNumber || '',
          motherPhoneNumber: data?.motherPhoneNumber || '',
          address: data?.address || '',
        });
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [studentId, user?.email]);

  const onSave = async () => {
    if (!studentId) return toast.error('Not logged in');

    setIsSaving(true);
    try {
      await updateStudentProfile(studentId, {
        // Keep immutable fields off the payload; backend ignores nulls and only updates provided values.
        dob: profile.dob || null,
        studentPhoneNumber: profile.studentPhoneNumber?.trim() || null,
        fatherName: profile.fatherName?.trim() || null,
        motherName: profile.motherName?.trim() || null,
        fatherPhoneNumber: profile.fatherPhoneNumber?.trim() || null,
        motherPhoneNumber: profile.motherPhoneNumber?.trim() || null,
        address: profile.address?.trim() || null,
      });
      toast.success('Profile updated');
    } catch (error) {
      const detail = error?.response?.data?.message || error?.response?.data?.detail;
      toast.error(detail || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="card max-w-4xl">
      <h3 className="text-xl font-semibold text-white">Student Profile</h3>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">Name</label>
          <input className="field" value={profile.name} disabled />
        </div>
        <div>
          <label className="label">Enrollment</label>
          <input className="field" value={profile.enrollmentNumber} disabled />
        </div>
        <div className="md:col-span-2">
          <label className="label">Email</label>
          <input className="field" value={profile.collegeEmail} disabled />
        </div>

        <div>
          <label className="label">Phone Number</label>
          <input
            className="field"
            placeholder="Phone Number"
            value={profile.studentPhoneNumber}
            disabled={isLoading}
            onChange={(e) => setProfile((s) => ({ ...s, studentPhoneNumber: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">DOB</label>
          <input
            className="field"
            type="date"
            value={profile.dob}
            disabled={isLoading}
            onChange={(e) => setProfile((s) => ({ ...s, dob: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Father Name</label>
          <input
            className="field"
            placeholder="Father Name"
            value={profile.fatherName}
            disabled={isLoading}
            onChange={(e) => setProfile((s) => ({ ...s, fatherName: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Mother Name</label>
          <input
            className="field"
            placeholder="Mother Name"
            value={profile.motherName}
            disabled={isLoading}
            onChange={(e) => setProfile((s) => ({ ...s, motherName: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Father Phone Number</label>
          <input
            className="field"
            placeholder="Father Phone Number"
            value={profile.fatherPhoneNumber}
            disabled={isLoading}
            onChange={(e) => setProfile((s) => ({ ...s, fatherPhoneNumber: e.target.value }))}
          />
        </div>
        <div>
          <label className="label">Mother Phone Number</label>
          <input
            className="field"
            placeholder="Mother Phone Number"
            value={profile.motherPhoneNumber}
            disabled={isLoading}
            onChange={(e) => setProfile((s) => ({ ...s, motherPhoneNumber: e.target.value }))}
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
      </div>
      <button className="btn btn-primary mt-6" disabled={isSaving || isLoading} onClick={onSave}>
        {isSaving ? 'Updating...' : 'Update profile'}
      </button>
    </div>
  );
}
