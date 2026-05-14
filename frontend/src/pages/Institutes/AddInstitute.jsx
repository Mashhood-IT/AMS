import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft,
  Save,
  Building2,
  Phone,
  MapPin,
  Loader2,
  Upload,
  UserCircle,
  GraduationCap
} from 'lucide-react';
import SearchableDropdown from '../../components/SearchableDropdown';
import SectionHeader from '../../components/constantComponents/SectionHeader';
import { toast } from 'react-toastify';

const AddInstitute = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isEditMode = !!id;
  const [loading, setLoading] = useState(false);
  const [fetchingPrincipals, setFetchingPrincipals] = useState(true);
  const [principals, setPrincipals] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    maxClass: '',
    phone: '',
    address: '',
    principalId: ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchPrincipals();
    if (isEditMode) {
      fetchInstituteDetails();
    } else if (location.state?.principalId) {
      setFormData(prev => ({ ...prev, principalId: location.state.principalId }));
    }
  }, [id, location.state]);

  const fetchPrincipals = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/users?role=PRINCIPAL', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data.success) {
        setPrincipals(response.data.users.map(u => ({
          label: u.name,
          value: u.id
        })));
      }
    } catch (err) {
      toast.error('Failed to fetch principals');
    } finally {
      setFetchingPrincipals(false);
    }
  };

  const fetchInstituteDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/institutes/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data.success) {
        const inst = response.data.institute;
        setFormData({
          name: inst.name,
          maxClass: inst.maxClass,
          phone: inst.phone || '',
          address: inst.address || '',
          principalId: inst.principalId || ''
        });
      }
    } catch (err) {
      toast.error('Failed to fetch institute details');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Institute name is required';
    if (!formData.maxClass) newErrors.maxClass = 'Highest class number is required';
    if (!formData.principalId) newErrors.principalId = 'Principal assignment is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const url = isEditMode
        ? `http://localhost:5000/api/institutes/${id}`
        : 'http://localhost:5000/api/institutes';

      const method = isEditMode ? 'put' : 'post';

      const response = await axios[method](url, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        toast.success(`Institute ${isEditMode ? 'updated' : 'created'} successfully`);
        navigate('/dashboard/institutes');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} institute`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-8">
      {/* Header */}
      <SectionHeader
        title={isEditMode ? 'Edit Institute' : 'Setup New Institute'}
        subtitle={isEditMode ? 'Update institute information and principal.' : 'Register a main branch and assign a Principal.'}
        button={
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200 transition-all active:scale-[0.98]"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
        }
      />

      <div>
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Right Column: Form Fields */}
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">

                {/* Institute Name */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700">
                    Institute Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <Building2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-active transition-colors" />
                    <input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      type="text"
                      placeholder="e.g. Oakridge International School"
                      className={`custom_input ${errors.name ? 'border-red-400 focus:border-red-500' : ''}`}
                    />
                  </div>
                  {errors.name && <p className="text-xs text-red-500 font-bold pl-2">{errors.name}</p>}
                </div>

                {/* Highest Class Number */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700 ml-1">
                    Highest Class Offered <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <GraduationCap size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-active transition-colors" />
                    <input
                      name="maxClass"
                      value={formData.maxClass}
                      onChange={handleInputChange}
                      type="number"
                      min="1"
                      placeholder="e.g. 10 (if institute offers classes up to 10)"
                      className={`custom_input ${errors.maxClass ? 'border-red-400 focus:border-red-500' : ''}`}
                    />
                  </div>
                  {errors.maxClass && <p className="text-xs text-red-500 font-bold pl-2">{errors.maxClass}</p>}
                </div>

                {/* Contact Number */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700 ml-1">
                    Official Contact <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-active transition-colors" />
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      type="tel"
                      placeholder="+44 20 1234 5678"
                      className="custom_input"
                    />
                  </div>
                </div>

                {/* Assign to Principal (Associate Admin slot) */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700 ml-1">
                    Assign to Principal <span className="text-red-500">*</span>
                  </label>
                  <SearchableDropdown
                    options={principals}
                    value={formData.principalId}
                    onChange={(val) => setFormData(prev => ({ ...prev, principalId: val }))}
                    placeholder={fetchingPrincipals ? "Loading..." : "Select Principal"}
                    isLoading={fetchingPrincipals}
                  />
                  {errors.principalId && <p className="text-xs text-red-500 font-bold pl-2">{errors.principalId}</p>}
                </div>

                {/* Address */}
                <div className="md:col-span-2 space-y-1.5 pt-2">
                  <label className="block text-sm font-bold text-slate-700 ml-1">
                    Institute Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative group">
                    <MapPin size={18} className="absolute left-4 top-4 text-slate-400 group-focus-within:text-brand-active transition-colors" />
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      rows="4"
                      placeholder="e.g. 1st Floor, 29 Minerva Road, London, England, NW10 6HJ"
                      className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 outline-none transition-all focus:border-brand-active focus:ring-4 focus:ring-brand-active/10 text-slate-700"
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="mt-12 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-3 px-6 py-2 rounded-lg bg-brand-active text-white hover:bg-brand-hover active:scale-[0.98] transition-all disabled:opacity-70 text-lg"
                >
                  {isEditMode ? 'Update Institute Details' : 'Create Institute Account'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddInstitute;
