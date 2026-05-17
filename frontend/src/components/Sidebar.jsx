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

  const filteredNavItems = navItems
    .filter(item => {
      const excludedForAdmin = ['students', 'courses', 'attendance'];
      if (user.role === 'ADMIN' && excludedForAdmin.includes(item.permissionKey)) {
        return false;
      }
      return user.role === 'ADMIN' || userPermissions.includes(item.permissionKey);
    })
    .map((item) => {
      if (user.role === 'STUDENT') {
        if (item.permissionKey === 'institutes') {
          return {
            ...item,
            subTabs: item.subTabs?.filter(sub => sub.path !== '/dashboard/institutes/add') || []
          };
        }

        if (item.permissionKey === 'courses') {
          return {
            ...item,
            subTabs: item.subTabs?.filter(sub => sub.path !== '/dashboard/courses/add-course') || []
          };
        }
      }
      return item;
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
        ${isSidebarOpen
          ? 'w-64 translate-x-0'
          : '-translate-x-full md:translate-x-0 md:w-12 overflow-hidden'
        }`}
    >
      <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto overflow-x-hidden custom-scrollbar">
        {filteredNavItems.map((item) => {
          const hasSubTabs = item.subTabs && item.subTabs.length > 0;
          const isOpen = openMenus[item.title];
          const isActive = location.pathname === item.path || (hasSubTabs && location.pathname.startsWith(item.path));

          return (
            <div key={item.title} className="space-y-1 ml-2">
              {hasSubTabs ? (
                <button
                  onClick={() => toggleMenu(item.title)}
                  className={`w-full ml-1 flex items-center rounded-lg transition-all duration-200 group cursor-pointer
                    ${isSidebarOpen ? 'gap-4 py-3 justify-between' : 'gap-0 py-3 justify-center'}
                    ${isActive
                      ? 'bg-brand-active text-white shadow-lg shadow-black/20'
                      : 'text-white/70 hover:bg-brand-hover hover:text-white'
                    }`}
                >
                  <div className="flex items-center justify-center">
                    <div className="shrink-0">{item.icon}</div>
                    <span className={`font-medium transition-all duration-300 whitespace-nowrap ml-4
                      ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden pointer-events-none ml-0'}`}>
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
                  className={`flex items-center rounded-lg transition-all duration-200 group
                    ${isSidebarOpen ? 'gap-4 px-4 py-3 justify-start' : 'gap-0 p-3 justify-center'}
                    ${isActive
                      ? 'bg-brand-active text-white shadow-lg shadow-black/20'
                      : 'text-white/70 hover:bg-brand-hover hover:text-white'
                    }`}
                >
                  <div className="shrink-0">{item.icon}</div>
                  <span className={`font-medium transition-all duration-300 whitespace-nowrap ml-4
                    ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden pointer-events-none ml-0'}`}>
                    {item.title}
                  </span>
                </Link>
              )}

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
      </nav>
      <div className="p-4 border-t border-white/10">
        <Link
          to="/logout"
          className={`flex items-center rounded-lg text-white/70 hover:bg-brand-hover hover:text-white transition-all duration-200 group
            ${isSidebarOpen ? 'gap-4 px-4 py-3 justify-start' : 'gap-0 p-3 justify-center'}`}
        >
          <div className="shrink-0"><LogOut size={20} /></div>
          <span className={`font-medium transition-all duration-300 whitespace-nowrap ml-4
            ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden pointer-events-none ml-0'}`}>
            Logout
          </span>
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;