import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, BellRing, ScanLine, UserSquare2, LogOut, ShieldCheck, BadgeCheck, QrCode } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const menu = {
  ADMIN: [
    { to: '/admin', label: 'Dashboard Overview', icon: LayoutDashboard },
    { to: '/admin/profile', label: 'Admin Profile', icon: ShieldCheck },
    { to: '/admin/students', label: 'Students', icon: Users },
    { to: '/admin/teachers', label: 'Teachers', icon: UserSquare2 },
    { to: '/admin/subjects', label: 'Subjects', icon: BookOpen },
    { to: '/admin/attendance-reports', label: 'Attendance Reports', icon: BellRing },
  ],
  STUDENT: [
    { to: '/student', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/profile', label: 'Profile', icon: BadgeCheck },
    { to: '/student/register-face', label: 'Register Face', icon: ScanLine },
    { to: '/student/mark-attendance', label: 'Mark Attendance', icon: QrCode },
    { to: '/student/attendance-history', label: 'Attendance History', icon: BellRing },
  ],
  TEACHER: [
    { to: '/teacher', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/teacher/profile', label: 'Profile', icon: BadgeCheck },
    { to: '/teacher/subjects', label: 'Subjects', icon: BookOpen },
    { to: '/teacher/generate-qr', label: 'Generate QR', icon: QrCode },
    { to: '/teacher/manual-attendance', label: 'Manual Attendance', icon: Users },
    { to: '/teacher/attendance-reports', label: 'Attendance Reports', icon: BellRing },
  ],
};

export default function Sidebar({ role }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-slate-950/80 p-5 lg:flex lg:flex-col">
      <div className="mb-8 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 p-5">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/80">AMS2</p>
        <h1 className="mt-2 text-2xl font-semibold">Smart Attendance</h1>
        <p className="mt-1 text-sm text-slate-300">Role: {role}</p>
      </div>
      <nav className="flex-1 space-y-2">
        {menu[role].map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === `/${role.toLowerCase()}`}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                isActive ? 'bg-cyan-400/15 text-cyan-200' : 'text-slate-300 hover:bg-white/5'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <button
        type="button"
        onClick={() => {
          logout();
          navigate('/login');
        }}
        className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:bg-white/10"
      >
        <LogOut className="h-4 w-4" />
        Logout
      </button>
    </aside>
  );
}
