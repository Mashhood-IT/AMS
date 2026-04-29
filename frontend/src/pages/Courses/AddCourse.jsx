import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Save,
  BookOpen,
  Hash,
  Loader2,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import SectionHeader from '../../components/constantComponents/SectionHeader';

const AddCourse = ({ courseId, onSuccess }) => {
  const isEditMode = !!courseId;

  const [formData, setFormData] = useState({
    name: '',
    code: ''
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      fetchCourseDetails();
    } else {
      setFormData({ name: '', code: '' });
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
          code: response.data.course.code
        });
      }
    } catch (err) {
      setError('Failed to fetch course details');
    } finally {
      setFetching(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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

      const response = await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess && onSuccess();
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
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
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onSuccess && onSuccess()}
              className="px-6 py-2.5 text-slate-500 font-bold hover:text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="flex items-center gap-2 px-8 py-2.5 bg-brand-dark text-white rounded-lg font-bold hover:bg-brand-hover active:scale-[0.98] transition-all shadow-lg shadow-brand-dark/20 disabled:opacity-70"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {isEditMode ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCourse;
