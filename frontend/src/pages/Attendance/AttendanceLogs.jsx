import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { Search, Calendar, Filter, RefreshCcw, User, BookOpen, Clock, CheckCircle, XCircle } from 'lucide-react';
import SectionHeader from '../../components/constantComponents/SectionHeader';

const statusMap = {
  PRESENT: { label: 'Present', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: <CheckCircle size={14} /> },
  ABSENT: { label: 'Absent', color: 'text-red-600 bg-red-50 border-red-100', icon: <XCircle size={14} /> },
  LATE: { label: 'Late', color: 'text-amber-600 bg-amber-50 border-amber-100', icon: <Clock size={14} /> },
};

const AttendanceLogs = () => {
  const [logs, setLogs] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    courseId: '',
    startDate: '',
    endDate: '',
    status: ''
  });

  useEffect(() => {
    fetchCourses();
    fetchLogs();
  }, []);

  const fetchCourses = async () => {
    try {
      const data = await api.getCourses();
      setCourses(data.courses || []);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAttendance(filters);
      setLogs(data.attendance || []);
    } catch (error) {
      console.error("Failed to fetch attendance logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    fetchLogs();
  };

  const resetFilters = () => {
    setFilters({
      courseId: '',
      startDate: '',
      endDate: '',
      status: ''
    });
    // fetchLogs will be called by useEffect or manually
  };

  // Re-fetch when filters are reset manually
  useEffect(() => {
    if (Object.values(filters).every(v => v === '')) {
      fetchLogs();
    }
  }, [filters]);

  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Attendance History"
        subtitle="Review and search historical attendance records."
      />
      {/* Filters Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Course</label>
            <select
              name="courseId"
              value={filters.courseId}
              onChange={handleFilterChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-dark/10 focus:border-brand-dark/30 transition-all"
            >
              <option value="">All Courses</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-dark/10 focus:border-brand-dark/30 transition-all"
            >
              <option value="">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="ABSENT">Absent</option>
              <option value="LATE">Late</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-dark/10 focus:border-brand-dark/30 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">End Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-dark/10 focus:border-brand-dark/30 transition-all"
            />
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={applyFilters}
              className="flex-1 bg-brand-dark text-white text-sm font-semibold py-2 rounded-lg hover:bg-brand-hover transition-all"
            >
              Apply
            </button>
            <button
              onClick={resetFilters}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              title="Reset Filters"
            >
              <RefreshCcw size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
            <RefreshCcw size={32} className="animate-spin text-brand-dark" />
            <p className="text-sm font-medium">Loading logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
            <Search size={32} strokeWidth={1.5} />
            <p className="text-sm font-medium">No attendance records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Student</th>
                  <th className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Course</th>
                  <th className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 font-semibold text-slate-500 text-xs uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <Calendar size={14} className="text-slate-400" />
                        {new Date(log.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-brand-dark/5 flex items-center justify-center text-brand-dark font-bold text-xs">
                          {log.student?.name?.[0]}
                        </div>
                        <div>
                          <p className="text-slate-900 font-semibold">{log.student?.name}</p>
                          <p className="text-slate-500 text-xs">{log.student?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-slate-800 font-medium">{log.course?.name}</p>
                        <p className="text-slate-400 text-xs">{log.course?.code}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${statusMap[log.status]?.color}`}>
                        {statusMap[log.status]?.icon}
                        {statusMap[log.status]?.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 italic max-w-xs truncate">
                      {log.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceLogs;
