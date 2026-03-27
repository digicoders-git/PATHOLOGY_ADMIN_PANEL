import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryTree,
} from "../apis/testAndServices";
import { toast } from "react-toastify";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdClose,
  MdRefresh,
  MdImage,
  MdChevronRight,
  MdKeyboardArrowDown,
  MdOutlineScience,
  MdCategory,
} from "react-icons/md";
import Swal from "sweetalert2";

const Categories = () => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [categoryData, setCategoryData] = useState({});
  const [catLoading, setCatLoading] = useState({});

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editId, setEditId] = useState(null);
  const [catForm, setCatForm] = useState({ name: "", description: "", image: null });
  const [previewUrl, setPreviewUrl] = useState(null);

  const fetchCats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getCategories();
      if (res.success) setCategories(res.data);
    } catch {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCats();
  }, [fetchCats]);

  const fetchTestsForCategory = async (catId) => {
    if (categoryData[catId]) return;
    try {
      setCatLoading((p) => ({ ...p, [catId]: true }));
      const res = await getCategoryTree(catId);
      if (res.success) setCategoryData((p) => ({ ...p, [catId]: res.data }));
    } catch {
      toast.error("Failed to load tests");
    } finally {
      setCatLoading((p) => ({ ...p, [catId]: false }));
    }
  };

  const toggleExpand = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      fetchTestsForCategory(id);
    }
  };

  const openAdd = () => {
    setEditId(null);
    setCatForm({ name: "", description: "", image: null });
    setPreviewUrl(null);
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditId(cat._id);
    setCatForm({ name: cat.name, description: cat.description || "", image: null });
    const img = cat.image?.cloudinary || (cat.image?.local ? `${import.meta.env.VITE_API_BASE_URL}/${cat.image.local}` : null);
    setPreviewUrl(img);
    setModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCatForm((p) => ({ ...p, image: file }));
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("name", catForm.name);
      formData.append("description", catForm.description);
      if (catForm.image) formData.append("categoryIcon", catForm.image);

      const res = editId
        ? await updateCategory(editId, formData)
        : await createCategory(formData);

      if (res.success) {
        toast.success(res.message);
        setModalOpen(false);
        fetchCats();
      }
    } catch {
      toast.error("Failed to save category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete Category?",
      text: "This will permanently remove the category.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#111",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });
    if (result.isConfirmed) {
      try {
        const res = await deleteCategory(id);
        if (res.success) {
          toast.success("Category deleted");
          fetchCats();
        }
      } catch {
        toast.error("Delete failed");
      }
    }
  };

  const getImgSrc = (image) => {
    if (!image) return null;
    return image.cloudinary || (image.local ? `${import.meta.env.VITE_API_BASE_URL}/${image.local}` : null);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: colors.text }}>
            Categories
          </h1>
          <p className="text-sm mt-1 opacity-50">
            Manage test categories &nbsp;·&nbsp; {categories.length} total
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchCats}
            title="Refresh"
            className="p-2.5 border rounded-sm hover:bg-black/5 transition-all"
            style={{ borderColor: colors.accent + "30", color: colors.text }}
          >
            <MdRefresh size={18} />
          </button>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-6 py-2.5 bg-black text-white text-[11px] font-black uppercase tracking-widest rounded transition-all hover:bg-slate-800"
          >
            <MdAdd size={18} /> Add Category
          </button>
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-sm border shadow-sm overflow-hidden"
        style={{ backgroundColor: colors.background, borderColor: colors.accent + "20" }}
      >
        {loading ? (
          <div className="py-20 text-center text-sm opacity-40">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="py-20 text-center text-sm opacity-40">No categories found</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ backgroundColor: colors.accent + "08" }}>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50 w-12"></th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50">Icon & Name</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50">Description</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {categories.map((cat) => (
                <React.Fragment key={cat._id}>
                  {/* Category Row */}
                  <tr
                    className="hover:bg-black/[0.03] transition-colors group"
                    style={expandedId === cat._id ? { backgroundColor: colors.accent + "05" } : {}}
                  >
                    {/* Expand Toggle */}
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => toggleExpand(cat._id)}
                        className="p-1.5 rounded-sm transition-all hover:bg-black/5"
                        style={{ color: expandedId === cat._id ? colors.primary : colors.text }}
                      >
                        {expandedId === cat._id ? (
                          <MdKeyboardArrowDown size={20} />
                        ) : (
                          <MdChevronRight size={20} />
                        )}
                      </button>
                    </td>

                    {/* Icon + Name */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-sm overflow-hidden shrink-0 flex items-center justify-center border"
                          style={{ borderColor: colors.accent + "20", backgroundColor: colors.accent + "08" }}
                        >
                          {getImgSrc(cat.image) ? (
                            <img src={getImgSrc(cat.image)} alt={cat.name} className="w-full h-full object-cover" />
                          ) : (
                            <MdCategory size={18} className="opacity-30" />
                          )}
                        </div>
                        <span className="text-sm font-bold uppercase tracking-tight" style={{ color: colors.text }}>
                          {cat.name}
                        </span>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="px-5 py-3.5">
                      <p className="text-xs opacity-50 line-clamp-1 max-w-xs">
                        {cat.description || "—"}
                      </p>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(cat)}
                          className="p-2 rounded-sm hover:bg-black/5 transition-colors"
                          style={{ color: colors.primary }}
                          title="Edit"
                        >
                          <MdEdit size={17} />
                        </button>
                        <button
                          onClick={() => handleDelete(cat._id)}
                          className="p-2 rounded-sm hover:bg-red-100 text-red-500 transition-colors"
                          title="Delete"
                        >
                          <MdDelete size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Tests Row */}
                  {expandedId === cat._id && (
                    <tr>
                      <td colSpan="4" className="px-16 py-6" style={{ backgroundColor: colors.accent + "04" }}>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4 flex items-center gap-2">
                          <MdOutlineScience size={14} /> Tests in {cat.name}
                        </p>

                        {catLoading[cat._id] ? (
                          <p className="text-xs opacity-40">Loading tests...</p>
                        ) : (categoryData[cat._id]?.services || []).length === 0 ? (
                          <p className="text-xs opacity-30 italic">No tests found in this category</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {categoryData[cat._id].services.map((test) => (
                              <div
                                key={test._id}
                                className="flex items-center justify-between p-3 rounded-sm border"
                                style={{
                                  backgroundColor: colors.background,
                                  borderColor: colors.accent + "20",
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className="w-8 h-8 rounded-sm overflow-hidden shrink-0 flex items-center justify-center border"
                                    style={{ borderColor: colors.accent + "15", backgroundColor: colors.accent + "06" }}
                                  >
                                    {getImgSrc(test.image) ? (
                                      <img src={getImgSrc(test.image)} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                      <MdOutlineScience size={14} className="opacity-20" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-black uppercase tracking-tight" style={{ color: colors.text }}>
                                      {test.title}
                                    </p>
                                    <p className="text-[9px] font-bold opacity-40 uppercase">
                                      {test.test_code || "N/A"}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-[11px] font-black" style={{ color: colors.text }}>₹{test.price}</p>
                                  {test.mrp && (
                                    <p className="text-[9px] opacity-30 line-through">₹{test.mrp}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight">
                  {editId ? "Edit Category" : "Add Category"}
                </h2>
                <p className="text-[10px] opacity-40 font-bold uppercase mt-1">
                  {editId ? "Update category details" : "Create a new test category"}
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="opacity-40 hover:opacity-100 transition-opacity">
                <MdClose size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-6">
              <form id="cat-form" onSubmit={handleSubmit} className="space-y-5">
                {/* Image Upload */}
                <div className="flex justify-center">
                  <label className="cursor-pointer group">
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                    <div className="w-24 h-24 rounded-sm border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-all hover:border-black"
                      style={{ borderColor: colors.accent + "40" }}>
                      {previewUrl ? (
                        <img src={previewUrl} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <>
                          <MdImage size={24} className="opacity-30 mb-1" />
                          <span className="text-[9px] font-black uppercase opacity-40">Icon</span>
                        </>
                      )}
                    </div>
                    <p className="text-[9px] font-bold uppercase opacity-30 text-center mt-2 tracking-widest">
                      Click to upload
                    </p>
                  </label>
                </div>

                {/* Name */}
                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 block mb-2">Category Name *</label>
                  <input
                    required
                    type="text"
                    value={catForm.name}
                    onChange={(e) => setCatForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Blood Tests"
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded font-bold text-sm outline-none focus:border-black transition-all"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 block mb-2">Description</label>
                  <textarea
                    value={catForm.description}
                    onChange={(e) => setCatForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Short description..."
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded font-bold text-sm outline-none focus:border-black transition-all resize-none"
                  />
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t flex justify-end gap-3 bg-slate-50">
              <button
                onClick={() => setModalOpen(false)}
                className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                form="cat-form"
                type="submit"
                disabled={submitting}
                className="px-10 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded hover:opacity-80 transition-all disabled:opacity-30 shadow-xl"
              >
                {submitting ? "Saving..." : editId ? "Save Changes" : "Create Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
