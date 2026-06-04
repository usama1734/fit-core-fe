import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/layout/Navbar.jsx';
import Sidebar from '../components/layout/Sidebar.jsx';

const titles = {
  '/dashboard': 'Dashboard',
  '/profile': 'My Profile',
  '/members': 'Members',
  '/trainers': 'Trainers',
  '/plans': 'Membership Plans',
  '/attendance': 'Attendance',
  '/payments': 'Payments',
  '/payment/success': 'Payment successful',
  '/payment/cancel': 'Payment cancelled',
};

function getPageTitle(pathname) {
  if (/^\/trainers\/[^/]+$/.test(pathname)) return 'Trainer members';
  return titles[pathname] ?? 'FitCore';
}

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const title = getPageTitle(pathname);

  return (
    <div className="flex h-dvh max-h-dvh w-full overflow-hidden bg-slate-950 text-slate-100">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Navbar onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mx-auto w-full max-w-7xl px-4 py-5 pb-safe sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
