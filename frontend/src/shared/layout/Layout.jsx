import { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <Sidebar role={user?.role} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <div className="flex min-w-0 flex-col lg:pl-64">
        <TopBar onMenuClick={() => setDrawerOpen(true)} />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}