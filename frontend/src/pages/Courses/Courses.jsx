import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import SectionHeader from '../../components/constantComponents/SectionHeader';

const Courses = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = JSON.parse(localStorage.getItem('user') || '{}').role;
  const isStudent = userRole === 'STUDENT';

  const isAddPage = location.pathname.includes('/add-course') || location.pathname.includes('/edit-course');

  const handleAddNew = () => {
    navigate('/dashboard/courses/add-course');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header & Tabs Section */}
      {!isAddPage && (
        <SectionHeader 
          title="Courses Management"
          subtitle="Create, edit and manage academic curricula"
          button={
            <div className="flex p-1 bg-slate-100 rounded-lg w-fit">
              {!isStudent && (
                <button
                  onClick={handleAddNew}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 bg-white text-brand-active shadow-sm hover:bg-slate-50"
                >
                  <PlusCircle size={16} />
                  Add New
                </button>
              )}
            </div>
          }
        />
      )}

      {/* Dynamic Content Panel */}
      <div className="duration-500">
        <Outlet />
      </div>
    </div>
  );
};

export default Courses;
