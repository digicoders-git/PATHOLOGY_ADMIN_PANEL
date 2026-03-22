import React, { useState, useEffect, useCallback } from "react";
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
  MdCategory,
  MdRefresh,
  MdImage,
  MdChevronRight,
  MdKeyboardArrowDown,
  MdOutlineScience
} from "react-icons/md";
import Loader from "./ui/Loader";
import Swal from "sweetalert2";

const Categories = () => {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [categoryData, setCategoryData] = useState({}); // { catId: { services: [] } }
  const [catLoading, setCatLoading] = useState({});
  
  // CRUD Modals
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catForm, setCatForm] = useState({ name: "", description: "", image: null });
  const [editCatId, setEditCatId] = useState(null);
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

  const fetchTestsForCategory = async (catId) => {
    if (categoryData[catId]) return;
    try {
      setCatLoading(prev => ({ ...prev, [catId]: true }));
      const res = await getCategoryTree(catId);
      if (res.success) {
        setCategoryData(prev => ({ ...prev, [catId]: res.data }));
      }
    } catch {
      toast.error("Failed to load tests");
    } finally {
      setCatLoading(prev => ({ ...prev, [catId]: false }));
    }
  };

  useEffect(() => {
    fetchCats();
  }, [fetchCats]);

  const toggleExpand = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      fetchTestsForCategory(id);
    }
  };

  // Category Actions
  const handleAddCat = () => {
    setEditCatId(null);
    setCatForm({ name: "", description: "", image: null });
    setPreviewUrl(null);
    setIsCatModalOpen(true);
  };

  const handleEditCat = (cat) => {
    setEditCatId(cat._id);
    setCatForm({ name: cat.name, description: cat.description || "", image: null });
    setPreviewUrl(cat.image?.cloudinary || cat.image?.local ? (cat.image.cloudinary || `${import.meta.env.VITE_API_BASE_URL}/${cat.image.local}`) : null);
    setIsCatModalOpen(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCatForm({ ...catForm, image: file });
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleCatSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("name", catForm.name);
      formData.append("description", catForm.description);
      if (catForm.image) {
        formData.append("categoryIcon", catForm.image);
      }

      const res = editCatId 
        ? await updateCategory(editCatId, formData)
        : await createCategory(formData);
      
      if (res.success) {
        toast.success(res.message);
        setIsCatModalOpen(false);
        fetchCats();
      }
    } catch (err) {
      toast.error(err.message || "Failed to save category");
    }
  };

  const handleDeleteCat = async (id) => {
    const result = await Swal.fire({
      title: "Delete Category?",
      text: "Permanent removal of this classification.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      confirmButtonText: "Yes, delete it!"
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

  return (
    <div className="p-4 md:p-8 min-h-screen bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto">
        
        {/* Simple Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">CLASSIFICATIONS</h1>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Manage Categories & Linked Tests</p>
          </div>
          <div className="flex gap-3">
             <button onClick={fetchCats} className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-blue-600 transition-all shadow-sm"><MdRefresh size={20} /></button>
             <button onClick={handleAddCat} className="px-6 py-3 bg-slate-900 border border-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all shadow-xl flex items-center gap-2 uppercase tracking-widest leading-none">
                <MdAdd size={20} />
                Add Category
             </button>
          </div>
        </div>

        {/* Table View */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
           {loading ? (
             <div className="py-20 flex justify-center"><Loader /></div>
           ) : (
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="bg-slate-50/50 border-b border-slate-100">
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-12"></th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Icon & Name</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tests Count</th>
                      <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {categories.map((cat) => (
                      <React.Fragment key={cat._id}>
                         <tr className={`hover:bg-slate-50/50 transition-colors group ${expandedId === cat._id ? 'bg-blue-50/20' : ''}`}>
                            <td className="px-6 py-4">
                               <button 
                                 onClick={() => toggleExpand(cat._id)} 
                                 className={`p-2 rounded-xl transition-all ${expandedId === cat._id ? 'bg-blue-100 text-blue-600' : 'text-slate-300 hover:bg-slate-100'}`}
                               >
                                  {expandedId === cat._id ? <MdKeyboardArrowDown size={24} /> : <MdChevronRight size={24} />}
                               </button>
                            </td>
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-100 overflow-hidden flex-shrink-0 shadow-sm">
                                     {cat.image?.cloudinary || cat.image?.local ? (
                                        <img 
                                          src={cat.image.cloudinary || `${import.meta.env.VITE_API_BASE_URL}/${cat.image.local}`} 
                                          alt={cat.name} 
                                          className="w-full h-full object-cover"
                                        />
                                     ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                           <MdCategory size={24} />
                                        </div>
                                     )}
                                  </div>
                                  <span className="text-sm font-bold text-slate-800 uppercase tracking-tight">{cat.name}</span>
                               </div>
                            </td>
                            <td className="px-6 py-4">
                               <p className="text-[11px] text-slate-400 font-medium line-clamp-1 max-w-xs">{cat.description || "—"}</p>
                            </td>
                            <td className="px-6 py-4">
                               <span className="text-[10px] font-black text-blue-600 px-3 py-1 bg-blue-50 rounded-lg uppercase tracking-wider">
                                  Click arrow to view
                               </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                               <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => handleEditCat(cat)} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"><MdEdit size={18} /></button>
                                  <button onClick={() => handleDeleteCat(cat._id)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition-colors"><MdDelete size={18} /></button>
                               </div>
                            </td>
                         </tr>
                         
                         {/* Expanded Tests View */}
                         {expandedId === cat._id && (
                           <tr>
                              <td colSpan="5" className="px-20 py-8 bg-slate-50 relative overflow-hidden">
                                 <div className="absolute left-10 top-0 bottom-0 w-1 bg-blue-100/50"></div>
                                 <div className="relative">
                                    <div className="flex items-center gap-2 mb-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                       <MdOutlineScience size={18} />
                                       Tests belonging to {cat.name}
                                    </div>
                                    
                                    {catLoading[cat._id] ? (
                                      <div className="flex items-center gap-3 text-sm text-slate-400 font-bold">
                                         <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent animate-spin rounded-full"></div>
                                         Synchronizing data...
                                      </div>
                                    ) : (categoryData[cat._id]?.services || []).length === 0 ? (
                                      <div className="p-8 bg-white rounded-3xl border border-slate-100 text-center">
                                         <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">No tests found in this category</p>
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                                         {categoryData[cat._id].services.map((test) => (
                                            <div key={test._id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group/test hover:border-blue-200 transition-colors">
                                               <div className="flex items-center gap-3">
                                                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-50 flex items-center justify-center overflow-hidden">
                                                     {test.image?.cloudinary || test.image?.local ? (
                                                        <img src={test.image.cloudinary || `${import.meta.env.VITE_API_BASE_URL}/${test.image.local}`} className="w-full h-full object-cover" />
                                                     ) : <MdOutlineScience size={20} className="text-slate-200" />}
                                                  </div>
                                                  <div>
                                                     <h4 className="text-[11px] font-black text-slate-700 uppercase">{test.title}</h4>
                                                     <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">{test.test_code || 'N/A'}</p>
                                                  </div>
                                               </div>
                                               <div className="text-right">
                                                  <p className="text-[10px] font-black text-slate-800 tracking-tight">₹{test.price}</p>
                                                  <p className="text-[9px] text-slate-300 line-through">₹{test.mrp}</p>
                                               </div>
                                            </div>
                                         ))}
                                      </div>
                                    )}
                                 </div>
                              </td>
                           </tr>
                         )}
                      </React.Fragment>
                   ))}
                </tbody>
             </table>
           )}
        </div>

        {/* Category Modal */}
        {isCatModalOpen && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsCatModalOpen(false)}></div>
             <div className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
                <div className="p-6 border-b flex justify-between items-center">
                   <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-800">{editCatId ? 'Edit Category' : 'New Category'}</h2>
                   <button onClick={() => setIsCatModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><MdClose size={22} /></button>
                </div>
                <form onSubmit={handleCatSubmit} className="p-8 space-y-6">
                   
                   <div className="flex justify-center">
                      <label className="relative cursor-pointer group">
                         <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                         <div className="w-28 h-28 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-100 flex flex-col items-center justify-center overflow-hidden group-hover:border-blue-400 transition-all">
                            {previewUrl ? (
                               <img src={previewUrl} className="w-full h-full object-cover" />
                            ) : (
                               <>
                                  <MdImage size={24} className="text-slate-300 mb-2" />
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Icon</span>
                               </>
                            )}
                         </div>
                      </label>
                   </div>

                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Title</label>
                      <input 
                         required
                         type="text" 
                         value={catForm.name}
                         onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                         className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-bold outline-none border border-transparent focus:border-blue-100 transition-all"
                      />
                   </div>

                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Short Description</label>
                      <textarea 
                        value={catForm.description}
                        onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                        className="w-full p-4 bg-slate-50 rounded-2xl text-xs font-medium outline-none h-24 focus:bg-white transition-all resize-none border border-transparent focus:border-blue-100"
                      ></textarea>
                   </div>

                   <button className="w-full py-4 bg-slate-900 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-800 shadow-xl shadow-slate-900/10 transition-all">
                      {editCatId ? 'Save Changes' : 'Initialize Category'}
                   </button>
                </form>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Categories;
