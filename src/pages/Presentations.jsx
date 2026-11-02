import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  getAllPresentations,
  getPresentationCategories,
  createPresentation,
  updatePresentation,
  deletePresentation,
  togglePresentationStatus,
} from "../apis/presentations";
import { toast } from "react-toastify";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdClose,
  MdRefresh,
  MdSearch,
  MdSlideshow,
  MdOutlineCloudUpload,
  MdToggleOn,
  MdToggleOff,
  MdCalendarToday,
  MdCategory,
  MdPictureAsPdf,
  MdChevronLeft,
  MdChevronRight,
  MdRemoveRedEye,
} from "react-icons/md";
import { FaFilePdf, FaFilePowerpoint } from "react-icons/fa";
import Swal from "sweetalert2";
import Loader from "./ui/Loader";

const EMPTY_FORM = {
  title: "",
  category: "",
  description: "",
  type: "PDF",
  pages: "20",
  date: "",
  sortOrder: "0",
  status: true,
  banner: null,
};

export const getPresentationImageUrl = (banner) => {
  if (!banner) return null;
  let url =
    typeof banner === "string"
      ? banner
      : banner.cloudinary || banner.local || "";
  if (!url || typeof url !== "string" || !url.trim()) return null;
  url = url.trim();
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url;
  }
  const cleanPath = url.replace(/^\/+/, "");
  const base = import.meta.env.VITE_API_BASE_URL || "https://api.laboindia.com";
  return `${base.replace(/\/+$/, "")}/${cleanPath}`;
};

const inpClass =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all text-slate-800";

