import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { getAllBookings, deleteBooking, uploadTestReport } from "../apis/booking";
import { toast } from "react-toastify";
import {
  MdDelete,
  MdSearch,
  MdChevronLeft,
  MdChevronRight,
  MdCloudUpload,
  MdFilePresent,
  MdClose,
  MdRefresh,
  MdAccessTime,
} from "react-icons/md";
import Swal from "sweetalert2";

const LIMIT = 10;

const STATUS_COLORS = {
  Pending:    "bg-amber-100 text-amber-700 border-amber-200",
  Confirmed:  "bg-blue-100 text-blue-700 border-blue-200",
  Completed:  "bg-emerald-100 text-emerald-700 border-emerald-200",
  Cancelled:  "bg-red-100 text-red-700 border-red-200",
  "In Progress": "bg-purple-100 text-purple-700 border-purple-200",
  Processing: "bg-purple-100 text-purple-700 border-purple-200",
  "Result Ready": "bg-cyan-100 text-cyan-700 border-cyan-200",
  "Report Generated": "bg-teal-100 text-teal-700 border-teal-200",
  "Sample Collected": "bg-indigo-100 text-indigo-700 border-indigo-200",
};

const OLD_STATUSES = [];
const NEW_STATUSES = [];

const Bookings = () => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  const [searchTerm, setSearchTerm] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllBookings({ page, limit: LIMIT, status: statusFilter, search });
      if (res.success) {
        let rows = res.data || [];
        if (sourceFilter) rows = rows.filter((b) => b.source === sourceFilter);
        setData(rows);
        setTotal(sourceFilter ? rows.length : res.count || 0);
        setTotalPages(sourceFilter ? Math.ceil(rows.length / LIMIT) : res.totalPages || 1);
      }
    } catch {
      toast.error("Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search, sourceFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchTerm); setPage(1); }, 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => { setPage(1); }, [statusFilter, sourceFilter]);

const handleDelete = (id) => {
    Swal.fire({
      title: "Delete Booking?",
      text: "This booking will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#111",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await deleteBooking(id);
          if (res.success) { toast.success("Booking deleted"); fetchData(); }
        } catch { toast.error("Deletion failed"); }
      }
    });
  };

  const handleFileUpload = async (id, e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await uploadTestReport(id, file);
      if (res.success) { toast.success("Report uploaded successfully"); fetchData(); }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Upload failed");
    }
  };

  const clearFilters = () => {
    setSearchTerm(""); setSearch(""); setStatusFilter(""); setSourceFilter(""); setPage(1);
  };

  const hasFilters = searchTerm || statusFilter || sourceFilter;

  const formatDate = (val) => {
    if (!val) return "—";
    const d = new Date(val);
    return isNaN(d) ? val : d.toLocaleDateString("en-GB");
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: colors.text }}>
            All Bookings
          </h1>
          <p className="text-sm mt-1 opacity-50">
            Direct + App bookings combined &nbsp;·&nbsp; {total} total
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
              placeholder="Search by patient, lab, booking ID or test..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border rounded-sm text-sm outline-none focus:ring-1 transition-all"
              style={{ backgroundColor: colors.background, borderColor: colors.accent + "30", color: colors.text }}
            />
          </div>

          {/* Source Filter */}
          <div className="w-full lg:w-44">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full border rounded-sm px-3 py-2.5 text-sm outline-none focus:ring-1 transition-all"
              style={{ backgroundColor: colors.background, borderColor: colors.accent + "30", color: colors.text }}
            >
              <option value="">All Sources</option>
              <option value="app">App Bookings</option>
              <option value="direct">Direct Bookings</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="w-full lg:w-44">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border rounded-sm px-3 py-2.5 text-sm outline-none focus:ring-1 transition-all"
              style={{ backgroundColor: colors.background, borderColor: colors.accent + "30", color: colors.text }}
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
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
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50">Booking ID</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50">Patient</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50">Lab</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50">Test</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50">Date / Slot</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50 text-center">Amount</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50 text-center">Payment</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50">Status</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {loading ? (
                <tr><td colSpan="10" className="py-20 text-center text-sm opacity-40">Loading bookings...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="10" className="py-20 text-center text-sm opacity-40">
                  {hasFilters ? "No bookings match your filters" : "No bookings found"}
                </td></tr>
              ) : (
                data.map((item, idx) => (
                  <tr key={item._id} className="hover:bg-black/[0.03] transition-colors">
                    {/* # */}
                    <td className="px-5 py-3.5 text-xs font-bold opacity-30">
                      {(page - 1) * LIMIT + idx + 1}
                    </td>

                    {/* Booking ID + Source Badge */}
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-black tracking-tight" style={{ color: colors.text }}>
                          {item.bookingId}
                        </span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-sm w-fit ${
                          item.source === "app"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {item.source === "app" ? "App" : "Direct"}
                        </span>
                      </div>
                    </td>

                    {/* Patient */}
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold" style={{ color: colors.text }}>
                          {item.patient.name}
                        </span>
                        <span className="text-[10px] opacity-50">{item.patient.mobile}</span>
                      </div>
                    </td>

                    {/* Lab */}
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold" style={{ color: colors.text }}>
                          {item.lab.name}
                        </span>
                        <span className="text-[10px] opacity-50">{item.lab.city}</span>
                      </div>
                    </td>

                    {/* Test */}
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold line-clamp-1 max-w-[140px]" style={{ color: colors.text }}>
                          {item.testName}
                        </span>
                        {item.testCount > 1 && (
                          <span className="text-[9px] opacity-40 font-bold">{item.testCount} tests</span>
                        )}
                      </div>
                    </td>

                    {/* Date / Slot */}
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold">{formatDate(item.bookingDate)}</span>
                        {item.slotTime && (
                          <span className="text-[10px] opacity-50 flex items-center gap-1">
                            <MdAccessTime size={11} /> {item.slotTime}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-3.5 text-center">
                      <span className="text-sm font-black">₹{item.amount}</span>
                    </td>

                    {/* Payment */}
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-sm ${
                          item.paymentStatus === "Paid"
                            ? "bg-emerald-100 text-emerald-700"
                            : item.paymentStatus === "Failed"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {item.paymentStatus}
                        </span>
                        <span className="text-[9px] opacity-40 font-bold uppercase">
                          {item.paymentMode}
                        </span>
                      </div>
                    </td>

                    {/* Status Badge (read-only) */}
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-sm border ${
                        STATUS_COLORS[item.status] || "bg-slate-100 text-slate-600 border-slate-200"
                      }`}>
                        {item.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-2">
                        {item.reportFile ? (
                          <a
                            href={`${import.meta.env.VITE_API_BASE_URL}/${item.reportFile}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-sm hover:bg-black/5 text-blue-600"
                            title="View Report"
                          >
                            <MdFilePresent size={17} />
                          </a>
                        ) : (
                          <label className="p-2 rounded-sm hover:bg-black/5 text-emerald-600 cursor-pointer" title="Upload Report">
                            <MdCloudUpload size={17} />
                            <input type="file" className="hidden" onChange={(e) => handleFileUpload(item._id, e)} />
                          </label>
                        )}
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-2 rounded-sm hover:bg-red-100 text-red-500 transition-colors"
                          title="Delete"
                        >
                          <MdDelete size={17} />
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
        {!loading && total > LIMIT && (
          <div
            className="px-6 py-4 border-t flex items-center justify-between"
            style={{ borderColor: colors.accent + "10" }}
          >
            <p className="text-sm opacity-50">
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total} bookings
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="p-2 border rounded-sm hover:bg-black/5 disabled:opacity-30 transition-all"
              >
                <MdChevronLeft size={20} />
              </button>
              <span className="text-sm font-bold opacity-50 px-2">{page} / {totalPages}</span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="p-2 border rounded-sm hover:bg-black/5 disabled:opacity-30 transition-all"
              >
                <MdChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookings;
