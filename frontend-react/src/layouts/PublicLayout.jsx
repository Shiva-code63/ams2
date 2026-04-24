import { Outlet } from 'react-router-dom';
import SiteNavbar from '../components/SiteNavbar';
import SiteFooter from '../components/SiteFooter';

export default function PublicLayout() {
  return (
    <main className="min-h-screen subtle-grid">
      <SiteNavbar />
      <Outlet />
      <SiteFooter />
    </main>
  );
}
