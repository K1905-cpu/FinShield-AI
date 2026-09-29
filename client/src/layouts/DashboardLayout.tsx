import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { api } from '../services/api';

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [alertsCount, setAlertsCount] = useState(0);

  useEffect(() => {
    const fetchAlertsCount = async () => {
      try {
        const data = await api.alerts.getAll({ status: 'new', limit: 1 });
        setAlertsCount(data.total);
      } catch (err) {
        // quiet error on initial background ping
      }
    };

    fetchAlertsCount();
    const interval = setInterval(fetchAlertsCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        alertsCount={alertsCount}
      />

      <div className="lg:pl-64 flex flex-col flex-1">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          alertsCount={alertsCount}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fadeIn">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
