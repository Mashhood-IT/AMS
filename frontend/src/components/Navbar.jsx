import React from 'react';
import { Menu, User } from 'lucide-react';

const Navbar = ({ toggleSidebar }) => {
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  return (
    <header className="h-20 bg-brand-dark text-white flex items-center justify-between px-6 sticky top-0 z-40 shadow-xl shadow-black/10">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          aria-label="Toggle Sidebar"
        >
          <Menu size={24} />
        </button>
        <h2 className="text-lg font-semibold tracking-tight">Admin Panel</h2>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="hidden sm:block text-right">
            <p className="text-sm font-bold leading-none">{user.name}</p>
            <p className="text-xs text-white/60 mt-1">{user.email}</p>
          </div>
        ) : (
          <div className="hidden sm:block text-right">
            <p className="text-sm font-bold leading-none">Guest User</p>
            <p className="text-xs text-white/60 mt-1">Please log in</p>
          </div>
        )}
        <div className="w-10 h-10 rounded-lg bg-brand-active flex items-center justify-center border-2 border-white/20 shadow-inner">
          <User size={20} className="text-white" />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
