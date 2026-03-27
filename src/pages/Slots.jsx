import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "../context/ThemeContext";
import { getAllSlots, generateSlots, deleteSlot } from "../apis/slots";
import { getAllRegistrations } from "../apis/registration";
import { toast } from "react-toastify";
import {
  MdAdd,
  MdDelete,
  MdSearch,
  MdClose,
  MdAccessTime,
  MdCalendarToday,
  MdCheckCircle,
  MdCancel,
  MdChevronLeft,
  MdChevronRight,
  MdRefresh,
} from "react-icons/md";
import Swal from "sweetalert2";

const LIMIT = 10;

const Slots = () => {
  const { colors } = useTheme();

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);

  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [labFilter, setLabFilter] = useState("");

  const [labs, setLabs] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    labId: "",
    date: new Date().toISOString().split("T")[0],
    slots: [{ startTime: "", endTime: "" }],
  });

  useEffect(() => {
    getAllRegistrations({ limit: 500 })
      .then((res) => { if (res.success) setLabs(res.data || []); })
      .catch(() => {});
  }, []);

  const fetchSlots = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: LIMIT };
      if (dateFilter) params.date = dateFilter;
      if (statusFilter) params.status = statusFilter;
      if (labFilter) params.labId = labFilter;
      const res = await getAllSlots(params);
      if (res.success) {
        setSlots(res.data || []);
        setTotal(res.total || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch {
      toast.error("Failed to fetch slots");
    } finally {
      setLoading(false);
    }
  }, [page, dateFilter, statusFilter, labFilter]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  // Reset to page 1 when filters change
  const prevFilters = React.useRef({ dateFilter, statusFilter, labFilter, searchTerm });
  useEffect(() => {
    const prev = prevFilters.current;
    if (
      prev.dateFilter !== dateFilter ||
      prev.statusFilter !== statusFilter ||
      prev.labFilter !== labFilter ||
      prev.searchTerm !== searchTerm
    ) {
      setPage(1);
      prevFilters.current = { dateFilter, statusFilter, labFilter, searchTerm };
    }
  }, [dateFilter, statusFilter, labFilter, searchTerm]);

  // Client-side search on populated lab name/city
  const displayedSlots = useMemo(() => {
    if (!searchTerm.trim()) return slots;
    const q = searchTerm.toLowerCase();
    return slots.filter(
      (s) =>
        s.labId?.labName?.toLowerCase().includes(q) ||
        s.labId?.city?.toLowerCase().includes(q)
    );
  }, [slots, searchTerm]);

  const handleDelete = (id) => {
    Swal.fire({
      title: "Delete Slot?",
      text: "This slot will be permanently removed!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#111",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await deleteSlot(id);
          if (res.success) {
            toast.success("Slot deleted");
            fetchSlots();
          }
        } catch (err) {
          toast.error(err.response?.data?.message || "Delete failed");
        }
      }
    });
  };

  const addSlotRow = () =>
    setFormData((p) => ({ ...p, slots: [...p.slots, { startTime: "", endTime: "" }] }));

  const removeSlotRow = (idx) =>
    setFormData((p) => ({ ...p, slots: p.slots.filter((_, i) => i !== idx) }));

  const updateSlotRow = (idx, field, val) => {
    const updated = [...formData.slots];
    updated[idx] = { ...updated[idx], [field]: val };
    setFormData((p) => ({ ...p, slots: updated }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validSlots = formData.slots.filter((s) => s.startTime && s.endTime);
    if (!formData.labId || !formData.date || !validSlots.length) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      setSubmitting(true);
      const res = await generateSlots({ ...formData, slots: validSlots });
      if (res.success) {
        toast.success(res.message || "Slots created successfully");
        setModalOpen(false);
        fetchSlots();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create slots");
    } finally {
      setSubmitting(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDateFilter("");
    setStatusFilter("");
    setLabFilter("");
  };

  const hasFilters = searchTerm || dateFilter || statusFilter || labFilter;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: colors.text }}>
            Slot Management
          </h1>
          <p className="text-sm mt-1 opacity-50">
            All lab appointment slots &nbsp;·&nbsp; {total} total
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({
              labId: "",
              date: new Date().toISOString().split("T")[0],
              slots: [{ startTime: "", endTime: "" }],
            });
            setModalOpen(true);
          }}
          className="flex items-center gap-2 px-6 py-2.5 bg-black text-white text-[11px] font-black uppercase tracking-widest rounded transition-all hover:bg-slate-800"
        >
          <MdAdd size={18} /> Generate Slots
        </button>
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
              placeholder="Search by lab name or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border rounded-sm text-sm outline-none focus:ring-1 transition-all"
              style={{
                backgroundColor: colors.background,
                borderColor: colors.accent + "30",
                color: colors.text,
              }}
            />
          </div>

          {/* Lab Filter */}
          <div className="w-full lg:w-52">
            <select
              value={labFilter}
              onChange={(e) => setLabFilter(e.target.value)}
              className="w-full border rounded-sm px-3 py-2.5 text-sm outline-none focus:ring-1 transition-all"
              style={{
                backgroundColor: colors.background,
                borderColor: colors.accent + "30",
                color: colors.text,
              }}
            >
              <option value="">All Labs</option>
              {labs.map((lab) => (
                <option key={lab._id} value={lab._id}>
                  {lab.labName}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div className="w-full lg:w-44">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full border rounded-sm px-3 py-2.5 text-sm outline-none focus:ring-1 transition-all"
              style={{
                backgroundColor: colors.background,
                borderColor: colors.accent + "30",
                color: colors.text,
              }}
            />
          </div>

          {/* Status Filter */}
          <div className="w-full lg:w-40">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border rounded-sm px-3 py-2.5 text-sm outline-none focus:ring-1 transition-all"
              style={{
                backgroundColor: colors.background,
                borderColor: colors.accent + "30",
                color: colors.text,
              }}
            >
              <option value="">All Status</option>
              <option value="available">Available</option>
              <option value="booked">Booked</option>
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
            onClick={fetchSlots}
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
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50">City</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50">Date</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50">Start Time</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50">End Time</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50 text-center">Status</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-20 text-center text-sm opacity-40">
                    Loading slots...
                  </td>
                </tr>
              ) : displayedSlots.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-20 text-center text-sm opacity-40">
                    {hasFilters ? "No slots match your filters" : "No slots found"}
                  </td>
                </tr>
              ) : (
                displayedSlots.map((slot, idx) => (
                  <tr key={slot._id} className="hover:bg-black/[0.03] transition-colors">
                    <td className="px-5 py-3.5 text-xs font-bold opacity-30">
                      {(page - 1) * LIMIT + idx + 1}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-bold" style={{ color: colors.text }}>
                        {slot.labId?.labName || <span className="opacity-30">—</span>}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-bold opacity-50">
                        {slot.labId?.city || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <MdCalendarToday size={13} className="opacity-30" />
                        <span className="text-sm font-bold">{slot.date}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <MdAccessTime size={13} className="opacity-30" />
                        <span className="text-sm font-bold">{slot.startTime}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <MdAccessTime size={13} className="opacity-30" />
                        <span className="text-sm font-bold">{slot.endTime}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {slot.isBooked ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-sm bg-red-100 text-red-700">
                          <MdCancel size={11} /> Booked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-sm bg-emerald-100 text-emerald-700">
                          <MdCheckCircle size={11} /> Available
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(slot._id)}
                        disabled={slot.isBooked}
                        title={slot.isBooked ? "Cannot delete booked slot" : "Delete slot"}
                        className="p-2 rounded-sm hover:bg-red-100 text-red-500 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                      >
                        <MdDelete size={17} />
                      </button>
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
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total} slots
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

      {/* Generate Slots Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight">Generate Slots</h2>
                <p className="text-[10px] opacity-40 font-bold uppercase mt-1">
                  Create appointment slots for a lab
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="opacity-40 hover:opacity-100 transition-opacity">
                <MdClose size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              <form id="slot-form" onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 block mb-2">Lab *</label>
                  <select
                    required
                    value={formData.labId}
                    onChange={(e) => setFormData((p) => ({ ...p, labId: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded font-bold text-sm outline-none focus:border-black transition-all"
                  >
                    <option value="">-- Select Lab --</option>
                    {labs.map((lab) => (
                      <option key={lab._id} value={lab._id}>{lab.labName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 block mb-2">Date *</label>
                  <input
                    required
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData((p) => ({ ...p, date: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded font-bold text-sm outline-none focus:border-black transition-all"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-[10px] font-black uppercase opacity-40">Time Slots *</label>
                    <button
                      type="button"
                      onClick={addSlotRow}
                      className="text-[9px] font-black uppercase flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded hover:bg-black hover:text-white transition-all"
                    >
                      <MdAdd size={14} /> Add Slot
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.slots.map((slot, idx) => (
                      <div key={idx} className="flex gap-3 items-end">
                        <div className="flex-1">
                          <label className="text-[9px] font-bold uppercase opacity-40 block mb-1">Start</label>
                          <input
                            required
                            type="time"
                            value={slot.startTime}
                            onChange={(e) => updateSlotRow(idx, "startTime", e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded font-bold text-sm outline-none focus:border-black transition-all"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[9px] font-bold uppercase opacity-40 block mb-1">End</label>
                          <input
                            required
                            type="time"
                            value={slot.endTime}
                            onChange={(e) => updateSlotRow(idx, "endTime", e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded font-bold text-sm outline-none focus:border-black transition-all"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSlotRow(idx)}
                          disabled={formData.slots.length === 1}
                          className="w-10 h-10 flex items-center justify-center border border-red-100 text-red-400 hover:bg-red-500 hover:text-white transition-all rounded disabled:opacity-20"
                        >
                          <MdClose size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t flex justify-end gap-3 bg-slate-50">
              <button
                onClick={() => setModalOpen(false)}
                className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-800 transition-all"
              >
                Cancel
              </button>
              <button
                form="slot-form"
                type="submit"
                disabled={submitting}
                className="px-10 py-3 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded hover:opacity-80 transition-all disabled:opacity-30 shadow-xl"
              >
                {submitting ? "Processing..." : "Generate Slots"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Slots;
