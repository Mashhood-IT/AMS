import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { BarChart, PieChart, TrendingUp, Users, BookOpen, RefreshCcw, Download, Calendar } from 'lucide-react';
import SectionHeader from '../../components/constantComponents/SectionHeader';

const AttendanceSummary = () => {
  const [summary, setSummary] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    courseId: '',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchCourses();
    fetchSummary();
  }, []);

  const fetchCourses = async () => {
    try {
      const data = await api.getCourses();
      setCourses(data.courses || []);
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    }
  };

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const data = await api.getAttendanceSummary(filters);
      setSummary(data.summary || []);
    } catch (error) {
      console.error("Failed to fetch attendance summary:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    fetchSummary();
  };

  const getPercentageColor = (pct) => {
    if (pct >= 90) return 'text-emerald-600 bg-emerald-50';
    if (pct >= 75) return 'text-blue-600 bg-blue-50';
    if (pct >= 60) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Attendance Analytics"
        subtitle="Visual summary and performance metrics for student attendance."
      />
      {/* Filters Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Filter by Course</label>
            <select
              name="courseId"
              value={filters.courseId}
              onChange={handleFilterChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-dark/10 focus:border-brand-dark/30 transition-all"
            >
              <option value="">All Courses</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="w-44">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">From Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-dark/10 focus:border-brand-dark/30 transition-all"
            />
          </div>

          <div className="w-44">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">To Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-dark/10 focus:border-brand-dark/30 transition-all"
            />
          </div>

          <button
            onClick={applyFilters}
            className="bg-brand-dark text-white px-8 py-2.5 rounded-lg font-semibold hover:bg-brand-hover active:scale-[0.98] transition-all shadow-sm"
          >
            Generate Analysis
          </button>
        </div>
      </div>

      {/* Summary Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
          <RefreshCcw size={32} className="animate-spin text-brand-dark" />
          <p className="text-sm font-medium">Crunching attendance data...</p>
        </div>
      ) : summary.length === 0 ? (
        <div className="py-20 flex flex-col items-center gap-3 text-slate-400 border border-dashed border-slate-200 rounded-lg bg-slate-50">
          <BarChart size={32} strokeWidth={1.5} />
          <p className="text-sm font-medium">No attendance data to summarize for this criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {summary.map((item, index) => (
            <div key={index} className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-dark/5 flex items-center justify-center text-brand-dark group-hover:bg-brand-dark group-hover:text-white transition-all">
                    <Users size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 leading-tight">{item.student?.name}</h3>
                    <p className="text-slate-400 text-xs">{item.student?.email}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-lg text-sm font-bold border ${getPercentageColor(item.attendancePercentage)}`}>
                  {item.attendancePercentage}%
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <BookOpen size={14} className="text-slate-400" />
                  <span className="text-sm font-semibold text-slate-700">{item.course?.name} ({item.course?.code})</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-lg overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${item.attendancePercentage >= 75 ? 'bg-emerald-500' : item.attendancePercentage >= 60 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                    style={{ width: `${item.attendancePercentage}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-50">
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Present</p>
                  <p className="text-lg font-bold text-emerald-600">{item.present}</p>
                </div>
                <div className="text-center border-x border-slate-50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Late</p>
                  <p className="text-lg font-bold text-amber-500">{item.late}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Absent</p>
                  <p className="text-lg font-bold text-red-500">{item.absent}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AttendanceSummary;
