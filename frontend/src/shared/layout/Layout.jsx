import { useState } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar role={user?.role} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <div className="flex flex-col min-w-0 lg:pl-56">
        <TopBar onMenuClick={() => setDrawerOpen(true)} />
        <main className="flex-1 px-4 sm:px-6 py-5 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}