import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  getTestServices, 
  createTestService, 
  updateTestService, 
  deleteTestService, 
  updateTestServiceStatus,
  bulkCreateTestServices,
  getCategories,
  createCategory
} from "../apis/testAndServices";
import { toast } from "react-toastify";
import { 
  MdAdd, 
  MdEdit, 
  MdDelete, 
  MdSearch, 
  MdFilterList, 
  MdToggleOn, 
  MdToggleOff, 
  MdClose,
  MdVisibility,
  MdRefresh,
  MdDownload,
  MdFileUpload,
  MdImage,
  MdOutlineScience
} from "react-icons/md";
import Loader from "./ui/Loader";
import Swal from "sweetalert2";
import * as XLSX from 'xlsx';

const TestsServices = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  // Master Data
  const [categories, setCategories] = useState([]);

  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);

  // Form State
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ 
    title: "", 
    status: true,
    category_id: "",
    fasting_required: false,
    fasting_hours: 0,
    instruction_text: "",
    sample_type: "",
    report_time: "",
    instructions: [],
    mrp: 0,
    price: 0,
    test_code: "",
    image: null
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getTestServices({
        page,
        limit: 10,
        search,
        status: statusFilter,
      });
      if (res.success) {
        setData(res.data);
        setPagination(res.pagination);
      }
    } catch {
      toast.error("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      if (res.success) setCategories(res.data);
    } catch {
      toast.error("Failed to load categories");
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setEditId(null);
    setFormData({ 
      title: "", 
      status: true,
      category_id: "",
      fasting_required: false,
      fasting_hours: 0,
      instruction_text: "",
      sample_type: "",
      report_time: "",
      instructions: [],
      mrp: 0,
      price: 0,
      test_code: "",
      image: null
    });
    setPreviewUrl(null);
    setIsModalOpen(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAddInstruction = () => {
    setFormData(prev => ({
       ...prev,
       instructions: [...prev.instructions, { title: "", description: "" }]
    }));
  };

  const handleRemoveInstruction = (index) => {
    setFormData(prev => ({
       ...prev,
       instructions: prev.instructions.filter((_, i) => i !== index)
    }));
  };

  const handleInstructionChange = (index, field, value) => {
    const newInstructions = [...formData.instructions];
    newInstructions[index][field] = value;
    setFormData(prev => ({ ...prev, instructions: newInstructions }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const submissionData = new FormData();
      Object.keys(formData).forEach(key => {
         if (key === 'image') {
            if (formData.image instanceof File) {
               submissionData.append('testImage', formData.image);
            }
         } else if (key === 'instructions') {
            submissionData.append(key, JSON.stringify(formData[key]));
         } else {
            submissionData.append(key, formData[key]);
         }
      });

      const res = editId 
        ? await updateTestService(editId, submissionData)
        : await createTestService(submissionData);
      
      if (res.success) {
        toast.success(res.message);
        resetForm();
        fetchData();
      }
    } catch (err) {
      toast.error(err.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    try {
      setTogglingId(id);
      const res = await updateTestServiceStatus(id, !currentStatus);
      if (res.success) {
        toast.success(res.message);
        setData((prev) =>
          prev.map((item) =>
            item._id === id ? { ...item, status: !currentStatus } : item,
          ),
        );
      }
    } catch {
      toast.error("Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3B82F6",
      confirmButtonText: "Delete",
    });

    if (result.isConfirmed) {
      try {
        setDeletingId(id);
        const res = await deleteTestService(id);
        if (res.success) {
          toast.success("Deleted successfully");
          fetchData();
        }
      } catch {
        toast.error("Delete failed");
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleEdit = (item) => {
    setEditId(item._id);
    setFormData({ 
      title: item.title, 
      status: item.status,
      category_id: item.category_id?._id || "",
      fasting_required: item.fasting_required || false,
      fasting_hours: item.fasting_hours || 0,
      instruction_text: item.instruction_text || "",
      sample_type: item.sample_type || "",
      report_time: item.report_time || "",
      instructions: item.instructions || [],
      mrp: item.mrp || 0,
      price: item.price || 0,
      test_code: item.test_code || "",
      image: null
    });
    setPreviewUrl(item.image?.cloudinary || item.image?.local || null);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 bg-[#F8FAFC] min-h-screen">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b pb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Tests & Services</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Manage Diagnostic Catalog</p>
          </div>
          <div className="flex gap-3">
             <button onClick={fetchData} className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-slate-600 shadow-sm"><MdRefresh size={20} /></button>
             <button onClick={() => setIsModalOpen(true)} className="px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all shadow-xl flex items-center gap-2 uppercase tracking-widest">
                <MdAdd size={20} />
                New Test
             </button>
          </div>
        </div>

        {/* Filter Card */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm mb-6 flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[300px] relative">
               <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
               <input 
                  type="text" 
                  placeholder="Search by test name or code..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
               />
            </div>
            <select 
               value={statusFilter}
               onChange={(e) => setStatusFilter(e.target.value)}
               className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none cursor-pointer"
            >
               <option value="">All Statuses</option>
               <option value="true">Active Only</option>
               <option value="false">Inactive Only</option>
            </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
           {loading ? <div className="p-20 flex justify-center"><Loader /></div> : (
              <table className="w-full">
                 <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                       <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Test Info</th>
                       <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                       <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Sample / TAT</th>
                       <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Value (₹)</th>
                       <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                       <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {data.map((item) => (
                       <tr key={item._id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-100 overflow-hidden flex-shrink-0">
                                   {item.image?.cloudinary || item.image?.local ? (
                                      <img src={item.image.cloudinary || `${import.meta.env.VITE_API_BASE_URL}/${item.image.local}`} className="w-full h-full object-cover" />
                                   ) : <div className="w-full h-full flex items-center justify-center text-slate-300"><MdOutlineScience size={24} /></div>}
                                </div>
                                <div>
                                   <p className="text-xs font-bold text-slate-800 uppercase line-clamp-1">{item.title}</p>
                                   <p className="text-[10px] text-blue-600 font-black tracking-wider uppercase mt-0.5">{item.test_code || "GEN-01"}</p>
                                </div>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <span className="text-[10px] font-bold px-3 py-1 bg-slate-100 text-slate-600 rounded-lg uppercase">
                                {item.category_id?.name || 'Uncategorized'}
                             </span>
                          </td>
                          <td className="px-6 py-4">
                             <p className="text-[10px] font-bold text-slate-700">{item.sample_type || 'N/A'}</p>
                             <p className="text-[9px] text-slate-400 mt-0.5">{item.report_time || '24 Hrs'}</p>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex flex-col">
                                <span className="text-xs font-black text-blue-600">₹{item.price}</span>
                                <span className="text-[9px] text-slate-300 line-through">₹{item.mrp}</span>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex justify-center">
                                <button 
                                   onClick={() => handleStatusToggle(item._id, item.status)}
                                   className={`p-1 rounded-full transition-all ${item.status ? 'text-green-500 hover:bg-green-50' : 'text-slate-300 hover:bg-slate-100'}`}
                                >
                                   {item.status ? <MdToggleOn size={32} /> : <MdToggleOff size={32} />}
                                </button>
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(item)} className="p-2 text-slate-400 hover:text-blue-600"><MdEdit size={18} /></button>
                                <button onClick={() => handleDelete(item._id)} className="p-2 text-slate-400 hover:text-red-500"><MdDelete size={18} /></button>
                             </div>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           )}
        </div>

        {/* Modal */}
        {isModalOpen && (
           <div className="fixed inset-0 z-1000 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={resetForm}></div>
              <div className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl animate-scale-in">
                 <div className="sticky top-0 z-20 p-6 bg-white border-b flex justify-between items-center">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">{editId ? 'Modify Test Information' : 'Register New Test'}</h3>
                    <button onClick={resetForm} className="p-2 text-slate-400 hover:text-slate-900"><MdClose size={24} /></button>
                 </div>

                 <form onSubmit={handleFormSubmit} className="p-8 space-y-8">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       {/* Left: Metadata */}
                       <div className="space-y-6">
                          
                          {/* Image Dropzone */}
                          <div className="space-y-2">
                             <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Test Visual Icon</label>
                             <label className="block relative cursor-pointer group">
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                <div className="w-full h-40 bg-slate-50 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center overflow-hidden hover:border-blue-400 transition-all">
                                   {previewUrl ? (
                                      <img src={previewUrl} className="w-full h-full object-cover" />
                                   ) : (
                                      <>
                                         <MdImage size={32} className="text-slate-300 mb-2" />
                                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Image</span>
                                      </>
                                   )}
                                </div>
                             </label>
                          </div>

                          <div className="space-y-2">
                             <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Official Title</label>
                             <input 
                                required
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/5 focus:bg-white transition-all shadow-inner" 
                                placeholder="E.g. Complete Blood Count (CBC)"
                             />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Category</label>
                                <select 
                                   required
                                   value={formData.category_id}
                                   onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                   className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-bold outline-none appearance-none shadow-inner"
                                >
                                   <option value="">Choose Category</option>
                                   {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                </select>
                             </div>
                             <div className="space-y-2">
                                <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Code</label>
                                <input 
                                   value={formData.test_code}
                                   onChange={(e) => setFormData({ ...formData, test_code: e.target.value })}
                                   className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-bold outline-none shadow-inner" 
                                   placeholder="TST-101"
                                />
                             </div>
                          </div>
                       </div>

                       {/* Right: Technical & Financial */}
                       <div className="space-y-6">
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                 <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">MRP (₹)</label>
                                 <input 
                                    type="number"
                                    value={formData.mrp}
                                    onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                                    className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-bold outline-none shadow-inner" 
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Offer Price (₹)</label>
                                 <input 
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-bold outline-none shadow-inner text-blue-600" 
                                 />
                              </div>
                           </div>

                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                 <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Sample Type</label>
                                 <input 
                                    value={formData.sample_type}
                                    onChange={(e) => setFormData({ ...formData, sample_type: e.target.value })}
                                    className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-bold outline-none shadow-inner" 
                                    placeholder="EDTA Blood"
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">Lead Time</label>
                                 <input 
                                    value={formData.report_time}
                                    onChange={(e) => setFormData({ ...formData, report_time: e.target.value })}
                                    className="w-full p-4 bg-slate-50 border-none rounded-2xl text-xs font-bold outline-none shadow-inner" 
                                    placeholder="Inside 24 Hours"
                                 />
                              </div>
                           </div>

                           <div className="p-4 bg-blue-50/50 rounded-2xl space-y-4">
                               <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-black text-blue-600 uppercase tracking-widest">Fasting Requirement</span>
                                  <button 
                                     type="button"
                                     onClick={() => setFormData({ ...formData, fasting_required: !formData.fasting_required })}
                                     className={`p-1 rounded-full transition-all ${formData.fasting_required ? 'text-blue-600' : 'text-slate-300'}`}
                                  >
                                     {formData.fasting_required ? <MdToggleOn size={36} /> : <MdToggleOff size={36} />}
                                  </button>
                               </div>
                               {formData.fasting_required && (
                                  <div className="animate-fade-in flex items-center gap-4">
                                     <span className="text-[10px] font-bold text-slate-500 uppercase">Min. Hours:</span>
                                     <input 
                                        type="number"
                                        value={formData.fasting_hours}
                                        onChange={(e) => setFormData({ ...formData, fasting_hours: e.target.value })}
                                        className="w-20 p-2 bg-white border border-blue-100 rounded-lg text-xs font-bold text-blue-600 outline-none"
                                     />
                                  </div>
                               )}
                           </div>
                       </div>
                    </div>

                    {/* Dynamic Instructions Section */}
                    <div className="pt-8 border-t space-y-4">
                       <div className="flex justify-between items-center px-1">
                          <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Patient Guidelines / Instructions</h4>
                          <button 
                            type="button" 
                            onClick={handleAddInstruction}
                            className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 hover:text-blue-700 transition-colors uppercase"
                          >
                             <MdAdd size={16} />
                             Add Instruction
                          </button>
                       </div>
                       
                       <div className="space-y-4">
                          {formData.instructions.length === 0 ? (
                             <div className="p-10 border-2 border-dashed border-slate-50 rounded-3xl text-center">
                                <p className="text-[10px] font-bold text-slate-300 uppercase italic">No specific instructions added yet</p>
                             </div>
                          ) : (
                             formData.instructions.map((ins, idx) => (
                                <div key={idx} className="bg-slate-50/50 p-6 rounded-3xl space-y-4 relative group/ins border border-slate-50">
                                   <button 
                                      type="button" 
                                      onClick={() => handleRemoveInstruction(idx)}
                                      className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors"
                                   >
                                      <MdDelete size={18} />
                                   </button>
                                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                      <div className="md:col-span-1 space-y-1">
                                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Label</label>
                                         <input 
                                            placeholder="E.g. Fasting"
                                            value={ins.title}
                                            onChange={(e) => handleInstructionChange(idx, 'title', e.target.value)}
                                            className="w-full p-3 bg-white border border-slate-100 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                                         />
                                      </div>
                                      <div className="md:col-span-2 space-y-1">
                                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Detailed Guideline</label>
                                         <textarea 
                                            placeholder="What the patient needs to do..."
                                            value={ins.description}
                                            onChange={(e) => handleInstructionChange(idx, 'description', e.target.value)}
                                            className="w-full p-3 bg-white border border-slate-100 rounded-xl text-xs font-medium outline-none h-20 resize-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                                         ></textarea>
                                      </div>
                                   </div>
                                </div>
                             ))
                          )}
                       </div>
                    </div>

                    <div className="pt-8 border-t">
                       <button 
                          disabled={submitting}
                          className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hov-scale-105 transition-all shadow-xl shadow-slate-900/20 disabled:opacity-50"
                       >
                          {submitting ? 'Synchronizing with Cloud...' : editId ? 'Commit Modifications' : 'Formalize New Test'}
                       </button>
                    </div>
                 </form>
              </div>
           </div>
        )}

      </div>
    </div>
  );
};

export default TestsServices;
