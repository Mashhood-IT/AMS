import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { CheckCircle, XCircle, Save, RefreshCcw, ChevronDown, Timer } from 'lucide-react';
import SectionHeader from '../../components/constantComponents/SectionHeader';

const STATUS_OPTIONS = ['PRESENT', 'ABSENT'];

const statusStyle = {
  PRESENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ABSENT: 'bg-red-50 text-red-600 border-red-200',
};

const statusIcon = {
  PRESENT: <CheckCircle size={14} />,
  ABSENT: <XCircle size={14} />,
};

const parseCourseTime = (time) => {
  if (!time) return null;
  const trimmed = time.trim();
  const ampmMatch = trimmed.match(/\s?(am|pm)$/i);
  let normalized = trimmed;

  if (ampmMatch) {
    const [timePart, period] = trimmed.split(' ');
    const [hour, minute] = timePart.split(':').map(Number);
    let hrs = hour;
    if (period.toUpperCase() === 'PM' && hour !== 12) hrs += 12;
    if (period.toUpperCase() === 'AM' && hour === 12) hrs = 0;
    normalized = `${hrs.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }

  const [hours, minutes] = normalized.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return { hours, minutes };
};

const isGracePeriodOver = (courseTimeStr, selectedDate) => {
  if (!courseTimeStr || !selectedDate) return false;
  const parsed = parseCourseTime(courseTimeStr);
  if (!parsed) return false;

  const [y, mo, d] = selectedDate.split('-').map(Number);
  const classTime = new Date(y, mo - 1, d, parsed.hours, parsed.minutes, 0, 0);
  const limitTime = new Date(classTime.getTime() + 5 * 60 * 1000);
  return new Date() > limitTime;
};

const MarkAttendance = () => {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [courseDetails, setCourseDetails] = useState(null);

  const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isStudentRole = loggedInUser?.role === 'STUDENT';

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const params = user.role === 'STUDENT' && user.className ? { className: user.className } : {};
    
    api.getCourses(params)
      .then(d => setCourses(d.courses || []))
      .catch(() => { });
  }, []);

  useEffect(() => {
    const loadStudentsAndAttendance = async () => {
      if (!selectedCourse) {
        setStudents([]);
        setRecords([]);
        setCourseDetails(null);
        return;
      }

      setLoading(true);

      try {
        const [usersResponse, attendanceResponse] = await Promise.all([
          api.getUsers({ role: 'STUDENT', courseId: selectedCourse }),
          api.getAttendanceByCourse(selectedCourse, { date }),
        ]);

        let studentList = usersResponse.users || [];
        if (loggedInUser.role === 'STUDENT') {
          studentList = studentList.filter(s => s.id === loggedInUser.id);
        }
        const attendanceList = attendanceResponse.attendance || [];
        const courseInfo = attendanceResponse.course || courses.find(c => String(c.id) === String(selectedCourse));

        const attendanceMap = new Map(attendanceList.map((record) => [record.studentId, record]));

        const mergedRecords = studentList.length > 0
          ? studentList.map((student) => {
              const existing = attendanceMap.get(student.id);
              let defaultStatus = 'PENDING';
              if (existing) {
                defaultStatus = existing.status;
              } else if (courseInfo?.time && isGracePeriodOver(courseInfo.time, date)) {
                defaultStatus = 'ABSENT';
              }
              return {
                studentId: student.id,
                name: student.name,
                email: student.email,
                status: defaultStatus,
                alreadySaved: !!existing,
              };
            })
          : attendanceList.map((record) => ({
              studentId: record.studentId,
              name: record.student?.name || 'Unknown Student',
              email: record.student?.email || 'Unknown Email',
              status: record.status,
              alreadySaved: true,
            }));

        setCourseDetails(courseInfo);
        setStudents(studentList);
        setRecords(mergedRecords);
      } catch (err) {
        showToast('error', err.message || 'Failed to load students for this course.');
      } finally {
        setLoading(false);
      }
    };

    loadStudentsAndAttendance();
  }, [selectedCourse, date, courses]);

  // Real-time ticker to auto-mark ABSENT for students who are currently on the page
  useEffect(() => {
    if (!isStudentRole || !courseDetails?.time || !date || records.length === 0) return;

    const currentRecord = records[0];
    if (currentRecord.status !== 'PENDING' || currentRecord.alreadySaved) return;

    const interval = setInterval(() => {
      if (isGracePeriodOver(courseDetails.time, date)) {
        clearInterval(interval);
        
        // Update local state to ABSENT
        setRecords(prev => prev.map(r => ({ ...r, status: 'ABSENT', alreadySaved: true })));

        // Persist the ABSENT record directly to backend
        api.bulkMarkAttendance({
          courseId: parseInt(selectedCourse),
          date,
          records: [{ studentId: loggedInUser.id, status: 'ABSENT' }],
        }).then(() => {
          showToast('error', "Time's up! You have been automatically marked Absent.");
        }).catch((err) => {
          console.error("Auto-absent background commit failed:", err);
        });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [courseDetails, date, records, isStudentRole, selectedCourse]);

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
    
    // Don't allow saving if PENDING
    if (isStudentRole && records[0].status === 'PENDING') {
      showToast('error', 'Please choose Present or Absent before saving.');
      return;
    }

    setSaving(true);
    try {
      const result = await api.bulkMarkAttendance({
        courseId: parseInt(selectedCourse),
        date,
        records: records.map((r) => ({ studentId: r.studentId, status: r.status })),
      });
      showToast('success', `${result.saved} record(s) saved successfully.`);
      setRecords(prev => prev.map(r => ({ ...r, alreadySaved: true })));
    } catch (err) {
      console.error('Failed to save attendance:', err);
      showToast('error', err.message || 'Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = records.filter(r => r.status === 'PRESENT').length;
  const absentCount  = records.filter(r => r.status === 'ABSENT').length;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Mark Attendance"
        subtitle={isStudentRole ? "Submit your daily attendance for this course." : "Record daily student attendance for academic courses."}
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

        {/* Students don't pick dates — they always mark attendance for today */}
        {!isStudentRole && (
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
        )}
      </div>

      {/* Student Guidance Alert */}
      {isStudentRole && selectedCourse && courseDetails && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm font-medium transition-all duration-300
          ${records[0]?.status === 'PRESENT'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : records[0]?.status === 'ABSENT'
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-amber-50 border-amber-200 text-amber-800'
          }`}
        >
          <Timer size={18} className={records[0]?.status === 'PENDING' ? "animate-pulse text-amber-500" : ""} />
          <span>
            {records[0]?.status === 'PRESENT' ? (
              <>Your attendance is successfully recorded as <strong className="uppercase">Present</strong>.</>
            ) : records[0]?.status === 'ABSENT' ? (
              <>You are marked <strong className="uppercase">Absent</strong> for this lecture.</>
            ) : (
              <>Please mark your attendance, or it will be automatically marked <strong className="uppercase text-red-600">Absent</strong> 5 minutes after the class has started!</>
            )}
          </span>
        </div>
      )}

      {/* Past-class warning (non-students only) */}
      {!isStudentRole && courseDetails && isGracePeriodOver(courseDetails.time, date) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Class time for <strong>{courseDetails.name}</strong> has passed. Students without a saved record are shown as <strong>Absent</strong>.
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      {!selectedCourse ? (
        <div className="py-20 flex flex-col items-center gap-3 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
          <div className="p-4 bg-white rounded-lg shadow-sm">
            <RefreshCcw size={28} className="text-slate-300" />
          </div>
          <p className="text-sm font-medium">Select a course to load student records</p>
        </div>
      ) : loading ? (
        <div className="py-20 flex flex-col items-center gap-3 text-slate-400">
          <RefreshCcw size={28} className="animate-spin text-brand-dark" />
          <p className="text-sm">Loading attendance details...</p>
        </div>
      ) : records.length === 0 ? (
        <div className="py-20 flex flex-col items-center gap-3 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
          <p className="text-sm font-medium">No records found for this course.</p>
        </div>
      ) : (
        <>
          {/* Summary + Mark-All (non-students only) */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-3">
              <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle size={13} /> {presentCount} Present
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200">
                <XCircle size={13} /> {absentCount} Absent
              </span>
            </div>
            {!isStudentRole && (
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
            )}
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
                        {STATUS_OPTIONS.map(s => {
                          const isSelected = r.status === s;
                          const isDisabled = isStudentRole && (r.alreadySaved || (courseDetails?.time && isGracePeriodOver(courseDetails.time, date)));
                          
                          return (
                            <button
                              key={s}
                              disabled={isDisabled}
                              onClick={() => setStatus(r.studentId, s)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all
                                ${isSelected
                                  ? `${statusStyle[s]} shadow-sm`
                                  : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 disabled:hover:border-slate-200'
                                }
                                ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'active:scale-95'}`}
                            >
                              {isSelected && statusIcon[s]}
                              {s === 'PRESENT' ? 'Present' : 'Absent'}
                            </button>
                          );
                        })}
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
              disabled={saving || (isStudentRole && (records[0]?.alreadySaved || (courseDetails?.time && isGracePeriodOver(courseDetails.time, date))))}
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
