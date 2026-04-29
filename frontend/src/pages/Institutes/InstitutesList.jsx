import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Building2, 
  Plus, 
  Edit,
  Trash2,
  ExternalLink,
  Loader2
} from 'lucide-react';
import CustomTable from '../../components/constantComponents/CustomTable';
import SectionHeader from '../../components/constantComponents/SectionHeader';
import { toast } from 'react-toastify';

const InstitutesList = () => {
  const navigate = useNavigate();
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstitutes();
  }, []);

  const fetchInstitutes = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/institutes', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data.success) {
        const flattened = response.data.institutes.map(inst => ({
          ...inst,
          principalName: inst.principal?.name || 'N/A'
        }));
        setInstitutes(flattened);
      }
    } catch (err) {
      toast.error('Failed to fetch institutes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this institute?')) return;
    
    try {
      const response = await axios.delete(`http://localhost:5000/api/institutes/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data.success) {
        toast.success('Institute deleted successfully');
        fetchInstitutes();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete institute');
    }
  };

  const tableHeaders = [
    { 
      key: 'name', 
      label: 'Institute Name',
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 font-bold">
            {val.charAt(0)}
          </div>
          <span className="font-semibold text-slate-900">{val}</span>
        </div>
      )
    },
    { key: 'classesOffered', label: 'Classes' },
    { 
      key: 'principalName', 
      label: 'Principal'
    },
    { key: 'phone', label: 'Contact' },
    { 
      key: 'address', 
      label: 'Address',
      render: (val) => (
        <span className="text-xs text-slate-500 max-w-xs truncate block" title={val}>
          {val}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate(`/dashboard/institutes/edit/${row.id}`)}
            className="p-2 text-slate-400 hover:text-brand-active hover:bg-brand-active/5 rounded-lg transition-all"
            title="Edit"
          >
            <Edit size={16} />
          </button>
          <button 
            onClick={() => handleDelete(row.id)}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
          <button 
            className="p-2 text-slate-400 hover:text-brand-active hover:bg-brand-active/5 rounded-lg transition-all"
            title="View Profile"
          >
            <ExternalLink size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <SectionHeader 
        title="Institutes Directory"
        subtitle="Manage all registered institutes and their principals."
        button={
          <button
            onClick={() => navigate('/dashboard/institutes/add')}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-dark text-white rounded-lg font-bold shadow-lg shadow-brand-dark/20 hover:bg-brand-hover active:scale-[0.98] transition-all"
          >
            <Plus size={20} />
            Add Institute
          </button>
        }
      />

      {/* Table Section */}
      <div className="bg-white p-6 rounded-lg border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-4">
            <Loader2 size={48} className="animate-spin text-brand-active/40" />
            <p className="font-bold text-lg animate-pulse">Loading institutes...</p>
          </div>
        ) : (
          <CustomTable 
            tableHeaders={tableHeaders}
            tableData={institutes}
            showSearch={true}
            showDownload={true}
            showPagination={true}
          />
        )}
      </div>
    </div>
  );
};

export default InstitutesList;
