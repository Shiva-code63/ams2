import { useAuth } from '../context/AuthContext';

export default function Topbar({ role }) {
  const { user } = useAuth();
  return (
    <header className="flex items-center justify-between border-b border-white/10 bg-slate-950/60 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Attendance Management System</p>
        <h2 className="text-lg font-semibold text-white">{role} Workspace</h2>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
        {user?.email}
      </div>
    </header>
  );
}
