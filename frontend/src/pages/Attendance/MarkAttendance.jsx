import React, { useState, useEffect } from 'react';
import { api } from '../../api';
import { CheckCircle, XCircle, Save, RefreshCcw, ChevronDown, Timer, QrCode, X } from 'lucide-react';
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

const getDayName = (dateStr) => {
  if (!dateStr) return '';
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  return days[dateObj.getDay()];
};

const parseCourseTime = (time, selectedDate) => {
  if (!time) return null;
  let resolvedTime = time.trim();

  // If time is a serialized JSON map of daily times
  if (resolvedTime.startsWith('{')) {
    try {
      const parsedMap = JSON.parse(resolvedTime);
      const dayName = getDayName(selectedDate);
      if (dayName && parsedMap[dayName]) {
        resolvedTime = parsedMap[dayName].trim();
      } else {
        return null; // No teaching time for this day
      }
    } catch (e) {
      console.error('Failed to parse daily course times:', e);
      return null;
    }
  }

  const ampmMatch = resolvedTime.match(/\s?(am|pm)$/i);
  let normalized = resolvedTime;

  if (ampmMatch) {
    const [timePart, period] = resolvedTime.split(' ');
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
  const parsed = parseCourseTime(courseTimeStr, selectedDate);
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

  // QR Check-in states
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrToken, setQrToken] = useState('');
  const [qrLoading, setQrLoading] = useState(false);

  const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isStudentRole = loggedInUser?.role === 'STUDENT';

  // Handle QR token fetching and real-time student updates
  useEffect(() => {
    if (!showQRModal || !selectedCourse) return;

    const fetchToken = async () => {
      try {
        setQrLoading(true);
        const res = await api.getQRToken(selectedCourse);
        if (res.success) {
          setQrToken(res.token);
        }
      } catch (err) {
        console.error("Failed to load QR token:", err);
      } finally {
        setQrLoading(false);
      }
    };

    fetchToken();

    // Refetches token every 60 seconds (safe dynamic window)
    const tokenInterval = setInterval(fetchToken, 60000);

    // Live refresh student attendance records every 4 seconds
    const reloadStudents = async () => {
      try {
        const [usersResponse, attendanceResponse] = await Promise.all([
          api.getUsers({ role: 'STUDENT', courseId: selectedCourse }),
          api.getAttendanceByCourse(selectedCourse, { date }),
        ]);
        const studentList = usersResponse.users || [];
        const attendanceList = attendanceResponse.attendance || [];
        const courseInfo = courses.find(c => String(c.id) === String(selectedCourse));
        const attendanceMap = new Map(attendanceList.map((record) => [record.studentId, record]));

        const mergedRecords = studentList.map((student) => {
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
        });
        setRecords(mergedRecords);
      } catch (err) {
        console.error("Live reload failed:", err);
      }
    };

    const reloadInterval = setInterval(reloadStudents, 4000);

    return () => {
      clearInterval(tokenInterval);
      clearInterval(reloadInterval);
    };
  }, [showQRModal, selectedCourse, date, courses]);


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
  const absentCount = records.filter(r => r.status === 'ABSENT').length;

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

        {isStudentRole && selectedCourse && (
          <button
            onClick={() => setShowQRModal(true)}
            className="btn btn-blue"
          >
            <QrCode size={16} />
            Get Check-in QR
          </button>
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
      {/* Dynamic QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-sm w-full shadow-2xl p-5 relative overflow-hidden flex flex-col items-center">

            {/* Elegant Header */}
            <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3 mb-3.5">
              <div>
                <h3 className="text-base font-bold text-slate-800">
                  {isStudentRole ? 'My Check-in QR Code' : 'Dynamic Attendance QR'}
                </h3>
                <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
                  {isStudentRole ? 'Scan with your phone to mark attendance' : 'Scannable check-in for students'}
                </p>
              </div>
              <button
                onClick={() => setShowQRModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content / Info Card */}
            <div className="w-full bg-slate-50 border border-slate-200/60 rounded-xl p-3 mb-3.5 text-center">
              <span className="text-[10px] font-semibold text-brand-dark bg-blue-50 px-2 py-0.5 rounded-full">
                {courses.find(c => String(c.id) === String(selectedCourse))?.name || 'Course'}
              </span>
              <h4 className="text-xs font-bold text-slate-700 mt-1.5">
                Scan QR to Automatically Mark Present
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">
                {isStudentRole
                  ? "Open your phone's camera, scan the QR code, and log in to verify your identity."
                  : 'Dynamic code expires & rotates automatically.'}
              </p>
            </div>

            {/* QR Display */}
            <div className="relative p-2 bg-gradient-to-tr from-slate-100 to-white border border-slate-200/80 rounded-xl shadow-inner mb-3.5 flex items-center justify-center min-h-[200px] min-w-[200px]">
              {qrLoading || !qrToken ? (
                <div className="flex flex-col items-center gap-1.5 text-slate-400">
                  <RefreshCcw size={20} className="animate-spin text-brand-dark" />
                  <span className="text-[10px]">Generating dynamic token...</span>
                </div>
              ) : (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    `${((origin, hostname, devIP) => {
                      if ((hostname === 'localhost' || hostname === '127.0.0.1') && devIP && devIP !== 'localhost') {
                        return origin.replace(hostname, devIP);
                      }
                      return origin;
                    })(window.location.origin, window.location.hostname, import.meta.env.VITE_DEV_IP)}/#/check-in?courseId=${selectedCourse}&token=${qrToken}`
                  )}`}
                  alt="Attendance Scan QR Code"
                  className="w-[180px] h-[180px] rounded-lg select-none"
                />
              )}

              {/* Pulsing indicator */}
              <div className="absolute top-2.5 right-2.5 flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </div>
            </div>

            {/* Status display / real-time counts */}
            {isStudentRole ? (
              <div className="w-full border-t border-slate-100 pt-3.5">
                {records[0]?.status === 'PRESENT' ? (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 text-center flex flex-col items-center animate-fade-in-up">
                    <div className="inline-flex items-center justify-center p-1 bg-emerald-500 rounded-full text-white mb-1 shadow-sm shadow-emerald-500/25">
                      <CheckCircle size={14} />
                    </div>
                    <p className="text-xs font-extrabold text-emerald-800 leading-tight">PRESENT</p>
                    <p className="text-[10px] text-emerald-600 mt-0.5 font-medium leading-tight">Your attendance has been successfully recorded!</p>
                  </div>
                ) : (
                  <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-2.5 text-center flex flex-col items-center">
                    <div className="inline-flex items-center justify-center p-1 bg-amber-500 rounded-full text-white mb-1 animate-bounce">
                      <RefreshCcw size={14} className="animate-spin text-amber-500 bg-white rounded-full p-0.5" style={{ animationDuration: '3s' }} />
                    </div>
                    <p className="text-xs font-extrabold text-amber-800 leading-tight">PENDING SCAN</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 font-medium leading-tight">Waiting for you to scan this code on your mobile phone...</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full grid grid-cols-2 gap-3 border-t border-slate-100 pt-3.5 text-center">
                <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-2">
                  <p className="text-base font-extrabold text-emerald-600 leading-none">
                    {records.filter(r => r.status === 'PRESENT').length}
                  </p>
                  <p className="text-[10px] font-semibold text-emerald-800 mt-0.5">Checked In</p>
                </div>
                <div className="bg-slate-50/60 border border-slate-100 rounded-xl p-2">
                  <p className="text-base font-extrabold text-slate-500 leading-none">
                    {records.filter(r => r.status === 'PENDING').length}
                  </p>
                  <p className="text-[10px] font-semibold text-slate-500 mt-0.5">Pending Scan</p>
                </div>
              </div>
            )}

            {/* Live activity ticker */}
            <div className="w-full mt-2.5 flex items-center justify-center gap-1.5 text-[10px] font-medium text-slate-400">
              <span className={`inline-block h-1.5 w-1.5 rounded-full animate-pulse ${(isStudentRole && records[0]?.status === 'PRESENT') ? 'bg-emerald-500' : 'bg-brand-dark'}`}></span>
              <span>
                {isStudentRole
                  ? (records[0]?.status === 'PRESENT' ? 'Check-in completed successfully!' : 'Waiting for scan on your mobile device...')
                  : 'Waiting for students to check in...'}
              </span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default MarkAttendance;
