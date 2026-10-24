import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { 
  getPlans, 
  createPlan, 
  updatePlan, 
  deletePlan, 
  togglePlanStatus,
  reorderPlans 
} from "../apis/plan";
import { toast } from "react-toastify";
import { 
    MdAdd, MdEdit, MdDelete, MdCheck, MdDragIndicator, 
    MdClose, MdStar, MdCheckCircle, MdInfo,
    MdArrowBack, MdArrowForward, MdFormatListNumbered
} from "react-icons/md";
import Swal from "sweetalert2";

const getBadgeUrl = (badge) => {
  if (!badge) return null;
  let url = typeof badge === "string" ? badge : badge.cloudinary || badge.local || "";
  if (!url || typeof url !== "string" || !url.trim()) return null;
  url = url.trim();
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  const cleanPath = url.replace(/^\/+/, "");
  return `https://pathology-backend-live.onrender.com/${cleanPath}`;
};

const Plans = () => {
  const { colors } = useTheme();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);

  // Drag and drop & sequence reordering state
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [isReordering, setIsReordering] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    totalPrice: "",
    priceLabel: "per month",
    badgeText: "",
    duration: "30",
    features: [""],
    status: true,
    isPopular: false,
    displayOrder: 0,
    offerBadge: null,
    removeOfferBadge: false
  });
  const [badgePreview, setBadgePreview] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getPlans();
      if (res.success) {
        const sorted = (res.data || []).sort(
          (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
        );
        setPlans(sorted);
      }
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
      duration: "30",
      features: [""],
      status: true,
      isPopular: false,
      displayOrder: plans.length + 1,
      offerBadge: null,
      removeOfferBadge: false
    });
    setBadgePreview(null);
    setEditId(null);
  };

  // Save new plan sequence to backend
  const saveOrder = async (newList) => {
    try {
      setIsReordering(true);
      const orderedIds = newList.map(p => p._id);
      const res = await reorderPlans(orderedIds);
      if (res.success) {
        toast.success("Plan sequence updated! Live on Website.");
        if (res.data) {
          const sorted = (res.data || []).sort(
            (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)
          );
          setPlans(sorted);
        }
      } else {
        toast.error(res.message || "Failed to update sequence");
        fetchData();
      }
    } catch (error) {
      toast.error("Failed to update sequence");
      fetchData();
    } finally {
      setIsReordering(false);
    }
  };

  // Drag & drop handlers
  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIdx !== index) {
      setDragOverIdx(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleDrop = async (e, targetIdx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }

    const updated = [...plans];
    const [movedItem] = updated.splice(draggedIdx, 1);
    updated.splice(targetIdx, 0, movedItem);

    const reorderedList = updated.map((p, idx) => ({
      ...p,
      displayOrder: idx + 1
    }));

    setPlans(reorderedList);
    setDraggedIdx(null);
    setDragOverIdx(null);

    await saveOrder(reorderedList);
  };

  // Move left (-1) or right (+1)
  const handleMove = async (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= plans.length) return;

    const updated = [...plans];
    const [movedItem] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, movedItem);

    const reorderedList = updated.map((p, idx) => ({
      ...p,
      displayOrder: idx + 1
    }));

    setPlans(reorderedList);
    await saveOrder(reorderedList);
  };

  // Direct position jump
  const handleDirectPositionChange = async (currentIndex, newPos1Based) => {
    const targetIdx = newPos1Based - 1;
    if (targetIdx < 0 || targetIdx >= plans.length || targetIdx === currentIndex) return;

    const updated = [...plans];
    const [movedItem] = updated.splice(currentIndex, 1);
    updated.splice(targetIdx, 0, movedItem);

    const reorderedList = updated.map((p, idx) => ({
      ...p,
      displayOrder: idx + 1
    }));

    setPlans(reorderedList);
    await saveOrder(reorderedList);
  };

  const handleEdit = (plan) => {
    setFormData({ 
      ...plan,
      offerBadge: null,
      removeOfferBadge: false
    });
    const existingUrl = getBadgeUrl(plan.offerBadge);
    setBadgePreview(existingUrl);
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

  const handleToggleStatus = async (id) => {
    try {
      const res = await togglePlanStatus(id);
      if (res.success) {
        toast.success(res.message);
        setPlans(prev => prev.map(p => p._id === id ? { ...p, status: res.data.status } : p));
      } else {
        toast.error(res.message || "Failed to update status");
      }
    } catch (error) {
      toast.error("Failed to update status");
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
      const filteredFeatures = formData.features.filter(f => f && f.trim() !== "");

      const payload = new FormData();
      payload.append("name", (formData.name || "").trim());
      payload.append("price", parseFloat(formData.price) || 0);
      payload.append("totalPrice", parseFloat(formData.totalPrice) || 0);
      payload.append("priceLabel", (formData.priceLabel || "per month").trim());
      payload.append("badgeText", (formData.badgeText || "").trim());
      payload.append("duration", parseInt(formData.duration) || 30);
      payload.append("displayOrder", parseInt(formData.displayOrder) || (plans.length + 1));
      payload.append("status", formData.status);
      payload.append("isPopular", formData.isPopular);
      payload.append("features", JSON.stringify(filteredFeatures));

      if (formData.offerBadge instanceof File) {
        payload.append("offerBadge", formData.offerBadge);
      } else if (formData.removeOfferBadge) {
        payload.append("removeOfferBadge", "true");
      }

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
          <p className="text-xs font-bold opacity-50 uppercase tracking-widest mt-1">Manage pricing, bookings & features for website & app</p>
        </div>
        <button 
          onClick={() => { resetForm(); setModalOpen(true); }}
          className="flex items-center gap-2 px-6 py-2.5 bg-black text-white text-[11px] font-black uppercase tracking-widest rounded transition-all hover:bg-slate-800"
        >
          <MdAdd size={18} /> Create New Plan
        </button>
      </div>

      {/* SEQUENCE & REORDERING CONTROL BAR */}
      <div className="mb-8 p-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/80 via-indigo-50/40 to-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
            <MdFormatListNumbered size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Plan Display Sequence (Website & App)
              </h3>
              {isReordering && (
                <span className="flex items-center gap-1.5 text-[10px] font-black text-blue-700 bg-blue-100 border border-blue-300 px-2.5 py-0.5 rounded-full animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  Saving Sequence...
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
              Drag & Drop (Pick & Drop) any card or use arrows / position numbers: <strong>#1 = 1st card</strong>, <strong>#2 = 2nd card</strong>, <strong>#3 = 3rd card</strong> on Website.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-black text-slate-600 bg-white px-3.5 py-2 rounded-lg border border-slate-200 shadow-2xs self-end sm:self-center shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>LIVE SEQUENCE: <strong className="text-black">{plans.length} PLANS ACTIVE</strong></span>
        </div>
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center opacity-30 text-xs font-bold uppercase tracking-widest">Loading Plans...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div 
              key={plan._id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative border-2 rounded-xl p-6 transition-all duration-200 group ${
                draggedIdx === index 
                  ? 'opacity-40 border-dashed border-2 border-blue-500 scale-[0.98] ring-4 ring-blue-100 bg-blue-50/20 shadow-none' 
                  : dragOverIdx === index 
                  ? 'border-blue-600 ring-4 ring-blue-200/80 scale-[1.02] shadow-2xl bg-blue-50/30' 
                  : plan.isPopular 
                  ? 'border-black ring-1 ring-black/5 bg-black/[0.02] shadow-md hover:shadow-xl' 
                  : 'border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-xl'
              }`}
              style={{ backgroundColor: colors.background }}
            >
              {plan.badgeText && (
                <div className="absolute -top-3 right-4 bg-orange-600 text-white text-[9px] font-black px-3.5 py-1 rounded uppercase tracking-widest shadow-md z-10">
                   {plan.badgeText}
                </div>
              )}
              {plan.isPopular && (
                <div className="absolute -top-3 left-4 bg-black text-white text-[9px] font-black px-3.5 py-1 rounded uppercase tracking-widest flex items-center gap-1 shadow-md z-10">
                   <MdStar size={10} /> Popular Plan
                </div>
              )}

              {/* TOP BAR: Drag Handle, Position #1/#2/#3 Badge & Quick Controls */}
              <div 
                className="flex items-center justify-between gap-2 pb-4 mb-5 border-b border-slate-100"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center gap-2">
                  {/* Drag Handle */}
                  <div 
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-grab active:cursor-grabbing transition-colors select-none"
                    title="Click & Drag to reorder this card"
                  >
                    <MdDragIndicator size={16} className="text-slate-500" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Drag</span>
                  </div>

                  {/* Position Badge */}
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider border ${
                    index === 0 
                      ? 'bg-amber-100 text-amber-900 border-amber-300' 
                      : index === 1 
                      ? 'bg-blue-100 text-blue-900 border-blue-300' 
                      : index === 2 
                      ? 'bg-purple-100 text-purple-900 border-purple-300' 
                      : 'bg-slate-100 text-slate-800 border-slate-200'
                  }`}>
                    <span>POS #{index + 1}</span>
                    <span className="text-[9px] font-bold opacity-75">
                      {index === 0 ? "★ 1st" : index === 1 ? "2nd" : index === 2 ? "3rd" : `${index + 1}th`}
                    </span>
                  </div>
                </div>

                {/* Quick Shift Controls */}
                <div className="flex items-center gap-1">
                  {/* Position selector dropdown */}
                  <select
                    value={index + 1}
                    onChange={(e) => handleDirectPositionChange(index, Number(e.target.value))}
                    className="text-[10px] font-black uppercase bg-white border border-slate-200 rounded px-1.5 py-1 text-slate-700 outline-none hover:border-black cursor-pointer shadow-2xs"
                    title="Directly select position number"
                  >
                    {plans.map((_, pIdx) => (
                      <option key={pIdx} value={pIdx + 1}>
                        #{pIdx + 1}
                      </option>
                    ))}
                  </select>

                  {/* Move Left */}
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMove(index, -1)}
                    className="w-6 h-6 flex items-center justify-center rounded border border-slate-200 bg-white hover:bg-black hover:text-white disabled:opacity-20 disabled:hover:bg-white disabled:hover:text-current transition-all cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                    title="Move Left / Earlier in sequence"
                  >
                    <MdArrowBack size={12} />
                  </button>

                  {/* Move Right */}
                  <button
                    type="button"
                    disabled={index === plans.length - 1}
                    onClick={() => handleMove(index, 1)}
                    className="w-6 h-6 flex items-center justify-center rounded border border-slate-200 bg-white hover:bg-black hover:text-white disabled:opacity-20 disabled:hover:bg-white disabled:hover:text-current transition-all cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                    title="Move Right / Later in sequence"
                  >
                    <MdArrowForward size={12} />
                  </button>
                </div>
              </div>

              <div className="mb-6 flex justify-between items-start">
                 <div>
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
                    {getBadgeUrl(plan.offerBadge) && (
                      <div className="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2 w-fit">
                        <img 
                          src={getBadgeUrl(plan.offerBadge)} 
                          alt="Offer Badge" 
                          className="w-10 h-10 object-contain drop-shadow-xs" 
                          onError={(e) => {
                            const currentSrc = e.target.src;
                            if (currentSrc.includes("pathology-backend-live.onrender.com")) {
                              e.target.src = currentSrc.replace("https://pathology-backend-live.onrender.com", "https://api.laboindia.com");
                            } else if (currentSrc.includes("api.laboindia.com")) {
                              e.target.src = currentSrc.replace("https://api.laboindia.com", "https://pathology-backend-live.onrender.com");
                            } else {
                              e.target.style.display = "none";
                            }
                          }}
                        />
                        <div>
                          <span className="text-[9px] font-black uppercase text-amber-800 block">Offer Badge</span>
                          <span className="text-[8px] text-amber-600 font-bold block">Active on Website</span>
                        </div>
                      </div>
                    )}
                 </div>
                 
                 <button
                   type="button"
                   onClick={(e) => { e.stopPropagation(); handleToggleStatus(plan._id); }}
                   className={`flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all duration-300 shadow-sm border ${
                     plan.status 
                       ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                       : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                   }`}
                   title="Click to toggle active/inactive status"
                 >
                   <span className={`w-1.5 h-1.5 rounded-full ${plan.status ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                   {plan.status ? 'Active' : 'Inactive'}
                 </button>
              </div>

              {/* Plan Info: Unlimited + Duration */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 flex flex-col items-center justify-center text-center">
                  <p className="text-[9px] font-black uppercase text-emerald-700 mb-1">Bookings</p>
                  <p className="text-xl font-black text-emerald-600">Unlimited</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 flex flex-col items-center justify-center text-center">
                  <p className="text-[9px] font-black uppercase text-blue-700 mb-1">Validity</p>
                  <p className="text-xl font-black text-blue-600">{plan.duration || 30} Days</p>
                </div>
              </div>

              <div className="space-y-3 mb-10 pt-6 border-t border-slate-50">
                {plan.features && plan.features.length > 0 ? (
                  plan.features.map((feat, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <MdCheckCircle className="text-blue-600 shrink-0 mt-0.5" size={16} />
                      <span className="text-xs font-bold opacity-70 leading-relaxed">{feat}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs opacity-40 italic">No features added</p>
                )}
              </div>

              <div className="flex gap-2 border-t pt-6" onClick={(e) => e.stopPropagation()}>
                <button 
                  type="button"
                  onClick={() => handleEdit(plan)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 border border-slate-200 text-[10px] font-black uppercase tracking-widest rounded hover:bg-black hover:text-white transition-all shadow-sm"
                >
                  <MdEdit size={14} /> Edit Plan
                </button>
                <button 
                  type="button"
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
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-lg p-0 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl scale-in duration-200">
             <div className="p-6 border-b flex justify-between items-center bg-slate-50">
               <div>
                  <h2 className="text-lg font-black uppercase tracking-tight">{editId ? 'Update Subscription' : 'Create Subscription'}</h2>
                  <p className="text-[10px] opacity-40 font-bold uppercase mt-1">All plans include unlimited bookings — just set price & duration</p>
               </div>
               <button onClick={() => setModalOpen(false)} className="opacity-40 hover:opacity-100 transition-opacity"><MdClose size={24} /></button>
             </div>

             <div className="flex-1 overflow-auto p-8">
               <form id="plan-form" onSubmit={handleSubmit} className="space-y-8">
                 {/* Basic Info */}
                 <div>
                   <h3 className="text-sm font-black uppercase mb-4 flex items-center gap-2 text-slate-700">
                     <MdInfo size={16} /> Basic Information
                   </h3>
                   <div className="grid grid-cols-2 gap-6">
                      <div>
                         <label className="text-[10px] font-black uppercase opacity-40 block mb-2">Plan Name *</label>
                         <input 
                            required value={formData.name} 
                            onChange={(e) => setFormData(p => ({...p, name: e.target.value}))}
                            placeholder="e.g. Weekly Plan"
                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded font-bold text-sm outline-none focus:border-black transition-all" 
                         />
                      </div>
                      <div>
                         <label className="text-[10px] font-black uppercase opacity-40 block mb-2">Badge Text (Optional)</label>
                         <input 
                            value={formData.badgeText} 
                            onChange={(e) => setFormData(p => ({...p, badgeText: e.target.value}))}
                            placeholder="e.g. Save 50%"
                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded font-bold text-sm outline-none focus:border-black transition-all" 
                         />
                      </div>
                   </div>
                 </div>

                 {/* Offer Badge / Sticker Upload Section */}
                 <div className="border-2 border-amber-200 rounded-lg p-6 bg-gradient-to-br from-amber-50/60 to-orange-50/40">
                   <h3 className="text-sm font-black uppercase mb-1 flex items-center gap-2 text-amber-900">
                     <MdStar className="text-amber-600" size={18} /> Dynamic Offer Badge / Sticker
                   </h3>
                   <p className="text-[11px] text-amber-800 font-bold mb-4 uppercase tracking-wide">
                     Upload a round badge or sticker (e.g. MUHAL Apply Coupon) to display directly beside the price on the pricing card.
                   </p>

                   <div className="flex flex-col sm:flex-row items-center gap-6">
                     <div className="relative w-28 h-28 rounded-2xl border-2 border-dashed border-amber-300 bg-white flex items-center justify-center p-2 shrink-0 shadow-sm overflow-hidden group">
                       {badgePreview ? (
                         <>
                           <img
                             src={badgePreview}
                             alt="Badge Preview"
                             className="w-full h-full object-contain transition-transform group-hover:scale-105"
                           />
                           <button
                             type="button"
                             onClick={() => {
                               setBadgePreview(null);
                               setFormData(p => ({ ...p, offerBadge: null, removeOfferBadge: true }));
                             }}
                             className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700 transition-all"
                             title="Remove Badge"
                           >
                             <MdClose size={14} />
                           </button>
                         </>
                       ) : (
                         <div className="text-center p-2">
                           <span className="text-[10px] font-black uppercase text-amber-600 block">No Badge</span>
                           <span className="text-[8px] text-slate-400 font-semibold block mt-0.5">Click to upload</span>
                         </div>
                       )}
                     </div>

                     <div className="flex-1 w-full space-y-2">
                       <div className="flex flex-wrap items-center gap-2">
                         <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white text-[11px] font-black uppercase tracking-wider rounded-lg cursor-pointer hover:bg-slate-800 transition-all shadow-sm">
                           <MdAdd size={16} /> {badgePreview ? "Change Badge Image" : "Upload Badge Image"}
                           <input
                             type="file"
                             accept="image/*"
                             className="hidden"
                             onChange={(e) => {
                               const file = e.target.files?.[0];
                               if (file) {
                                 setFormData(p => ({ ...p, offerBadge: file, removeOfferBadge: false }));
                                 setBadgePreview(URL.createObjectURL(file));
                               }
                             }}
                           />
                         </label>

                         <button
                           type="button"
                           onClick={async () => {
                             try {
                               const response = await fetch("/offer-badge-sample.png");
                               const blob = await response.blob();
                               const file = new File([blob], "muhal-apply-coupon-badge.png", { type: "image/png" });
                               setFormData(p => ({ ...p, offerBadge: file, removeOfferBadge: false }));
                               setBadgePreview("/offer-badge-sample.png");
                               toast.info("Sample gold badge selected!");
                             } catch (err) {
                               console.error(err);
                             }
                           }}
                           className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-amber-200 transition-all"
                         >
                           ★ Use Sample Gold Badge
                         </button>
                       </div>

                       <p className="text-[10px] text-slate-500 font-medium">
                         Recommended: Transparent PNG, WebP or SVG format. Looks great in 150x150 or 200x200 resolution.
                       </p>
                     </div>
                   </div>
                 </div>

                 {/* Pricing */}
                 <div>
                   <h3 className="text-sm font-black uppercase mb-4 flex items-center gap-2 text-slate-700">
                     <MdInfo size={16} /> Pricing Details
                   </h3>
                   <div className="grid grid-cols-2 gap-6">
                      <div>
                         <label className="text-[10px] font-black uppercase opacity-40 block mb-2">Price Amount (₹) *</label>
                         <input 
                            required type="number" 
                            value={formData.price} 
                            onChange={(e) => setFormData(p => ({...p, price: e.target.value}))}
                            placeholder="e.g. 999"
                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded font-bold text-sm outline-none focus:border-black transition-all" 
                         />
                      </div>
                      <div>
                         <label className="text-[10px] font-black uppercase opacity-40 block mb-2">Total Price (₹) (Optional)</label>
                         <input 
                            type="number" 
                            value={formData.totalPrice} 
                            onChange={(e) => setFormData(p => ({...p, totalPrice: e.target.value}))}
                            placeholder="e.g. 1999"
                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded font-bold text-sm outline-none focus:border-black transition-all" 
                         />
                      </div>
                      <div>
                         <label className="text-[10px] font-black uppercase opacity-40 block mb-2">Price Label *</label>
                         <input 
                            required value={formData.priceLabel} 
                            onChange={(e) => setFormData(p => ({...p, priceLabel: e.target.value}))}
                            placeholder="e.g. per week"
                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded font-bold text-sm outline-none focus:border-black transition-all" 
                         />
                      </div>
                      <div>
                         <label className="text-[10px] font-black uppercase opacity-40 block mb-2">Display Order</label>
                         <input 
                            type="number" 
                            value={formData.displayOrder} 
                            onChange={(e) => setFormData(p => ({...p, displayOrder: e.target.value}))}
                            placeholder="e.g. 1"
                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded font-bold text-sm outline-none focus:border-black transition-all" 
                         />
                      </div>
                   </div>
                 </div>

                                {/* Duration — MAIN SECTION */}
                 <div className="border-2 border-blue-300 rounded-lg p-6 bg-gradient-to-br from-blue-50 to-blue-100">
                   <h3 className="text-sm font-black uppercase mb-2 flex items-center gap-2 text-blue-800">
                     <MdInfo size={16} /> Plan Duration & Bookings
                   </h3>
                   <p className="text-[10px] text-blue-600 font-bold mb-6 uppercase tracking-wide">
                     All plans include <span className="text-emerald-700 font-black underline">UNLIMITED BOOKINGS</span> — lab can accept unlimited bookings during plan validity
                   </p>
                   
                   <div className="grid grid-cols-2 gap-6">
                      <div>
                         <label className="text-[10px] font-black uppercase text-blue-800 block mb-2">Duration (Days) *</label>
                         <input 
                            required type="number" 
                            value={formData.duration} 
                            onChange={(e) => setFormData(p => ({...p, duration: e.target.value}))}
                            placeholder="e.g. 7, 30, 90, 365"
                            className="w-full bg-white border-2 border-blue-400 p-3 rounded font-bold text-sm outline-none focus:border-blue-600 transition-all" 
                         />
                         <p className="text-[9px] text-blue-700 font-bold mt-2">7 = Weekly | 30 = Monthly | 90 = Quarterly | 365 = Yearly</p>
                      </div>

                      <div className="bg-white rounded-lg border-2 border-emerald-200 p-4 flex flex-col justify-center">
                        <p className="text-[9px] font-black uppercase text-slate-500 mb-2">Plan Summary Preview</p>
                        <div className="flex items-center gap-2 mb-1">
                          <MdCheck className="text-emerald-600" size={16} />
                          <span className="text-sm font-black text-emerald-700">Unlimited Bookings</span>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <MdCheck className="text-blue-600" size={16} />
                          <span className="text-sm font-black text-blue-700">Valid for {formData.duration || 30} days</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MdCheck className="text-slate-600" size={16} />
                          <span className="text-sm font-black text-slate-700">Price: ₹{formData.price || 0}</span>
                        </div>
                      </div>
                   </div>
                 </div>

                 {/* Status */}
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
                       <span className="text-[11px] font-black uppercase opacity-60 group-hover:opacity-100 transition-all">Enable Status (Visible on Website)</span>
                    </label>
                 </div>

                 {/* Features */}
                 <div className="border-t pt-8">
                   <div className="flex justify-between items-center mb-4">
                      <label className="text-sm font-black uppercase opacity-70">Plan Features List</label>
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
