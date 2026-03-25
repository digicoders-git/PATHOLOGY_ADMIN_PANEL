import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { getPlans, createPlan, updatePlan, deletePlan } from "../apis/plan";
import { toast } from "react-toastify";
import { 
    MdAdd, MdEdit, MdDelete, MdCheck, MdDragIndicator, 
    MdClose, MdStar, MdCheckCircle 
} from "react-icons/md";
import Swal from "sweetalert2";

const Plans = () => {
  const { colors } = useTheme();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    totalPrice: "",
    priceLabel: "per month",
    badgeText: "",
    features: [""],
    status: true,
    isPopular: false,
    displayOrder: 0
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getPlans();
      if (res.success) setPlans(res.data);
    } catch (error) {
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      totalPrice: "",
      priceLabel: "per month",
      badgeText: "",
      features: [""],
      status: true,
      isPopular: false,
      displayOrder: 0
    });
    setEditId(null);
  };

  const handleEdit = (plan) => {
    setFormData({ ...plan });
    setEditId(plan._id);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Plan will be permanently removed!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#111",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!"
    });

    if (result.isConfirmed) {
      try {
        const res = await deletePlan(id);
        if (res.success) {
          toast.success(res.message);
          fetchData();
        }
      } catch (error) {
        toast.error("Cleanup failed");
      }
    }
  };

  const handleAddFeature = () => {
    setFormData(prev => ({ ...prev, features: [...prev.features, ""] }));
  };

  const handleRemoveFeature = (idx) => {
    const newFeatures = formData.features.filter((_, i) => i !== idx);
    setFormData(prev => ({ ...prev, features: newFeatures }));
  };

  const handleFeatureChange = (idx, val) => {
    const newFeatures = [...formData.features];
    newFeatures[idx] = val;
    setFormData(prev => ({ ...prev, features: newFeatures }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const filteredFeatures = formData.features.filter(f => f.trim() !== "");
      const payload = { ...formData, features: filteredFeatures };

      const res = editId 
        ? await updatePlan(editId, payload)
        : await createPlan(payload);

      if (res.success) {
        toast.success(res.message);
        setModalOpen(false);
        resetForm();
        fetchData();
      } else {
        toast.error(res.message);
      }
    } catch (error) {
       toast.error("Submission failed");
    } finally {
       setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8 border-b pb-6">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight" style={{ color: colors.text }}>Subscription Plans</h1>
          <p className="text-xs font-bold opacity-50 uppercase tracking-widest mt-1">Manage pricing and features for website & app</p>
        </div>
        <button 
          onClick={() => { resetForm(); setModalOpen(true); }}
          className="flex items-center gap-2 px-6 py-2.5 bg-black text-white text-[11px] font-black uppercase tracking-widest rounded transition-all hover:bg-slate-800"
        >
          <MdAdd size={18} /> Create New Plan
        </button>
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center opacity-30 text-xs font-bold uppercase tracking-widest">Loading Plans...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div 
              key={plan._id}
              className={`relative border-2 rounded p-8 transition-all hover:shadow-xl group ${plan.isPopular ? 'border-black ring-1 ring-black/5' : 'border-slate-100'}`}
              style={{ backgroundColor: colors.background }}
            >
              {plan.badgeText && (
                <div className="absolute -top-3 right-4 bg-orange-600 text-white text-[9px] font-black px-4 py-1.5 rounded uppercase tracking-widest shadow-lg">
                   {plan.badgeText}
                </div>
              )}
              {plan.isPopular && (
                <div className="absolute -top-3 left-4 bg-black text-white text-[9px] font-black px-4 py-1.5 rounded uppercase tracking-widest flex items-center gap-1 shadow-lg">
                   <MdStar size={10} /> Popular Plan
                </div>
              )}

              <div className="mb-6">
                 <h3 className="text-lg font-black uppercase tracking-tighter opacity-70">{plan.name}</h3>
                 <div className="flex items-baseline gap-1 mt-4">
                    <span className="text-3xl font-black">₹{plan.price}</span>
                    <span className="text-xs font-bold opacity-40 uppercase">{plan.priceLabel}</span>
                 </div>
                 {plan.totalPrice > 0 && (
                   <div className="text-[10px] font-bold opacity-50 uppercase tracking-widest mt-1">
                      Total Price: <span className="text-black">₹{plan.totalPrice}</span>
                   </div>
                 )}
              </div>

              <div className="space-y-3 mb-10 pt-6 border-t border-slate-50">
                {plan.features.map((feat, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <MdCheckCircle className="text-blue-600 shrink-0 mt-0.5" size={16} />
                    <span className="text-xs font-bold opacity-70 leading-relaxed">{feat}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 border-t pt-6 bg-slate-50/10">
                <button 
                  onClick={() => handleEdit(plan)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 border border-slate-200 text-[10px] font-black uppercase tracking-widest rounded hover:bg-black hover:text-white transition-all shadow-sm"
                >
                  <MdEdit size={14} /> Edit Plan
                </button>
                <button 
                  onClick={() => handleDelete(plan._id)}
                  className="w-12 flex items-center justify-center py-3 border border-red-100 text-red-500 rounded hover:bg-red-600 hover:text-white transition-all shadow-sm"
                >
                  <MdDelete size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded p-0 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl scale-in duration-200">
             <div className="p-6 border-b flex justify-between items-center bg-slate-50">
               <div>
                  <h2 className="text-lg font-black uppercase tracking-tight">{editId ? 'Update Subscription' : 'Create Subscription'}</h2>
                  <p className="text-[10px] opacity-40 font-bold uppercase mt-1">Define pricing, labels and features</p>
               </div>
               <button onClick={() => setModalOpen(false)} className="opacity-40 hover:opacity-100 transition-opacity"><MdClose size={24} /></button>
             </div>

             <div className="flex-1 overflow-auto p-8">
               <form id="plan-form" onSubmit={handleSubmit} className="space-y-8">
                 <div className="grid grid-cols-2 gap-6">
                    <div>
                       <label className="text-[10px] font-black uppercase opacity-40 block mb-2">Plan Name (e.g. Yearly Plan)</label>
                       <input 
                          required value={formData.name} 
                          onChange={(e) => setFormData(p => ({...p, name: e.target.value}))}
                          className="w-full bg-slate-50 border border-slate-200 p-3 rounded font-bold text-sm outline-none focus:border-black transition-all" 
                       />
                    </div>
                    <div>
                       <label className="text-[10px] font-black uppercase opacity-40 block mb-2">Badge Text (e.g. Save 90%)</label>
                       <input 
                          value={formData.badgeText} 
                          onChange={(e) => setFormData(p => ({...p, badgeText: e.target.value}))}
                          className="w-full bg-slate-50 border border-slate-200 p-3 rounded font-bold text-sm outline-none focus:border-black transition-all" 
                       />
                    </div>
                    <div>
                       <label className="text-[10px] font-black uppercase opacity-40 block mb-2">Price Amount (₹)</label>
                       <input 
                          required type="number" 
                          value={formData.price} 
                          onChange={(e) => setFormData(p => ({...p, price: e.target.value}))}
                          className="w-full bg-slate-50 border border-slate-200 p-3 rounded font-bold text-sm outline-none focus:border-black transition-all" 
                       />
                    </div>
                    <div>
                       <label className="text-[10px] font-black uppercase opacity-40 block mb-2">Total Price (Optional ₹)</label>
                       <input 
                          type="number" 
                          value={formData.totalPrice} 
                          onChange={(e) => setFormData(p => ({...p, totalPrice: e.target.value}))}
                          className="w-full bg-slate-50 border border-slate-200 p-3 rounded font-bold text-sm outline-none focus:border-black transition-all" 
                       />
                    </div>
                    <div>
                       <label className="text-[10px] font-black uppercase opacity-40 block mb-2">Price Label (e.g. per month)</label>
                       <input 
                          value={formData.priceLabel} 
                          onChange={(e) => setFormData(p => ({...p, priceLabel: e.target.value}))}
                          className="w-full bg-slate-50 border border-slate-200 p-3 rounded font-bold text-sm outline-none focus:border-black transition-all" 
                       />
                    </div>
                    <div>
                       <label className="text-[10px] font-black uppercase opacity-40 block mb-2">Display Order</label>
                       <input 
                          type="number" 
                          value={formData.displayOrder} 
                          onChange={(e) => setFormData(p => ({...p, displayOrder: e.target.value}))}
                          className="w-full bg-slate-50 border border-slate-200 p-3 rounded font-bold text-sm outline-none focus:border-black transition-all" 
                       />
                    </div>
                 </div>

                 <div className="flex gap-10 border-t pt-8">
                    <label className="flex items-center gap-3 cursor-pointer group">
                       <input 
                          type="checkbox" className="w-5 h-5 accent-black" 
                          checked={formData.isPopular} 
                          onChange={(e) => setFormData(p => ({...p, isPopular: e.target.checked}))} 
                       />
                       <span className="text-[11px] font-black uppercase opacity-60 group-hover:opacity-100 transition-all">Mark as Popular Plan</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                       <input 
                          type="checkbox" className="w-5 h-5 accent-green-600" 
                          checked={formData.status} 
                          onChange={(e) => setFormData(p => ({...p, status: e.target.checked}))} 
                       />
                       <span className="text-[11px] font-black uppercase opacity-60 group-hover:opacity-100 transition-all">Enable Status (Visible)</span>
                    </label>
                 </div>

                 <div className="border-t pt-8">
                   <div className="flex justify-between items-center mb-4">
                      <label className="text-[10px] font-black uppercase opacity-40">Plan Features List</label>
                      <button 
                        type="button" onClick={handleAddFeature}
                        className="text-[9px] font-black uppercase flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded hover:bg-black hover:text-white transition-all shadow-sm"
                      >
                         <MdAdd size={14} /> Add Feature
                      </button>
                   </div>
                   <div className="space-y-3">
                      {formData.features.map((feat, idx) => (
                        <div key={idx} className="flex gap-2 animate-in slide-in-from-left-2 duration-150">
                           <input 
                              value={feat} 
                              placeholder="e.g. Higher Listing on Website"
                              onChange={(e) => handleFeatureChange(idx, e.target.value)}
                              className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded font-bold text-sm outline-none focus:border-black transition-all" 
                           />
                           <button 
                              type="button" onClick={() => handleRemoveFeature(idx)}
                              className="w-12 flex items-center justify-center border border-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all rounded"
                           >
                             <MdClose size={18} />
                           </button>
                        </div>
                      ))}
                   </div>
                 </div>
               </form>
             </div>

             <div className="p-6 border-t flex justify-end gap-3 bg-slate-50">
                <button 
                  onClick={() => setModalOpen(false)}
                  className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-800 transition-all"
                >Cancel</button>
                <button 
                  form="plan-form" type="submit" disabled={submitting}
                  className="px-10 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded hover:opacity-80 transition-all disabled:opacity-30 shadow-xl"
                >
                  {submitting ? 'Processing...' : (editId ? 'Save Changes' : 'Create Subscription')}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Plans;
