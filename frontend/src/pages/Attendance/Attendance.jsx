import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { ClipboardCheck, List } from 'lucide-react';
import SectionHeader from '../../components/constantComponents/SectionHeader';

const tabs = [
  { label: 'Attendance List', path: '/dashboard/attendance/list', icon: <List size={16} /> },
  { label: 'Mark Attendance', path: '/dashboard/attendance/mark', icon: <ClipboardCheck size={16} /> },
];

const Attendance = () => {
  return (
    <div className="space-y-6">
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

      <Outlet />
    </div>
  );
};

export default Attendance;
