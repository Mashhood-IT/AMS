import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { ClipboardCheck, List, BarChart2 } from 'lucide-react';
import SectionHeader from '../../components/constantComponents/SectionHeader';

const tabs = [
  { label: 'Mark Attendance', path: '/dashboard/attendance/mark', icon: <ClipboardCheck size={16} /> },
  { label: 'Logs', path: '/dashboard/attendance/logs', icon: <List size={16} /> },
  { label: 'Summary', path: '/dashboard/attendance/summary', icon: <BarChart2 size={16} /> },
];

const Attendance = () => {
  return (
    <div className="animate-fade-in space-y-6">
      {/* Page Header */}
      <SectionHeader 
        title="Attendance Management"
        subtitle="Mark, view, and analyse student attendance across all courses."
      />

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-slate-200">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              `flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all border-b-2 -mb-px
              ${isActive
                ? 'border-brand-dark text-brand-dark bg-slate-50'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`
            }
          >
            {tab.icon}
            {tab.label}
          </NavLink>
        ))}
      </div>

      {/* Tab Content */}
      <Outlet />
    </div>
  );
};

export default Attendance;
