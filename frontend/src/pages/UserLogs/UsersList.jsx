import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SectionHeader from '../../components/constantComponents/SectionHeader';
import CustomTable from '../../components/constantComponents/CustomTable';
import Icons from '../../assets/icons';

const UsersList = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await axios.delete(`http://localhost:5000/api/users/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.data.success) {
          fetchUsers();
        }
      } catch (error) {
        alert('Failed to delete user');
      }
    }
  };

  const tableHeaders = [
    { key: 'name', label: 'Full Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'role',
      label: 'Role',
      render: (val) => (
        <span className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${val === 'ADMIN' ? 'bg-indigo-50 text-indigo-600' :
            val === 'TEACHER' ? 'bg-amber-50 text-amber-600' :
              'bg-emerald-50 text-emerald-600'
          }`}>
          {val}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: 'Joined Date',
      render: (val) => new Date(val).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, item) => {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const isSelf = currentUser.id === item.id;

        if (isSelf) return <span className="text-xs text-slate-400 italic px-2">You</span>;

        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/dashboard/user-logs/edit-user/${item.id}`)}
              className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-brand-active hover:text-white transition-all shadow-sm"
              title="Edit User"
            >
              <Icons.Pencil size={16} />
            </button>
            <button
              onClick={() => handleDelete(item.id)}
              className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100"
              title="Delete User"
            >
              <Icons.Trash2 size={16} />
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="">
      <SectionHeader 
        title="Users Management"
        subtitle="Manage system users, access levels, and role assignments."
        button={
          <button
            onClick={() => navigate('/dashboard/user-logs/add-user')}
            className="btn btn-blue"
          >
            Add User
          </button>
        }
      />

      <div className="bg-white rounded-lg border-0 p-1 mt-6 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <Icons.RefreshCcw className="animate-spin text-brand-active" size={32} />
            <p className="text-slate-500 font-medium tracking-tight">Fetching users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-3 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
            <div className="p-4 bg-white rounded-lg shadow-sm mb-2">
              <Icons.Users size={32} className="text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">No users found in the system.</p>
          </div>
        ) : (
          <CustomTable
            tableHeaders={tableHeaders}
            tableData={users}
          />
        )}
      </div>
    </div>
  );
};

export default UsersList;
