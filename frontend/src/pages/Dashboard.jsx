import React from 'react';
import { Users, BookOpen, CheckCircle, Clock, FileText } from 'lucide-react';
import SectionHeader from '../components/constantComponents/SectionHeader';

const Dashboard = () => {
  const stats = [
    { title: 'Total Students', value: '1,280', icon: <Users size={24} /> },
    { title: 'Active Courses', value: '24', icon: <BookOpen size={24} /> },
    { title: 'Today Attendance', value: '92%', icon: <CheckCircle size={24} /> },
    { title: 'Pending Approval', value: '12', icon: <Clock size={24} /> },
  ];

  return (
    <div className="space-y-8">
      <SectionHeader 
        title="System Overview"
        subtitle="Welcome back, Admin. Here's a snapshot of the system today."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-lg border border-slate-200 transition-shadow duration-200 flex items-center gap-5"
          >
            <div className="w-14 h-14 rounded-lg bg-brand-active/10 text-brand-active flex items-center justify-center shrink-0">
              {stat.icon}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{stat.title}</h3>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
