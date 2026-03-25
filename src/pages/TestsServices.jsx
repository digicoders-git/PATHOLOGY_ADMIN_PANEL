import React, { useState, useEffect, useCallback } from "react";
import RichEditor from "../components/ui/RichEditor";
import {
  getTestServices,
  createTestService,
  updateTestService,
  deleteTestService,
  updateTestServiceStatus,
  getCategories,
} from "../apis/testAndServices";
import { toast } from "react-toastify";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdSearch,
  MdToggleOn,
  MdToggleOff,
  MdClose,
  MdRefresh,
  MdImage,
  MdOutlineScience,
  MdStar,
  MdStarBorder,
} from "react-icons/md";
import Loader from "./ui/Loader";
import Swal from "sweetalert2";


// ─── Empty form ───────────────────────────────────────────────────────────────
const EMPTY = {
  title: "",
  status: true,
  is_featured: false,
  category_id: "",
  test_code: "",
  mrp: "",
  discountPercent: "",
  price: "",
  sample_type: "",
  report_time: "",
  short_description: "",
  overview: "",            // rich text (HTML string)
  purpose: [],             // string[]
  test_components: [],     // { name, detail }[]
  test_method: "",
  fasting_required: false,
  fasting_hours: "",
  precautions_before: [],  // string[]
  precautions_during: "",
  precautions_after: [],   // string[]
  image: null,
};

const ARRAY_JSON_FIELDS = [
  "purpose", "test_components",
  "precautions_before", "precautions_after",
];

// ── Tiny UI helpers ───────────────────────────────────────────────────────────
const Label = ({ children, accent }) => (
  <label className={`text-[10px] font-bold uppercase tracking-widest ${accent || "text-slate-400"}`}>
    {children}
  </label>
);

const inp = "w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all";
const ta  = `${inp} resize-none`;

