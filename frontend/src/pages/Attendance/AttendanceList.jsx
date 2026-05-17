import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import { RefreshCcw, CheckCircle, XCircle, Clock } from 'lucide-react';
import SectionHeader from '../../components/constantComponents/SectionHeader';

const statusStyle = {
  PRESENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ABSENT: 'bg-red-50 text-red-600 border-red-200',
  LATE: 'bg-amber-50 text-amber-600 border-amber-200',
};

const AttendanceList = () => {
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('Select a class and subject to view attendance.');

  // Determine if the logged-in user is a student with a fixed class
  const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isStudent = loggedInUser?.role === 'STUDENT';
  const studentClass = isStudent ? (loggedInUser?.className || null) : null;

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const coursesResponse = await api.getCourses();
        setCourses(coursesResponse.courses || []);

        // For students, their class is locked — no need to fetch all classes
        if (user?.role === 'STUDENT' && user?.className) {
          setSelectedClass(user.className);
          return; // skip loading the class list from the institute
        }

        if (user?.instituteId) {
          const instituteResponse = await api.getInstituteById(user.instituteId);
          if (instituteResponse.success && instituteResponse.institute?.maxClass) {
            const maxClass = instituteResponse.institute.maxClass;
            setClasses(Array.from({ length: maxClass }, (_, idx) => `Class ${idx + 1}`));
          }
        }
      } catch (err) {
        console.error('Failed to load attendance filters:', err);
        setError('Unable to load filters. Please refresh the page.');
      }
    };

    loadOptions();
  }, []);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!selectedCourse || !selectedClass) {
        setAttendance([]);
        setInfo('Select a class and subject to view attendance.');
        return;
      }

      setLoading(true);
      setError('');
      setInfo('Loading attendance...');

      try {
        const result = await api.getAttendance({ courseId: selectedCourse, className: selectedClass });
        if (result.success) {
          let records = result.attendance || [];
          if (isStudent && loggedInUser?.id) {
            records = records.filter(r => r.studentId === loggedInUser.id);
          }
          setAttendance(records);
          setInfo(result.attendance && result.attendance.length > 0 ? '' : 'No attendance records found for the selected class and subject.');
        } else {
          setError(result.message || 'Failed to load attendance.');
          setAttendance([]);
        }
      } catch (err) {
        console.error('Attendance list fetch error:', err);
        setError(err.message || 'Failed to load attendance.');
        setAttendance([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [selectedCourse, selectedClass]);

  const selectedSubject = courses.find((c) => String(c.id) === String(selectedCourse));

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Attendance List"
        subtitle="Filter by class and subject to review attendance records."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Class filter: locked badge for students, dropdown for others */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Class</label>
          {isStudent ? (
            <div className="w-full rounded-lg border border-brand-dark/30 bg-brand-dark/5 px-4 py-2.5 text-sm font-semibold text-brand-dark flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              {studentClass || 'No class assigned'}
            </div>
          ) : (
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-brand-dark focus:ring-2 focus:ring-brand-dark/15"
            >
              <option value="">Select class</option>
              {classes.map((className) => (
                <option key={className} value={className}>{className}</option>
              ))}
            </select>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Subject</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-brand-dark focus:ring-2 focus:ring-brand-dark/15"
          >
            <option value="">Select subject</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>{course.name} ({course.code})</option>
            ))}
          </select>
        </div>

        <div className="space-y-2 xl:col-span-2">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Selected Filters</label>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p><strong>Class:</strong> {selectedClass || 'Not selected'}</p>
            <p><strong>Subject:</strong> {selectedSubject ? `${selectedSubject.name} (${selectedSubject.code})` : 'Not selected'}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500 flex flex-col items-center gap-4">
            <RefreshCcw size={32} className="animate-spin text-brand-active" />
            <p>Loading attendance records...</p>
          </div>
        ) : attendance.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <p>{info}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-xs">
                <th className="px-5 py-3.5 text-left">#</th>
                <th className="px-5 py-3.5 text-left">Student</th>
                <th className="px-5 py-3.5 text-left">Email</th>
                <th className="px-5 py-3.5 text-left">Date</th>
                <th className="px-5 py-3.5 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((record, index) => (
                <tr key={`${record.id}-${record.studentId}`} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 text-slate-500">{index + 1}</td>
                  <td className="px-5 py-3.5 font-semibold text-slate-800">{record.student?.name || 'Unknown'}</td>
                  <td className="px-5 py-3.5 text-slate-500">{record.student?.email || 'Unknown'}</td>
                  <td className="px-5 py-3.5 text-slate-500">{new Date(record.date).toLocaleDateString()}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle[record.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                      {record.status === 'PRESENT' ? <CheckCircle size={12} /> : record.status === 'ABSENT' ? <XCircle size={12} /> : <Clock size={12} />}
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AttendanceList;
