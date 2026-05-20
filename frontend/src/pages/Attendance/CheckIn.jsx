import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../api';
import { CheckCircle, XCircle, Loader2, Sparkles } from 'lucide-react';

const CheckIn = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState(null);

  const courseId = searchParams.get('courseId');
  const token = searchParams.get('token');
  const desktopUserId = searchParams.get('desktopUserId');

  useEffect(() => {
    if (!courseId || !token) {
      setStatus('error');
      setMessage('Invalid QR code. The request is missing check-in parameters.');
      return;
    }

    const authToken = localStorage.getItem('token');
    const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');

    if (!authToken || !loggedInUser?.id) {
      // Not authenticated - persist parameters and redirect to login
      localStorage.setItem('pendingQRCheckIn', JSON.stringify({ courseId, token, desktopUserId }));
      
      // We can redirect the user with state so the Login page knows to show an elegant toast
      navigate('/login', { 
        state: { 
          fromQR: true, 
          message: 'Please log in to automatically mark your attendance for this class.' 
        } 
      });
      return;
    }

    // Authenticated - verify role
    if (loggedInUser.role !== 'STUDENT') {
      setStatus('error');
      setMessage('Only students can record attendance using QR check-in.');
      return;
    }

    // Mark attendance
    const recordQRCheckIn = async () => {
      try {
        setStatus('loading');
        const res = await api.markAttendanceQR({
          courseId: parseInt(courseId),
          token,
          desktopUserId: desktopUserId ? parseInt(desktopUserId) : undefined,
        });

        if (res.success) {
          setStatus('success');
          setMessage(res.message || 'Attendance marked successfully!');
          setDetails(res.attendance);
          // Clear pending check-in if any
          localStorage.removeItem('pendingQRCheckIn');
        } else {
          setStatus('error');
          setMessage(res.message || 'Failed to record attendance.');
        }
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'An error occurred while marking your attendance. The QR code might have expired.');
      }
    };

    recordQRCheckIn();
  }, [courseId, token, navigate]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-100 rounded-3xl shadow-2xl p-8 relative overflow-hidden transition-all duration-300">
        
        {/* Decorative subtle background gradients */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-dark/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl"></div>

        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-slate-100 rounded-full flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-brand-dark" />
              </div>
              <div className="absolute top-0 right-0 animate-bounce">
                <Sparkles size={18} className="text-amber-500" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Verifying check-in session</h2>
              <p className="text-sm text-slate-500 mt-2 font-medium">
                Please keep this tab open. Recording your attendance in real-time...
              </p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center text-center space-y-6 animate-fade-in-up">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100 animate-scale-up shadow-inner relative">
              <CheckCircle size={42} className="text-emerald-500" />
              <div className="absolute -top-1 -right-1 animate-pulse">
                <Sparkles size={16} className="text-emerald-400" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Success!</h2>
              <p className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full inline-block mt-3 border border-emerald-100/50">
                {details?.course?.name || 'Class Attendance Saved'}
              </p>
              <p className="text-sm text-slate-500 mt-4 leading-relaxed font-medium">
                Your attendance has been recorded successfully. You are marked as <span className="text-emerald-600 font-bold">PRESENT</span>.
              </p>
            </div>

            {/* Attendance Card Details */}
            {details && (
              <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 text-left space-y-3 shadow-inner">
                <div className="flex justify-between border-b border-slate-200/50 pb-2">
                  <span className="text-xs font-semibold text-slate-400">COURSE</span>
                  <span className="text-xs font-bold text-slate-700">{details.course?.code}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/50 pb-2">
                  <span className="text-xs font-semibold text-slate-400">STUDENT</span>
                  <span className="text-xs font-bold text-slate-700">{details.student?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs font-semibold text-slate-400">DATE & TIME</span>
                  <span className="text-xs font-bold text-slate-700">
                    {new Date().toLocaleDateString(undefined, { dateStyle: 'medium' })}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3.5 bg-brand-dark hover:bg-brand-hover text-white font-bold rounded-2xl transition-all shadow-lg shadow-brand-dark/25 hover:shadow-brand-hover/30 active:scale-[0.98] cursor-pointer"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center text-center space-y-6 animate-fade-in-up">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center border border-red-100 animate-scale-up shadow-inner">
              <XCircle size={42} className="text-red-500" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Check-In Failed</h2>
              <p className="text-sm text-slate-500 mt-4 leading-relaxed font-medium">
                {message}
              </p>
            </div>

            <div className="w-full flex gap-3 mt-4">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all active:scale-[0.98] cursor-pointer"
              >
                Retry Scan
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 py-3 bg-brand-dark hover:bg-brand-hover text-white font-bold rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer"
              >
                Dashboard
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CheckIn;
