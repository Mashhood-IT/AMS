import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import SectionHeader from '../../components/constantComponents/SectionHeader';
import { toast } from 'react-toastify';

const EditProfile = () => {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = currentUser.id;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    setFetching(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data.success) {
        const user = response.data.users.find(u => u.id === userId);
        if (user) {
          setFormData({
            name: user.name,
            email: user.email,
            password: '',
            phone: user.phone || '',
          });
        }
      }
    } catch (err) {
      toast.error('Failed to fetch profile details');
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
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = { ...formData };
      if (!payload.password) delete payload.password;

      const response = await axios.put(`http://localhost:5000/api/users/${userId}`, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        toast.success('Profile updated successfully');
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 size={40} className="animate-spin text-brand-active" />
        <p className="text-slate-500 font-medium">Fetching Profile Details...</p>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        title="Edit Profile"
        subtitle="Update your personal details and account security settings."
      />

      <div className="w-full">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-8">
            {/* Full Name - Span 2 */}
            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-bold text-slate-700 ml-1 italic tracking-wide uppercase text-[10px] opacity-70">Full Name</label>
              <div className="relative group">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-active transition-colors" />
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  type="text"
                  placeholder="Your Full Name"
                  className={`custom_input bg-white/50 border-slate-200 focus:bg-white transition-all ${errors.name ? 'border-red-400 focus:border-red-500 shadow-red-50' : ''}`}
                />
              </div>
              {errors.name && <p className="text-xs text-red-500 font-bold pl-2">{errors.name}</p>}
            </div>

            {/* Phone Number - Span 1 */}
            <div className="md:col-span-1 space-y-2">
              <label className="block text-sm font-bold text-slate-700 ml-1 italic tracking-wide uppercase text-[10px] opacity-70">Phone Number</label>
              <div className="relative group">
                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-active transition-colors" />
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  className="custom_input bg-white/50 border-slate-200 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Email Address - Span 2 */}
            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-bold text-slate-700 ml-1 italic tracking-wide uppercase text-[10px] opacity-70">Email Address</label>
              <div className="relative group">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-active transition-colors" />
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  type="email"
                  placeholder="name@example.com"
                  disabled={currentUser.role !== 'ADMIN'}
                  className={`custom_input bg-white/50 border-slate-200 focus:bg-white transition-all ${errors.email ? 'border-red-400 focus:border-red-500 shadow-red-50' : ''} ${currentUser.role !== 'ADMIN' ? 'cursor-not-allowed opacity-60 grayscale-[0.5]' : ''}`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 font-bold pl-2">{errors.email}</p>}
              {currentUser.role !== 'ADMIN' && (
                <p className="text-[10px] text-slate-400 font-medium pl-1 italic mt-1">
                  * Email can only be changed by a system administrator.
                </p>
              )}
            </div>

            {/* Change Password - Span 1 */}
            <div className="md:col-span-1 space-y-2">
              <label className="block text-sm font-bold text-slate-700 ml-1 italic tracking-wide uppercase text-[10px] opacity-70">Account Password</label>
              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-active transition-colors" />
                <input
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  type={showPassword ? "text" : "password"}
                  placeholder="Leave blank to keep current"
                  className="custom_input bg-white/50 border-slate-200 focus:bg-white transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-10 mt-10 border-t border-slate-200/60 flex items-center justify-end gap-4">

            <button
              type="submit"
              disabled={loading}
              className="btn btn-blue px-8 py-2.5 shadow-lg shadow-blue-500/20"
            >
              {loading ? "Updating Profile..." : "Update Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
