import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { CheckCircle, XCircle, Clock, Save, RefreshCcw, ChevronDown } from 'lucide-react';
import SectionHeader from '../../components/constantComponents/SectionHeader';

const STATUS_OPTIONS = ['PRESENT', 'ABSENT', 'LATE'];

const statusStyle = {
  PRESENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ABSENT: 'bg-red-50 text-red-600 border-red-200',
  LATE: 'bg-amber-50 text-amber-600 border-amber-200',
};

const statusIcon = {
  PRESENT: <CheckCircle size={14} />,
  ABSENT: <XCircle size={14} />,
  LATE: <Clock size={14} />,
};

const MarkAttendance = () => {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState([]);   // [{ studentId, name, email, status }]
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message }

  // Load courses on mount
  useEffect(() => {
    api.getCourses()
      .then(d => setCourses(d.courses || []))
      .catch(() => { });
  }, []);

  // Load students when course changes
  useEffect(() => {
    if (!selectedCourse) {
      setStudents([]);
      setRecords([]);
      return;
    }
    setLoading(true);
    // Fetch only students enrolled in this course
    api.getUsers({ role: 'STUDENT', courseId: selectedCourse })
      .then(d => {
        const list = d.users || [];
        setStudents(list);
        // Seed records with default PRESENT
        setRecords(list.map(s => ({
          studentId: s.id,
          name: s.name,
          email: s.email,
          status: 'PRESENT'
        })));
      })
      .catch((err) => {
        console.error("Failed to load students:", err);
        showToast('error', 'Failed to load students for this course.');
      })
      .finally(() => setLoading(false));
  }, [selectedCourse]);

  const setStatus = (studentId, status) => {
    setRecords(prev => prev.map(r => r.studentId === studentId ? { ...r, status } : r));
  };

  const markAll = (status) => {
    setRecords(prev => prev.map(r => ({ ...r, status })));
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSave = async () => {
    if (!selectedCourse || records.length === 0) return;
    setSaving(true);
    try {
      const result = await api.bulkMarkAttendance({
        courseId: parseInt(selectedCourse),
        date,
        records: records.map(r => ({ studentId: r.studentId, status: r.status })),
      });
      showToast('success', `${result.saved} record(s) saved successfully.`);
    } catch (err) {
      showToast('error', err.message || 'Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = records.filter(r => r.status === 'PRESENT').length;
  const absentCount = records.filter(r => r.status === 'ABSENT').length;
  const lateCount = records.filter(r => r.status === 'LATE').length;

  return (
    <div className="space-y-6">
      <SectionHeader 
        title="Mark Attendance"
        subtitle="Record daily student attendance for academic courses."
      />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-lg border shadow-lg text-sm font-medium transition-all ${toast.type === 'success' ? 'bg-white border-emerald-200 text-emerald-700' : 'bg-white border-red-200 text-red-600'}`}>
          {toast.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          {toast.message}
        </div>
      )}

      {/* Filters Row */}
      <div className="flex flex-wrap gap-4 items-end bg-slate-50 border border-slate-200 rounded-lg p-5">
        {/* Course Picker */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Course</label>
          <div className="relative">
            <select
              value={selectedCourse}
              onChange={e => setSelectedCourse(e.target.value)}
              className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-4 py-2.5 pr-9 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-dark/15 focus:border-brand-dark/40 transition-all"
            >
              <option value="">— Select a course —</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
            <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Date Picker */}
        <div className="w-48">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Date</label>
          <input
            type="date"
            value={date}
            max={new Date().toISOString().split('T')[0]}
            onChange={e => setDate(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-dark/15 focus:border-brand-dark/40 transition-all"
          />
        </div>
      </div>

      {/* Student Table */}
      {!selectedCourse ? (
        <div className="py-20 flex flex-col items-center gap-3 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <RefreshCcw size={28} className="text-slate-300" />
          </div>
          <p className="text-sm font-medium">Select a course to load students</p>
        </div>
      ) : loading ? (
        <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
          <RefreshCcw size={28} className="animate-spin text-brand-dark" />
          <p className="text-sm">Loading students...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="py-20 flex flex-col items-center gap-3 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
          <p className="text-sm font-medium">No students found for this course.</p>
        </div>
      ) : (
        <>
          {/* Stats + Bulk Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-3">
              <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle size={13} /> {presentCount} Present
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200">
                <XCircle size={13} /> {absentCount} Absent
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
                <Clock size={13} /> {lateCount} Late
              </span>
            </div>
            <div className="flex gap-2 text-xs">
              <span className="text-slate-400 font-medium self-center">Mark all:</span>
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => markAll(s)}
                  className={`px-3 py-1.5 rounded-lg border font-semibold transition-all hover:opacity-80 ${statusStyle[s]}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider">#</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider">Student</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider">Email</th>
                  <th className="px-5 py-3.5 text-left font-semibold text-slate-500 text-xs uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={r.studentId} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5 text-slate-400 font-medium">{i + 1}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-800">{r.name}</td>
                    <td className="px-5 py-3.5 text-slate-500">{r.email}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-2">
                        {STATUS_OPTIONS.map(s => (
                          <button
                            key={s}
                            onClick={() => setStatus(r.studentId, s)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all
                              ${r.status === s
                                ? `${statusStyle[s]} shadow-sm`
                                : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                              }`}
                          >
                            {r.status === s && statusIcon[s]}
                            {s === 'PRESENT' ? 'Present' : s === 'ABSENT' ? 'Absent' : 'Late'}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-brand-dark text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-brand-hover active:scale-[0.98] transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default MarkAttendance;
