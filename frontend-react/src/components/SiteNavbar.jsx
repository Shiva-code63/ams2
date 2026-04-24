import { Link, NavLink } from 'react-router-dom';

const navItems = [
  { to: '/features', label: 'Features' },
  { to: '/security', label: 'Security' },
  { to: '/contact', label: 'Contact' },
];

export default function SiteNavbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500" />
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/70">AMS2</p>
            <p className="text-sm text-slate-300">Attendance portal</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'text-cyan-200' : 'hover:text-white')}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link to="/login" className="btn btn-secondary px-4 py-2 text-sm">
            Sign In
          </Link>
          <Link to="/login" className="btn btn-primary px-4 py-2 text-sm">
            Open Portal
          </Link>
        </div>
      </div>
    </header>
  );
}
