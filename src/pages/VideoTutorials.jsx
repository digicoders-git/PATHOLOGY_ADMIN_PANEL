import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  getAllTutorials,
  getTutorialCategories,
  createTutorial,
  updateTutorial,
  deleteTutorial,
  toggleTutorialStatus,
} from "../apis/tutorials";
import { toast } from "react-toastify";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdClose,
  MdRefresh,
  MdSearch,
  MdOndemandVideo,
  MdPlayCircleOutline,
  MdOutlineCloudUpload,
  MdToggleOn,
  MdToggleOff,
  MdOpenInNew,
  MdAccessTime,
  MdVisibility,
  MdCalendarToday,
  MdCategory,
  MdInfoOutline,
} from "react-icons/md";
import { FaYoutube } from "react-icons/fa";
import Swal from "sweetalert2";
import Loader from "./ui/Loader";

const EMPTY_FORM = {
  title: "",
  category: "",
  description: "",
  videoUrl: "",
  youtubeId: "",
  duration: "03:30",
  date: "",
  views: "1.0K Views",
  sortOrder: "0",
  status: true,
  thumbnail: null,
};

const extractYoutubeId = (url) => {
  if (!url) return "";
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match && match[1] ? match[1] : "";
};

export const getTutorialImageUrl = (thumbnail) => {
  if (!thumbnail) return null;
  let url =
    typeof thumbnail === "string"
      ? thumbnail
      : thumbnail.cloudinary || thumbnail.local || "";
  if (!url || typeof url !== "string" || !url.trim()) return null;
  url = url.trim();
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    if (url.includes("pathology-backend-live.onrender.com")) {
      return url.replace(
        "https://pathology-backend-live.onrender.com",
        "https://api.laboindia.com"
      );
    }
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

const VideoTutorials = () => {
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
  const [previewThumbnail, setPreviewThumbnail] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // Video Player Preview Modal
  const [previewVideo, setPreviewVideo] = useState(null);

  // Fetch dynamic categories
  const fetchCategories = useCallback(async () => {
    try {
      const res = await getTutorialCategories();
      if (res && res.success && Array.isArray(res.data)) {
        setServerCategories(res.data);
      }
    } catch (_) {}
  }, []);

  // Fetch Tutorial list
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllTutorials({
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
          total: res.total || (res.data ? res.data.length : 0),
        });
      }
    } catch (err) {
      console.error("Fetch Tutorials Error:", err);
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

  // Combined list of all unique categories from server + loaded data
  const dynamicCategories = useMemo(() => {
    const set = new Set(serverCategories);
    data.forEach((item) => {
      if (item.category && item.category.trim()) {
        set.add(item.category.trim());
      }
    });
    return Array.from(set).filter(Boolean);
  }, [serverCategories, data]);

  // Statistics
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
      category: dynamicCategories[0] || "Patient Guide",
      date: today,
    });
    setPreviewThumbnail(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setEditId(item._id);
    setForm({
      title: item.title || "",
      category: item.category || "",
      description: item.description || "",
      videoUrl: item.videoUrl || "",
      youtubeId: item.youtubeId || "",
      duration: item.duration || "03:30",
      date: item.date || "",
      views: item.views || "1.0K Views",
      sortOrder: String(item.sortOrder || 0),
      status: item.status !== false,
      thumbnail: null,
    });
    setPreviewThumbnail(getTutorialImageUrl(item.thumbnail));
    setIsModalOpen(true);
  };

  // Handle Video URL change to auto-extract YouTube ID
  const handleVideoUrlChange = (val) => {
    const detectedId = extractYoutubeId(val);
    setForm((prev) => ({
      ...prev,
      videoUrl: val,
      youtubeId: detectedId || prev.youtubeId,
    }));
  };

  // Handle Image File Selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload a valid image file (PNG, JPG, WEBP)");
        return;
      }
      setForm((prev) => ({ ...prev, thumbnail: file }));
      setPreviewThumbnail(URL.createObjectURL(file));
    }
  };

  // Handle Form Submit (Create / Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Please provide a tutorial title");
      return;
    }

    const finalCategory = form.category.trim();
    if (!finalCategory) {
      toast.error("Please enter a category name");
      return;
    }

    const detectedId =
      form.youtubeId?.trim() || extractYoutubeId(form.videoUrl);

    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("category", finalCategory);
      fd.append("description", form.description.trim());
      fd.append("videoUrl", form.videoUrl.trim());
      fd.append("youtubeId", detectedId);
      fd.append("duration", form.duration.trim());
      fd.append("date", form.date.trim());
      fd.append("views", form.views.trim());
      fd.append("sortOrder", form.sortOrder || "0");
      fd.append("status", String(form.status));

      if (form.thumbnail instanceof File) {
        fd.append("thumbnail", form.thumbnail);
      }

      if (editId) {
        const res = await updateTutorial(editId, fd);
        if (res.success) {
          toast.success("Tutorial video updated successfully");
          setIsModalOpen(false);
          fetchData();
          fetchCategories();
        } else {
          toast.error(res.message || "Failed to update video tutorial");
        }
      } else {
        const res = await createTutorial(fd);
        if (res.success) {
          toast.success("Tutorial video created successfully");
          setIsModalOpen(false);
          fetchData();
          fetchCategories();
        } else {
          toast.error(res.message || "Failed to create video tutorial");
        }
      }
    } catch (err) {
      console.error("Submit Tutorial Error:", err);
      toast.error(err.response?.data?.message || "Failed to save video tutorial");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Status
  const handleToggle = async (id) => {
    try {
      setTogglingId(id);
      const res = await toggleTutorialStatus(id);
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

  // Delete Tutorial
  const handleDelete = async (id, title) => {
    const result = await Swal.fire({
      title: "Delete Tutorial Video?",
      text: `Are you sure you want to delete "${title}"? This action cannot be undone.`,
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
        const res = await deleteTutorial(id);
        if (res.success) {
          toast.success("Tutorial video deleted successfully");
          fetchData();
          fetchCategories();
        }
      } catch (err) {
        toast.error("Failed to delete tutorial video");
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
                <MdOndemandVideo className="text-2xl" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                  Video Tutorials Management
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                    Fully Dynamic
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                  Create custom categories & YouTube video guides for website visitors and lab partners.
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
              <span>Add Tutorial Video</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Videos
              </p>
              <p className="text-2xl font-black text-slate-800 mt-1">{stats.total}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <MdOndemandVideo className="text-2xl" />
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
              placeholder="Search by tutorial title, category, or description..."
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
                Loading video tutorials...
              </p>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-3">
                <MdOndemandVideo className="text-3xl" />
              </div>
              <h3 className="text-base font-black text-slate-800">No Video Tutorials Found</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                No video tutorials match your filter or none have been added yet. Click below
                to add the first tutorial.
              </p>
              <button
                onClick={handleOpenAdd}
                className="mt-4 inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
              >
                <MdAdd className="text-base" /> Add Video Tutorial
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3.5 px-4 w-12 text-center">#</th>
                    <th className="py-3.5 px-4 w-44">Thumbnail</th>
                    <th className="py-3.5 px-4">Title & Details</th>
                    <th className="py-3.5 px-4 w-40">Category</th>
                    <th className="py-3.5 px-4 w-36">Duration / Views</th>
                    <th className="py-3.5 px-4 w-32">YouTube Link</th>
                    <th className="py-3.5 px-4 w-24 text-center">Status</th>
                    <th className="py-3.5 px-4 w-28 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {data.map((item, index) => {
                    const imgUrl =
                      getTutorialImageUrl(item.thumbnail) ||
                      (item.youtubeId
                        ? `https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg`
                        : null);

                    return (
                      <tr
                        key={item._id || index}
                        className="hover:bg-slate-50/60 transition-colors group"
                      >
                        {/* Sort / Index */}
                        <td className="py-3 px-4 text-center text-slate-400 font-bold text-[11px]">
                          {item.sortOrder || index + 1}
                        </td>

                        {/* Thumbnail */}
                        <td className="py-3 px-4">
                          <div
                            onClick={() => setPreviewVideo(item)}
                            className="relative w-36 aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-200 group-hover:shadow-md transition-all cursor-pointer group/thumb"
                            title="Click to preview video"
                          >
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = item.youtubeId
                                    ? `https://img.youtube.com/vi/${item.youtubeId}/hqdefault.jpg`
                                    : "https://via.placeholder.com/320x180?text=Video+Tutorial";
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-400">
                                <MdOndemandVideo className="text-2xl" />
                              </div>
                            )}

                            {/* Play overlay on hover */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                              <MdPlayCircleOutline className="text-3xl text-white drop-shadow-md" />
                            </div>

                            {/* Duration badge */}
                            <span className="absolute bottom-1 right-1 bg-black/85 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-xs">
                              {item.duration || "03:30"}
                            </span>
                          </div>
                        </td>

                        {/* Title & Info */}
                        <td className="py-3 px-4 max-w-sm">
                          <p className="font-black text-slate-900 text-sm group-hover:text-red-600 transition-colors line-clamp-1">
                            {item.title}
                          </p>
                          {item.description && (
                            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-normal">
                              {item.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1.5">
                            <span className="flex items-center gap-1">
                              <MdCalendarToday className="text-slate-400 text-xs" />
                              {item.date || "Recent"}
                            </span>
                          </div>
                        </td>

                        {/* Dynamic Category Badge */}
                        <td className="py-3 px-4">
                          <span className="inline-block text-[10px] font-black uppercase px-2.5 py-1 rounded-full border bg-red-50 text-red-600 border-red-200">
                            {item.category || "General"}
                          </span>
                        </td>

                        {/* Duration & Views */}
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <span className="flex items-center gap-1.5 text-slate-600 text-[11px] font-bold">
                              <MdAccessTime className="text-slate-400 text-xs" />
                              {item.duration}
                            </span>
                            <span className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                              <MdVisibility className="text-slate-400 text-xs" />
                              {item.views || "1.0K Views"}
                            </span>
                          </div>
                        </td>

                        {/* Video / YouTube Link */}
                        <td className="py-3 px-4">
                          {item.youtubeId ? (
                            <a
                              href={
                                item.videoUrl ||
                                `https://www.youtube.com/watch?v=${item.youtubeId}`
                              }
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-700 font-bold text-[11px] bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition-colors border border-red-100"
                            >
                              <FaYoutube className="text-sm shrink-0" />
                              <span className="font-mono text-[10px]">
                                {item.youtubeId}
                              </span>
                              <MdOpenInNew className="text-xs" />
                            </a>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">
                              No Video Link
                            </span>
                          )}
                        </td>

                        {/* Status Toggle */}
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
                              onClick={() => setPreviewVideo(item)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Play Video"
                            >
                              <MdPlayCircleOutline className="text-base" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Edit Tutorial"
                            >
                              <MdEdit className="text-base" />
                            </button>
                            <button
                              onClick={() => handleDelete(item._id, item.title)}
                              disabled={deletingId === item._id}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete Tutorial"
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
                  <MdOndemandVideo className="text-lg" />
                </div>
                <h3 className="text-base font-black text-slate-800">
                  {editId ? "Edit Video Tutorial" : "Add New Video Tutorial"}
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
                <Label required>Tutorial Title</Label>
                <input
                  type="text"
                  required
                  placeholder="e.g. How to Book a Test on Labo India?"
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
                    list="category-suggestions-list"
                    placeholder="Type any category name (e.g. Patient Guide, Doctor Tips, Phlebotomy...)"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className={inpClass}
                  />
                  <datalist id="category-suggestions-list">
                    {dynamicCategories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                {/* Quick Pick Badges from Existing Categories */}
                {dynamicCategories.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">
                      Existing Suggestions:
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
                <p className="text-[10px] text-slate-400 mt-1">
                  💡 Category koi fix nahi hai. Aap koi bhi nayi category manually type kar sakte hain, wo turant website par dynamic card ban jayegi.
                </p>
              </div>

              {/* Sort Order */}
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
                <p className="text-[10px] text-slate-400 mt-1">
                  Lower number shows first on website (1, 2, 3...)
                </p>
              </div>

              {/* YouTube Link / Video ID */}
              <div>
                <Label>YouTube Video Link or Video ID</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <FaYoutube className="absolute left-3 top-1/2 -translate-y-1/2 text-red-500 text-base" />
                    <input
                      type="text"
                      placeholder="https://www.youtube.com/watch?v=... or Video ID"
                      value={form.videoUrl}
                      onChange={(e) => handleVideoUrlChange(e.target.value)}
                      className={`${inpClass} pl-9`}
                    />
                  </div>
                </div>

                {form.youtubeId && (
                  <div className="mt-2 p-2.5 bg-red-50/60 rounded-xl border border-red-100 flex items-center justify-between text-xs text-red-700">
                    <span className="font-mono font-bold text-[11px]">
                      Detected YouTube ID: {form.youtubeId}
                    </span>
                    <a
                      href={`https://www.youtube.com/watch?v=${form.youtubeId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-bold hover:underline"
                    >
                      Verify on YouTube <MdOpenInNew className="text-xs" />
                    </a>
                  </div>
                )}
              </div>

              {/* Duration & Views & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label>Duration</Label>
                  <input
                    type="text"
                    placeholder="04:32"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    className={inpClass}
                  />
                </div>
                <div>
                  <Label>Views Display</Label>
                  <input
                    type="text"
                    placeholder="12.5K Views"
                    value={form.views}
                    onChange={(e) => setForm({ ...form, views: e.target.value })}
                    className={inpClass}
                  />
                </div>
                <div>
                  <Label>Display Date</Label>
                  <input
                    type="text"
                    placeholder="Oct 25, 2025"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className={inpClass}
                  />
                </div>
              </div>

              {/* Thumbnail Image Upload (saved in backend uploads/tutorials) */}
              <div>
                <Label>Thumbnail Image (Saved to Backend /uploads/tutorials)</Label>
                <div className="mt-1 flex flex-col sm:flex-row gap-4 items-center">
                  {/* Upload Box */}
                  <label className="flex-1 w-full flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-red-500 rounded-xl cursor-pointer bg-slate-50/50 hover:bg-red-50/20 transition-all text-center">
                    <MdOutlineCloudUpload className="text-3xl text-slate-400 mb-1" />
                    <span className="text-xs font-bold text-slate-700">
                      Click to upload thumbnail
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      PNG, JPG, WEBP (Max 10MB). 16:9 ratio recommended.
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>

                  {/* Image Preview Box */}
                  {previewThumbnail ? (
                    <div className="relative w-40 aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-xs">
                      <img
                        src={previewThumbnail}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setForm({ ...form, thumbnail: null });
                          setPreviewThumbnail(null);
                        }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center cursor-pointer shadow-xs"
                        title="Remove image"
                      >
                        <MdClose className="text-xs" />
                      </button>
                    </div>
                  ) : form.youtubeId ? (
                    <div className="relative w-40 aspect-video rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 shadow-xs flex flex-col items-center justify-center text-center p-1">
                      <img
                        src={`https://img.youtube.com/vi/${form.youtubeId}/hqdefault.jpg`}
                        alt="YouTube HQ"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 bg-black/70 text-white text-[9px] px-1 rounded">
                        YouTube Fallback
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Description */}
              <div>
                <Label>Description / Overview</Label>
                <textarea
                  rows="2"
                  placeholder="Optional brief description of what this video tutorial explains..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={inpClass}
                />
              </div>

              {/* Status Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="statusToggle"
                  checked={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.checked })}
                  className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer"
                />
                <label
                  htmlFor="statusToggle"
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
                    "Update Tutorial"
                  ) : (
                    "Save Tutorial Video"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── VIDEO PLAYER PREVIEW MODAL ─────────────────────────────────── */}
      {previewVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 px-6 border-b border-slate-100 bg-white">
              <div className="flex items-center gap-3">
                <span className="bg-red-50 text-red-600 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-red-100">
                  {previewVideo.category}
                </span>
                <span className="text-xs font-bold text-slate-800 line-clamp-1">
                  {previewVideo.title}
                </span>
              </div>
              <button
                onClick={() => setPreviewVideo(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              >
                <MdClose className="text-base" />
              </button>
            </div>

            {/* Video Player */}
            <div className="relative w-full aspect-video bg-black flex items-center justify-center">
              {previewVideo.youtubeId ? (
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube-nocookie.com/embed/${previewVideo.youtubeId}?autoplay=1&rel=0`}
                  title={previewVideo.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="text-center text-white p-6">
                  <FaYoutube className="text-5xl text-red-600 mx-auto mb-2" />
                  <p className="text-sm font-bold">No YouTube ID assigned to this tutorial.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Edit this item and enter a YouTube link or Video ID.
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 px-6 bg-slate-50 flex items-center justify-between">
              <div className="text-xs text-slate-500 font-medium">
                Duration: <strong className="text-slate-800">{previewVideo.duration}</strong> • Views: <strong className="text-slate-800">{previewVideo.views}</strong>
              </div>
              <button
                onClick={() => setPreviewVideo(null)}
                className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-100 cursor-pointer"
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

export default VideoTutorials;
