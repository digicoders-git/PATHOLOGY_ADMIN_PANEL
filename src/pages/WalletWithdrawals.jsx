import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { getWithdrawalRequests, updateWithdrawalStatus } from "../apis/wallet";
import { toast } from "react-toastify";
import {
  MdRefresh,
  MdChevronLeft,
  MdChevronRight,
  MdAccountBalanceWallet,
  MdCheck,
  MdClose,
} from "react-icons/md";
import Swal from "sweetalert2";

const LIMIT = 10;

const STATUS_STYLES = {
  pending:  "bg-amber-100 text-amber-700 border-amber-200",
  success:  "bg-emerald-100 text-emerald-700 border-emerald-200",
  failed:   "bg-red-100 text-red-700 border-red-200",
};

const formatDate = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  return isNaN(d)
    ? val
    : d.toLocaleDateString("en-GB") +
        " " +
        d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
};

const WalletWithdrawals = () => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [actionLoading, setActionLoading] = useState(null); // id of item being processed

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getWithdrawalRequests({ status: statusFilter || undefined, page, limit: LIMIT });
      if (res.success) {
        setData(res.data || []);
        setTotal(res.pagination?.total || res.data?.length || 0);
      }
    } catch {
      toast.error("Failed to fetch withdrawal requests");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const handleAction = (id, newStatus) => {
    const isApprove = newStatus === "success";
    Swal.fire({
      title: isApprove ? "Approve Withdrawal?" : "Reject Withdrawal?",
      text: isApprove
        ? "This will mark the request as approved. The money will be transferred to the Lab."
        : "This will reject the request and refund the amount to the Lab's wallet automatically.",
      icon: isApprove ? "question" : "warning",
      showCancelButton: true,
      confirmButtonColor: isApprove ? "#059669" : "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: isApprove ? "Yes, Approve!" : "Yes, Reject!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setActionLoading(id);
          const res = await updateWithdrawalStatus(id, newStatus);
          if (res.success) {
            toast.success(isApprove ? "Withdrawal approved!" : "Withdrawal rejected. Amount refunded to Lab.");
            fetchData();
          }
        } catch (err) {
          toast.error(err?.response?.data?.message || "Action failed");
        } finally {
          setActionLoading(null);
        }
      }
    });
  };

  const totalPages = Math.ceil(total / LIMIT) || 1;

  const pendingCount = statusFilter !== "pending" ? "" : ` (${total})`;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" style={{ color: colors.text }}>
            <MdAccountBalanceWallet className="text-amber-500" size={28} />
            Wallet Withdrawals
          </h1>
          <p className="text-sm mt-1 opacity-50">
            Manage Lab wallet withdrawal requests · {total} total
          </p>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {["pending", "success", "failed"].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s === statusFilter ? "" : s)}
            className={`p-4 rounded-sm border text-left transition-all ${
              statusFilter === s ? "ring-2" : ""
            }`}
            style={{
              backgroundColor: colors.background,
              borderColor: statusFilter === s ? colors.primary : colors.accent + "20",
              ringColor: colors.primary,
            }}
          >
            <p className="text-xs font-black uppercase tracking-widest opacity-50 mb-1">
              {s === "pending" ? "Pending" : s === "success" ? "Approved" : "Rejected"}
            </p>
            <p className="text-xl font-black" style={{ color: colors.text }}>
              {s === statusFilter ? total : "—"}
            </p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div
        className="p-4 rounded-sm border shadow-sm mb-6 flex gap-3 items-center flex-wrap"
        style={{ backgroundColor: colors.background, borderColor: colors.accent + "20" }}
      >
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-sm px-3 py-2.5 text-sm outline-none"
          style={{ backgroundColor: colors.background, borderColor: colors.accent + "30", color: colors.text }}
        >
          <option value="">All Requests</option>
          <option value="pending">Pending</option>
          <option value="success">Approved</option>
          <option value="failed">Rejected</option>
        </select>

        <button
          onClick={fetchData}
          title="Refresh"
          className="p-2.5 border rounded-sm hover:bg-black/5 transition-all ml-auto"
          style={{ borderColor: colors.accent + "30", color: colors.text }}
        >
          <MdRefresh size={18} />
        </button>
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
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50">Contact</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50">Amount</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50">Request Date</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50 text-center">Status</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-20 text-center text-sm opacity-40">
                    Loading withdrawal requests...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-20 text-center text-sm opacity-40">
                    No withdrawal requests found
                  </td>
                </tr>
              ) : (
                data.map((item, idx) => (
                  <tr key={item._id} className="hover:bg-black/[0.03] transition-colors">
                    {/* # */}
                    <td className="px-5 py-3.5 text-xs font-bold opacity-30">
                      {(page - 1) * LIMIT + idx + 1}
                    </td>

                    {/* Lab Name */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                          <MdAccountBalanceWallet size={14} className="text-amber-600" />
                        </div>
                        <span className="text-sm font-bold" style={{ color: colors.text }}>
                          {item.labId?.labName || "Unknown Lab"}
                        </span>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold opacity-70">{item.labId?.phone || "N/A"}</span>
                        <span className="text-[10px] opacity-40">{item.labId?.email || ""}</span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-3.5">
                      <span className="text-base font-black text-red-600">
                        ₹{item.amount?.toLocaleString("en-IN") || 0}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-bold">{formatDate(item.createdAt)}</span>
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`text-[10px] font-black uppercase px-3 py-1 rounded-sm border ${
                          STATUS_STYLES[item.status] || "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {item.status === "pending" ? "Pending" : item.status === "success" ? "Approved" : "Rejected"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      {item.status === "pending" ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleAction(item._id, "success")}
                            disabled={actionLoading === item._id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-sm text-xs font-bold transition-all disabled:opacity-50"
                            title="Approve"
                          >
                            {actionLoading === item._id ? (
                              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <MdCheck size={15} />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(item._id, "failed")}
                            disabled={actionLoading === item._id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-sm text-xs font-bold transition-all disabled:opacity-50"
                            title="Reject"
                          >
                            <MdClose size={15} />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs opacity-30 italic">Already processed</span>
                      )}
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
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total} requests
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="p-2 border rounded-sm hover:bg-black/5 disabled:opacity-30 transition-all"
              >
                <MdChevronLeft size={20} />
              </button>
              <span className="text-sm font-bold opacity-50 px-2">
                {page} / {totalPages}
              </span>
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

export default WalletWithdrawals;
