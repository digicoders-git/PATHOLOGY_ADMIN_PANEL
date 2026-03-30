import React, { useState, useEffect, useCallback, useRef } from "react";
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
  offerType: "slider",
  link: "",
  bgColor: "#ffffff",
  textColor: "#000000",
  validFrom: "",
  validTo: "",
  status: true,
  sortOrder: "",
  image: null,
};

const inp = "w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all";
const Label = ({ children }) => (
  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-1">
    {children}
  </label>
);

const OFFER_TYPES = ["slider", "banner", "popup"];

const Offers = () => {
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
      const res = await getAllOffers({ page, limit: 10, search, status: statusFilter, offerType: typeFilter });
      if (res.success) { setData(res.data); setPagination(res.pagination); }
    } catch { toast.error("Failed to fetch offers"); }
    finally { setLoading(false); }
  }, [page, search, statusFilter, typeFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Form helpers ───────────────────────────────────────────────────────────
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const resetForm = () => { setEditId(null); setForm(EMPTY); setPreviewUrl(null); setIsModalOpen(false); };

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
      offerType: item.offerType || "slider",
      link: item.link || "",
      bgColor: item.bgColor || "#ffffff",
      textColor: item.textColor || "#000000",
      validFrom: item.validFrom ? item.validFrom.slice(0, 10) : "",
      validTo: item.validTo ? item.validTo.slice(0, 10) : "",
      status: item.status,
      sortOrder: item.sortOrder || "",
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
    const r = await Swal.fire({ title: "Delete this offer?", icon: "warning", showCancelButton: true, confirmButtonColor: "#EF4444", confirmButtonText: "Delete" });
    if (r.isConfirmed) {
      try {
        setDeletingId(id);
        const res = await deleteOffer(id);
        if (res.success) { toast.success("Deleted"); fetchData(); }
      } catch { toast.error("Delete failed"); } finally { setDeletingId(null); }
    }
  };

  const typeBadge = (type) => {
    const map = { slider: "bg-blue-100 text-blue-700", banner: "bg-purple-100 text-purple-700", popup: "bg-amber-100 text-amber-700" };
    return <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${map[type] || "bg-slate-100 text-slate-500"}`}>{type}</span>;
  };

  return (
    <div className="p-6 min-h-screen bg-slate-50">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* Header */}
        <div className="flex justify-between items-end border-b pb-5">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Offers & Banners</h1>
            <p className="text-xs text-slate-400 mt-0.5">Manage promotional offers shown on the website</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchData} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 transition-all">
              <MdRefresh size={18} />
            </button>
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all">
              <MdAdd size={16} /> Add Offer
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input placeholder="Search offers..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-blue-400 transition-all" />
          </div>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none">
            <option value="">All Types</option>
            {OFFER_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none">
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-24 flex justify-center"><Loader /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <th className="px-5 py-3.5">Offer</th>
                    <th className="px-5 py-3.5">Type</th>
                    <th className="px-5 py-3.5">Discount</th>
                    <th className="px-5 py-3.5">Coupon</th>
                    <th className="px-5 py-3.5">Validity</th>
                    <th className="px-5 py-3.5 text-center">Order</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.length === 0 ? (
                    <tr><td colSpan={8} className="py-20 text-center text-xs text-slate-400">No offers found.</td></tr>
                  ) : data.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Offer Info */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-slate-100"
                            style={{ backgroundColor: item.bgColor || "#f8fafc" }}>
                            {(item.image?.cloudinary || item.image?.local)
                              ? <img src={item.image.cloudinary || `${import.meta.env.VITE_API_BASE_URL}/${item.image.local}`} className="w-full h-full object-cover" />
                              : <MdLocalOffer className="text-slate-300" size={18} />}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 line-clamp-1 max-w-[180px]">{item.title}</p>
                            {item.subtitle && <p className="text-[10px] text-slate-400 line-clamp-1">{item.subtitle}</p>}
                          </div>
                        </div>
                      </td>
                      {/* Type */}
                      <td className="px-5 py-3.5">{typeBadge(item.offerType)}</td>
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
                      {/* Sort Order */}
                      <td className="px-5 py-3.5 text-center">
                        <span className="text-xs font-bold text-slate-500">{item.sortOrder ?? 0}</span>
                      </td>
                      {/* Status */}
                      <td className="px-5 py-3.5 text-center">
                        <button onClick={() => handleToggle(item._id)} disabled={togglingId === item._id}
                          className={`p-0.5 rounded-full transition-all ${item.status ? "text-green-500" : "text-slate-300"}`}>
                          {item.status ? <MdToggleOn size={28} /> : <MdToggleOff size={28} />}
                        </button>
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => handleEdit(item)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all">
                            <MdEdit size={15} />
                          </button>
                          <button onClick={() => handleDelete(item._id)} disabled={deletingId === item._id}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                            <MdDelete size={15} />
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
                  <h3 className="text-sm font-bold text-slate-800">{editId ? "Edit Offer" : "Add New Offer"}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Fill in the offer details below</p>
                </div>
                <button onClick={resetForm} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-all">
                  <MdClose size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-7 py-6 space-y-6">

                {/* Image + Basic */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Image Upload */}
                  <div>
                    <Label>Offer Image / Banner</Label>
                    <label className="block mt-1 cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
                      <div className="h-36 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center overflow-hidden hover:border-blue-400 transition-all"
                        style={{ backgroundColor: form.bgColor }}>
                        {previewUrl
                          ? <img src={previewUrl} className="w-full h-full object-cover" />
                          : <><MdImage size={28} className="text-slate-300 mb-1" /><span className="text-[10px] text-slate-400 font-semibold">Click to Upload</span></>}
                      </div>
                    </label>
                  </div>

                  {/* Title + Subtitle + Type */}
                  <div className="space-y-3">
                    <div>
                      <Label>Title *</Label>
                      <input required value={form.title} onChange={(e) => set("title", e.target.value)}
                        className={inp} placeholder="e.g. Diwali Special Offer" />
                    </div>
                    <div>
                      <Label>Subtitle</Label>
                      <input value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)}
                        className={inp} placeholder="e.g. Up to 50% off on all tests" />
                    </div>
                    <div>
                      <Label>Offer Type</Label>
                      <select value={form.offerType} onChange={(e) => set("offerType", e.target.value)} className={inp}>
                        {OFFER_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <Label>Description</Label>
                  <textarea rows={2} value={form.description} onChange={(e) => set("description", e.target.value)}
                    className={`${inp} resize-none`} placeholder="Brief description of the offer..." />
                </div>

                {/* Discount + Coupon */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                  <div>
                    <Label>Sort Order</Label>
                    <input type="number" min="0" value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)}
                      className={inp} placeholder="0" />
                  </div>
                </div>

                {/* Link + Colors */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-1">
                    <Label>Redirect Link</Label>
                    <input value={form.link} onChange={(e) => set("link", e.target.value)}
                      className={inp} placeholder="https://..." />
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
                    <Label>Valid From</Label>
                    <input type="date" value={form.validFrom} onChange={(e) => set("validFrom", e.target.value)} className={inp} />
                  </div>
                  <div>
                    <Label>Valid To</Label>
                    <input type="date" value={form.validTo} onChange={(e) => set("validTo", e.target.value)} className={inp} />
                  </div>
                </div>

                {/* Status Toggle */}
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl w-fit">
                  <span className="text-xs font-semibold text-slate-600">Active</span>
                  <button type="button" onClick={() => set("status", !form.status)}
                    className={`transition-all ${form.status ? "text-green-500" : "text-slate-300"}`}>
                    {form.status ? <MdToggleOn size={32} /> : <MdToggleOff size={32} />}
                  </button>
                </div>

                {/* Preview Card */}
                {form.title && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-4 py-2 bg-slate-50 border-b">Live Preview</p>
                    <div className="p-5 flex items-center gap-4" style={{ backgroundColor: form.bgColor }}>
                      {previewUrl && <img src={previewUrl} className="w-16 h-16 object-cover rounded-lg shrink-0" />}
                      <div>
                        <p className="font-bold text-sm" style={{ color: form.textColor }}>{form.title}</p>
                        {form.subtitle && <p className="text-xs mt-0.5 opacity-80" style={{ color: form.textColor }}>{form.subtitle}</p>}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {form.discountPercent > 0 && (
                            <span className="text-[10px] font-black px-2 py-0.5 bg-white/30 rounded-full" style={{ color: form.textColor }}>{form.discountPercent}% OFF</span>
                          )}
                          {form.couponCode && (
                            <span className="text-[10px] font-black px-2 py-0.5 bg-white/30 rounded-full tracking-widest" style={{ color: form.textColor }}>Code: {form.couponCode}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit */}
                <div className="pt-2 border-t sticky bottom-0 bg-white pb-1">
                  <button type="submit" disabled={submitting}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm disabled:opacity-50">
                    {submitting ? "Saving…" : editId ? "Update Offer" : "Create Offer"}
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
