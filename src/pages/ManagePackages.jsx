import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { getAllPackages, createPackage, updatePackage, deletePackage, togglePackageStatus } from "../apis/packages";
import { getTestServices } from "../apis/testAndServices";
import { toast } from "react-toastify";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdSearch,
  MdClose,
  MdRefresh,
  MdImage,
  MdCheckCircle,
  MdCancel,
  MdChevronLeft,
  MdChevronRight,
} from "react-icons/md";
import Swal from "sweetalert2";

const ManagePackages = () => {
  const { colors } = useTheme();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Tests for dropdown
  const [tests, setTests] = useState([]);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [form, setForm] = useState({
    packageName: "",
    description: "",
    category: "",
    actualPrice: "",
    discountPrice: "",
    tests: [],
    image: null,
  });

  useEffect(() => {
    getTestServices({ limit: 500 }).then((r) => { if (r.success) setTests(r.data || []); }).catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllPackages({ search, status: statusFilter || undefined });
      if (res.success) setData(res.data || []);
    } catch { toast.error("Failed to fetch packages"); }
    finally { setLoading(false); }
  }, [search, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchTerm), 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const resetForm = () => {
    setForm({ packageName: "", description: "", category: "", actualPrice: "", discountPrice: "", tests: [], image: null });
    setEditId(null);
    setPreviewUrl(null);
    setModalOpen(false);
  };

  const openAdd = () => { resetForm(); setModalOpen(true); };

  const openEdit = (pkg) => {
    setEditId(pkg._id);
    setForm({
      packageName: pkg.packageName || "",
      description: pkg.description || "",
      category: pkg.category || "",
      actualPrice: pkg.actualPrice || "",
      discountPrice: pkg.discountPrice || "",
      tests: pkg.tests?.map((t) => (typeof t === "object" ? t._id : t)) || [],
      image: null,
    });
    setPreviewUrl(pkg.image || null);
    setModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) { setForm((p) => ({ ...p, image: file })); setPreviewUrl(URL.createObjectURL(file)); }
  };

  const handleTestToggle = (id) => {
    setForm((p) => ({
      ...p,
      tests: p.tests.includes(id) ? p.tests.filter((t) => t !== id) : [...p.tests, id],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.packageName.trim()) return toast.error("Package name is required");
    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append("packageName", form.packageName);
      fd.append("description", form.description);
      fd.append("category", form.category);
      fd.append("actualPrice", form.actualPrice);
      fd.append("discountPrice", form.discountPrice);
      fd.append("tests", JSON.stringify(form.tests));
      if (form.image instanceof File) fd.append("image", form.image);

      const res = editId ? await updatePackage(editId, fd) : await createPackage(fd);
      if (res.success) {
        toast.success(res.message || "Package saved successfully");
        resetForm();
        fetchData();
      }
    } catch (err) { toast.error(err.response?.data?.message || "Failed to save package"); }
    finally { setSubmitting(false); }
  };

  const handleToggleStatus = async (id) => {
    try {
      setTogglingId(id);
      const res = await togglePackageStatus(id);
      if (res.success) {
        toast.success(res.message);
        setData((prev) => prev.map((p) => p._id === id ? { ...p, status: !p.status } : p));
      }
    } catch { toast.error("Failed to update status"); }
    finally { setTogglingId(null); }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: "Delete Package?",
      text: "This package will be permanently removed.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#111",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setDeletingId(id);
          const res = await deletePackage(id);
          if (res.success) { toast.success("Package deleted"); fetchData(); }
        } catch { toast.error("Delete failed"); }
        finally { setDeletingId(null); }
      }
    });
  };

  const discount = (actual, disc) => {
    if (!actual || !disc) return null;
    return Math.round(((actual - disc) / actual) * 100);
  };

  const hasFilters = searchTerm || statusFilter;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: colors.text }}>
            Manage Packages
          </h1>
          <p className="text-sm mt-1 opacity-50">
            Test bundles & health packages &nbsp;·&nbsp; {data.length} total
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-6 py-2.5 bg-black text-white text-[11px] font-black uppercase tracking-widest rounded transition-all hover:bg-slate-800"
        >
          <MdAdd size={18} /> Add Package
        </button>
      </div>

      {/* Filters */}
      <div
        className="p-4 rounded-sm border shadow-sm mb-6"
        style={{ backgroundColor: colors.background, borderColor: colors.accent + "20" }}
      >
        <div className="flex flex-col lg:flex-row gap-3 items-end">
          <div className="relative flex-1 w-full">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={18} />
            <input
              type="text"
              placeholder="Search by package name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border rounded-sm text-sm outline-none focus:ring-1 transition-all"
              style={{ backgroundColor: colors.background, borderColor: colors.accent + "30", color: colors.text }}
            />
          </div>

          <div className="w-full lg:w-44">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border rounded-sm px-3 py-2.5 text-sm outline-none focus:ring-1 transition-all"
              style={{ backgroundColor: colors.background, borderColor: colors.accent + "30", color: colors.text }}
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          {hasFilters && (
            <button
              onClick={() => { setSearchTerm(""); setSearch(""); setStatusFilter(""); }}
              className="flex items-center gap-1 px-4 py-2.5 border rounded-sm text-[11px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all whitespace-nowrap"
              style={{ borderColor: colors.accent + "30", color: colors.text }}
            >
              <MdClose size={14} /> Clear
            </button>
          )}

          <button
            onClick={fetchData}
            title="Refresh"
            className="p-2.5 border rounded-sm hover:bg-black/5 transition-all"
            style={{ borderColor: colors.accent + "30", color: colors.text }}
          >
            <MdRefresh size={18} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-sm border shadow-sm overflow-hidden"
        style={{ backgroundColor: colors.background, borderColor: colors.accent + "20" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ backgroundColor: colors.accent + "08" }}>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50">#</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50">Package</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50">Category</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50 text-center">Tests</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50 text-center">Price</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50 text-center">Status</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {loading ? (
                <tr><td colSpan="7" className="py-20 text-center text-sm opacity-40">Loading packages...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="7" className="py-20 text-center text-sm opacity-40">
                  {hasFilters ? "No packages match your filters" : "No packages found"}
                </td></tr>
              ) : (
                data.map((pkg, idx) => {
                  const pct = discount(pkg.actualPrice, pkg.discountPrice);
                  return (
                    <tr key={pkg._id} className="hover:bg-black/[0.03] transition-colors">
                      <td className="px-5 py-3.5 text-xs font-bold opacity-30">{idx + 1}</td>

                      {/* Package Info */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-sm overflow-hidden shrink-0 flex items-center justify-center border"
                            style={{ borderColor: colors.accent + "20", backgroundColor: colors.accent + "06" }}
                          >
                            {pkg.image ? (
                              <img src={pkg.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <MdImage size={16} className="opacity-20" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-bold" style={{ color: colors.text }}>{pkg.packageName}</p>
                            {pkg.description && (
                              <p className="text-[10px] opacity-40 line-clamp-1 max-w-[180px]">{pkg.description}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-bold opacity-60">{pkg.category || "—"}</span>
                      </td>

                      {/* Tests count */}
                      <td className="px-5 py-3.5 text-center">
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-sm bg-blue-100 text-blue-700">
                          {pkg.tests?.length || 0} Tests
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex flex-col items-center">
                          {pkg.discountPrice ? (
                            <>
                              <span className="text-sm font-black text-emerald-600">₹{pkg.discountPrice}</span>
                              <span className="text-[10px] opacity-30 line-through">₹{pkg.actualPrice}</span>
                              {pct && <span className="text-[9px] font-black text-emerald-600">{pct}% OFF</span>}
                            </>
                          ) : (
                            <span className="text-sm font-bold">₹{pkg.actualPrice || "—"}</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => handleToggleStatus(pkg._id)}
                          disabled={togglingId === pkg._id}
                          className="transition-all disabled:opacity-40"
                        >
                          {togglingId === pkg._id ? (
                            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mx-auto" />
                          ) : pkg.status ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-sm bg-emerald-100 text-emerald-700">
                              <MdCheckCircle size={11} /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-sm bg-red-100 text-red-700">
                              <MdCancel size={11} /> Inactive
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEdit(pkg)}
                            className="p-2 rounded-sm hover:bg-black/5 transition-colors"
                            style={{ color: colors.primary }}
                            title="Edit"
                          >
                            <MdEdit size={17} />
                          </button>
                          <button
                            onClick={() => handleDelete(pkg._id)}
                            disabled={deletingId === pkg._id}
                            className="p-2 rounded-sm hover:bg-red-100 text-red-500 disabled:opacity-40 transition-colors"
                            title="Delete"
                          >
                            {deletingId === pkg._id ? (
                              <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <MdDelete size={17} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight">
                  {editId ? "Edit Package" : "Add Package"}
                </h2>
                <p className="text-[10px] opacity-40 font-bold uppercase mt-1">
                  {editId ? "Update package details" : "Create a new test bundle"}
                </p>
              </div>
              <button onClick={resetForm} className="opacity-40 hover:opacity-100 transition-opacity">
                <MdClose size={24} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto p-6">
              <form id="pkg-form" onSubmit={handleSubmit} className="space-y-5">
                {/* Image */}
                <div className="flex justify-center">
                  <label className="cursor-pointer group">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    <div
                      className="w-24 h-24 rounded-sm border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all hover:border-black"
                      style={{ borderColor: colors.accent + "40" }}
                    >
                      {previewUrl ? (
                        <img src={previewUrl} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <>
                          <MdImage size={24} className="opacity-30 mb-1" />
                          <span className="text-[9px] font-black uppercase opacity-40">Image</span>
                        </>
                      )}
                    </div>
                    <p className="text-[9px] font-bold uppercase opacity-30 text-center mt-2 tracking-widest">Click to upload</p>
                  </label>
                </div>

                {/* Package Name */}
                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 block mb-2">Package Name *</label>
                  <input
                    required
                    value={form.packageName}
                    onChange={(e) => setForm((p) => ({ ...p, packageName: e.target.value }))}
                    placeholder="e.g. Full Body Checkup"
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded font-bold text-sm outline-none focus:border-black transition-all"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 block mb-2">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Short description..."
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded font-bold text-sm outline-none focus:border-black transition-all resize-none"
                  />
                </div>

                {/* Category + Prices */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase opacity-40 block mb-2">Category</label>
                    <input
                      value={form.category}
                      onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                      placeholder="e.g. Wellness"
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded font-bold text-sm outline-none focus:border-black transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase opacity-40 block mb-2">Actual Price (₹)</label>
                    <input
                      type="number"
                      value={form.actualPrice}
                      onChange={(e) => setForm((p) => ({ ...p, actualPrice: e.target.value }))}
                      placeholder="e.g. 2000"
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded font-bold text-sm outline-none focus:border-black transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase opacity-40 block mb-2">Discount Price (₹)</label>
                    <input
                      type="number"
                      value={form.discountPrice}
                      onChange={(e) => setForm((p) => ({ ...p, discountPrice: e.target.value }))}
                      placeholder="e.g. 1499"
                      className="w-full bg-slate-50 border border-slate-200 p-3 rounded font-bold text-sm outline-none focus:border-black transition-all"
                    />
                  </div>
                </div>

                {/* Tests Selection */}
                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 block mb-2">
                    Select Tests &nbsp;
                    <span className="normal-case font-bold opacity-60">({form.tests.length} selected)</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-slate-200 rounded p-3 bg-slate-50">
                    {tests.map((t) => {
                      const selected = form.tests.includes(t._id);
                      return (
                        <div
                          key={t._id}
                          onClick={() => handleTestToggle(t._id)}
                          className={`flex items-center gap-2 p-2.5 rounded cursor-pointer border transition-all text-xs font-bold ${
                            selected
                              ? "bg-black text-white border-black"
                              : "bg-white border-slate-200 hover:border-slate-400"
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center shrink-0 ${selected ? "bg-white border-white" : "border-slate-300"}`}>
                            {selected && <div className="w-2 h-2 bg-black rounded-sm" />}
                          </div>
                          <span className="truncate">{t.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="p-6 border-t flex justify-end gap-3 bg-slate-50">
              <button
                onClick={resetForm}
                className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                form="pkg-form"
                type="submit"
                disabled={submitting}
                className="px-10 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded hover:opacity-80 transition-all disabled:opacity-30 shadow-xl"
              >
                {submitting ? "Saving..." : editId ? "Save Changes" : "Create Package"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePackages;
