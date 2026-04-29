import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Eye, EyeOff, Lock, CheckCircle, ArrowLeft } from 'lucide-react';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.resetPassword(token, formData.password);
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'This reset link is invalid or has expired.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-5 text-center">
        <div className="flex justify-center">
          <div className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center">
            <CheckCircle size={28} className="text-slate-700" />
          </div>
        </div>
        <div>
          <h2 className="text-slate-900 font-bold text-base">Password updated</h2>
          <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">
            Your password has been reset successfully. You can now sign in with your new credentials.
          </p>
        </div>
        <button
          onClick={() => navigate('/login')}
          className="w-full bg-slate-900 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-slate-800 active:scale-[0.98] transition-all shadow-sm text-sm"
        >
          Go to Sign In
        </button>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-red-500 text-sm">Invalid or missing reset token.</p>
        <Link to="/forgot-password" className="text-slate-700 text-sm font-semibold hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-slate-900 font-bold text-base">Set a new password</h2>
        <p className="text-slate-500 text-sm mt-1">
          Choose a strong password for your account.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-xs py-2.5 px-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-slate-700 text-sm font-semibold mb-1.5 pl-0.5" htmlFor="reset-password">
            New Password
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              id="reset-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              disabled={loading}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-11 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-sm disabled:opacity-50"
              placeholder="Min. 8 characters"
              value={formData.password}
              onChange={handleChange}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-slate-700 text-sm font-semibold mb-1.5 pl-0.5" htmlFor="confirm-password">
            Confirm Password
          </label>
          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              id="confirm-password"
              name="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              required
              disabled={loading}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-11 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-sm disabled:opacity-50"
              placeholder="Repeat your password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-slate-800 active:scale-[0.98] transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed text-sm mt-1"
        >
          {loading ? 'Updating password...' : 'Update Password'}
        </button>
      </form>

      <Link
        to="/login"
        className="flex items-center justify-center gap-1.5 text-slate-400 text-sm hover:text-slate-700 transition-colors pt-1"
      >
        <ArrowLeft size={14} />
        Back to sign in
      </Link>
    </div>
  );
};

export default ResetPassword;
