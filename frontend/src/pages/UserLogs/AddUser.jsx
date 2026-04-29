import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  BookOpen,
  Loader2,
  CheckCircle2,
  XCircle,
  Users
} from 'lucide-react';
import SearchableDropdown from '../../components/SearchableDropdown';
import SectionHeader from '../../components/constantComponents/SectionHeader';
import { toast } from 'react-toastify';

const AddUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'STUDENT',
    status: 'ACTIVE',
    courseIds: []
  });

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCourses();
    if (isEditMode) {
      fetchUser();
    }
  }, [id]);

  const fetchCourses = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/courses', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data.success) {
        setCourses(response.data.courses.map(c => ({
          label: `${c.name} (${c.code})`,
          value: c.id
        })));
      }
    } catch (err) {
      console.error('Failed to fetch courses', err);
    }
  };

  const fetchUser = async () => {
    setFetching(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data.success) {
        const user = response.data.users.find(u => u.id === parseInt(id));
        if (user) {
          setFormData({
            name: user.name,
            email: user.email,
            password: '',
            phone: user.phone || '',
            role: user.role,
            status: user.status || 'ACTIVE',
            courseIds: user.taughtCourses ? user.taughtCourses.map(c => c.id) : []
          });
        }
      }
    } catch (err) {
      toast.error('Failed to fetch user details');
    } finally {
      setFetching(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Full name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!isEditMode && !formData.password) newErrors.password = 'Password is required';
    if (formData.role === 'TEACHER' && formData.courseIds.length === 0) {
      newErrors.courses = 'Assign at least one course to the teacher';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const url = isEditMode
        ? `http://localhost:5000/api/users/${id}`
        : `http://localhost:5000/api/users`;

      const method = isEditMode ? 'put' : 'post';

      const payload = { ...formData };
      if (isEditMode && !payload.password) delete payload.password;
      if (payload.role !== 'TEACHER') delete payload.courseIds;

      const response = await axios[method](url, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        toast.success(isEditMode ? 'User updated successfully' : 'User created successfully');
        navigate('/dashboard/user-logs/users-list');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { label: 'Admin', value: 'ADMIN' },
    { label: 'Principal', value: 'PRINCIPAL' },
    { label: 'Teacher', value: 'TEACHER' },
    { label: 'Student', value: 'STUDENT' }
  ];

  const statusOptions = [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' },
    { label: 'Pending', value: 'PENDING' }
  ];

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 size={40} className="animate-spin text-brand-active" />
        <p className="text-slate-500 font-medium">Fetching User Details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-8">
      {/* Compact Header */}
      <SectionHeader 
        title={isEditMode ? 'Update User Account' : 'Register New User'}
        subtitle="Configure profile, roles and access levels."
        button={
          <button
            onClick={() => navigate('/dashboard/user-logs/users-list')}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200 transition-all active:scale-[0.98]"
          >
            <ArrowLeft size={18} />
            Back to list
          </button>
        }
      />

      <div className="bg-white rounded-lg border-0 p-1">
        <form onSubmit={handleSubmit} className="space-y-4 p-4 md:p-6 bg-slate-50/30 rounded-lg border border-slate-100">
          {/* Main Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-4 gap-y-3">
            {/* Full Name */}
            <div className="space-y-1 md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 ml-1">Full Name</label>
              <div className="relative group">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-active transition-colors" />
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  type="text"
                  placeholder="Full Name"
                  className={`custom_input ${errors.name ? 'border-red-400 focus:border-red-500 shadow-red-50' : ''}`}
                />
              </div>
              {errors.name && <p className="text-xs text-red-500 font-bold pl-2">{errors.name}</p>}
            </div>

            {/* Role Selection */}
            <div className="space-y-1">
              <label className="block text-sm font-bold text-slate-700 ml-1">System Role</label>
              <SearchableDropdown
                options={roleOptions}
                value={formData.role}
                onChange={(val) => setFormData(prev => ({ ...prev, role: val }))}
                placeholder="Select Role"
              />
            </div>

            {/* Email */}
            <div className="space-y-1 md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 ml-1">Email Address</label>
              <div className="relative group">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-active transition-colors transition-colors" />
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  type="email"
                  placeholder="name@example.com"
                  className={`custom_input ${errors.email ? 'border-red-400 focus:border-red-500 shadow-red-50' : ''}`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 font-bold pl-2">{errors.email}</p>}
            </div>

             {/* Status Selection */}
             <div className="space-y-1">
              <label className="block text-sm font-bold text-slate-700 ml-1">Account Status</label>
              <SearchableDropdown
                options={statusOptions}
                value={formData.status}
                onChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                placeholder="Select Status"
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-1">
              <label className="block text-sm font-bold text-slate-700 ml-1">Phone Number</label>
              <div className="relative group">
                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-active transition-colors" />
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  className="custom_input"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1 md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 ml-1">
                {isEditMode ? "Reset Password (Optional)" : "Account Password"}
              </label>
              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-active transition-colors" />
                <input
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  type={showPassword ? "text" : "password"}
                  placeholder={isEditMode ? "Leave blank to keep current" : "Minimum 8 characters"}
                  className={`custom_input pr-12 ${errors.password ? 'border-red-400 focus:border-red-500 shadow-red-50' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 font-bold pl-2">{errors.password}</p>}
            </div>
          </div>

          {/* Teacher Assignment Section */}
          {formData.role === 'TEACHER' && (
            <div className="mt-4 pt-6 border-t border-slate-200/50 duration-400">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-50 text-brand-active rounded-lg">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 tracking-tight">Academic Assignments</h3>
                  <p className="text-xs text-slate-500 font-medium">Select courses this teacher will be responsible for.</p>
                </div>
              </div>

              <div className="max-w-2xl">
                <SearchableDropdown
                  options={courses}
                  value={formData.courseIds}
                  onChange={(val) => setFormData(prev => ({ ...prev, courseIds: val }))}
                  placeholder="Search and select multiple courses..."
                  isMulti={true}
                  error={errors.courses}
                />
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-6 mt-4 border-t border-slate-200/50 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard/user-logs/users-list')}
              className="px-6 py-2.5 text-slate-500 font-bold hover:text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-10 py-3 bg-brand-dark text-white rounded-lg font-bold shadow-lg shadow-brand-dark/20 hover:bg-brand-hover active:scale-[0.98] transition-all disabled:opacity-70"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {isEditMode ? "Save Changes" : "Create User Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUser;
