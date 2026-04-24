import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import SectionTitle from '../../components/SectionTitle';
import StatCard from '../../components/StatCard';
import { TrendChart } from '../../components/ChartPanel';
import { useAuth } from '../../context/AuthContext';
import { checkFaceRegistered, getFaceImage, getStudentDashboard, listStudentAttendance } from '../../services/api';

function buildWeeklyTrend(attendanceItems) {
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  const byDate = new Map();
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    byDate.set(key, { present: 0, total: 0, label: d.toLocaleDateString('en-US', { weekday: 'short' }) });
  }

  (attendanceItems || []).forEach((row) => {
    const key = row.attendanceDate;
    const bucket = byDate.get(key);
    if (!bucket) return;
    bucket.total += 1;
    if (String(row.status).toUpperCase() === 'PRESENT') bucket.present += 1;
  });

  return Array.from(byDate.entries()).map(([, v]) => ({
    name: v.label,
    attendance: v.total === 0 ? 0 : Math.round(((v.present * 100) / v.total) * 10) / 10,
  }));
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const studentId = user?.userId;

  const [stats, setStats] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [faceUrl, setFaceUrl] = useState('');

  const recentAttendance = useMemo(() => stats?.recentAttendance || [], [stats]);

  useEffect(() => {
    if (!studentId) return;
    let active = true;
    let faceObjectUrl = '';

    const load = async () => {
      setIsLoading(true);
      try {
        const [dashboard, attendancePage, faceState] = await Promise.all([
          getStudentDashboard(studentId),
          listStudentAttendance(studentId, { page: 0, size: 200 }),
          checkFaceRegistered(studentId),
        ]);
        if (!active) return;
        setStats(dashboard);
        setTrendData(buildWeeklyTrend(attendancePage?.content || []));

        const isRegistered = Boolean(faceState?.faceRegistered);
        if (isRegistered) {
          try {
            const blob = await getFaceImage(studentId);
            if (!active) return;
            faceObjectUrl = URL.createObjectURL(blob);
            setFaceUrl(faceObjectUrl);
          } catch {
            setFaceUrl('');
          }
        } else {
          setFaceUrl('');
        }
      } catch {
        toast.error('Failed to load student dashboard');
      } finally {
        if (active) setIsLoading(false);
      }
    };

    load();
    return () => {
      active = false;
      if (faceObjectUrl) URL.revokeObjectURL(faceObjectUrl);
    };
  }, [studentId]);

  return (
    <div className="space-y-6">
      <SectionTitle eyebrow="Student" title="Student Dashboard" description="Your live attendance, subjects, and recent records pulled from the database." />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Attendance Percentage" value={stats ? `${Math.round((stats.attendancePercentage || 0) * 10) / 10}%` : isLoading ? '...' : '0%'} hint="Current overall" />
        <StatCard label="Subjects Enrolled" value={stats?.subjectsEnrolled ?? (isLoading ? '...' : 0)} hint="Current mapping" />
        <StatCard label="Recent Records" value={recentAttendance.length} hint="Last 5 entries" />
      </div>

      <div className="card">
        <h4 className="text-lg font-semibold text-white">Registered Face</h4>
        <div className="mt-4 flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60">
            {faceUrl ? (
              <img src={faceUrl} alt="Registered face" className="h-full w-full object-cover" />
            ) : (
              <div className="text-xs text-slate-400">No face saved</div>
            )}
          </div>
          <div className="text-sm text-slate-300">
            {faceUrl ? 'Face is registered and saved in the backend.' : 'Register your face to enable QR attendance verification.'}
          </div>
        </div>
      </div>
      <TrendChart data={trendData} />
      <div className="card">
        <h4 className="text-lg font-semibold text-white">Recent Attendance</h4>
        <div className="mt-4 space-y-3">
          {isLoading ? (
            <div className="text-sm text-slate-300">Loading...</div>
          ) : recentAttendance.length === 0 ? (
            <div className="text-sm text-slate-300">No attendance records yet.</div>
          ) : (
            recentAttendance.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/5 bg-white/5 px-4 py-3 text-sm">
                <span>
                  {item.subjectName} ({item.subjectCode})
                </span>
                <span>{item.attendanceDate}</span>
                <span>{item.status}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
