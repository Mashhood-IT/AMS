import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-5 text-center">
        <div className="flex justify-center">
          <div className="w-14 h-14 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center">
            <CheckCircle size={28} className="text-slate-700" />
          </div>
        </div>
        <div>
          <h2 className="text-slate-900 font-bold text-base">Check your inbox</h2>
          <p className="text-slate-500 text-sm mt-1.5 leading-relaxed">
            If an account exists for <span className="font-semibold text-slate-700">{email}</span>, you'll receive a reset link within a few minutes.
          </p>
        </div>
        <p className="text-slate-400 text-xs">
          Didn't receive it? Check your spam folder or{' '}
          <button
            onClick={() => setSubmitted(false)}
            className="text-slate-700 font-semibold hover:underline"
          >
            try again
          </button>
          .
        </p>
        <Link
          to="/login"
          className="flex items-center justify-center gap-2 text-slate-500 text-sm hover:text-slate-800 transition-colors pt-2"
        >
          <ArrowLeft size={15} />
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-slate-900 font-bold text-base">Reset your password</h2>
        <p className="text-slate-500 text-sm mt-1">
          Enter your account email and we'll send you a secure reset link.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-xs py-2.5 px-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-slate-700 text-sm font-semibold mb-1.5 pl-0.5" htmlFor="forgot-email">
            Email Address
          </label>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              id="forgot-email"
              name="email"
              type="email"
              required
              disabled={loading}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-sm disabled:opacity-50"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-slate-900 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-slate-800 active:scale-[0.98] transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed text-sm mt-1"
        >
          {loading ? 'Sending link...' : 'Send Reset Link'}
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

export default ForgotPassword;
