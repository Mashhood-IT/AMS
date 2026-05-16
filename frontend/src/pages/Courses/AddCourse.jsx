import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Save,
  BookOpen,
  Hash,
  Loader2,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  ChevronDown
} from 'lucide-react';
import SectionHeader from '../../components/constantComponents/SectionHeader';

const AddCourse = ({ courseId, onSuccess }) => {
  const isEditMode = !!courseId;

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    className: '',
    days: [],
    time: ''
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [instituteClasses, setInstituteClasses] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchInstituteClasses();
    if (isEditMode) {
      fetchCourseDetails();
    } else {
      setFormData({ name: '', code: '', className: '', days: [], time: '' });
      setFetching(false);
    }
  }, [courseId]);

  const fetchCourseDetails = async () => {
    setFetching(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data.success) {
        setFormData({
          name: response.data.course.name,
          code: response.data.course.code,
          className: response.data.course.className || '',
          days: response.data.course.days || [],
          time: response.data.course.time || ''
        });
      }
    } catch (err) {
      setError('Failed to fetch course details');
    } finally {
      setFetching(false);
    }
  };

  const fetchInstituteClasses = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const instituteId = user.instituteId;
      if (instituteId) {
        const response = await axios.get(`http://localhost:5000/api/institutes/${instituteId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.data.success) {
          const maxClass = response.data.institute.maxClass || 0;
          const classesArr = [];
          for (let i = 1; i <= maxClass; i++) {
            classesArr.push(`Class ${i}`);
          }
          setInstituteClasses(classesArr);
        }
      }
    } catch (err) {
      console.error('Failed to fetch institute classes', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const toggleDay = (day) => {
    setFormData(prev => {
      const days = prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day];
      return { ...prev, days };
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      setError('Please fill in all mandatory fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const url = isEditMode
        ? `http://localhost:5000/api/courses/${courseId}`
        : `http://localhost:5000/api/courses`;

      const method = isEditMode ? 'put' : 'post';

      const payload = {
        ...formData,
        instituteId: JSON.parse(localStorage.getItem('user') || '{}').instituteId
      };

      const response = await axios[method](url, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess && onSuccess();
        }, 1500);
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Something went wrong';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 size={40} className="animate-spin text-brand-active" />
        <p className="text-slate-500 font-medium tracking-tight">Loading details...</p>
      </div>
    );
  }

  return (
    <div className="">
      <div className="bg-white rounded-lg border-0 p-1">
        <form onSubmit={handleSubmit} className="space-y-4 p-4 md:p-6 bg-slate-50/30 rounded-lg border border-slate-100">
          <SectionHeader
            title={isEditMode ? 'Update Academic Course' : 'Create New Course'}
            subtitle={isEditMode ? 'Modify course name and code.' : 'Register a new academic curriculum.'}
          />

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg flex items-center gap-3 text-sm font-medium animate-shake">
              <XCircle size={18} />
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg flex items-center gap-3 text-sm font-medium">
              <CheckCircle2 size={18} />
              Course {isEditMode ? 'updated' : 'created'} successfully!
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Course Name */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700 ml-1">Course Name</label>
              <div className="relative group">
                <BookOpen size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-active transition-colors" />
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Advanced Mathematics"
                  className="custom_input"
                />
              </div>
            </div>

            {/* Course Code */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700 ml-1">Course Code</label>
              <div className="relative group">
                <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-active transition-colors" />
                <input
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="e.g. MATH-401"
                  className="custom_input"
                />
              </div>
            </div>

            {/* Class Assignment */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 ml-1">Assigned To Class</label>
              <div className="relative group">
                <LayoutGrid size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-active transition-colors" />
                <select
                  name="className"
                  value={formData.className}
                  onChange={handleInputChange}
                  className="custom_input pl-12 appearance-none"
                >
                  <option value="">Select Class...</option>
                  {instituteClasses.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronDown size={18} />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium ml-1">This course will be visible to all students in the selected class.</p>
            </div>

            {/* Schedule Days */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 ml-1">Teaching Days</label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${formData.days.includes(day)
                        ? 'bg-brand-active text-white border-brand-active shadow-sm'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Teaching Time */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 ml-1">Start Time</label>
              <div className="relative group">
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  className="custom_input"
                />
              </div>
              <p className="text-[10px] text-slate-400 font-medium ml-1">Specify the time this class usually starts.</p>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onSuccess && onSuccess()}
              className="btn btn-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="btn btn-blue"
            >
              {loading ? "Processing..." : (isEditMode ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCourse;
