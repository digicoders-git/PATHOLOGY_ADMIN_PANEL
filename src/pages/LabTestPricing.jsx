import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { getAllLabTestPricing, deleteLabTestPricing, updateLabTestPricingStatus } from "../apis/labTestPricing";
import { getAllRegistrations } from "../apis/registration";
import { getTestServices } from "../apis/testAndServices";
import { toast } from "react-toastify";
import {
  MdSearch,
  MdDelete,
  MdClose,
  MdRefresh,
  MdChevronLeft,
  MdChevronRight,
  MdCheckCircle,
  MdCancel,
} from "react-icons/md";
import Swal from "sweetalert2";

const LIMIT = 10;

const LabTestPricing = () => {
  const { colors } = useTheme();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [search, setSearch] = useState("");
  const [labFilter, setLabFilter] = useState("");
  const [testFilter, setTestFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("true");

  // Dropdown data
  const [labs, setLabs] = useState([]);
  const [tests, setTests] = useState([]);

  useEffect(() => {
    getAllRegistrations({ limit: 500 }).then((r) => { if (r.success) setLabs(r.data || []); }).catch(() => {});
    getTestServices({ limit: 500 }).then((r) => { if (r.success) setTests(r.data || []); }).catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllLabTestPricing({
        page,
        limit: LIMIT,
        search,
        registration: labFilter || undefined,
        test: testFilter || undefined,
        status: statusFilter,
      });
      if (res.success) {
        setData(res.data || []);
        setTotal(res.total || 0);
        setTotalPages(res.pagination?.totalPages || 1);
      }
    } catch {
      toast.error("Failed to fetch lab test pricing");
    } finally {
      setLoading(false);
    }
  }, [page, search, labFilter, testFilter, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchTerm); setPage(1); }, 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => { setPage(1); }, [labFilter, testFilter, statusFilter]);

  const handleStatusToggle = async (id, current) => {
    try {
      setTogglingId(id);
      const res = await updateLabTestPricingStatus(id, !current);
      if (res.success) {
        toast.success(res.message);
        setData((prev) => prev.map((item) => item._id === id ? { ...item, status: !current } : item));
      }
    } catch { toast.error("Failed to update status"); }
    finally { setTogglingId(null); }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: "Delete Pricing?",
      text: "This pricing entry will be removed.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#111",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setDeletingId(id);
          const res = await deleteLabTestPricing(id);
          if (res.success) { toast.success("Deleted successfully"); fetchData(); }
        } catch { toast.error("Delete failed"); }
        finally { setDeletingId(null); }
      }
    });
  };

  const clearFilters = () => {
    setSearchTerm(""); setSearch(""); setLabFilter(""); setTestFilter(""); setStatusFilter("true"); setPage(1);
  };

  const hasFilters = searchTerm || labFilter || testFilter || statusFilter !== "true";

  const discountPercent = (price, discountPrice) => {
    if (!price || !discountPrice) return null;
    const p = parseFloat(price), d = parseFloat(discountPrice);
    if (p <= 0) return null;
    return Math.round(((p - d) / p) * 100);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: colors.text }}>
            Lab Test Pricing
          </h1>
          <p className="text-sm mt-1 opacity-50">
            Lab-wise custom test pricing &nbsp;·&nbsp; {total} total
          </p>
        </div>
      </div>

      {/* Filters */}
      <div
        className="p-4 rounded-sm border shadow-sm mb-6"
        style={{ backgroundColor: colors.background, borderColor: colors.accent + "20" }}
      >
        <div className="flex flex-col lg:flex-row gap-3 items-end">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" size={18} />
            <input
              type="text"
              placeholder="Search by price..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border rounded-sm text-sm outline-none focus:ring-1 transition-all"
              style={{ backgroundColor: colors.background, borderColor: colors.accent + "30", color: colors.text }}
            />
          </div>

          {/* Lab Filter */}
          <div className="w-full lg:w-52">
            <select
              value={labFilter}
              onChange={(e) => setLabFilter(e.target.value)}
              className="w-full border rounded-sm px-3 py-2.5 text-sm outline-none focus:ring-1 transition-all"
              style={{ backgroundColor: colors.background, borderColor: colors.accent + "30", color: colors.text }}
            >
              <option value="">All Labs</option>
              {labs.map((lab) => <option key={lab._id} value={lab._id}>{lab.labName}</option>)}
            </select>
          </div>

          {/* Test Filter */}
          <div className="w-full lg:w-52">
            <select
              value={testFilter}
              onChange={(e) => setTestFilter(e.target.value)}
              className="w-full border rounded-sm px-3 py-2.5 text-sm outline-none focus:ring-1 transition-all"
              style={{ backgroundColor: colors.background, borderColor: colors.accent + "30", color: colors.text }}
            >
              <option value="">All Tests</option>
              {tests.map((t) => <option key={t._id} value={t._id}>{t.title}</option>)}
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full lg:w-40">
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
              onClick={clearFilters}
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
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50">Lab Name</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50">Test Name</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50 text-center">MRP (₹)</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50 text-center">Discount Price (₹)</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50 text-center">Discount %</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50 text-center">Status</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {loading ? (
                <tr><td colSpan="8" className="py-20 text-center text-sm opacity-40">Loading...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="8" className="py-20 text-center text-sm opacity-40">
                  {hasFilters ? "No pricing entries match your filters" : "No pricing entries found"}
                </td></tr>
              ) : (
                data.map((item, idx) => {
                  const pct = discountPercent(item.price, item.discountPrice);
                  return (
                    <tr key={item._id} className="hover:bg-black/[0.03] transition-colors">
                      <td className="px-5 py-3.5 text-xs font-bold opacity-30">{(page - 1) * LIMIT + idx + 1}</td>

                      {/* Lab */}
                      <td className="px-5 py-3.5">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold" style={{ color: colors.text }}>
                            {item.registration?.labName || "—"}
                          </span>
                          <span className="text-[10px] opacity-40">{item.registration?.city || ""}</span>
                        </div>
                      </td>

                      {/* Test */}
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-bold" style={{ color: colors.text }}>
                          {item.test?.title || "—"}
                        </span>
                      </td>

                      {/* MRP */}
                      <td className="px-5 py-3.5 text-center">
                        <span className="text-sm font-bold">₹{item.price || "—"}</span>
                      </td>

                      {/* Discount Price */}
                      <td className="px-5 py-3.5 text-center">
                        {item.discountPrice ? (
                          <span className="text-sm font-black text-emerald-600">₹{item.discountPrice}</span>
                        ) : (
                          <span className="text-xs opacity-30">—</span>
                        )}
                      </td>

                      {/* Discount % */}
                      <td className="px-5 py-3.5 text-center">
                        {pct !== null ? (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-sm bg-emerald-100 text-emerald-700">
                            {pct}% OFF
                          </span>
                        ) : (
                          <span className="text-xs opacity-30">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() => handleStatusToggle(item._id, item.status)}
                          disabled={togglingId === item._id}
                          className="transition-all disabled:opacity-40"
                        >
                          {togglingId === item._id ? (
                            <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin mx-auto" />
                          ) : item.status ? (
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
                        <button
                          onClick={() => handleDelete(item._id)}
                          disabled={deletingId === item._id}
                          className="p-2 rounded-sm hover:bg-red-100 text-red-500 disabled:opacity-40 transition-colors"
                          title="Delete"
                        >
                          {deletingId === item._id ? (
                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <MdDelete size={17} />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && total > LIMIT && (
          <div
            className="px-6 py-4 border-t flex items-center justify-between"
            style={{ borderColor: colors.accent + "10" }}
          >
            <p className="text-sm opacity-50">
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total} entries
            </p>
            <div className="flex items-center gap-2">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="p-2 border rounded-sm hover:bg-black/5 disabled:opacity-30 transition-all">
                <MdChevronLeft size={20} />
              </button>
              <span className="text-sm font-bold opacity-50 px-2">{page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="p-2 border rounded-sm hover:bg-black/5 disabled:opacity-30 transition-all">
                <MdChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LabTestPricing;
