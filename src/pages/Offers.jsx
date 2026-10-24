import React, { useState, useEffect, useCallback } from "react";
import {
  getAllOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  toggleOfferStatus,
} from "../apis/offers";
import { toast } from "react-toastify";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdClose,
  MdRefresh,
  MdImage,
  MdToggleOn,
  MdToggleOff,
  MdSearch,
  MdLocalOffer,
  MdSmartphone,
  MdWeb,
  MdOpenInNew,
} from "react-icons/md";
import Swal from "sweetalert2";
import Loader from "./ui/Loader";

const EMPTY = {
  title: "",
  subtitle: "",
  description: "",
  couponCode: "",
  discountPercent: "",
  discountAmount: "",
  offerType: "app_banner",
  link: "",
  bgColor: "#FF0000",
  textColor: "#ffffff",
  validFrom: "",
  validTo: "",
  status: true,
  sortOrder: "0",
  image: null,
};

const inp = "w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all";
const Label = ({ children }) => (
  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
    {children}
  </label>
);

const WEB_OFFER_TYPES = ["slider", "banner", "popup"];
const ALL_OFFER_TYPES = ["slider", "banner", "popup", "app_banner"];

const Offers = () => {
  const [activeTab, setActiveTab] = useState("app_banner"); // "app_banner" | "website"
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const effectiveType = activeTab === "app_banner" ? "app_banner" : (typeFilter || "!app_banner");
      const res = await getAllOffers({ page, limit: 10, search, status: statusFilter, offerType: effectiveType });
      if (res.success) { setData(res.data); setPagination(res.pagination); }
    } catch { toast.error("Failed to fetch offers"); }
    finally { setLoading(false); }
  }, [page, search, statusFilter, typeFilter, activeTab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    setSearch("");
    setStatusFilter("");
    setTypeFilter("");
  };

  // ── Form helpers ───────────────────────────────────────────────────────────
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const resetForm = () => {
    setEditId(null);
    setForm(EMPTY);
    setPreviewUrl(null);
    setIsModalOpen(false);
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setForm({
      ...EMPTY,
      offerType: activeTab === "app_banner" ? "app_banner" : "slider",
      bgColor: activeTab === "app_banner" ? "#FF0000" : "#ffffff",
      textColor: activeTab === "app_banner" ? "#ffffff" : "#000000",
    });
    setPreviewUrl(null);
    setIsModalOpen(true);
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) { set("image", file); setPreviewUrl(URL.createObjectURL(file)); }
  };

  const handleEdit = (item) => {
    setEditId(item._id);
    setForm({
      title: item.title || "",
      subtitle: item.subtitle || "",
      description: item.description || "",
      couponCode: item.couponCode || "",
      discountPercent: item.discountPercent || "",
      discountAmount: item.discountAmount || "",
      offerType: item.offerType || "app_banner",
      link: item.link || "",
      bgColor: item.bgColor || "#ffffff",
      textColor: item.textColor || "#000000",
      validFrom: item.validFrom ? item.validFrom.slice(0, 10) : "",
      validTo: item.validTo ? item.validTo.slice(0, 10) : "",
      status: item.status,
      sortOrder: item.sortOrder ?? "0",
      image: null,
    });
    setPreviewUrl(item.image?.cloudinary || (item.image?.local ? `${import.meta.env.VITE_API_BASE_URL}/${item.image.local}` : null));
    setIsModalOpen(true);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === "image") { if (v instanceof File) fd.append("offerImage", v); }
        else fd.append(k, v ?? "");
      });
      const res = editId ? await updateOffer(editId, fd) : await createOffer(fd);
      if (res.success) { toast.success(res.message); resetForm(); fetchData(); }
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setSubmitting(false); }
  };

  // ── Toggle ─────────────────────────────────────────────────────────────────
  const handleToggle = async (id) => {
    try {
      setTogglingId(id);
      const res = await toggleOfferStatus(id);
      if (res.success) {
        toast.success(res.message);
        setData((p) => p.map((x) => x._id === id ? { ...x, status: res.data.status } : x));
      }
    } catch { toast.error("Failed"); } finally { setTogglingId(null); }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    const isApp = activeTab === "app_banner";
    const r = await Swal.fire({
      title: isApp ? "Delete this App Banner?" : "Delete this offer?",
      text: isApp ? "This will remove the banner from the Patient App Home Screen footer." : "This offer will no longer be visible.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      confirmButtonText: "Delete",
    });
    if (r.isConfirmed) {
      try {
        setDeletingId(id);
        const res = await deleteOffer(id);
        if (res.success) { toast.success("Deleted successfully"); fetchData(); }
      } catch { toast.error("Delete failed"); } finally { setDeletingId(null); }
    }
  };

  const typeBadge = (type) => {
    const map = {
      slider: "bg-blue-100 text-blue-700",
      banner: "bg-purple-100 text-purple-700",
      popup: "bg-amber-100 text-amber-700",
      app_banner: "bg-rose-100 text-rose-700 border border-rose-200",
    };
    const labels = {
      slider: "Web Slider",
      banner: "Web Banner",
      popup: "Web Popup",
      app_banner: "App Banner",
    };
    return <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${map[type] || "bg-slate-100 text-slate-500"}`}>{labels[type] || type}</span>;
  };

  return (
    <div className="p-6 min-h-screen bg-slate-50">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 border-b pb-5">
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              {activeTab === "app_banner" ? "Patient App Banners" : "Offers & Website Sliders"}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {activeTab === "app_banner"
                ? "Manage dynamic promotional banners shown on the Patient App Home Screen footer"
                : "Manage promotional offers and sliders shown on the website"}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={fetchData} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 transition-all shadow-xs" title="Refresh">
              <MdRefresh size={18} />
            </button>
            <button onClick={handleOpenAdd} className={`flex items-center gap-2 px-4 py-2 text-white text-xs font-bold rounded-lg transition-all shadow-xs ${activeTab === "app_banner" ? "bg-rose-600 hover:bg-rose-700" : "bg-blue-600 hover:bg-blue-700"}`}>
              <MdAdd size={16} /> {activeTab === "app_banner" ? "Add App Banner" : "Add Offer"}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-3">
          <button
            type="button"
            onClick={() => handleTabChange("app_banner")}
            className={`flex items-center gap-2 pb-3.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === "app_banner"
                ? "text-rose-600 border-rose-600"
                : "text-slate-400 border-transparent hover:text-slate-600"
            }`}
          >
            <MdSmartphone size={18} />
            <span>Patient App Banners</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-black border border-rose-100">
              Home Footer
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("website")}
            className={`flex items-center gap-2 pb-3.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === "website"
                ? "text-blue-600 border-blue-600"
                : "text-slate-400 border-transparent hover:text-slate-600"
            }`}
          >
            <MdWeb size={18} />
            <span>Website Offers & Sliders</span>
          </button>
        </div>

        {/* Tip Box for App Banners */}
        {activeTab === "app_banner" && (
          <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-3.5 flex items-start gap-3">
            <span className="p-1 rounded bg-rose-100 text-rose-600 shrink-0 mt-0.5"><MdSmartphone size={16} /></span>
            <div className="text-xs text-rose-900 leading-relaxed">
              <span className="font-bold">Dynamic Home Footer Banners: </span>
              Active banners configured here are delivered directly to the <strong>Patient Mobile App</strong> home screen footer. If multiple banners are active, the app automatically cycles through them as a slider.
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input placeholder={activeTab === "app_banner" ? "Search app banners..." : "Search offers..."} value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-blue-400 transition-all" />
          </div>
          {activeTab === "website" && (
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none">
              <option value="">All Web Types</option>
              {WEB_OFFER_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          )}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none">
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        {/* Table / List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-24 flex justify-center"><Loader /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <th className="px-5 py-3.5">Banner / Offer</th>
                    <th className="px-5 py-3.5">Type</th>
                    {activeTab === "website" ? (
                      <>
                        <th className="px-5 py-3.5">Discount</th>
                        <th className="px-5 py-3.5">Coupon</th>
                        <th className="px-5 py-3.5">Validity</th>
                      </>
                    ) : (
                      <>
                        <th className="px-5 py-3.5">Target Link</th>
                        <th className="px-5 py-3.5">Validity</th>
                      </>
                    )}
                    <th className="px-5 py-3.5 text-center">Order</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={activeTab === "website" ? 8 : 6} className="py-20 text-center text-xs text-slate-400">
                        {activeTab === "app_banner" ? "No App Banners found. Click '+ Add App Banner' above to add one!" : "No offers found."}
                      </td>
                    </tr>
                  ) : data.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Banner Info */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-slate-200 ${activeTab === "app_banner" ? "w-28 h-12 bg-slate-900" : "w-14 h-10"}`}
                            style={{ backgroundColor: item.bgColor || "#f8fafc" }}>
                            {(item.image?.cloudinary || item.image?.local)
                              ? <img src={item.image.cloudinary || `${import.meta.env.VITE_API_BASE_URL}/${item.image.local}`} className="w-full h-full object-cover" alt="Banner" />
                              : <MdImage className="text-slate-300" size={20} />}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 line-clamp-1 max-w-[220px]">{item.title}</p>
                            {item.subtitle && <p className="text-[10px] text-slate-400 line-clamp-1 max-w-[220px]">{item.subtitle}</p>}
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-5 py-3.5">{typeBadge(item.offerType)}</td>

                      {/* Web vs App Columns */}
                      {activeTab === "website" ? (
                        <>
                          {/* Discount */}
                          <td className="px-5 py-3.5">
                            <div className="space-y-0.5">
                              {item.discountPercent > 0 && <p className="text-xs font-bold text-emerald-600">{item.discountPercent}% OFF</p>}
                              {item.discountAmount > 0 && <p className="text-xs font-bold text-blue-600">₹{item.discountAmount} OFF</p>}
                              {!item.discountPercent && !item.discountAmount && <p className="text-xs text-slate-300">—</p>}
                            </div>
                          </td>
                          {/* Coupon */}
                          <td className="px-5 py-3.5">
                            {item.couponCode
                              ? <span className="text-[10px] font-black px-2 py-1 bg-slate-100 text-slate-700 rounded tracking-widest">{item.couponCode}</span>
                              : <span className="text-xs text-slate-300">—</span>}
                          </td>
                          {/* Validity */}
                          <td className="px-5 py-3.5">
                            <div className="text-[10px] text-slate-500 space-y-0.5">
                              {item.validFrom && <p>From: {new Date(item.validFrom).toLocaleDateString("en-IN")}</p>}
                              {item.validTo && <p>To: {new Date(item.validTo).toLocaleDateString("en-IN")}</p>}
                              {!item.validFrom && !item.validTo && <p className="text-slate-300">Always Active</p>}
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          {/* Target Link */}
                          <td className="px-5 py-3.5">
                            {item.link ? (
                              <a href={item.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:underline max-w-[180px] truncate">
                                <span className="truncate">{item.link}</span>
                                <MdOpenInNew size={12} className="shrink-0" />
                              </a>
                            ) : (
                              <span className="text-xs text-slate-300">None</span>
                            )}
                          </td>
                          {/* Validity */}
                          <td className="px-5 py-3.5">
                            <div className="text-[10px] text-slate-500 space-y-0.5">
                              {item.validFrom && <p>From: {new Date(item.validFrom).toLocaleDateString("en-IN")}</p>}
                              {item.validTo && <p>To: {new Date(item.validTo).toLocaleDateString("en-IN")}</p>}
                              {!item.validFrom && !item.validTo && <span className="text-[10px] px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded font-semibold">Always Active</span>}
                            </div>
                          </td>
                        </>
                      )}

                      {/* Sort Order */}
                      <td className="px-5 py-3.5 text-center">
                        <span className="text-xs font-bold text-slate-600 px-2 py-0.5 bg-slate-100 rounded-md">{item.sortOrder ?? 0}</span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 text-center">
                        <button onClick={() => handleToggle(item._id)} disabled={togglingId === item._id}
                          className={`p-0.5 rounded-full transition-all cursor-pointer ${item.status ? "text-green-500" : "text-slate-300"}`}>
                          {item.status ? <MdToggleOn size={28} /> : <MdToggleOff size={28} />}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => handleEdit(item)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer" title="Edit">
                            <MdEdit size={16} />
                          </button>
                          <button onClick={() => handleDelete(item._id)} disabled={deletingId === item._id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer" title="Delete">
                            <MdDelete size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && pagination.totalPages > 1 && (
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
              <p className="text-[10px] text-slate-400 font-semibold">Page {pagination.page} of {pagination.totalPages}</p>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-all">Prev</button>
                <button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-all">Next</button>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════ MODAL ════════════════════ */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={resetForm} />
            <div className="relative bg-white w-full max-w-3xl max-h-[93vh] overflow-y-auto rounded-2xl shadow-2xl flex flex-col">

              {/* Modal Header */}
              <div className="sticky top-0 z-20 px-7 py-4 bg-white border-b flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    {editId
                      ? (form.offerType === "app_banner" ? "Edit App Banner" : "Edit Offer")
                      : (form.offerType === "app_banner" ? "Add Patient App Banner" : "Add New Offer")}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {form.offerType === "app_banner"
                      ? "Configure promotional banner for the Patient App Home Screen footer"
                      : "Fill in the promotional offer details"}
                  </p>
                </div>
                <button onClick={resetForm} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-all cursor-pointer">
                  <MdClose size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-7 py-6 space-y-6">

                {/* Banner Upload Box */}
                <div>
                  <Label>
                    {form.offerType === "app_banner"
                      ? "App Banner Image * (Recommended ~1200 x 500 px or landscape ratio)"
                      : "Offer Image / Banner"}
                  </Label>
                  <label className="block mt-1 cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
                    <div className={`border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center overflow-hidden hover:border-blue-400 transition-all ${form.offerType === "app_banner" ? "h-44 sm:h-52 bg-slate-900" : "h-36 bg-slate-50"}`}
                      style={{ backgroundColor: form.bgColor }}>
                      {previewUrl
                        ? <img src={previewUrl} className="w-full h-full object-contain" alt="Preview" />
                        : (
                          <div className="flex flex-col items-center p-4 text-center">
                            <MdImage size={32} className="text-slate-300 mb-2" />
                            <span className="text-xs text-slate-600 font-bold">Click to Upload Banner Image</span>
                            <span className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WEBP up to 5MB</span>
                          </div>
                        )}
                    </div>
                  </label>
                </div>

                {/* Title + Subtitle + Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Title *</Label>
                    <input required value={form.title} onChange={(e) => set("title", e.target.value)}
                      className={inp} placeholder="e.g. India ka Apna Pathology Lab Network" />
                  </div>
                  <div>
                    <Label>Subtitle / Tagline</Label>
                    <input value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)}
                      className={inp} placeholder="e.g. Find accredited labs & book tests easily" />
                  </div>
                </div>

                {/* Type Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Banner / Placement Type</Label>
                    <select value={form.offerType} onChange={(e) => set("offerType", e.target.value)} className={inp}>
                      <option value="app_banner">Patient App Banner (Home Footer)</option>
                      <option value="slider">Website Slider</option>
                      <option value="banner">Website Banner</option>
                      <option value="popup">Website Popup</option>
                    </select>
                  </div>
                  <div>
                    <Label>Sort Order</Label>
                    <input type="number" min="0" value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)}
                      className={inp} placeholder="0 (Lower numbers appear first)" />
                  </div>
                </div>

                {/* Web Offer extra fields (if not app_banner or if desired) */}
                {form.offerType !== "app_banner" && (
                  <>
                    {/* Description */}
                    <div>
                      <Label>Description</Label>
                      <textarea rows={2} value={form.description} onChange={(e) => set("description", e.target.value)}
                        className={`${inp} resize-none`} placeholder="Brief description of the offer..." />
                    </div>

                    {/* Discount + Coupon */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <Label>Discount (%)</Label>
                        <input type="number" min="0" max="100" value={form.discountPercent} onChange={(e) => set("discountPercent", e.target.value)}
                          className={inp} placeholder="e.g. 20" />
                      </div>
                      <div>
                        <Label>Discount (₹)</Label>
                        <input type="number" min="0" value={form.discountAmount} onChange={(e) => set("discountAmount", e.target.value)}
                          className={inp} placeholder="e.g. 100" />
                      </div>
                      <div>
                        <Label>Coupon Code</Label>
                        <input value={form.couponCode} onChange={(e) => set("couponCode", e.target.value.toUpperCase())}
                          className={`${inp} uppercase tracking-widest`} placeholder="SAVE20" />
                      </div>
                    </div>
                  </>
                )}

                {/* Link + Colors */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-1">
                    <Label>Redirect / Deep Link (Optional)</Label>
                    <input value={form.link} onChange={(e) => set("link", e.target.value)}
                      className={inp} placeholder="https://... or offer URL" />
                  </div>
                  <div>
                    <Label>Background Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input type="color" value={form.bgColor} onChange={(e) => set("bgColor", e.target.value)}
                        className="w-10 h-9 rounded border border-slate-200 cursor-pointer p-0.5" />
                      <input value={form.bgColor} onChange={(e) => set("bgColor", e.target.value)}
                        className={`${inp} flex-1`} placeholder="#ffffff" />
                    </div>
                  </div>
                  <div>
                    <Label>Text Color</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input type="color" value={form.textColor} onChange={(e) => set("textColor", e.target.value)}
                        className="w-10 h-9 rounded border border-slate-200 cursor-pointer p-0.5" />
                      <input value={form.textColor} onChange={(e) => set("textColor", e.target.value)}
                        className={`${inp} flex-1`} placeholder="#000000" />
                    </div>
                  </div>
                </div>

                {/* Validity */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Valid From (Optional)</Label>
                    <input type="date" value={form.validFrom} onChange={(e) => set("validFrom", e.target.value)} className={inp} />
                  </div>
                  <div>
                    <Label>Valid To (Optional)</Label>
                    <input type="date" value={form.validTo} onChange={(e) => set("validTo", e.target.value)} className={inp} />
                  </div>
                </div>

                {/* Status Toggle */}
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl w-fit">
                  <span className="text-xs font-semibold text-slate-600">Active</span>
                  <button type="button" onClick={() => set("status", !form.status)}
                    className={`transition-all cursor-pointer ${form.status ? "text-green-500" : "text-slate-300"}`}>
                    {form.status ? <MdToggleOn size={32} /> : <MdToggleOff size={32} />}
                  </button>
                </div>

                {/* Preview Box */}
                {form.title && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-4 py-2 bg-slate-50 border-b">
                      {form.offerType === "app_banner" ? "Patient App Footer Banner Preview" : "Live Preview"}
                    </p>
                    <div className="p-4" style={{ backgroundColor: form.bgColor }}>
                      {previewUrl ? (
                        <div className="rounded-lg overflow-hidden border border-white/20 shadow-md">
                          <img src={previewUrl} className="w-full h-32 sm:h-44 object-cover" alt="Banner Preview" />
                        </div>
                      ) : (
                        <div className="p-4 text-center" style={{ color: form.textColor }}>
                          <p className="font-bold text-sm">{form.title}</p>
                          {form.subtitle && <p className="text-xs mt-1 opacity-90">{form.subtitle}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Submit */}
                <div className="pt-2 border-t sticky bottom-0 bg-white pb-1">
                  <button type="submit" disabled={submitting}
                    className={`w-full py-3 text-white rounded-xl font-bold text-sm transition-all shadow-sm disabled:opacity-50 cursor-pointer ${
                      form.offerType === "app_banner" ? "bg-rose-600 hover:bg-rose-700" : "bg-blue-600 hover:bg-blue-700"
                    }`}>
                    {submitting ? "Saving…" : editId ? "Update Banner" : "Create App Banner"}
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

export default Offers;
