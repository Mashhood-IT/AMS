import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { api } from '../api';
import { Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const qrMessage = location.state?.message;

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    loading || setLoading(true);
    setError('');

    try {
      const data = await api.login(formData);
      if (data.success) {
        // Store token and user info
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        // Intercept for pending QR code attendance
        const pendingQR = localStorage.getItem('pendingQRCheckIn');
        if (pendingQR && data.user?.role === 'STUDENT') {
          const { courseId, token, desktopUserId } = JSON.parse(pendingQR);
          const desktopUserParam = desktopUserId ? `&desktopUserId=${desktopUserId}` : '';
          navigate(`/check-in?courseId=${courseId}&token=${token}${desktopUserParam}`);
        } else {
          // Redirect to dashboard
          navigate('/dashboard');
        }
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {qrMessage && (
        <div className="bg-indigo-50 border border-indigo-100 text-indigo-800 text-xs py-3 px-4 rounded-xl flex items-center gap-2.5 font-semibold animate-pulse shadow-sm">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          {qrMessage}
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs py-2 px-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          <div>
            <label className="block text-slate-700 text-sm font-semibold mb-1 pl-1" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              disabled={loading}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-dark/20 transition-all text-sm disabled:opacity-50"
              placeholder="name@example.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1 pl-1">
              <label className="text-slate-700 text-sm font-semibold" htmlFor="password">
                Password
              </label>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                disabled={loading}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 pr-11 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-dark/20 transition-all text-sm disabled:opacity-50"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-dark text-white font-bold py-2.5 px-4 rounded-lg hover:bg-brand-hover transform active:scale-[0.98] transition-all shadow-md mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>

        <div className="text-center pt-2">
          <p className="text-slate-500 text-xs">
            Forgot your password?{' '}
            <Link to="/forgot-password" className="text-brand-dark hover:underline font-semibold transition-all">
              Reset it here
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
