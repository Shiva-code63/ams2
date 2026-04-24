import { useEffect, useMemo, useState } from 'react';
import StatCard from '../../components/StatCard';
import SectionTitle from '../../components/SectionTitle';
import { LinePanel, PiePanel, TrendChart } from '../../components/ChartPanel';
import { getAdminDashboardStats } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let active = true;
    getAdminDashboardStats()
      .then((data) => {
        if (active) setStats(data);
      })
      .catch(() => toast.error('Failed to load dashboard stats'));
    return () => {
      active = false;
    };
  }, []);

  const pieData = useMemo(() => {
    const present = Number(stats?.presentRecords || 0);
    const absent = Number(stats?.absentRecords || 0);
    return [
      { name: 'Present', value: present },
      { name: 'Absent', value: absent },
    ];
  }, [stats]);

  return (
    <div className="space-y-6">
      <SectionTitle
        eyebrow="Overview"
        title="Admin Dashboard"
        description="A compact, premium view of the institution's attendance health, powered by live-style widgets and report-ready charts."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Students" value={stats?.totalStudents ?? '...'} hint="Active enrollments" />
        <StatCard label="Total Teachers" value={stats?.totalTeachers ?? '...'} hint="Faculty accounts" />
        <StatCard label="Total Subjects" value={stats?.totalSubjects ?? '...'} hint="Mapped subjects" />
        <StatCard label="Attendance Records" value={stats?.totalAttendanceRecords ?? '...'} hint="All sessions" />
        <StatCard label="Average Attendance" value={stats ? `${stats.averageAttendance}%` : '...'} hint="Institution average" />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <TrendChart data={stats?.weeklyTrend || []} />
        <PiePanel data={pieData} colors={['#38bdf8', '#f43f5e']} />
      </div>
      <LinePanel data={stats?.monthlyAttendance || []} />
    </div>
  );
}
