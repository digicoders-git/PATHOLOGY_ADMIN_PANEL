import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../apis/notifications";
import { toast } from "react-toastify";
import {
  MdNotifications,
  MdDelete,
  MdDoneAll,
  MdChevronLeft,
  MdChevronRight,
  MdClose,
  MdRefresh,
  MdCalendarToday,
  MdOutlineArticle,
  MdPerson,
  MdAlarm,
  MdSettings,
} from "react-icons/md";
import Swal from "sweetalert2";

const LIMIT = 15;

const TYPE_CONFIG = {
  booking:      { icon: MdCalendarToday, color: "bg-blue-100 text-blue-600" },
  registration: { icon: MdOutlineArticle, color: "bg-purple-100 text-purple-600" },
  patient:      { icon: MdPerson, color: "bg-emerald-100 text-emerald-600" },
  slot:         { icon: MdAlarm, color: "bg-amber-100 text-amber-600" },
  system:       { icon: MdSettings, color: "bg-slate-100 text-slate-600" },
};

const Notifications = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState(""); // "" | "false" (unread) | "true" (read)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getNotifications({ page, limit: LIMIT, isRead: filter });
      if (res.success) {
        setData(res.data || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch {
      toast.error("Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [filter]);

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id);
      setData((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { toast.error("Failed to mark as read"); }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      toast.success("All notifications marked as read");
      fetchData();
    } catch { toast.error("Failed"); }
  };

  const handleDelete = async (id) => {
    try {
      await deleteNotification(id);
      setData((prev) => prev.filter((n) => n._id !== id));
      setTotal((t) => t - 1);
    } catch { toast.error("Delete failed"); }
  };

  const handleClearAll = async () => {
    const result = await Swal.fire({
      title: "Clear All Notifications?",
      text: "All notifications will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#111",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, clear all!",
    });
    if (result.isConfirmed) {
      try {
        await deleteAllNotifications();
        toast.success("All notifications cleared");
        fetchData();
      } catch { toast.error("Failed to clear"); }
    }
  };

  const handleClick = async (notif) => {
    if (!notif.isRead) await handleMarkRead(notif._id);
    if (notif.link) navigate(notif.link);
  };

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString("en-GB");
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" style={{ color: colors.text }}>
            Notifications
            {unreadCount > 0 && (
              <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-red-500 text-white">
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-sm mt-1 opacity-50">{total} total &nbsp;·&nbsp; {unreadCount} unread</p>
        </div>
        <div className="flex gap-3">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-2 px-5 py-2.5 border rounded text-[11px] font-black uppercase tracking-widest hover:bg-black/5 transition-all"
              style={{ borderColor: colors.accent + "30", color: colors.text }}
            >
              <MdDoneAll size={16} /> Mark All Read
            </button>
          )}
          {total > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-2 px-5 py-2.5 border rounded text-[11px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
              style={{ borderColor: colors.accent + "30", color: colors.text }}
            >
              <MdDelete size={16} /> Clear All
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

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { label: "All", value: "" },
          { label: "Unread", value: "false" },
          { label: "Read", value: "true" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 rounded-sm text-[11px] font-black uppercase tracking-widest border transition-all ${
              filter === tab.value
                ? "bg-black text-white border-black"
                : "border-slate-200 hover:bg-black/5"
            }`}
            style={filter !== tab.value ? { color: colors.text } : {}}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div
        className="rounded-sm border shadow-sm overflow-hidden"
        style={{ backgroundColor: colors.background, borderColor: colors.accent + "20" }}
      >
        {loading ? (
          <div className="py-20 text-center text-sm opacity-40">Loading notifications...</div>
        ) : data.length === 0 ? (
          <div className="py-20 text-center">
            <MdNotifications size={40} className="mx-auto opacity-10 mb-3" />
            <p className="text-sm opacity-40">No notifications found</p>
          </div>
        ) : (
          <div className="divide-y divide-black/5">
            {data.map((notif) => {
              const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.system;
              const Icon = cfg.icon;
              return (
                <div
                  key={notif._id}
                  className={`flex items-start gap-4 px-5 py-4 transition-colors group ${
                    !notif.isRead ? "bg-blue-50/40" : "hover:bg-black/[0.02]"
                  }`}
                >
                  {/* Icon */}
                  <div className={`w-9 h-9 rounded-sm flex items-center justify-center shrink-0 mt-0.5 ${cfg.color}`}>
                    <Icon size={17} />
                  </div>

                  {/* Content */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => handleClick(notif)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-bold leading-snug ${!notif.isRead ? "" : "opacity-60"}`} style={{ color: colors.text }}>
                        {notif.title}
                      </p>
                      <span className="text-[10px] opacity-40 whitespace-nowrap shrink-0 mt-0.5">
                        {formatTime(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs opacity-50 mt-0.5 line-clamp-2">{notif.message}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-sm ${cfg.color}`}>
                        {notif.type}
                      </span>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                      )}
                      {notif.link && (
                        <span className="text-[10px] opacity-40 font-bold">Click to view →</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {!notif.isRead && (
                      <button
                        onClick={() => handleMarkRead(notif._id)}
                        title="Mark as read"
                        className="p-1.5 rounded-sm hover:bg-black/5 transition-colors"
                        style={{ color: colors.primary }}
                      >
                        <MdDoneAll size={15} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notif._id)}
                      title="Delete"
                      className="p-1.5 rounded-sm hover:bg-red-100 text-red-500 transition-colors"
                    >
                      <MdClose size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && total > LIMIT && (
          <div
            className="px-6 py-4 border-t flex items-center justify-between"
            style={{ borderColor: colors.accent + "10" }}
          >
            <p className="text-sm opacity-50">
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
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

export default Notifications;
