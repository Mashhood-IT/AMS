import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, BookOpen, UserCheck, Shield, School, Loader2, RefreshCw } from 'lucide-react';
import SectionHeader from '../components/constantComponents/SectionHeader';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const roleName = user.role ? user.role.toUpperCase() : 'STUDENT';

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/dashboard/stats`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
      toast.error('Failed to load real-time statistics');
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const name = user.name || 'User';
    switch (roleName) {
      case 'ADMIN':
        return `Welcome back, Admin ${name}. Here's a system-wide snapshot today.`;
      case 'PRINCIPAL':
        return `Welcome back, Principal ${name}. Here's a snapshot of your institute.`;
      case 'TEACHER':
        return `Welcome back, ${name}. Here's your academic status today.`;
      case 'STUDENT':
        return `Welcome back, ${name}. Check your active courses and classes below.`;
      default:
        return `Welcome back, ${name}. Here's your overview today.`;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 size={40} className="animate-spin text-brand-active" />
        <p className="text-slate-500 font-medium">Loading Real-time Overview...</p>
      </div>
    );
  }

  // Define cards config
  const cards = [];

  if (stats) {
    // 1. Total Students (Admin, Principal, Teacher)
    if (roleName === 'ADMIN' || roleName === 'PRINCIPAL' || roleName === 'TEACHER') {
      cards.push({
        title: 'Total Students',
        value: stats.totalStudents ?? 0,
        icon: <Users size={24} />,
        bgClass: 'bg-blue-50 text-blue-600',
      });
    }

    // 2. Active Courses (Admin, Principal, Teacher, Student)
    cards.push({
      title: 'Active Courses',
      value: stats.activeCourses ?? 0,
      icon: <BookOpen size={24} />,
      bgClass: 'bg-emerald-50 text-emerald-600',
    });

    // 3. No. of Teachers (Admin, Principal)
    if (roleName === 'ADMIN' || roleName === 'PRINCIPAL') {
      cards.push({
        title: 'No. of Teachers',
        value: stats.totalTeachers ?? 0,
        icon: <UserCheck size={24} />,
        bgClass: 'bg-indigo-50 text-indigo-600',
      });
    }

    // 4. No. of Principals (Admin only)
    if (roleName === 'ADMIN') {
      cards.push({
        title: 'No. of Principals',
        value: stats.totalPrincipals ?? 0,
        icon: <Shield size={24} />,
        bgClass: 'bg-amber-50 text-amber-600',
      });
    }

    // 5. No. of Institutes (Admin only)
    if (roleName === 'ADMIN') {
      cards.push({
        title: 'No. of Institutes',
        value: stats.totalInstitutes ?? 0,
        icon: <School size={24} />,
        bgClass: 'bg-rose-50 text-rose-600',
      });
    }
  }

  return (
    <div className="space-y-8">
      <SectionHeader
        title="System Overview"
        subtitle={getGreeting()}
        button={
          <button
            onClick={fetchStats}
            className="btn btn-cancel flex items-center gap-2 text-xs font-semibold py-2 px-3 border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={14} />
            Refresh Stats
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-lg border border-slate-200 hover:shadow-md transition-shadow duration-200 flex items-center gap-5"
          >
            <div className={`w-14 h-14 rounded-lg flex items-center justify-center shrink-0 ${card.bgClass}`}>
              {card.icon}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{card.title}</h3>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{card.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
