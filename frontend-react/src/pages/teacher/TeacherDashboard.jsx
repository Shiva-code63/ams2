import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import SectionTitle from '../../components/SectionTitle';
import StatCard from '../../components/StatCard';
import { useAuth } from '../../context/AuthContext';
import { getTeacherDashboard } from '../../services/api';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const teacherId = user?.userId;

  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!teacherId) return;
    let active = true;
    setIsLoading(true);
    getTeacherDashboard(teacherId)
      .then((data) => {
        if (active) setStats(data);
      })
      .catch(() => toast.error('Failed to load teacher dashboard'))
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [teacherId]);

  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Teacher" title="Teacher Dashboard" description="Live stats pulled from the database." />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Subjects Taught" value={stats?.subjectsTaught ?? (isLoading ? '...' : 0)} hint="Current mapping" />
        <StatCard label="Total Students" value={stats?.totalStudents ?? (isLoading ? '...' : 0)} hint="Across assigned subjects" />
        <StatCard label="Sessions Created" value={stats?.sessionsCreated ?? (isLoading ? '...' : 0)} hint="All time" />
      </div>
      <div className="card">
        <h4 className="text-lg font-semibold text-white">Notes</h4>
        <p className="mt-3 text-sm text-slate-300">
          QR sessions, attendance marking, and reports will reflect your database records as you use the app.
        </p>
      </div>
    </div>
  );
}
