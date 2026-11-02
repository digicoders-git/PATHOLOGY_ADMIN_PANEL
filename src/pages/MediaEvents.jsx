import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  getAllMediaEvents,
  getMediaEventCategories,
  createMediaEvent,
  updateMediaEvent,
  deleteMediaEvent,
  toggleMediaEventStatus,
  resolveMediaImageUrl,
} from "../apis/mediaEvents";
import { toast } from "react-toastify";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdClose,
  MdRefresh,
  MdSearch,
  MdPermMedia,
  MdOutlineCloudUpload,
  MdToggleOn,
  MdToggleOff,
  MdChevronLeft,
  MdChevronRight,
  MdRemoveRedEye,
  MdCheckCircle,
  MdCancel,
  MdCategory,
  MdPhotoLibrary,
} from "react-icons/md";
import { FaImages, FaArrowRight, FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";
import Loader from "./ui/Loader";

const EMPTY_FORM = {
  title: "",
  subtitle: "",
  category: "Media",
  description: "",
  metaText: "",
  buttonText: "View Details",
  order: "0",
  status: true,
  image: null,
};

const DEFAULT_CATEGORY_SUGGESTIONS = [
  "Media",
  "Event",
  "Press Note",
  "Social Media",
  "Conferences",
  "Health Drives",
  "Achievements",
];

const inpClass =
  "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all text-slate-800";

const Label = ({ children, required }) => (
  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
    {children} {required && <span className="text-red-500">*</span>}
  </label>
);

const MediaEvents = () => {
  const [data, setData] = useState([]);
  const [categories, setCategories] = useState([]);
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
  const [previewImage, setPreviewImage] = useState(null);
  
  // Multiple Gallery Photos State
  const [existingGallery, setExistingGallery] = useState([]);
  const [newGalleryFiles, setNewGalleryFiles] = useState([]);
  const [previewNewGallery, setPreviewNewGallery] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // Preview Modal
  const [previewCard, setPreviewCard] = useState(null);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await getMediaEventCategories();
      if (res && res.success && Array.isArray(res.categories)) {
        setCategories(res.categories.map((c) => c.category));
      }
    } catch (err) {
      console.warn("Could not fetch categories:", err.message);
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllMediaEvents({
        page,
        limit: 15,
        search,
        category: categoryFilter === "All" ? "" : categoryFilter,
        status: statusFilter,
      });

      if (res && res.success) {
        setData(res.mediaEvents || []);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } else {
        setData([]);
      }
    } catch (err) {
      console.error("Failed to load media events:", err);
      toast.error(err?.response?.data?.message || "Failed to load media events");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchData();
    fetchCategories();
  }, [fetchData, fetchCategories]);

  // Statistics
  const stats = useMemo(() => {
    const total = pagination.total || data.length;
    const active = data.filter((d) => d.status === "Active").length;
    const inactive = data.filter((d) => d.status === "Inactive").length;
    const uniqueCats = new Set(data.map((d) => d.category)).size;
    return { total, active, inactive, uniqueCats };
  }, [data, pagination]);

  // Suggestions merge
  const allCategorySuggestions = useMemo(() => {
    const set = new Set([...DEFAULT_CATEGORY_SUGGESTIONS, ...categories]);
    return Array.from(set);
  }, [categories]);

  // Modal Handlers
  const handleOpenAdd = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setPreviewImage(null);
    setExistingGallery([]);
    setNewGalleryFiles([]);
    setPreviewNewGallery([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditId(item._id);
    setForm({
      title: item.title || "",
      subtitle: item.subtitle || "",
      category: item.category || "Media",
      description: item.description || "",
      metaText: item.metaText || "",
      buttonText: item.buttonText || "View Details",
      order: String(item.order ?? 0),
      status: item.status === "Active",
      image: null,
    });
    setPreviewImage(resolveMediaImageUrl(item.image));
    setExistingGallery(Array.isArray(item.gallery) ? item.gallery : []);
    setNewGalleryFiles([]);
    setPreviewNewGallery([]);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditId(null);
    setForm(EMPTY_FORM);
    setPreviewImage(null);
    setExistingGallery([]);
    setNewGalleryFiles([]);
    setPreviewNewGallery([]);
  };

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select a valid image file");
        return;
      }
      setForm((prev) => ({ ...prev, image: file }));
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const handleMultipleGalleryChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter((f) => f.type.startsWith("image/"));
    if (validFiles.length < files.length) {
      toast.warn("Some non-image files were skipped");
    }

    setNewGalleryFiles((prev) => [...prev, ...validFiles]);
    const previews = validFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      title: file.name,
    }));
    setPreviewNewGallery((prev) => [...prev, ...previews]);
  };

  const handleRemoveExistingGalleryImage = (indexToRemove) => {
    setExistingGallery((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleRemoveNewGalleryImage = (indexToRemove) => {
    setNewGalleryFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setPreviewNewGallery((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!form.category.trim()) {
      toast.error("Category is required");
      return;
    }

    if (!editId && !form.image) {
      toast.error("Please upload a cover/banner image for the card");
      return;
    }

    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append("title", form.title.trim());
      fd.append("subtitle", form.subtitle.trim());
      fd.append("category", form.category.trim());
      fd.append("description", form.description.trim());
      fd.append("buttonText", form.buttonText.trim());
      fd.append("order", form.order || "0");
      fd.append("status", form.status ? "Active" : "Inactive");

      // Dynamic Photo Count
      const totalGalleryCount = existingGallery.length + newGalleryFiles.length;
      if (form.category.toLowerCase().includes("media") || form.category.toLowerCase().includes("gallery")) {
        fd.append("metaText", `${totalGalleryCount} Photos`);
      } else {
        fd.append("metaText", form.metaText.trim() || `${totalGalleryCount} Photos`);
      }

      // Cover image
      if (form.image) {
        fd.append("image", form.image);
      }

      // Existing retained gallery
      fd.append("retainedGallery", JSON.stringify(existingGallery));

      // New multiple gallery images
      for (const file of newGalleryFiles) {
        fd.append("gallery", file);
      }

      if (editId) {
        await updateMediaEvent(editId, fd);
        toast.success("Media / Event updated successfully!");
      } else {
        await createMediaEvent(fd);
        toast.success("Media / Event created successfully!");
      }

      handleCloseModal();
      fetchData();
      fetchCategories();
    } catch (err) {
      console.error("Save media event error:", err);
      toast.error(err?.response?.data?.message || "Failed to save media event");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (item) => {
    try {
      setTogglingId(item._id);
      const res = await toggleMediaEventStatus(item._id);
      toast.success(res.message || "Status updated!");
      setData((prev) =>
        prev.map((c) =>
          c._id === item._id
            ? { ...c, status: c.status === "Active" ? "Inactive" : "Active" }
            : c
        )
      );
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (item) => {
    const confirm = await Swal.fire({
      title: "Delete Media / Event?",
      text: `Are you sure you want to delete "${item.title}"? This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    });

    if (confirm.isConfirmed) {
      try {
        setDeletingId(item._id);
        await deleteMediaEvent(item._id);
        toast.success("Media / Event deleted successfully!");
        setData((prev) => prev.filter((c) => c._id !== item._id));
        fetchCategories();
      } catch (err) {
        toast.error(err?.response?.data?.message || "Failed to delete item");
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl shadow-xs border border-slate-100">
        <div>
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <span className="p-2 bg-red-50 text-red-600 rounded-xl">
              <MdPermMedia className="text-xl" />
            </span>
            Media & Events Management
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Manage your photo galleries, conferences, press releases and upload multiple gallery images.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setPage(1);
              fetchData();
              fetchCategories();
            }}
            disabled={loading}
            className="p-2 text-slate-500 hover:text-red-600 bg-slate-50 hover:bg-red-50 rounded-xl transition-all border border-slate-200 cursor-pointer disabled:opacity-50"
            title="Refresh Media Events"
          >
            <MdRefresh className={`text-lg ${loading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md shadow-red-500/20 transition-all cursor-pointer"
          >
            <MdAdd className="text-base" />
            <span>Add Media / Event</span>
          </button>
        </div>
      </div>

      {/* ── Stats Bar ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Cards
            </p>
            <h3 className="text-2xl font-black text-slate-800 mt-0.5">{stats.total}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center">
            <MdPermMedia className="text-xl" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-green-500">
              Active Cards
            </p>
            <h3 className="text-2xl font-black text-green-600 mt-0.5">{stats.active}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
            <MdCheckCircle className="text-xl" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
              Inactive Cards
            </p>
            <h3 className="text-2xl font-black text-amber-600 mt-0.5">{stats.inactive}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <MdCancel className="text-xl" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-blue-500">
              Categories
            </p>
            <h3 className="text-2xl font-black text-blue-600 mt-0.5">{stats.uniqueCats || categories.length || 4}</h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <MdCategory className="text-xl" />
          </div>
        </div>
      </div>

      {/* ── Search & Filter Controls ────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
          <input
            type="text"
            placeholder="Search by title, description, category..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-all text-slate-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 outline-none cursor-pointer"
          >
            <option value="All">All Categories</option>
            {allCategorySuggestions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Status buttons */}
          {["All", "Active", "Inactive"].map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatusFilter(s === "All" ? "" : s);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                (s === "All" && !statusFilter) || statusFilter === s
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* ── Media & Events Table / Grid ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center items-center">
            <Loader />
          </div>
        ) : data.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <MdPermMedia className="text-2xl" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Media / Events Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {search || statusFilter || categoryFilter !== "All"
                ? "No records match your filters."
                : "No media cards created yet. Click 'Add Media / Event' to create one."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Image</th>
                  <th className="py-3 px-4">Title & Details</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Gallery Photos</th>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {data.map((item) => {
                  const imageSrc = resolveMediaImageUrl(item.image);
                  const photosCount = Array.isArray(item.gallery) ? item.gallery.length : (item.photoCount || 0);

                  return (
                    <tr
                      key={item._id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Image Thumbnail */}
                      <td className="py-3 px-4 w-28">
                        <div
                          onClick={() => setPreviewCard(item)}
                          className="w-24 h-16 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-xs cursor-pointer group-hover:scale-105 transition-transform flex items-center justify-center relative"
                          title="Click to preview"
                        >
                          {imageSrc ? (
                            <img
                              src={imageSrc}
                              alt={item.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/media-hero.png";
                              }}
                            />
                          ) : (
                            <FaImages className="text-slate-300 text-xl" />
                          )}
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                            <MdRemoveRedEye className="text-base drop-shadow" />
                          </div>
                        </div>
                      </td>

                      {/* Title & Description */}
                      <td className="py-3 px-4 max-w-xs sm:max-w-md">
                        <div className="font-bold text-slate-800 text-sm group-hover:text-red-600 transition-colors">
                          {item.title}
                        </div>
                        {item.description && (
                          <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                            {item.description}
                          </div>
                        )}
                      </td>

                      {/* Category Badge */}
                      <td className="py-3 px-4">
                        <span className="inline-block bg-red-50 text-red-700 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-red-100">
                          {item.category}
                        </span>
                      </td>

                      {/* Dynamic Photos Count (NO DUMMY 120!) */}
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-md text-[11px]">
                          <FaImages className="text-red-500 text-xs" />
                          <span>{photosCount} Photos</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {item.buttonText || "View Details"}
                        </div>
                      </td>

                      {/* Sort Order */}
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md text-[11px]">
                          #{item.order ?? 0}
                        </span>
                      </td>

                      {/* Status Toggle Switch */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleStatus(item)}
                          disabled={togglingId === item._id}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all ${
                            item.status === "Active"
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}
                        >
                          {item.status === "Active" ? (
                            <MdToggleOn className="text-lg text-green-600" />
                          ) : (
                            <MdToggleOff className="text-lg text-slate-400" />
                          )}
                          <span>{item.status}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setPreviewCard(item)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Preview Card & Gallery"
                          >
                            <MdRemoveRedEye className="text-base" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Card & Gallery"
                          >
                            <MdEdit className="text-base" />
                          </button>

                          <button
                            onClick={() => handleDelete(item)}
                            disabled={deletingId === item._id}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            title="Delete Card"
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

        {/* ── Pagination ────────────────────────────────────────────────────── */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
              >
                <MdChevronLeft className="text-base" />
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 cursor-pointer"
              >
                <MdChevronRight className="text-base" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal (With Multiple Gallery Images!) ─────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-red-100 text-red-600 rounded-xl">
                  <MdPermMedia className="text-lg" />
                </span>
                <div>
                  <h3 className="font-black text-slate-800 text-base">
                    {editId ? "Edit Media / Event Card & Gallery" : "Add New Media / Event Card"}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Upload cover image and multiple gallery photos.
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer border border-slate-200"
              >
                <MdClose className="text-base" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Title */}
              <div>
                <Label required>Title</Label>
                <input
                  type="text"
                  placeholder="e.g. Photo Gallery, Our Events, Press Releases..."
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className={inpClass}
                  required
                />
              </div>

              {/* Category (Manual Free-Text + Suggestions) */}
              <div>
                <Label required>Category</Label>
                <input
                  type="text"
                  list="mediaCategoriesList"
                  placeholder="Type or select category (e.g. Media, Event, Press Note, Social Media)"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className={inpClass}
                  required
                />
                <datalist id="mediaCategoriesList">
                  {allCategorySuggestions.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>

              {/* Description */}
              <div>
                <Label>Description</Label>
                <textarea
                  rows={2}
                  placeholder="Short description for the card..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={inpClass}
                />
              </div>

              {/* Button Text & Sort Order */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Button Text</Label>
                  <input
                    type="text"
                    placeholder="e.g. View Gallery, View Events"
                    value={form.buttonText}
                    onChange={(e) => setForm({ ...form, buttonText: e.target.value })}
                    className={inpClass}
                  />
                </div>
                <div>
                  <Label>Sort Order</Label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: e.target.value })}
                    className={inpClass}
                  />
                </div>
              </div>

              {/* 1. Main Cover / Banner Image */}
              <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200">
                <Label required={!editId}>Main Cover / Card Banner Image</Label>
                <div className="flex gap-4 items-center mt-2">
                  <div className="w-28 h-20 bg-white border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center overflow-hidden shrink-0 relative group">
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <MdOutlineCloudUpload className="text-2xl text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      id="mediaCoverInput"
                      accept="image/*"
                      onChange={handleCoverChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="mediaCoverInput"
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-xs"
                    >
                      <MdOutlineCloudUpload className="text-base text-red-500" />
                      <span>{previewImage ? "Change Cover Image" : "Choose Cover Image"}</span>
                    </label>
                    <p className="text-[10px] text-slate-400 mt-1">
                      This image will be displayed on the main card.
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. MULTIPLE GALLERY PHOTOS UPLOAD */}
              <div className="p-4 bg-red-50/30 rounded-2xl border border-red-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <MdPhotoLibrary className="text-red-600 text-base" />
                      Gallery Photos (Multiple Images)
                    </span>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Upload all the photos you want to show inside this gallery. Photo count is 100% dynamic!
                    </p>
                  </div>
                  <span className="bg-red-50 text-red-600 border border-red-200 text-xs font-black px-2.5 py-0.5 rounded-full">
                    {existingGallery.length + newGalleryFiles.length} Photos
                  </span>
                </div>

                {/* Upload Multiple Button */}
                <div>
                  <input
                    type="file"
                    id="multipleGalleryInput"
                    accept="image/*"
                    multiple
                    onChange={handleMultipleGalleryChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="multipleGalleryInput"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-sm active:scale-95"
                  >
                    <MdAdd className="text-base" />
                    <span>Upload Multiple Photos</span>
                  </label>
                  <span className="text-[11px] text-slate-400 ml-3">
                    (You can select multiple photos at once)
                  </span>
                </div>

                {/* Gallery Thumbnails Grid */}
                {(existingGallery.length > 0 || previewNewGallery.length > 0) ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-2 max-h-56 overflow-y-auto p-1 bg-white rounded-xl border border-slate-100">
                    {/* Existing Photos */}
                    {existingGallery.map((img, idx) => (
                      <div
                        key={img._id || idx}
                        className="relative group rounded-xl overflow-hidden aspect-square border border-slate-200 bg-slate-50"
                      >
                        <img
                          src={resolveMediaImageUrl(img.local || img.imageUrl)}
                          alt={img.title || `Photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingGalleryImage(idx)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center opacity-80 group-hover:opacity-100 hover:scale-110 transition-all cursor-pointer shadow-md"
                          title="Delete photo"
                        >
                          <MdClose className="text-xs" />
                        </button>
                        <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                          #{idx + 1}
                        </span>
                      </div>
                    ))}

                    {/* Newly Added Photos */}
                    {previewNewGallery.map((item, idx) => (
                      <div
                        key={`new-${idx}`}
                        className="relative group rounded-xl overflow-hidden aspect-square border-2 border-dashed border-red-300 bg-red-50/50"
                      >
                        <img
                          src={item.url}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveNewGalleryImage(idx)}
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center opacity-80 group-hover:opacity-100 hover:scale-110 transition-all cursor-pointer shadow-md"
                          title="Remove this photo"
                        >
                          <MdClose className="text-xs" />
                        </button>
                        <span className="absolute bottom-1 left-1 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                          New
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center bg-white rounded-xl border border-dashed border-slate-200">
                    <p className="text-xs text-slate-400 font-semibold">
                      No gallery photos added yet. Click "+ Upload Multiple Photos" above.
                    </p>
                  </div>
                )}
              </div>

              {/* Status Toggle */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-700">Publish Status</span>
                  <p className="text-[10px] text-slate-400">
                    Active items will appear immediately on the website.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, status: !prev.status }))}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all ${
                    form.status
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-slate-100 text-slate-500 border border-slate-200"
                  }`}
                >
                  {form.status ? (
                    <MdToggleOn className="text-xl text-green-600" />
                  ) : (
                    <MdToggleOff className="text-xl text-slate-400" />
                  )}
                  <span>{form.status ? "Active" : "Inactive"}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 text-slate-500 hover:bg-slate-100 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-red-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <span>Saving...</span>
                  ) : (
                    <span>{editId ? "Update Item" : "Save Item"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Preview Card & Gallery Modal ─────────────────────────────────────── */}
      {previewCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col p-6 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-red-50 text-red-600 rounded-lg">
                  <MdPermMedia className="text-sm" />
                </span>
                <span className="bg-red-50 text-red-600 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                  {previewCard.category}
                </span>
                <h4 className="font-bold text-slate-800 text-sm truncate">{previewCard.title}</h4>
              </div>
              <button
                onClick={() => setPreviewCard(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <MdClose className="text-sm" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 flex-1 pr-1">
              {/* Cover Banner */}
              <div className="w-full aspect-[16/9] max-h-[220px] bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 flex items-center justify-center">
                <img
                  src={resolveMediaImageUrl(previewCard.image)}
                  alt={previewCard.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h5 className="font-black text-slate-800 text-lg">{previewCard.title}</h5>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {previewCard.description}
                </p>
              </div>

              {/* Photos Gallery Grid in Preview */}
              {Array.isArray(previewCard.gallery) && previewCard.gallery.length > 0 && (
                <div className="pt-2">
                  <h6 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <MdPhotoLibrary className="text-red-500" />
                    Uploaded Photos ({previewCard.gallery.length})
                  </h6>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                    {previewCard.gallery.map((g, idx) => (
                      <div
                        key={g._id || idx}
                        className="rounded-xl overflow-hidden aspect-square border border-slate-200 bg-slate-50 group relative"
                      >
                        <img
                          src={resolveMediaImageUrl(g.local || g.imageUrl)}
                          alt={g.title || `Photo ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setPreviewCard(null)}
              className="mt-5 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaEvents;
