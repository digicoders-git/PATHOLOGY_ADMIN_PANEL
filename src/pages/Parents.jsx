import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import {
  getAllParentsWithLabs,
  createParent,
  updateParent,
  deleteParent,
  updateParentStatus,
} from "../apis/parent";
import { toast } from "react-toastify";
import {
  MdDelete, MdEdit, MdClose, MdRefresh, MdSearch,
  MdOutlineScience, MdVisibility, MdKeyboardArrowDown, MdChevronRight,
} from "react-icons/md";
import Loader from "./ui/Loader";
import Swal from "sweetalert2";
import Toggle from "../components/ui/Toggle";
import ModernSelect from "../components/ui/ModernSelect";

const Parents = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [expandedId, setExpandedId] = useState(null);
  const [editingParent, setEditingParent] = useState(null);
  const [formData, setFormData] = useState({ name: "" });
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllParentsWithLabs({ search, status: statusFilter, page, limit: 10 });
      if (res.success) { setData(res.data); setPagination(res.pagination); }
    } catch (error) {
      toast.error(error.message || "Failed to fetch parents");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchTerm); setPage(1); }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleEdit = (parent) => {
    setEditingParent(parent);
    setFormData({ name: parent.name });
    setIsModalOpen(true);
  };

  const resetForm = () => { setEditingParent(null); setFormData({ name: "" }); setIsModalOpen(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.warning("Please enter a name");
    try {
      setSubmitting(true);
      const res = editingParent
        ? await updateParent(editingParent._id, formData)
        : await createParent(formData);
      if (res.success) { toast.success(res.message); resetForm(); fetchData(); }
    } catch (error) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    try {
      setTogglingId(id);
      const res = await updateParentStatus(id, !currentStatus);
      if (res.success) {
        toast.success(res.message);
        setData(prev => prev.map(item => item._id === id ? { ...item, status: !currentStatus } : item));
      }
    } catch (error) {
      toast.error(error.message || "Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: colors.primary,
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await deleteParent(id);
          if (res.success) { toast.success(res.message); fetchData(); }
        } catch (error) {
          toast.error(error.message || "Failed to delete");
        }
      }
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Parent Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage parent lab organizations and their registered labs</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button onClick={fetchData} className="px-4 py-2 bg-white border border-slate-200 text-xs font-bold text-slate-600 rounded-lg hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2">
            <MdRefresh size={16} /> Refresh
          </button>
          <button onClick={() => setIsModalOpen(true)} className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
            <MdEdit size={16} /> Add Parent
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
        <div className="relative flex-1 w-full">
          <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by parent name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all text-sm"
          />
        </div>
        <ModernSelect
          value={statusFilter}
          onChange={(val) => { setStatusFilter(val); setPage(1); }}
          options={[
            { label: "All Status", value: "" },
            { label: "Active Only", value: "true" },
            { label: "Inactive Only", value: "false" },
          ]}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center"><Loader /></div>
        ) : data.length === 0 ? (
          <div className="py-24 text-center text-xs text-slate-400 uppercase tracking-widest">No parent organizations found</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 w-10"></th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">#</th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Parent Name</th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Linked Labs</th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-center">Status</th>
                <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((item, index) => (
                <React.Fragment key={item._id}>
                  {/* Parent Row */}
                  <tr className="hover:bg-slate-50/50 transition-colors" style={expandedId === item._id ? { backgroundColor: colors.accent + "05" } : {}}>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => setExpandedId(expandedId === item._id ? null : item._id)}
                        className="p-1 rounded transition-all hover:bg-black/5"
                        style={{ color: expandedId === item._id ? colors.primary : colors.text }}
                      >
                        {expandedId === item._id ? <MdKeyboardArrowDown size={20} /> : <MdChevronRight size={20} />}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-400">
                      {(pagination.page - 1) * pagination.limit + index + 1}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-sm text-slate-700 cursor-pointer" onClick={() => setExpandedId(expandedId === item._id ? null : item._id)}>
                      {item.name}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        onClick={() => setExpandedId(expandedId === item._id ? null : item._id)}
                        className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-bold cursor-pointer hover:bg-blue-100 transition-all"
                      >
                        {item.labCount || 0} LABS
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex justify-center scale-90">
                        <Toggle checked={item.status} loading={togglingId === item._id} onChange={() => handleStatusToggle(item._id, item.status)} />
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit">
                          <MdEdit size={17} />
                        </button>
                        <button onClick={() => handleDelete(item._id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete">
                          <MdDelete size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Labs */}
                  {expandedId === item._id && (
                    <tr>
                      <td colSpan={6} className="px-10 py-5" style={{ backgroundColor: colors.accent + "04" }}>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4 flex items-center gap-2">
                          <MdOutlineScience size={13} /> Labs under {item.name}
                        </p>

                        {item.labCount === 0 ? (
                          <p className="text-xs text-slate-300 italic">No labs registered under this parent.</p>
                        ) : (
                          <div className="overflow-x-auto rounded-lg border border-slate-100">
                            <table className="w-full text-left border-collapse min-w-[900px]">
                              <thead>
                                <tr className="bg-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b">
                                  <th className="px-4 py-2.5">#</th>
                                  <th className="px-4 py-2.5">Lab</th>
                                  <th className="px-4 py-2.5">Type</th>
                                  <th className="px-4 py-2.5">Location</th>
                                  <th className="px-4 py-2.5">Contact</th>
                                  <th className="px-4 py-2.5">Owner</th>
                                  <th className="px-4 py-2.5 text-center">Services</th>
                                  <th className="px-4 py-2.5 text-center">Status</th>
                                  <th className="px-4 py-2.5 text-right">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 bg-white">
                                {item.labs.map((lab, idx) => (
                                  <tr key={lab._id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 text-xs text-slate-400 font-bold">{idx + 1}</td>

                                    {/* Lab Info */}
                                    <td className="px-4 py-3">
                                      <div className="flex items-center gap-2.5">
                                        {lab.labLogo ? (
                                          <img src={lab.labLogo} className="w-8 h-8 rounded object-cover shrink-0 border border-slate-100" alt="" />
                                        ) : (
                                          <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center shrink-0">
                                            <MdOutlineScience size={14} className="text-slate-400" />
                                          </div>
                                        )}
                                        <div>
                                          <p className="text-xs font-bold text-slate-800">{lab.labName}</p>
                                          <p className="text-[10px] text-slate-400">{lab.registrationNumber || "—"}</p>
                                        </div>
                                      </div>
                                    </td>

                                    <td className="px-4 py-3">
                                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">{lab.labType || "—"}</span>
                                    </td>

                                    <td className="px-4 py-3">
                                      <p className="text-xs font-semibold text-slate-600">{lab.city || "—"}, {lab.state || "—"}</p>
                                      <p className="text-[10px] text-slate-400">{lab.pincode || ""}</p>
                                    </td>

                                    <td className="px-4 py-3">
                                      <p className="text-xs text-slate-600">{lab.phone || "—"}</p>
                                      <p className="text-[10px] text-slate-400 truncate max-w-[140px]">{lab.email || ""}</p>
                                    </td>

                                    <td className="px-4 py-3">
                                      <p className="text-xs font-semibold text-slate-600">{lab.ownerName || "—"}</p>
                                      <p className="text-[10px] text-slate-400">{lab.ownerPhone || ""}</p>
                                    </td>

                                    <td className="px-4 py-3">
                                      <div className="flex flex-wrap gap-1 justify-center">
                                        {lab.homeCollection && <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">Home</span>}
                                        {lab.is24x7 && <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">24x7</span>}
                                        {lab.emergency && <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">Emergency</span>}
                                        {lab.ambulanceService && <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">Ambulance</span>}
                                        {!lab.homeCollection && !lab.is24x7 && !lab.emergency && !lab.ambulanceService && <span className="text-[9px] text-slate-300">—</span>}
                                      </div>
                                    </td>

                                    <td className="px-4 py-3 text-center">
                                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${lab.status ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                                        {lab.status ? "Active" : "Inactive"}
                                      </span>
                                    </td>

                                    <td className="px-4 py-3 text-right">
                                      <button
                                        onClick={() => navigate(`/dashboard/registration-details/${lab._id}`)}
                                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                        title="View Details"
                                      >
                                        <MdVisibility size={16} />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
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

        {/* Pagination */}
        {!loading && data.length > 0 && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Page {pagination.page} of {pagination.totalPages}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(page - 1)}
                className="px-4 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 transition-all">Prev</button>
              <button disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}
                className="px-4 py-1.5 border border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 disabled:opacity-30 transition-all">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800">
                {editingParent ? "Edit Parent Record" : "Add New Parent"}
              </h2>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 transition-colors" disabled={submitting}>
                <MdClose size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8">
              <div>
                <label className="text-[10px] font-bold uppercase text-slate-400 mb-2 block tracking-widest">Parent Organization Name</label>
                <input
                  type="text" required autoFocus
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="E.g. Lalpath Pathology"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-400 transition-all text-sm font-semibold"
                />
                <p className="text-[10px] text-slate-400 mt-2 font-medium italic">Enter the unique title for the parent entity.</p>
              </div>
              <div className="mt-8 flex gap-3">
                <button type="button" onClick={resetForm} disabled={submitting}
                  className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-slate-100 rounded-lg transition-all">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="flex-[2] py-3 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? (
                    <><div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
                  ) : (editingParent ? "Update Parent" : "Create Parent")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Parents;
