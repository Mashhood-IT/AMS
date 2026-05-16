import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CustomTable from '../../components/constantComponents/CustomTable';
import Icons from '../../assets/icons';

const CoursesList = ({ onEdit }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/courses', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data.success) {
        setCourses(response.data.courses);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        const response = await axios.delete(`http://localhost:5000/api/courses/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.data.success) {
          fetchCourses();
        }
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to delete course';
        alert(message);
      }
    }
  };

  const tableHeaders = [
    { key: 'name', label: 'Course Name' },
    { 
      key: 'code', 
      label: 'Course Code',
      render: (val) => <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold tracking-wider">{val}</span>
    },
    { 
      key: 'updatedAt', 
      label: 'Last Modified',
      render: (val) => new Date(val).toLocaleDateString()
    },
    {
      key: 'schedule',
      label: 'Schedule',
      render: (_, item) => (
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap gap-1">
            {(item.days || []).map(day => (
              <span key={day} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">
                {day.substring(0, 3)}
              </span>
            ))}
          </div>
          {item.time && <span className="text-[10px] text-slate-400 font-medium">{item.time}</span>}
          {!item.time && (!item.days || item.days.length === 0) && <span className="text-[10px] text-slate-300 italic">Not set</span>}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, item) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onEdit && onEdit(item.id)}
            className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-brand-active hover:text-white transition-all shadow-sm"
            title="Edit Course"
          >
            <Icons.Pencil size={16} />
          </button>
          <button 
            onClick={() => handleDelete(item.id)}
            className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100"
            title="Delete Course"
          >
            <Icons.Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="">
      <div className="bg-white rounded-lg border-0 p-1 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <Icons.RefreshCcw className="animate-spin text-brand-active" size={32} />
            <p className="text-slate-500 font-medium tracking-tight">Fetching courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-3 bg-slate-50/50 rounded-lg border border-dashed border-slate-200 m-4">
             <div className="p-4 bg-white rounded-lg shadow-sm mb-2">
              <Icons.BookOpen size={32} className="text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">No courses found matching your criteria.</p>
          </div>
        ) : (
          <CustomTable 
            tableHeaders={tableHeaders} 
            tableData={courses}
          />
        )}
      </div>
    </div>
  );
};

export default CoursesList;
