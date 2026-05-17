import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="md:min-h-screen min-h-fit w-full flex items-center justify-center bg-white relative overflow-hidden">
      <div className="w-full max-w-md p-6 bg-white border border-slate-100 rounded-lg shadow-2xl relative z-10 m-4">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-brand-dark rounded-lg flex items-center justify-center mb-3 shadow-lg">
            <span className="text-2xl font-bold text-white">A</span>
          </div>
          <p className="text-slate-900 font-bold text-lg">Attendance Management System</p>
        </div>

        <Outlet />
      </div>

      {/* Footer credit */}
      <div className="absolute bottom-6 text-slate-400 text-xs tracking-widest uppercase">
        © 2026 AMS Project
      </div>
    </div>
  );
};

export default AuthLayout;
