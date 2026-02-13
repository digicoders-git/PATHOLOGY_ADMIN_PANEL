import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import {
  getAllParents,
  createParent,
  updateParent,
  deleteParent,
  updateParentStatus,
} from "../apis/parent";
import { toast } from "react-toastify";
import { MdDelete, MdEdit, MdClose, MdRefresh, MdSearch } from "react-icons/md";
import Loader from "./ui/Loader";
import Swal from "sweetalert2";
import Toggle from "../components/ui/Toggle";
import ModernSelect from "../components/ui/ModernSelect";

const Parents = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });
  const [editingParent, setEditingParent] = useState(null);
  const [formData, setFormData] = useState({ name: "" });
  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllParents({
        search,
        status: statusFilter,
        page,
        limit: 10,
      });
      if (res.success) {
        setData(res.data);
        setPagination(res.pagination);
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch parents");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleEdit = (parent) => {
    setEditingParent(parent);
    setFormData({ name: parent.name });
    // Scroll to form on mobile
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditingParent(null);
    setFormData({ name: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.warning("Please enter a name");

    try {
      setSubmitting(true);
      let res;
      if (editingParent) {
        res = await updateParent(editingParent._id, formData);
      } else {
        res = await createParent(formData);
      }

      if (res.success) {
        toast.success(res.message);
        resetForm();
        fetchData();
      }
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
        setData((prev) =>
          prev.map((item) =>
            item._id === id ? { ...item, status: !currentStatus } : item,
          ),
        );
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
          if (res.success) {
            toast.success(res.message);
            fetchData();
          }
        } catch (error) {
          toast.error(error.message || "Failed to delete");
        }
      }
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1
            className="text-2xl font-bold uppercase tracking-tight"
            style={{ color: colors.text }}
          >
            Parent Management
          </h1>
          <p className="text-sm opacity-60" style={{ color: colors.text }}>
            Manage parent lab organizations and titles
          </p>
        </div>
        <button
          onClick={fetchData}
          className="p-2 rounded-full hover:bg-black/5 transition-all text-primary"
          title="Refresh Data"
        >
          <MdRefresh size={24} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Table */}
        <div className="lg:col-span-8 order-2 lg:order-1">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
            <div className="relative flex-1 w-full">
              <MdSearch
                className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-sm border outline-none focus:ring-1 transition-all text-sm"
                style={{ borderColor: colors.accent + "20" }}
              />
            </div>
            <ModernSelect
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
              options={[
                { label: "All Status", value: "" },
                { label: "Active", value: "true" },
                { label: "Inactive", value: "false" },
              ]}
            />
          </div>

          <div
            className="rounded-sm border shadow-sm overflow-hidden bg-white"
            style={{ borderColor: colors.accent + "20" }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr style={{ backgroundColor: colors.accent + "05" }}>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider opacity-60">
                      #
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider opacity-60">
                      Parent Name
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider opacity-60 text-center">
                      Labs Count
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider opacity-60">
                      Status
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider opacity-60 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="py-20 text-center">
                        <Loader />
                      </td>
                    </tr>
                  ) : data.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="py-20 text-center opacity-40 uppercase text-xs font-bold"
                      >
                        No parents found
                      </td>
                    </tr>
                  ) : (
                    data.map((item, index) => (
                      <tr
                        key={item._id}
                        className="hover:bg-black/5 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm opacity-40">
                          {index + 1}
                        </td>
                        <td
                          className="px-6 py-4 font-bold text-sm uppercase tracking-tight"
                          style={{ color: colors.text }}
                        >
                          {item.name}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() =>
                              navigate(
                                `/dashboard/registrations?regType=parent&parentId=${item._id}`,
                              )
                            }
                            className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full text-xs font-bold hover:bg-blue-100 transition-all active:scale-95"
                          >
                            {item.registrationCount || 0} Labs
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          <Toggle
                            checked={item.status}
                            loading={togglingId === item._id}
                            onChange={() =>
                              handleStatusToggle(item._id, item.status)
                            }
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-2 rounded-sm hover:bg-black/5 text-blue-600 transition-all"
                              title="Edit"
                            >
                              <MdEdit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(item._id)}
                              className="p-2 rounded-sm hover:bg-red-50 text-red-600 transition-all"
                              title="Delete"
                            >
                              <MdDelete size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && data.length > 0 && (
              <div
                className="px-6 py-4 border-t flex items-center justify-between"
                style={{ borderColor: colors.accent + "10" }}
              >
                <p className="text-xs opacity-50 uppercase font-bold tracking-tight">
                  Page {pagination.page} of {pagination.totalPages || 1}
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="px-3 py-1.5 border rounded-sm hover:bg-black/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-[10px] font-black uppercase"
                    style={{ borderColor: colors.accent + "20" }}
                  >
                    Prev
                  </button>
                  <button
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage(page + 1)}
                    className="px-3 py-1.5 border rounded-sm hover:bg-black/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed text-[10px] font-black uppercase"
                    style={{ borderColor: colors.accent + "20" }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="lg:col-span-4 order-1 lg:order-2 sticky top-6">
          <div
            className="bg-white rounded-sm border shadow-sm overflow-hidden"
            style={{ borderColor: colors.accent + "20" }}
          >
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2
                className="text-sm font-black uppercase tracking-tight"
                style={{ color: colors.primary }}
              >
                {editingParent ? "Edit Parent Record" : "Add New Parent"}
              </h2>
              {editingParent && (
                <button
                  onClick={resetForm}
                  className="p-1 hover:bg-black/5 rounded-full"
                  title="Cancel Edit"
                >
                  <MdClose size={20} />
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 mb-2 block tracking-widest px-1">
                    Parent Organization Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="E.g. Lalpath Pathology"
                    className="w-full px-4 py-3 rounded-sm border outline-none focus:ring-1 transition-all text-sm font-semibold"
                    style={{
                      borderColor: colors.accent + "30",
                      backgroundColor: colors.background,
                      color: colors.text,
                    }}
                  />
                  <p className="text-[9px] opacity-40 mt-2 px-1 font-medium italic">
                    Enter the unique identifier or title for the parent entity.
                  </p>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-8 py-3.5 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-sm hover:opacity-90 transition-all shadow-md active:scale-95 disabled:opacity-50"
                style={{ backgroundColor: colors.primary }}
              >
                {submitting
                  ? "Processing..."
                  : editingParent
                    ? "Update Parent"
                    : "Add Parent"}
              </button>

              {editingParent && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="w-full mt-3 py-3 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
                >
                  Cancel & Add New
                </button>
              )}
            </form>
          </div>

          <div className="mt-6 p-4 bg-blue-50/50 border border-blue-100/50 rounded-sm">
            <h4 className="text-[10px] font-black uppercase text-blue-800 mb-2">
              Quick Info
            </h4>
            <p className="text-[11px] text-blue-700 leading-relaxed opacity-70">
              Parent records are used to group multiple labs under a single
              entity. Set the status to <strong>Inactive</strong> to temporarily
              hide its visibility in dropdowns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Parents;
