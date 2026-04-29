import React, { useState } from 'react';
import CoursesList from './CoursesList';
import AddCourse from './AddCourse';
import { BookOpen, PlusCircle, LayoutGrid } from 'lucide-react';
import SectionHeader from '../../components/constantComponents/SectionHeader';

const Courses = () => {
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'add'
  const [editingId, setEditingId] = useState(null);

  const handleEdit = (id) => {
    setEditingId(id);
    setActiveTab('add');
  };

  const handleAddNew = () => {
    setEditingId(null);
    setActiveTab('add');
  };

  const handleSuccess = () => {
    setEditingId(null);
    setActiveTab('list');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header & Tabs Section */}
      <SectionHeader 
        title="Courses Management"
        subtitle="Create, edit and manage academic curricula"
        button={
          <div className="flex p-1 bg-slate-100 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'list'
                ? "bg-white text-brand-active shadow-sm"
                : "text-slate-500 hover:text-slate-700"
                }`}
            >
              <LayoutGrid size={16} />
              Courses List
            </button>
            <button
              onClick={handleAddNew}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${activeTab === 'add'
                ? "bg-white text-brand-active shadow-sm"
                : "text-slate-500 hover:text-slate-700"
                }`}
            >
              <PlusCircle size={16} />
              Add New
            </button>
          </div>
        }
      />

      {/* Dynamic Content Panel */}
      <div className="duration-500">
        {activeTab === 'list' ? (
          <CoursesList onEdit={handleEdit} />
        ) : (
          <AddCourse courseId={editingId} onSuccess={handleSuccess} />
        )}
      </div>
    </div>
  );
};

export default Courses;
