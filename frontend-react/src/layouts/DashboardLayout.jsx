import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import MobileNav from '../components/MobileNav';

export default function DashboardLayout({ role }) {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      <Sidebar role={role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav role={role} />
        <Topbar role={role} />
        <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