const SectionTitle = ({ n, children }) => (
  <div className="flex items-center gap-3 mb-4">
    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">{n}</span>
    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-widest">{children}</h4>
    <div className="flex-1 h-px bg-slate-100" />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
const TestsServices = () => {
  const [data, setData]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 });
  const [categories, setCategories] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage]               = useState(1);

  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getTestServices({ page, limit: 10, search, status: statusFilter });
      if (res.success) { setData(res.data); setPagination(res.pagination); }
    } catch { toast.error("Failed to fetch tests"); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    getCategories().then(r => { if (r.success) setCategories(r.data); }).catch(() => {});
  }, []);

  // ── Form helpers ───────────────────────────────────────────────────────────
  const set   = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const addRow    = (k, empty) => setForm(p => ({ ...p, [k]: [...p[k], empty] }));
  const removeRow = (k, i)     => setForm(p => ({ ...p, [k]: p[k].filter((_, j) => j !== i) }));
  const setRow    = (k, i, v)  => setForm(p => { const a = [...p[k]]; a[i] = v; return { ...p, [k]: a }; });
  const setRowField = (k, i, f, v) => setForm(p => {
    const a = [...p[k]]; a[i] = { ...a[i], [f]: v }; return { ...p, [k]: a };
  });

  const handlePriceCalc = (field, value) => {
    setForm(prev => {
      const newForm = { ...prev, [field]: value };
      const mrp = parseFloat(field === "mrp" ? value : newForm.mrp || 0);
      const percent = parseFloat(field === "discountPercent" ? value : newForm.discountPercent || 0);

      if (mrp > 0 && percent >= 0) {
        const calculatedPrice = mrp - (mrp * percent / 100);
        newForm.price = calculatedPrice > 0 ? Math.round(calculatedPrice).toString() : "0";
      } else if (field === "mrp") {
          newForm.price = value; // Default price to MRP if no percent
      }
      return newForm;
    });
  };

  const resetForm = () => { setEditId(null); setForm(EMPTY); setPreviewUrl(null); setIsModalOpen(false); };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) { set("image", file); setPreviewUrl(URL.createObjectURL(file)); }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === "image") { if (v instanceof File) fd.append("testImage", v); }
        else if (ARRAY_JSON_FIELDS.includes(k)) fd.append(k, JSON.stringify(v));
        else fd.append(k, v ?? "");
      });
      const res = editId ? await updateTestService(editId, fd) : await createTestService(fd);
      if (res.success) { toast.success(res.message); resetForm(); fetchData(); }
    } catch (err) { toast.error(err.message || "Failed"); }
    finally { setSubmitting(false); }
  };

  // ── Status / Delete / Edit ─────────────────────────────────────────────────
  const toggle = async (id, cur) => {
    try {
      setTogglingId(id);
      const res = await updateTestServiceStatus(id, !cur);
      if (res.success) { toast.success(res.message); setData(p => p.map(x => x._id === id ? { ...x, status: !cur } : x)); }
    } catch { toast.error("Failed"); } finally { setTogglingId(null); }
  };

  const handleDelete = async (id) => {
    const r = await Swal.fire({ title: "Delete this test?", icon: "warning", showCancelButton: true, confirmButtonColor: "#EF4444", confirmButtonText: "Delete" });
    if (r.isConfirmed) {
      try { setDeletingId(id); const res = await deleteTestService(id); if (res.success) { toast.success("Deleted"); fetchData(); } }
      catch { toast.error("Delete failed"); } finally { setDeletingId(null); }
    }
  };

  const handleEdit = (item) => {
    setEditId(item._id);
    setForm({
      title: item.title || "",
      status: item.status,
      is_featured: item.is_featured || false,
      category_id: item.category_id?._id || "",
      test_code: item.test_code || "",
      mrp: item.mrp || "",
      discountPercent: item.mrp && item.price ? Math.round(((item.mrp - item.price) / item.mrp) * 100) : "",
      price: item.price || "",
      sample_type: item.sample_type || "",
      report_time: item.report_time || "",
      short_description: item.short_description || "",
      overview: item.overview || "",
      purpose: item.purpose || [],
      test_components: item.test_components || [],
      test_method: item.test_method || "",
      fasting_required: item.fasting_required || false,
      fasting_hours: item.fasting_hours || "",
      precautions_before: item.precautions_before || [],
      precautions_during: item.precautions_during || "",
      precautions_after: item.precautions_after || [],
      image: null,
    });
    setPreviewUrl(item.image?.cloudinary || (item.image?.local ? `${import.meta.env.VITE_API_BASE_URL}/${item.image.local}` : null));
    setIsModalOpen(true);
  };

  // ── Table badge helper ─────────────────────────────────────────────────────
  const badge = (txt, color) => (
    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${color}`}>{txt}</span>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 min-h-screen bg-slate-50">
      <div className="max-w-[1400px] mx-auto space-y-6">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex justify-between items-end border-b pb-5">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Tests & Services</h1>
            <p className="text-xs text-slate-400 mt-0.5">Manage your diagnostic catalog</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchData} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 transition-all">
              <MdRefresh size={18} />
            </button>
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all">
              <MdAdd size={16} /> Add New Test
            </button>
          </div>
        </div>

        {/* ── Filters ────────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input placeholder="Search test name or code..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-blue-400 transition-all" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold outline-none">
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        {/* ── Table ──────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-24 flex justify-center"><Loader /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <th className="px-5 py-3.5">Test</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Price</th>
                    <th className="px-5 py-3.5">TAT</th>
                    <th className="px-5 py-3.5 text-center">Featured</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.length === 0 ? (
                    <tr><td colSpan={7} className="py-20 text-center text-xs text-slate-400">No tests found.</td></tr>
                  ) : data.map(item => (
                    <tr key={item._id} className="hover:bg-slate-50/60 transition-colors group">
                      {/* Test Info */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                            {(item.image?.cloudinary || item.image?.local)
                              ? <img src={item.image.cloudinary || `${import.meta.env.VITE_API_BASE_URL}/${item.image.local}`} className="w-full h-full object-cover" />
                              : <MdOutlineScience className="text-slate-300" size={18} />}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800 line-clamp-1 max-w-[180px]">{item.title}</p>
                            {item.test_code && <p className="text-[10px] text-blue-500 font-semibold">{item.test_code}</p>}
                          </div>
                        </div>
                      </td>
                      {/* Category */}
                      <td className="px-5 py-3.5">
                        <span className="text-[10px] font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded">
                          {item.category_id?.name || "—"}
                        </span>
                      </td>
                      {/* Price */}
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-bold text-blue-600">₹{item.price}</p>
                        {item.mrp > item.price && <p className="text-[10px] text-slate-400 line-through">₹{item.mrp}</p>}
                      </td>
                      {/* TAT */}
                      <td className="px-5 py-3.5">
                        <span className="text-xs text-slate-600 font-semibold">{item.report_time || "—"}</span>
                      </td>
                      {/* Featured */}
                      <td className="px-5 py-3.5 text-center">
                        {item.is_featured
                          ? <MdStar className="text-amber-400 mx-auto" size={18} />
                          : <MdStarBorder className="text-slate-300 mx-auto" size={18} />}
                      </td>
                      {/* Status */}
                      <td className="px-5 py-3.5 text-center">
                        <button onClick={() => toggle(item._id, item.status)} disabled={togglingId === item._id}
                          className={`p-0.5 rounded-full transition-all ${item.status ? "text-green-500" : "text-slate-300"}`}>
                          {item.status ? <MdToggleOn size={28} /> : <MdToggleOff size={28} />}
                        </button>
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
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
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-all">Prev</button>
                <button disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-all">Next</button>
              </div>
            </div>
          )}
        </div>

        {/* ═══════════════════ MODAL ════════════════════ */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={resetForm} />
            <div className="relative bg-white w-full max-w-4xl max-h-[93vh] overflow-y-auto rounded-2xl shadow-2xl flex flex-col">

              {/* Modal Header */}
              <div className="sticky top-0 z-20 px-7 py-4 bg-white border-b flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{editId ? "Edit Test" : "Add New Test"}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Fill in the sections below</p>
                </div>
                <button onClick={resetForm} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-all">
                  <MdClose size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-7 py-6 space-y-8 overflow-y-auto">

                {/* ── 1. Basic Info ──────────────────────────────────────── */}
                <div>
                  <SectionTitle n="1">Basic Information</SectionTitle>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                    {/* Image */}
                    <div>
                      <Label>Test Image</Label>
                      <label className="block mt-1.5 cursor-pointer">
                        <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
                        <div className="h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center overflow-hidden hover:border-blue-400 transition-all">
                          {previewUrl
                            ? <img src={previewUrl} className="w-full h-full object-cover" />
                            : <><MdImage size={24} className="text-slate-300 mb-1" /><span className="text-[10px] text-slate-400 font-semibold">Click to Upload</span></>}
                        </div>
                      </label>
                    </div>

                    <div className="space-y-3">
                      {/* Test Name */}
                      <div>
                        <Label>Test Name *</Label>
                        <input required value={form.title} onChange={e => set("title", e.target.value)}
                          className={`${inp} mt-1`} placeholder="E.g. Liver Function Test (LFT)" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {/* Category */}
                        <div>
                          <Label>Category *</Label>
                          <select required value={form.category_id} onChange={e => set("category_id", e.target.value)} className={`${inp} mt-1`}>
                            <option value="">Select…</option>
                            {categories.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                          </select>
                        </div>
                        {/* Test Code */}
                        <div>
                          <Label>Test Code</Label>
                          <input value={form.test_code} onChange={e => set("test_code", e.target.value)}
                            className={`${inp} mt-1`} placeholder="LFT-01" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                    <div>
                      <Label>MRP (₹)</Label>
                      <input type="number" value={form.mrp} onChange={e => handlePriceCalc("mrp", e.target.value)}
                        className={`${inp} mt-1`} placeholder="1000" />
                    </div>
                    <div>
                      <Label>Discount (%)</Label>
                      <input type="number" value={form.discountPercent} onChange={e => handlePriceCalc("discountPercent", e.target.value)}
                        className={`${inp} mt-1`} placeholder="%" />
                    </div>
                    <div>
                      <Label accent="text-blue-500">Selling Price (₹)</Label>
                      <input type="number" value={form.price} onChange={e => set("price", e.target.value)}
                        className={`${inp} mt-1 text-blue-600 font-bold bg-blue-50/50`} placeholder="900" />
                    </div>
                    <div>
                      <Label>Sample Type</Label>
                      <input value={form.sample_type} onChange={e => set("sample_type", e.target.value)}
                        className={`${inp} mt-1`} placeholder="EDTA Blood" />
                    </div>
                    <div>
                      <Label>Report Time</Label>
                      <input value={form.report_time} onChange={e => set("report_time", e.target.value)}
                        className={`${inp} mt-1`} placeholder="24 Hours" />
                    </div>
                  </div>

                  {/* Toggles row */}
                  <div className="flex flex-wrap gap-4 mt-4">
                    {/* Active toggle */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl">
                      <span className="text-xs font-semibold text-slate-600">Active</span>
                      <button type="button" onClick={() => set("status", !form.status)}
                        className={`transition-all ${form.status ? "text-green-500" : "text-slate-300"}`}>
                        {form.status ? <MdToggleOn size={32} /> : <MdToggleOff size={32} />}
                      </button>
                    </div>
                    {/* Featured toggle */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl">
                      <span className="text-xs font-semibold text-slate-600">Featured</span>
                      <button type="button" onClick={() => set("is_featured", !form.is_featured)}
                        className={`transition-all ${form.is_featured ? "text-amber-400" : "text-slate-300"}`}>
                        {form.is_featured ? <MdStar size={24} /> : <MdStarBorder size={24} />}
                      </button>
                    </div>
                    {/* Fasting toggle */}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl">
                      <span className="text-xs font-semibold text-slate-600">Fasting Required</span>
                      <button type="button" onClick={() => set("fasting_required", !form.fasting_required)}
                        className={`transition-all ${form.fasting_required ? "text-blue-600" : "text-slate-300"}`}>
                        {form.fasting_required ? <MdToggleOn size={32} /> : <MdToggleOff size={32} />}
                      </button>
                      {form.fasting_required && (
                        <div className="flex items-center gap-1.5 ml-1">
                          <span className="text-[10px] text-slate-500 font-semibold">Hours:</span>
                          <input type="number" value={form.fasting_hours} onChange={e => set("fasting_hours", e.target.value)}
                            className="w-14 px-2 py-1 bg-white border border-blue-200 rounded text-xs font-bold text-blue-600 outline-none text-center" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── 2. Short Description ───────────────────────────────── */}
                <div>
                  <SectionTitle n="2">Short Description</SectionTitle>
                  <textarea rows={3} value={form.short_description} onChange={e => set("short_description", e.target.value)}
                    className={ta} placeholder="A brief one-liner about this test shown in listings…" />
                </div>

                {/* ── 3. Overview (Rich Text) ─────────────────────────────── */}
                <div>
                  <SectionTitle n="3">Overview (Detailed Description)</SectionTitle>
                  <RichEditor
                    value={form.overview}
                    onChange={val => set("overview", val)}
                    placeholder="Write a detailed overview of the test…"
                    minHeight={150}
                  />
                </div>

                {/* ── 4. Purpose ────────────────────────────────────────────── */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <SectionTitle n="4">Purpose</SectionTitle>
                    <button type="button" onClick={() => addRow("purpose", "")}
                      className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase -mt-3">
                      <MdAdd size={13} /> Add Point
                    </button>
                  </div>
                  {form.purpose.length === 0 && (
                    <p className="text-[11px] text-slate-300 italic py-3 text-center">No purpose points added.</p>
                  )}
                  <div className="space-y-2">
                    {form.purpose.map((pt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-slate-400 font-bold text-xs w-5 shrink-0">{i + 1}.</span>
                        <input value={pt} onChange={e => setRow("purpose", i, e.target.value)}
                          className={`${inp} flex-1`} placeholder="E.g. Diagnoses liver diseases…" />
                        <button type="button" onClick={() => removeRow("purpose", i)} className="text-slate-300 hover:text-red-500 transition-colors shrink-0">
                          <MdDelete size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── 5. Components ─────────────────────────────────────────── */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <SectionTitle n="5">Test Components</SectionTitle>
                    <button type="button" onClick={() => addRow("test_components", { name: "", detail: "" })}
                      className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase -mt-3">
                      <MdAdd size={13} /> Add Row
                    </button>
                  </div>
                  {form.test_components.length === 0 && (
                    <p className="text-[11px] text-slate-300 italic py-3 text-center">No components added.</p>
                  )}
                  <div className="space-y-2">
                    {form.test_components.map((c, i) => (
                      <div key={i} className="grid grid-cols-5 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <input value={c.name} onChange={e => setRowField("test_components", i, "name", e.target.value)}
                          className={`${inp} col-span-2 bg-white`} placeholder="Component (e.g. ALT)" />
                        <input value={c.detail} onChange={e => setRowField("test_components", i, "detail", e.target.value)}
                          className={`${inp} col-span-2 bg-white`} placeholder="What it measures…" />
                        <button type="button" onClick={() => removeRow("test_components", i)}
                          className="text-slate-300 hover:text-red-500 transition-colors justify-self-center">
                          <MdDelete size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── 6. Precautions ──────────────────────────────────────── */}
                <div>
                  <SectionTitle n="6">Precautions</SectionTitle>
                  <div className="space-y-4">

                    {/* Before */}
                    <div className="border border-amber-100 bg-amber-50/30 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Before the Test</span>
                        <button type="button" onClick={() => addRow("precautions_before", "")}
                          className="flex items-center gap-1 text-[10px] font-bold text-amber-600 hover:text-amber-700">
                          <MdAdd size={13} /> Add
                        </button>
                      </div>
                      {form.precautions_before.length === 0 && <p className="text-[11px] text-slate-300 italic">None added.</p>}
                      <div className="space-y-2">
                        {form.precautions_before.map((pt, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-amber-300 text-xs shrink-0">•</span>
                            <input value={pt} onChange={e => setRow("precautions_before", i, e.target.value)}
                              className={`${inp} flex-1 bg-white`} placeholder="E.g. Fast for 8-12 hours…" />
                            <button type="button" onClick={() => removeRow("precautions_before", i)} className="text-slate-300 hover:text-red-500"><MdDelete size={14} /></button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* During */}
                    <div className="border border-blue-100 bg-blue-50/30 rounded-xl p-4">
                      <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block mb-3">During the Test</span>
                      <textarea rows={2} value={form.precautions_during} onChange={e => set("precautions_during", e.target.value)}
                        className={`${ta} bg-white`} placeholder="E.g. A small blood sample is taken from a vein…" />
                    </div>

                    {/* After */}
                    <div className="border border-green-100 bg-green-50/30 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">After the Test</span>
                        <button type="button" onClick={() => addRow("precautions_after", "")}
                          className="flex items-center gap-1 text-[10px] font-bold text-green-600 hover:text-green-700">
                          <MdAdd size={13} /> Add
                        </button>
                      </div>
                      {form.precautions_after.length === 0 && <p className="text-[11px] text-slate-300 italic">None added.</p>}
                      <div className="space-y-2">
                        {form.precautions_after.map((pt, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-green-300 text-xs shrink-0">•</span>
                            <input value={pt} onChange={e => setRow("precautions_after", i, e.target.value)}
                              className={`${inp} flex-1 bg-white`} placeholder="E.g. Resume normal activities…" />
                            <button type="button" onClick={() => removeRow("precautions_after", i)} className="text-slate-300 hover:text-red-500"><MdDelete size={14} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-2 border-t sticky bottom-0 bg-white pb-1">
                  <button type="submit" disabled={submitting}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm transition-all shadow-sm disabled:opacity-50">
                    {submitting ? "Saving…" : editId ? "Update Test" : "Create Test"}
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
