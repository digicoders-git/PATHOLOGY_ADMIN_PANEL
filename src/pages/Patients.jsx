import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { getAllPatients, updatePatientStatus } from "../apis/patient";
import { toast } from "react-toastify";
import {
  MdSearch,
  MdPerson,
  MdPhone,
  MdEmail,
  MdClose,
  MdChevronLeft,
  MdChevronRight,
  MdRefresh,
  MdCheckCircle,
  MdCancel,
  MdLocationOn,
} from "react-icons/md";
import Swal from "sweetalert2";

const LIMIT = 10;

const Patients = () => {
  const { colors } = useTheme();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [togglingId, setTogglingId] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllPatients({
        search,
        isActive: statusFilter,
        page,
        limit: LIMIT,
      });
      if (res.success) {
        setData(res.patients || []);
        setTotal(res.count || 0);
        setTotalPages(res.totalPages || 1);
      }
    } catch {
      toast.error("Failed to fetch patients");
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

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const handleStatusToggle = async (id, currentStatus) => {
    const result = await Swal.fire({
      title: "Change Status?",
      text: `Patient will be ${currentStatus ? "blocked" : "activated"}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#111",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, change it!",
    });

    if (result.isConfirmed) {
      try {
        setTogglingId(id);
        const res = await updatePatientStatus(id, {});
        if (res.success) {
          toast.success(res.message);
          setData((prev) =>
            prev.map((p) => (p._id === id ? { ...p, isActive: !p.isActive } : p))
          );
        }
      } catch {
        toast.error("Failed to update status");
      } finally {
        setTogglingId(null);
      }
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSearch("");
    setStatusFilter("");
    setPage(1);
  };

  const hasFilters = searchTerm || statusFilter;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: colors.text }}>
            Patient Records
          </h1>
          <p className="text-sm mt-1 opacity-50">
            All registered patients &nbsp;·&nbsp; {total} total
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
              placeholder="Search by name, mobile, email or address..."
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

          {/* Status Filter */}
          <div className="w-full lg:w-44">
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
              <option value="true">Active</option>
              <option value="false">Blocked</option>
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
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50">Mobile</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50">Email</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50">Age / Gender</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50">Address</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50 text-center">Status</th>
                <th className="px-5 py-4 text-xs font-bold uppercase tracking-wider opacity-50 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-20 text-center text-sm opacity-40">
                    Loading patients...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-20 text-center text-sm opacity-40">
                    {hasFilters ? "No patients match your filters" : "No patients found"}
                  </td>
                </tr>
              ) : (
                data.map((patient, idx) => (
                  <tr key={patient._id} className="hover:bg-black/[0.03] transition-colors">
                    <td className="px-5 py-3.5 text-xs font-bold opacity-30">
                      {(page - 1) * LIMIT + idx + 1}
                    </td>

                    {/* Patient Name + Avatar */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-sm overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
                          {patient.profileImage ? (
                            <img
                              src={`${import.meta.env.VITE_API_BASE_URL}/${patient.profileImage}`}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <MdPerson size={18} className="opacity-30" />
                          )}
                        </div>
                        <span className="text-sm font-bold capitalize" style={{ color: colors.text }}>
                          {patient.name || <span className="opacity-30 font-normal italic">Not set</span>}
                        </span>
                      </div>
                    </td>

                    {/* Mobile */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <MdPhone size={13} className="opacity-30" />
                        <span className="text-sm font-bold">{patient.mobile}</span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <MdEmail size={13} className="opacity-30" />
                        <span className="text-xs opacity-60">{patient.email || "—"}</span>
                      </div>
                    </td>

                    {/* Age / Gender */}
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold capitalize">
                          {patient.gender || "—"}
                        </span>
                        <span className="text-[10px] opacity-40 font-bold">
                          {patient.age ? `Age ${patient.age}` : "Age N/A"}
                        </span>
                      </div>
                    </td>

                    {/* Address */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-start gap-1.5 max-w-[160px]">
                        <MdLocationOn size={13} className="opacity-30 mt-0.5 shrink-0" />
                        <span className="text-xs opacity-50 truncate">
                          {patient.address || "—"}
                        </span>
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-5 py-3.5 text-center">
                      {patient.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-sm bg-emerald-100 text-emerald-700">
                          <MdCheckCircle size={11} /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-sm bg-red-100 text-red-700">
                          <MdCancel size={11} /> Blocked
                        </span>
                      )}
                    </td>

                    {/* Toggle Action */}
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleStatusToggle(patient._id, patient.isActive)}
                        disabled={togglingId === patient._id}
                        title={patient.isActive ? "Block Patient" : "Activate Patient"}
                        className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-sm border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                          patient.isActive
                            ? "border-red-200 text-red-600 hover:bg-red-600 hover:text-white"
                            : "border-emerald-200 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                        }`}
                      >
                        {togglingId === patient._id ? "..." : patient.isActive ? "Block" : "Activate"}
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
              Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total} patients
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

export default Patients;
