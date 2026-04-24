import { Link } from 'react-router-dom';

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/80">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-3 lg:px-8">
        <div>
          <p className="text-lg font-semibold text-white">AMS2</p>
          <p className="mt-2 text-sm text-slate-400">
            A modern attendance management website for admins, students, and teachers.
          </p>
        </div>
        <div className="text-sm text-slate-400">
          <p className="font-medium text-slate-200">Navigation</p>
          <div className="mt-3 flex flex-col gap-2">
            <Link to="/features">Features</Link>
            <Link to="/security">Security</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </div>
        <div className="text-sm text-slate-400">
          <p className="font-medium text-slate-200">Portal</p>
          <p className="mt-3">Use the sign in page to enter the role-based workspace.</p>
        </div>
      </div>
    </footer>
  );
}
