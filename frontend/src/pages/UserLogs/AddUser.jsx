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
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isStudent = user.role === 'STUDENT';

  useEffect(() => {
    if (isStudent) {
      navigate('/dashboard/students');
    }
  }, [isStudent, navigate]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'STUDENT',
    status: 'ACTIVE',
    courseIds: [],
    permissions: ['dashboard', 'edit-profile'],
    className: ''
  });

  const availablePermissions = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'edit-profile', label: 'Edit Profile' },
    { id: 'institutes', label: 'Institutes' },
    { id: 'attendance', label: 'Attendance' },
    { id: 'students', label: 'Students' },
    { id: 'courses', label: 'Courses' },
    { id: 'reports', label: 'Reports' },
    { id: 'settings', label: 'Settings' },
    { id: 'user-logs', label: 'User Logs' },
  ];

  const [courses, setCourses] = useState([]);
  const [instituteClasses, setInstituteClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCourses();
    fetchInstituteClasses();
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
          setInstituteClasses(classesArr.map(c => ({ label: c, value: c })));
        }
      }
    } catch (err) {
      console.error('Failed to fetch institute classes', err);
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
            courseIds: user.taughtCourses ? user.taughtCourses.map(c => c.id) : [],
            permissions: Array.from(new Set([...(user.permissions || []), 'dashboard', 'edit-profile'])),
            className: user.className || ''
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

  const handlePermissionChange = (permId) => {
    setFormData(prev => {
      const currentPerms = prev.permissions || [];
      if (currentPerms.includes(permId)) {
        return { ...prev, permissions: currentPerms.filter(p => p !== permId) };
      } else {
        return { ...prev, permissions: [...currentPerms, permId] };
      }
    });
  };

  const handleSelectAllPermissions = () => {
    const allPermIds = filteredPermissions.map(p => p.id);
    const areAllSelected = formData.permissions.length === allPermIds.length;

    setFormData(prev => ({
      ...prev,
      permissions: areAllSelected ? [] : allPermIds
    }));
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

        if (!isEditMode && formData.role === 'PRINCIPAL') {
          const userId = response.data.user?.id;
          navigate('/dashboard/institutes/add', { state: { principalId: userId } });
        } else {
          navigate('/dashboard/user-logs/users-list');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserRole = currentUser.role || 'ADMIN';

  const roleOptions = (currentUserRole === 'ADMIN'
    ? [
      { label: 'Principal', value: 'PRINCIPAL' },
    ]
    : [
      { label: 'Teacher', value: 'TEACHER' },
      { label: 'Student', value: 'STUDENT' }
    ]
  );

  const rolePermissionMap = {
    PRINCIPAL: availablePermissions.map(p => p.id),
    TEACHER: ['dashboard', 'edit-profile', 'students', 'courses', 'reports', 'settings', 'institutes', 'attendance'],
    STUDENT: ['dashboard', 'edit-profile', 'students', 'reports', 'institutes', 'attendance', 'courses']
  };

  // Get filtered permissions based on the role being assigned to the new/edited user
  const filteredPermissions = availablePermissions.filter(p =>
    (rolePermissionMap[formData.role] || []).includes(p.id)
  );

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
    <div>
      {/* Compact Header */}
      <SectionHeader
        title={isEditMode ? 'Update User Account' : 'Register New User'}
        subtitle="Configure profile, roles and access levels."
        button={
          <button
            onClick={() => navigate('/dashboard/user-logs/users-list')}
            className="btn btn-cancel"
          >
            Back to list
          </button>
        }
      />

      <div>
        <form onSubmit={handleSubmit}>
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
                  disabled={isEditMode && currentUser.role !== 'ADMIN'}
                  className={`custom_input ${errors.email ? 'border-red-400 focus:border-red-500 shadow-red-50' : ''} ${isEditMode && currentUser.role !== 'ADMIN' ? 'bg-slate-50 cursor-not-allowed opacity-70' : ''}`}
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

            {/* Class Assignment (Conditional) */}
            {formData.role === 'STUDENT' && (
              <div className="space-y-1">
                <label className="block text-sm font-bold text-slate-700 ml-1">Class Assignment</label>
                <SearchableDropdown
                  options={instituteClasses}
                  value={formData.className}
                  onChange={(val) => setFormData(prev => ({ ...prev, className: val }))}
                  placeholder="Select Class"
                />
              </div>
            )}

            {/* Password */}
            <div className={`space-y-1 ${formData.role === 'STUDENT' ? 'md:col-span-1' : 'md:col-span-2'}`}>
              <label className="block text-sm font-bold text-slate-700 ml-1">
                {isEditMode ? "Reset Password" : "Account Password"}
              </label>
              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-active transition-colors" />
                <input
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  type={showPassword ? "text" : "password"}
                  placeholder={isEditMode ? "Keep current" : "Min. 8 chars"}
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

          <div className="mt-4 pt-6 border-t border-slate-200/50">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-800 tracking-tight">Module Permissions</h3>
                <p className="text-xs text-slate-500 font-medium">Select which modules this user can access in the sidebar.</p>
              </div>

              <button
                type="button"
                onClick={handleSelectAllPermissions}
                className="btn btn-cancel text-xs"
              >
                {formData.permissions.length === filteredPermissions.length ? 'Deselect All' : 'Select All Modules'}
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white rounded-xl border border-slate-200">
              {filteredPermissions.map((perm) => (
                <label
                  key={perm.id}
                  className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer group border border-transparent hover:border-slate-100"
                >
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(perm.id)}
                    onChange={() => handlePermissionChange(perm.id)}
                    className="cursor-pointer mt-1 accent-brand-dark"
                  />
                  <span className={`text-sm font-bold transition-colors ${formData.permissions.includes(perm.id) ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`}>
                    {perm.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-6 mt-4 border-t border-slate-200/50 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard/user-logs/users-list')}
              className="btn btn-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-blue"
            >
              {loading ? "Processing..." : (isEditMode ? "Save Changes" : "Create User Account")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUser;
