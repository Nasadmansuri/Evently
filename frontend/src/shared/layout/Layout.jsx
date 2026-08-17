import { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <Sidebar role={user?.role} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <div className="flex min-w-0 flex-col lg:pl-60">
        <TopBar onMenuClick={() => setDrawerOpen(true)} />
        <main className="mx-auto flex w-full max-w-7xl flex-1 px-4 py-5 sm:px-6 lg:px-8">
          <div className="w-full rounded-[18px] border border-slate-200 bg-white/80 p-3 shadow-sm sm:p-4 lg:p-5">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}