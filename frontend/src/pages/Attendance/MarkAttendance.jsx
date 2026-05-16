import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { CheckCircle, XCircle, Clock, Save, RefreshCcw, ChevronDown } from 'lucide-react';
import SectionHeader from '../../components/constantComponents/SectionHeader';

const STATUS_OPTIONS = ['PRESENT', 'ABSENT', 'LATE'];

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

const isTimeUpForCourse = (course, selectedDate) => {
  if (!course || !course.time) return false;
  const time = parseCourseTime(course.time);
  if (!time) return false;

  const target = new Date(selectedDate);
  target.setHours(time.hours, time.minutes, 0, 0);
  return new Date() > target;
};

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
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [courseDetails, setCourseDetails] = useState(null);

  useEffect(() => {
    api.getCourses()
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
      console.log('Loading attendance data for course:', selectedCourse, 'date:', date);

      try {
        const [usersResponse, attendanceResponse] = await Promise.all([
          api.getUsers({ role: 'STUDENT', courseId: selectedCourse }),
          api.getAttendanceByCourse(selectedCourse, { date }),
        ]);

        const studentList = usersResponse.users || [];
        const attendanceList = attendanceResponse.attendance || [];
        const courseInfo = attendanceResponse.course || courses.find(c => String(c.id) === String(selectedCourse));

        console.log('Loaded students:', studentList);
        console.log('Loaded attendance records:', attendanceList);
        console.log('Course info for attendance:', courseInfo);

        const attendanceMap = new Map(attendanceList.map((record) => [record.studentId, record]));

        const mergedRecords = studentList.length > 0
          ? studentList.map((student) => {
              const existing = attendanceMap.get(student.id);
              const defaultStatus = existing ? existing.status : (isTimeUpForCourse(courseInfo, date) ? 'ABSENT' : 'PRESENT');

              return {
                studentId: student.id,
                name: student.name,
                email: student.email,
                status: existing ? existing.status : defaultStatus,
                autoAbsent: !existing && defaultStatus === 'ABSENT',
              };
            })
          : attendanceList.map((record) => ({
              studentId: record.studentId,
              name: record.student?.name || 'Unknown Student',
              email: record.student?.email || 'Unknown Email',
              status: record.status,
              autoAbsent: false,
            }));

        console.log('Merged attendance records:', mergedRecords);

        setCourseDetails(courseInfo);
        setStudents(studentList);
        setRecords(mergedRecords);
      } catch (err) {
        console.error('Failed to load students or attendance:', err);
        showToast('error', err.message || 'Failed to load students for this course.');
      } finally {
        setLoading(false);
      }
    };

    loadStudentsAndAttendance();
  }, [selectedCourse, date, courses]);

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
    console.log('Saving attendance records:', records);
    try {
      const result = await api.bulkMarkAttendance({
        courseId: parseInt(selectedCourse),
        date,
        records: records.map((r) => ({ studentId: r.studentId, status: r.status })),
      });
      console.log('Save response:', result);
      showToast('success', `${result.saved} record(s) saved successfully.`);
    } catch (err) {
      console.error('Failed to save attendance:', err);
      showToast('error', err.message || 'Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = records.filter(r => r.status === 'PRESENT').length;
  const absentCount = records.filter(r => r.status === 'ABSENT').length;
  const lateCount = records.filter(r => r.status === 'LATE').length;
  console.log("records are", records)
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
      {courseDetails && isTimeUpForCourse(courseDetails, date) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Class time for <strong>{courseDetails.name}</strong> has passed. Students without an existing record are being shown as <strong>Absent</strong>.
        </div>
      )}

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
