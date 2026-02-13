import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import {
  getTestServices,
  createTestService,
  updateTestService,
  deleteTestService,
  updateTestServiceStatus,
} from "../apis/testAndServices";
import { toast } from "react-toastify";
import {
  MdAdd,
  MdEdit,
  MdDelete,
  MdSearch,
  MdChevronLeft,
  MdChevronRight,
  MdClose,
  MdRefresh,
} from "react-icons/md";
import Loader from "./ui/Loader";
import Swal from "sweetalert2";
import Toggle from "../components/ui/Toggle";
import ModernSelect from "../components/ui/ModernSelect";

const TestsServices = () => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Filters
  const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState(""); // For debouncing
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  // Form State (Replacing Modal)
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ title: "", status: true });
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getTestServices({
        page,
        limit: 10,
        search,
        status: statusFilter,
      });
      if (res.success) {
        setData(res.data);
        setPagination(res.pagination);
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusToggle = useCallback(async (id, currentStatus) => {
    try {
      setTogglingId(id);
      const res = await updateTestServiceStatus(id, !currentStatus);
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
  }, []);

  const handleDelete = useCallback(
    async (id) => {
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
            setDeletingId(id);
            const res = await deleteTestService(id);
            if (res.success) {
              toast.success(res.message);
              fetchData();
            }
          } catch (error) {
            toast.error(error.message || "Failed to delete");
          } finally {
            setDeletingId(null);
          }
        }
      });
    },
    [colors.primary, fetchData],
  );

  const handleEdit = (item) => {
    setEditId(item._id);
    setFormData({ title: item.title, status: item.status });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setEditId(null);
    setFormData({ title: "", status: true });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return toast.warning("Please enter a title");

    try {
      setSubmitting(true);
      if (editId) {
        const res = await updateTestService(editId, formData);
        if (res.success) toast.success(res.message);
      } else {
        const res = await createTestService(formData);
        if (res.success) toast.success(res.message);
      }
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1
            className="text-2xl font-bold uppercase tracking-tight"
            style={{ color: colors.text }}
          >
            Tests & Services
          </h1>
          <p className="text-sm opacity-60" style={{ color: colors.text }}>
            Manage your pathology tests and service categories
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
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-sm border outline-none focus:ring-1 transition-all text-sm"
                style={{
                  borderColor: colors.accent + "20",
                  backgroundColor: colors.background,
                  color: colors.text,
                }}
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
                { label: "Active Only", value: "true" },
                { label: "Inactive Only", value: "false" },
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
                      S.No
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider opacity-60">
                      Service Title
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
                      <td colSpan="4" className="py-20 text-center">
                        <Loader />
                      </td>
                    </tr>
                  ) : data.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="py-20 text-center opacity-40 uppercase text-xs font-bold"
                      >
                        No services found
                      </td>
                    </tr>
                  ) : (
                    data.map((item, index) => (
                      <tr
                        key={item._id}
                        className="hover:bg-black/5 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm opacity-40">
                          {(pagination.page - 1) * pagination.limit + index + 1}
                        </td>
                        <td
                          className="px-6 py-4 font-bold text-sm uppercase tracking-tight"
                          style={{ color: colors.text }}
                        >
                          {item.title}
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
                              disabled={deletingId === item._id}
                              className="p-2 rounded-sm hover:bg-red-50 text-red-600 transition-all disabled:opacity-50"
                              title="Delete"
                            >
                              {deletingId === item._id ? (
                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <MdDelete size={18} />
                              )}
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
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total,
                  )}{" "}
                  of {pagination.total}
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="p-1.5 border rounded-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5 transition-all text-xs font-bold"
                    style={{
                      borderColor: colors.accent + "20",
                      color: colors.text,
                    }}
                  >
                    <MdChevronLeft size={20} />
                  </button>
                  <button
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage(page + 1)}
                    className="p-1.5 border rounded-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-black/5 transition-all text-xs font-bold"
                    style={{
                      borderColor: colors.accent + "20",
                      color: colors.text,
                    }}
                  >
                    <MdChevronRight size={20} />
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
                {editId ? "Edit Service" : "Add New Service"}
              </h2>
              {editId && (
                <button
                  onClick={resetForm}
                  className="p-1 hover:bg-black/5 rounded-full"
                  title="Cancel Edit"
                >
                  <MdClose size={20} />
                </button>
              )}
            </div>

            <form onSubmit={handleFormSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 mb-2 block tracking-widest px-1">
                    Service Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="E.g. Full Body Checkup"
                    className="w-full px-4 py-3 rounded-sm border outline-none focus:ring-1 transition-all text-sm font-semibold"
                    style={{
                      borderColor: colors.accent + "30",
                      backgroundColor: colors.background,
                      color: colors.text,
                    }}
                  />
                  <p className="text-[9px] opacity-40 mt-2 px-1 font-medium italic">
                    This name will appear in registration forms and search
                    filters.
                  </p>
                </div>

                <div className="py-2 border-t border-black/5 mt-4">
                  <Toggle
                    label="Status"
                    checked={formData.status}
                    onChange={(val) =>
                      setFormData({ ...formData, status: val })
                    }
                  />
                  <p className="text-[9px] opacity-40 mt-1 px-1">
                    Inactive services won't be visible to new lab registrations.
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
                  : editId
                    ? "Update Service"
                    : "Create Service"}
              </button>

              {editId && (
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

          <div className="mt-6 p-4 bg-emerald-50/50 border border-emerald-100/50 rounded-sm">
            <h4 className="text-[10px] font-black uppercase text-emerald-800 mb-2">
              Service Info
            </h4>
            <p className="text-[11px] text-emerald-700 leading-relaxed opacity-70">
              Manage core test categories here. These services will be
              selectable by labs during their onboarding process.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestsServices;
