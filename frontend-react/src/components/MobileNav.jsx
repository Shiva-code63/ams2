import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, BookOpen, QrCode, LogOut, BadgeCheck, ScanLine, BellRing, ShieldCheck, UserSquare2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const menu = {
  ADMIN: [
    { to: '/admin', icon: LayoutDashboard },
    { to: '/admin/profile', icon: ShieldCheck },
    { to: '/admin/students', icon: Users },
    { to: '/admin/teachers', icon: UserSquare2 },
    { to: '/admin/subjects', icon: BookOpen },
    { to: '/admin/attendance-reports', icon: BellRing },
  ],
  STUDENT: [
    { to: '/student', icon: LayoutDashboard },
    { to: '/student/profile', icon: BadgeCheck },
    { to: '/student/register-face', icon: ScanLine },
    { to: '/student/mark-attendance', icon: QrCode },
    { to: '/student/attendance-history', icon: BellRing },
  ],
  TEACHER: [
    { to: '/teacher', icon: LayoutDashboard },
    { to: '/teacher/profile', icon: BadgeCheck },
    { to: '/teacher/subjects', icon: BookOpen },
    { to: '/teacher/generate-qr', icon: QrCode },
    { to: '/teacher/manual-attendance', icon: Users },
    { to: '/teacher/attendance-reports', icon: BellRing },
  ],
};

export default function MobileNav({ role }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/90 px-3 py-3 backdrop-blur lg:hidden">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {menu[role].map(({ to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === `/${role.toLowerCase()}`}
            className={({ isActive }) =>
              `flex shrink-0 items-center justify-center rounded-2xl border px-3 py-2 text-xs ${
                isActive ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-100' : 'border-white/10 bg-white/5 text-slate-300'
              }`
            }
          >
            <Icon className="h-4 w-4" />
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="flex shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