const Label = ({ children, required }) => (
  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

const Presentations = () => {
  const [data, setData] = useState([]);
  const [serverCategories, setServerCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [page, setPage] = useState(1);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [previewBanner, setPreviewBanner] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // Slide Viewer Modal
  const [previewPresentation, setPreviewPresentation] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(1);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await getPresentationCategories();
      if (res && res.success && Array.isArray(res.data)) {
        setServerCategories(res.data);
      }
    } catch (_) {}
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllPresentations({
        page,
        limit: 15,
        search,
        status: statusFilter,
        category: categoryFilter,
      });
      if (res && res.success) {
        setData(res.data || []);
        setPagination({
          page: res.currentPage || 1,
          totalPages: res.totalPages || 1,
          total: res.total || 0,
        });
      }
    } catch (err) {
      console.error("Fetch Presentations Error:", err);
      toast.error("Failed to load presentations from server");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, categoryFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Dynamic Categories set
  const dynamicCategories = useMemo(() => {
    const set = new Set(serverCategories);
    data.forEach((item) => {
      if (item.category && item.category.trim()) {
        set.add(item.category.trim());
      }
    });
    return Array.from(set).filter(Boolean);
  }, [serverCategories, data]);

  // Stats
  const stats = useMemo(() => {
    const total = pagination.total || data.length;
    const active = data.filter((v) => v.status).length;
    const inactive = data.filter((v) => !v.status).length;
    return { total, active, inactive, categoriesCount: dynamicCategories.length };
  }, [pagination.total, data, dynamicCategories]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditId(null);
    const today = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    setForm({
      ...EMPTY_FORM,
      category: dynamicCategories[0] || "Company Profile",
      date: today,
    });
    setPreviewBanner(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setEditId(item._id);
    setForm({
      title: item.title || "",
      category: item.category || "",
      description: item.description || "",
      type: item.type || "PDF",
      pages: String(item.pages || "20"),
      date: item.date || "",
      sortOrder: String(item.sortOrder || 0),
      status: item.status !== false,
      banner: null,
    });
    setPreviewBanner(getPresentationImageUrl(item.banner));
    setIsModalOpen(true);
  };

  // Handle Banner Image File Selection
  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload a valid image file (PNG, JPG, WEBP)");
        return;
      }
      setForm((prev) => ({ ...prev, banner: file }));
      setPreviewBanner(URL.createObjectURL(file));
    }
  };

  // Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Please provide a presentation title");
      return;
    }

    const finalCategory = form.category.trim();
    if (!finalCategory) {
      toast.error("Please enter a category name");
      return;
    }

    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("category", finalCategory);
      fd.append("description", form.description.trim());
      fd.append("type", form.type.trim());
      fd.append("pages", form.pages.trim());
      fd.append("date", form.date.trim());
      fd.append("sortOrder", form.sortOrder || "0");
      fd.append("status", String(form.status));

      if (form.banner instanceof File) {
        fd.append("banner", form.banner);
      }

      if (editId) {
        const res = await updatePresentation(editId, fd);
        if (res.success) {
          toast.success("Presentation updated successfully");
          setIsModalOpen(false);
          fetchData();
          fetchCategories();
        } else {
          toast.error(res.message || "Failed to update presentation");
        }
      } else {
        const res = await createPresentation(fd);
        if (res.success) {
          toast.success("Presentation created successfully");
          setIsModalOpen(false);
          fetchData();
          fetchCategories();
        } else {
          toast.error(res.message || "Failed to create presentation");
        }
      }
    } catch (err) {
      console.error("Submit Presentation Error:", err);
      toast.error(err.response?.data?.message || "Failed to save presentation");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Status
  const handleToggle = async (id) => {
    try {
      setTogglingId(id);
      const res = await togglePresentationStatus(id);
      if (res.success) {
        toast.success(res.message || "Status updated");
        setData((prev) =>
          prev.map((x) =>
            x._id === id ? { ...x, status: res.data?.status ?? !x.status } : x
          )
        );
      }
    } catch (err) {
      toast.error("Failed to toggle status");
    } finally {
      setTogglingId(null);
    }
  };

  // Delete Presentation
  const handleDelete = async (id, title) => {
    const result = await Swal.fire({
      title: "Delete Presentation?",
      text: `Are you sure you want to delete "${title}"? This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        setDeletingId(id);
        const res = await deletePresentation(id);
        if (res.success) {
          toast.success("Presentation deleted successfully");
          fetchData();
          fetchCategories();
        }
      } catch (err) {
        toast.error("Failed to delete presentation");
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-slate-50 font-sans">
      <div className="max-w-[1440px] mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                <MdSlideshow className="text-2xl" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                  Presentations Management
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                    Fully Dynamic
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  Upload presentations, slides, and manage dynamic categories on the website.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                fetchData();
                fetchCategories();
              }}
              disabled={loading}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer shadow-xs"
              title="Refresh List"
            >
              <MdRefresh className={`text-lg ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-red-600/20 active:scale-95 cursor-pointer"
            >
              <MdAdd className="text-base" />
              <span>Add Presentation</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Presentations
              </p>
              <p className="text-2xl font-black text-slate-800 mt-1">{stats.total}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <MdSlideshow className="text-2xl" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Active on Website
              </p>
              <p className="text-2xl font-black text-emerald-600 mt-1">{stats.active}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <MdToggleOn className="text-3xl" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Inactive / Hidden
              </p>
              <p className="text-2xl font-black text-slate-400 mt-1">{stats.inactive}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold">
              <MdToggleOff className="text-3xl" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Dynamic Categories
              </p>
              <p className="text-2xl font-black text-purple-600 mt-1">
                {stats.categoriesCount}
              </p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <MdCategory className="text-2xl" />
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
            <input
              type="text"
              placeholder="Search by presentation title, category, or description..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap gap-2.5 items-center">
            {/* Dynamic Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-red-500 transition-all cursor-pointer"
            >
              <option value="All">All Categories ({dynamicCategories.length})</option>
              {dynamicCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none focus:border-red-500 transition-all cursor-pointer"
            >
              <option value="">All Status</option>
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Content Table / Empty / Loading */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader />
              <p className="text-xs text-slate-400 font-bold mt-3">
                Loading presentations from database...
              </p>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-3">
                <MdSlideshow className="text-3xl" />
              </div>
              <h3 className="text-base font-black text-slate-800">No Presentations Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No presentations match your search or none have been created yet. Click below
                to add the first presentation.
              </p>
              <button
                onClick={handleOpenAdd}
                className="mt-4 inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                <MdAdd className="text-base" /> Add Presentation
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-4 w-44">Banner Image</th>
                    <th className="py-3.5 px-4">Title & Description</th>
                    <th className="py-3.5 px-4 w-40">Category</th>
                    <th className="py-3.5 px-4 w-32">Type / Pages</th>
                    <th className="py-3.5 px-4 w-28">Date</th>
                    <th className="py-3.5 px-4 w-24 text-center">Status</th>
                    <th className="py-3.5 px-4 w-28 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {data.map((item, index) => {
                    const imgUrl = getPresentationImageUrl(item.banner);

                    return (
                      <tr
                        key={item._id || index}
                        className="hover:bg-slate-50/60 transition-colors group"
                      >
                        {/* Sort / Index */}
                        <td className="py-3 px-4 text-center text-slate-400 font-bold text-[11px]">
                          {item.sortOrder || index + 1}
                        </td>

                        {/* Banner Image */}
                        <td className="py-3 px-4">
                          <div
                            onClick={() => {
                              setCurrentSlide(1);
                              setPreviewPresentation(item);
                            }}
                            className="relative w-36 aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-200 group-hover:shadow-md transition-all cursor-pointer group/thumb"
                            title="Click to preview slide deck"
                          >
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400">
                                <MdSlideshow className="text-2xl" />
                              </div>
                            )}

                            {/* Hover Eye Overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                              <MdRemoveRedEye className="text-2xl text-white drop-shadow-md" />
                            </div>

                            {/* Pages Badge */}
                            <span className="absolute bottom-1 right-1 bg-black/85 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-xs">
                              {item.pages || "20"} Slides
                            </span>
                          </div>
                        </td>

                        {/* Title & Description */}
                        <td className="py-3 px-4 max-w-sm">
                          <p className="font-black text-slate-900 text-sm group-hover:text-red-600 transition-colors line-clamp-1">
                            {item.title}
                          </p>
                          {item.description && (
                            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-normal">
                              {item.description}
                            </p>
                          )}
                        </td>

                        {/* Category Badge */}
                        <td className="py-3 px-4">
                          <span className="inline-block text-[10px] font-black uppercase px-2.5 py-1 rounded-full border bg-red-50 text-red-600 border-red-200">
                            {item.category || "General"}
                          </span>
                        </td>

                        {/* Format Type & Pages */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 font-bold text-slate-700">
                            {item.type === "PDF" ? (
                              <FaFilePdf className="text-red-500 text-sm" />
                            ) : (
                              <FaFilePowerpoint className="text-orange-500 text-sm" />
                            )}
                            <span>{item.type || "PDF"}</span>
                            <span className="text-slate-400 font-normal">
                              ({item.pages || "20"} pgs)
                            </span>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          <span className="flex items-center gap-1">
                            <MdCalendarToday className="text-slate-400 text-xs" />
                            {item.date || "Recent"}
                          </span>
                        </td>

                        {/* Status Switch */}
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleToggle(item._id)}
                            disabled={togglingId === item._id}
                            className={`inline-flex items-center justify-center transition-colors cursor-pointer text-2xl ${
                              item.status ? "text-emerald-500" : "text-slate-300"
                            }`}
                            title={
                              item.status ? "Active (Click to disable)" : "Inactive (Click to enable)"
                            }
                          >
                            {item.status ? <MdToggleOn /> : <MdToggleOff />}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setCurrentSlide(1);
                                setPreviewPresentation(item);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Preview Slides"
                            >
                              <MdRemoveRedEye className="text-base" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Edit Presentation"
                            >
                              <MdEdit className="text-base" />
                            </button>
                            <button
                              onClick={() => handleDelete(item._id, item.title)}
                              disabled={deletingId === item._id}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete Presentation"
                            >
                              <MdDelete className="text-base" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/50">
              <span className="text-xs text-slate-500 font-semibold">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CREATE / EDIT MODAL ────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold">
                  <MdSlideshow className="text-lg" />
                </div>
                <h3 className="text-base font-black text-slate-800">
                  {editId ? "Edit Presentation" : "Add New Presentation"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
              >
                <MdClose className="text-base" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Title */}
              <div>
                <Label required>Presentation Title</Label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Labo India Company Profile"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={inpClass}
                />
              </div>

              {/* Dynamic Category (Manual Entry + Quick Suggestions) */}
              <div>
                <Label required>Category (Jo chahein wo manually type karein)</Label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    list="pres-category-suggestions"
                    placeholder="Type category (e.g. Company Profile, Lab Partner, Healthcare...)"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className={inpClass}
                  />
                  <datalist id="pres-category-suggestions">
                    {dynamicCategories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                {/* Quick Pick Badges from Existing Categories */}
                {dynamicCategories.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">
                      Existing:
                    </span>
                    {dynamicCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setForm({ ...form, category: cat })}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                          form.category.trim().toLowerCase() === cat.trim().toLowerCase()
                            ? "bg-red-600 text-white border-red-600 shadow-xs"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Format Type & Total Pages & Sort Order */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label>File Type</Label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className={inpClass}
                  >
                    <option value="PDF">PDF Presentation</option>
                    <option value="PPT">PowerPoint (PPT)</option>
                    <option value="Slide">Slide Deck</option>
                  </select>
                </div>

                <div>
                  <Label>Total Slides / Pages</Label>
                  <input
                    type="number"
                    min="1"
                    placeholder="20"
                    value={form.pages}
                    onChange={(e) => setForm({ ...form, pages: e.target.value })}
                    className={inpClass}
                  />
                </div>

                <div>
                  <Label>Sort Order</Label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                    className={inpClass}
                  />
                </div>
              </div>

              {/* Display Date */}
              <div>
                <Label>Display Date</Label>
                <input
                  type="text"
                  placeholder="Oct 24, 2025"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className={inpClass}
                />
              </div>

              {/* Banner Image Upload (Saved in backend uploads/presentations) */}
              <div>
                <Label>Banner Slide Image (Saved to Backend /uploads/presentations)</Label>
                <div className="mt-1 flex flex-col sm:flex-row gap-4 items-center">
                  <label className="flex-1 w-full flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-red-500 rounded-xl cursor-pointer bg-slate-50/50 hover:bg-red-50/20 transition-all text-center">
                    <MdOutlineCloudUpload className="text-3xl text-slate-400 mb-1" />
                    <span className="text-xs font-bold text-slate-700">
                      Click to upload presentation banner
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      PNG, JPG, WEBP (16:9 ratio recommended).
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerChange}
                      className="hidden"
                    />
                  </label>

                  {previewBanner && (
                    <div className="relative w-40 aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-xs">
                      <img
                        src={previewBanner}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setForm({ ...form, banner: null });
                          setPreviewBanner(null);
                        }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center cursor-pointer shadow-xs"
                        title="Remove image"
                      >
                        <MdClose className="text-xs" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <Label>Short Description / Overview</Label>
                <textarea
                  rows="2"
                  placeholder="Brief summary of what this presentation deck covers..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={inpClass}
                />
              </div>

              {/* Status Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="presStatusToggle"
                  checked={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.checked })}
                  className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer"
                />
                <label
                  htmlFor="presStatusToggle"
                  className="text-xs font-bold text-slate-700 cursor-pointer"
                >
                  Publish Immediately (Active on Website)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-md shadow-red-600/20 active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader /> Saving...
                    </>
                  ) : editId ? (
                    "Update Presentation"
                  ) : (
                    "Save Presentation"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SLIDE VIEWER MODAL ─────────────────────────────────────────── */}
      {previewPresentation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 px-6 border-b border-slate-100 bg-white">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 text-[10px] font-black uppercase px-3 py-1 rounded-full border border-red-100">
                  {previewPresentation.type === "PDF" ? <FaFilePdf /> : <FaFilePowerpoint />}
                  {previewPresentation.category}
                </span>
                <span className="text-xs font-bold text-slate-800 line-clamp-1">
                  {previewPresentation.title}
                </span>
              </div>
              <button
                onClick={() => setPreviewPresentation(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <MdClose className="text-base" />
              </button>
            </div>

            {/* Slide View Container */}
            <div className="p-6 bg-slate-100 flex flex-col items-center justify-center min-h-[300px]">
              <div className="relative w-full max-w-xl aspect-[16/9] rounded-xl overflow-hidden bg-white shadow-lg border border-slate-200">
                <img
                  src={getPresentationImageUrl(previewPresentation.banner)}
                  alt={previewPresentation.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2.5 right-3 bg-black/80 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                  Slide {currentSlide} of {previewPresentation.pages || 20}
                </div>
              </div>

              {/* Slide Navigation */}
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => setCurrentSlide((prev) => Math.max(1, prev - 1))}
                  disabled={currentSlide === 1}
                  className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-red-600 hover:text-white shadow-xs flex items-center justify-center cursor-pointer transition-all disabled:opacity-30 disabled:pointer-events-none"
                >
                  <MdChevronLeft className="text-lg" />
                </button>
                <span className="text-slate-700 text-xs font-bold px-2">
                  Slide {currentSlide} / {previewPresentation.pages || 20}
                </span>
                <button
                  onClick={() =>
                    setCurrentSlide((prev) =>
                      Math.min(parseInt(previewPresentation.pages) || 20, prev + 1)
                    )
                  }
                  disabled={currentSlide >= (parseInt(previewPresentation.pages) || 20)}
                  className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-red-600 hover:text-white shadow-xs flex items-center justify-center cursor-pointer transition-all disabled:opacity-30 disabled:pointer-events-none"
                >
                  <MdChevronRight className="text-lg" />
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 bg-white border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                {previewPresentation.description}
              </span>
              <button
                onClick={() => setPreviewPresentation(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Presentations;
