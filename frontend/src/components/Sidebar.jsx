import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LogOut,
  ChevronDown,
  ChevronRight,
  User
} from 'lucide-react';
import { navItems } from '../data/Data';

const Sidebar = ({ isSidebarOpen }) => {
  const [openMenus, setOpenMenus] = useState({});
  const location = useLocation();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userPermissions = user.permissions || [];

  const filteredNavItems = navItems.filter(item => {
    const excludedForAdmin = ['students', 'courses', 'attendance'];
    if (user.role === 'ADMIN' && excludedForAdmin.includes(item.permissionKey)) {
      return false;
    }
    return user.role === 'ADMIN' || userPermissions.includes(item.permissionKey);
  });

  const toggleMenu = (title) => {
    setOpenMenus(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out bg-brand-dark text-white flex flex-col
        ${isSidebarOpen ? 'w-64' : 'w-20 overflow-hidden'}`}
    >
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto custom-scrollbar">
        {filteredNavItems.map((item) => {
          const hasSubTabs = item.subTabs && item.subTabs.length > 0;
          const isOpen = openMenus[item.title];
          const isActive = location.pathname === item.path || (hasSubTabs && location.pathname.startsWith(item.path));

          return (
            <div key={item.title} className="space-y-1">
              {hasSubTabs ? (
                <button
                  onClick={() => toggleMenu(item.title)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group cursor-pointer
                    ${isActive
                      ? 'bg-brand-active text-white shadow-lg shadow-black/20'
                      : 'text-white/70 hover:bg-brand-hover hover:text-white'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="shrink-0">{item.icon}</div>
                    <span className={`font-medium transition-all duration-300 whitespace-nowrap
                      ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 pointer-events-none'}`}>
                      {item.title}
                    </span>
                  </div>
                  {isSidebarOpen && (
                    <div className="shrink-0">
                      {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                  )}
                </button>
              ) : (
                <Link
                  to={item.path}
                  className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 group
                    ${isActive
                      ? 'bg-brand-active text-white shadow-lg shadow-black/20'
                      : 'text-white/70 hover:bg-brand-hover hover:text-white'
                    }`}
                >
                  <div className="shrink-0">{item.icon}</div>
                  <span className={`font-medium transition-all duration-300 whitespace-nowrap
                    ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 pointer-events-none'}`}>
                    {item.title}
                  </span>
                </Link>
              )}

              {/* Sub Tabs */}
              {hasSubTabs && isOpen && isSidebarOpen && (
                <div className="ml-9 space-y-1 mt-1 transition-all duration-300">
                  {item.subTabs.map((sub) => (
                    <Link
                      key={sub.path}
                      to={sub.path}
                      className={`block px-4 py-2 text-sm rounded-lg transition-all duration-200
                        ${location.pathname === sub.path
                          ? 'bg-white/10 text-white font-semibold'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      {sub.title}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Edit Profile Tab (End of List) */}
        <Link
          to="/dashboard/profile"
          className={`flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-200 group
            ${location.pathname === '/dashboard/profile'
              ? 'bg-brand-active text-white shadow-lg shadow-black/20'
              : 'text-white/70 hover:bg-brand-hover hover:text-white'
            }`}
        >
          <div className="shrink-0"><User size={20} /></div>
          <span className={`font-medium transition-all duration-300 whitespace-nowrap
            ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 pointer-events-none'}`}>
            Edit Profile
          </span>
        </Link>
      </nav>

      {/* Footer Section */}
      <div className="p-4 border-t border-white/10">
        <Link
          to="/logout"
          className="flex items-center gap-4 px-4 py-3 rounded-lg text-white/70 hover:bg-brand-hover hover:text-white transition-all duration-200"
        >
          <LogOut size={20} />
          <span className={`font-medium transition-all duration-300 
            ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'}`}>
            Logout
          </span>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
