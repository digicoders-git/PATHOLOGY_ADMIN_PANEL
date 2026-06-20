import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { getAllSupportQueries, updateSupportQuery, deleteSupportQuery, replyToSupportQuery } from "../apis/support";
import { toast } from "react-toastify";
import {
  MdDelete,
  MdSearch,
  MdChevronLeft,
  MdChevronRight,
  MdClose,
  MdRefresh,
  MdComment,
  MdOutlineRemoveRedEye
} from "react-icons/md";
import Swal from "sweetalert2";

const LIMIT = 10;

const STATUS_COLORS = {
  Open: "bg-amber-100 text-amber-700 border-amber-200",
  "In Progress": "bg-blue-100 text-blue-700 border-blue-200",
  Resolved: "bg-emerald-100 text-emerald-700 border-emerald-200",
  Closed: "bg-slate-100 text-slate-700 border-slate-200",
};

const SupportQueries = () => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [searchTerm, setSearchTerm] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllSupportQueries();
      if (res.success) {
        setData(res.data || []);
      }
    } catch {
      toast.error("Failed to fetch support queries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    let filtered = [...data];
    if (statusFilter) {
      filtered = filtered.filter((q) => q.status === statusFilter);
    }
    if (search) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter((q) => 
        q.subject?.toLowerCase().includes(lowerSearch) ||
        q.patientId?.name?.toLowerCase().includes(lowerSearch) ||
        q.patientId?.mobile?.toLowerCase().includes(lowerSearch)
      );
    }
    setFilteredData(filtered);
    setTotal(filtered.length);
  }, [data, search, statusFilter]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const handleDelete = (id) => {
    Swal.fire({
      title: "Delete Query?",
      text: "This support query will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#111",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await deleteSupportQuery(id);
          if (res.success) {
            toast.success("Query deleted");
            fetchData();
          }
        } catch {
          toast.error("Deletion failed");
        }
      }
    });
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const res = await updateSupportQuery(id, { status: newStatus });
      if (res.success) {
        toast.success(`Status updated to ${newStatus}`);
        fetchData();
      }
    } catch (err) {
      toast.error("Failed to update status");
    }
  };

  const handleReplySubmit = async () => {
    if (!selectedQuery) return;
    try {
      setReplying(true);
      const res = await replyToSupportQuery(selectedQuery._id, { adminReply: replyText });
      if (res.success) {
        toast.success("Reply sent and marked as resolved.");
        setViewModalOpen(false);
        fetchData();
      }
    } catch (err) {
      toast.error("Failed to send reply");
    } finally {
      setReplying(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSearch("");
    setStatusFilter("");
    setPage(1);
  };

  const hasFilters = searchTerm || statusFilter;

  const formatDate = (val) => {
    if (!val) return "—";
    const d = new Date(val);
    return isNaN(d) ? val : d.toLocaleDateString("en-GB") + " " + d.toLocaleTimeString("en-GB", { hour: '2-digit', minute: '2-digit' });
  };

  // Pagination logic
  const totalPages = Math.ceil(total / LIMIT) || 1;
  const currentData = filteredData.slice((page - 1) * LIMIT, page * LIMIT);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: colors.text }}>
            Support Queries
          </h1>
          <p className="text-sm mt-1 opacity-50">
            Manage user support and contact queries &nbsp;·&nbsp; {total} total
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
              placeholder="Search by patient name, mobile or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border rounded-sm text-sm outline-none focus:ring-1 transition-all"
              style={{ backgroundColor: colors.background, borderColor: colors.accent + "30", color: colors.text }}
            />
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
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
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
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50">Patient</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50">Subject & Message</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50">Date</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50">Admin Reply</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50 text-center">Status</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {loading ? (
                <tr><td colSpan="7" className="py-20 text-center text-sm opacity-40">Loading queries...</td></tr>
              ) : currentData.length === 0 ? (
                <tr><td colSpan="7" className="py-20 text-center text-sm opacity-40">
                  {hasFilters ? "No queries match your filters" : "No queries found"}
                </td></tr>
              ) : (
                currentData.map((item, idx) => (
                  <tr key={item._id} className="hover:bg-black/[0.03] transition-colors">
                    {/* # */}
                    <td className="px-5 py-3.5 text-xs font-bold opacity-30">
                      {(page - 1) * LIMIT + idx + 1}
                    </td>

                    {/* Patient */}
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold" style={{ color: colors.text }}>
                          {item.patientId?.name || "Unknown"}
                        </span>
                        <span className="text-[10px] opacity-50">{item.patientId?.mobile || "N/A"}</span>
                      </div>
                    </td>

                    {/* Subject & Message */}
                    <td className="px-5 py-3.5 max-w-[250px]">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold truncate" style={{ color: colors.text }}>
                          {item.subject}
                        </span>
                        <span className="text-xs opacity-60 truncate">{item.message}</span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-bold">{formatDate(item.createdAt)}</span>
                    </td>

                    {/* Admin Reply */}
                    <td className="px-5 py-3.5 max-w-[200px]">
                      <span className={`text-xs ${!item.adminReply ? "opacity-30 italic" : "truncate block"}`}>
                        {item.adminReply || "No reply yet"}
                      </span>
                    </td>

                    {/* Status Badge with Update dropdown */}
                    <td className="px-5 py-3.5 text-center">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusUpdate(item._id, e.target.value)}
                        className={`text-[10px] font-black uppercase px-2 py-1 rounded-sm border outline-none cursor-pointer ${
                          STATUS_COLORS[item.status] || "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedQuery(item);
                            setReplyText(item.adminReply || "");
                            setViewModalOpen(true);
                          }}
                          className="p-2 rounded-sm hover:bg-blue-100 text-blue-500 transition-colors"
                          title="View & Reply"
                        >
                          <MdOutlineRemoveRedEye size={17} />
                        </button>
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
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total} queries
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

      {/* View & Reply Modal */}
      {viewModalOpen && selectedQuery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div
            className="w-full max-w-lg rounded-sm shadow-2xl flex flex-col"
            style={{ backgroundColor: colors.background, color: colors.text }}
          >
            <div className="p-5 border-b flex justify-between items-center" style={{ borderColor: colors.accent + "20" }}>
              <h2 className="font-bold text-lg">Support Query Details</h2>
              <button onClick={() => setViewModalOpen(false)} className="opacity-50 hover:opacity-100">
                <MdClose size={24} />
              </button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs opacity-50 mb-1">Patient Name</p>
                  <p className="text-sm font-bold">{selectedQuery.patientId?.name || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs opacity-50 mb-1">Mobile / Email</p>
                  <p className="text-sm font-bold">{selectedQuery.patientId?.mobile || "N/A"}</p>
                  <p className="text-xs opacity-80">{selectedQuery.patientId?.email}</p>
                </div>
              </div>
              
              <div className="p-3 rounded-sm" style={{ backgroundColor: colors.accent + "10" }}>
                <p className="text-xs opacity-50 mb-1">Subject</p>
                <p className="text-sm font-bold mb-3">{selectedQuery.subject}</p>
                
                <p className="text-xs opacity-50 mb-1">Message</p>
                <p className="text-sm whitespace-pre-wrap">{selectedQuery.message}</p>
              </div>

              <div className="mt-2">
                <label className="text-xs font-bold opacity-70 mb-2 block">Admin Reply</label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type your reply here..."
                  className="w-full p-3 border rounded-sm outline-none focus:ring-1 text-sm"
                  rows="4"
                  style={{ backgroundColor: "transparent", borderColor: colors.accent + "30" }}
                ></textarea>
                <p className="text-[10px] opacity-40 mt-1">Submitting a reply will automatically mark this query as 'Resolved'.</p>
              </div>
            </div>
            
            <div className="p-5 border-t flex justify-end gap-3" style={{ borderColor: colors.accent + "20" }}>
              <button
                onClick={() => setViewModalOpen(false)}
                className="px-4 py-2 border rounded-sm text-sm font-bold hover:bg-black/5"
                style={{ borderColor: colors.accent + "30" }}
              >
                Cancel
              </button>
              <button
                onClick={handleReplySubmit}
                disabled={replying}
                className="px-6 py-2 rounded-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {replying ? "Sending..." : "Send Reply"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportQueries;
