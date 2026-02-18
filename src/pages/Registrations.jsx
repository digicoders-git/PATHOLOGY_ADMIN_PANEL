import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getAllRegistrations,
  updateRegistrationStatus,
  deleteRegistration,
} from "../apis/registration";
import { toast } from "react-toastify";
import {
  MdDelete,
  MdSearch,
  MdChevronLeft,
  MdChevronRight,
  MdVisibility,
  MdEdit,
} from "react-icons/md";
import Loader from "./ui/Loader";
import Swal from "sweetalert2";
import Toggle from "../components/ui/Toggle";
import ModernSelect from "../components/ui/ModernSelect";

const Registrations = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState(""); // For debouncing
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [regType, setRegType] = useState(
    searchParams.get("regType") || "individual",
  ); // 'individual' or 'parent'
  const [page, setPage] = useState(1);
  const [parentIdFilter, setParentIdFilter] = useState(
    searchParams.get("parentId") || "",
  );
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({
    types: [],
    status: [],
    sources: [],
    totalCount: 0,
    individualCount: 0,
    parentCount: 0,
    parents: [],
  });

  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [editingId, setEditingId] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllRegistrations({
        page,
        limit: 10,
        search,
        status: statusFilter,
        type: typeFilter,
        source: sourceFilter,
        regType: regType,
        parentId: parentIdFilter,
      });
      if (res.success) {
        setData(res.data);
        setPagination(res.pagination);
        setStats(res.stats || { types: [], status: [], totalCount: 0 });
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, [
    page,
    search,
    statusFilter,
    typeFilter,
    sourceFilter,
    regType,
    parentIdFilter,
  ]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const type = searchParams.get("regType");
    const parentId = searchParams.get("parentId");
    if (type) setRegType(type);
    if (parentId) setParentIdFilter(parentId);
  }, [searchParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusToggle = useCallback(async (id, currentStatus) => {
    try {
      setTogglingId(id);
      const res = await updateRegistrationStatus(id, !currentStatus);
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
            const res = await deleteRegistration(id);
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

  const viewDetails = (id) => {
    navigate(`/dashboard/registration-details/${id}`);
  };

  const handleEdit = (id) => {
    setEditingId(id);
    navigate(`/dashboard/edit-registration/${id}`);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1
            className="text-2xl font-bold uppercase tracking-tight"
            style={{ color: colors.text }}
          >
            Pathology Registrations
          </h1>
          <p className="text-sm opacity-60" style={{ color: colors.text }}>
            Manage and review lab registration applications
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 self-end md:self-center">
          <button
            onClick={() => navigate("/dashboard/create-registration")}
            className="px-6 py-2.5 bg-black text-white text-[11px] font-black uppercase tracking-[0.1em] rounded-sm hover:opacity-80 transition-all shadow-sm"
          >
            + Register New Lab
          </button>

          {/* Tabs Switcher */}
          <div className="flex bg-gray-100 p-1 rounded-sm shadow-inner">
            <button
              onClick={() => {
                setRegType("individual");
                setPage(1);
                setParentIdFilter("");
              }}
              className={`px-6 py-2 text-sm transition-all rounded-sm flex items-center gap-2 ${regType === "individual" ? "bg-white shadow-sm font-bold opacity-100" : "opacity-40 hover:opacity-60"}`}
              style={{ color: colors.text }}
            >
              <span>Individual Labs</span>
              <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full text-[10px]">
                {stats.individualCount || 0}
              </span>
            </button>
            <button
              onClick={() => {
                setRegType("parent");
                setPage(1);
              }}
              className={`px-6 py-2 text-sm transition-all rounded-sm flex items-center gap-2 ${regType === "parent" ? "bg-white shadow-sm font-bold opacity-100" : "opacity-40 hover:opacity-60"}`}
              style={{ color: colors.text }}
            >
              <span>Parent Labs</span>
              <span className="bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full text-[10px]">
                {stats.parentCount || 0}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div
        className="p-4 rounded-sm border shadow-sm flex flex-col lg:flex-row gap-4 items-center mb-6"
        style={{
          backgroundColor: colors.background,
          borderColor: colors.accent + "20",
        }}
      >
        <div className="relative flex-1 w-full">
          <MdSearch
            className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50"
            size={20}
            style={{ color: colors.text }}
          />
          <input
            type="text"
            placeholder="Search by Lab Name, Owner, Email or Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-sm border outline-none focus:ring-1 transition-all"
            style={{
              backgroundColor: colors.background,
              borderColor: colors.accent + "30",
              color: colors.text,
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <ModernSelect
            value={typeFilter}
            onChange={(val) => {
              setTypeFilter(val);
              setPage(1);
            }}
            options={[
              { label: "All Lab Types", value: "" },
              ...stats.types
                .filter((t) => t.value !== "Parent" && t.value !== "Individual")
                .map((t) => ({
                  label: `${t.label} (${t.count})`,
                  value: t.value,
                })),
            ]}
          />
          <ModernSelect
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setPage(1);
            }}
            options={[
              { label: "All Status", value: "" },
              ...(stats.status?.map((s) => ({
                label: `${s.label} (${s.count})`,
                value: s.value,
              })) || []),
            ]}
          />
          <ModernSelect
            value={sourceFilter}
            onChange={(val) => {
              setSourceFilter(val);
              setPage(1);
            }}
            options={[
              { label: "All Sources", value: "" },
              ...(stats.sources?.map((s) => ({
                label: `${s.label} (${s.count})`,
                value: s.value,
              })) || []),
            ]}
          />
          {regType === "parent" && (
            <ModernSelect
              value={parentIdFilter}
              onChange={(val) => {
                setParentIdFilter(val);
                setPage(1);
              }}
              options={[
                { label: "All Parents", value: "" },
                ...(stats.parents?.map((p) => ({
                  label: `${p.label} (${p.count})`,
                  value: p.value,
                })) || []),
              ]}
            />
          )}
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-sm border shadow-sm overflow-hidden"
        style={{
          backgroundColor: colors.background,
          borderColor: colors.accent + "20",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ backgroundColor: colors.accent + "05" }}>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider opacity-60">
                  #
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider opacity-60">
                  Lab Details
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider opacity-60">
                  Owner
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider opacity-60">
                  Type
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider opacity-60 text-center">
                  Source
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
                  <td colSpan="7" className="py-20 text-center">
                    <Loader />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-20 text-center opacity-40">
                    No registrations found
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr
                    key={item._id}
                    className="hover:bg-black/5 transition-colors group"
                  >
                    <td className="px-6 py-4 text-sm font-medium opacity-40">
                      {(pagination.page - 1) * pagination.limit + index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span
                          className="text-sm font-bold"
                          style={{ color: colors.text }}
                        >
                          {item.labName}
                        </span>
                        <span className="text-[10px] opacity-60">
                          {item.areaName ? `${item.areaName}, ` : ""}
                          {item.city}, {item.state}
                        </span>
                        {item.parent && (
                          <span className="text-[10px] font-black uppercase text-secondary mt-1 tracking-wider opacity-80">
                            Affiliated: {item.parent.name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm">{item.ownerName}</span>
                        <span className="text-[10px] opacity-60">
                          {item.phone}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="text-sm font-bold uppercase tracking-tight"
                        style={{ color: colors.text }}
                      >
                        {item.labType || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-sm border ${
                          item.source === "admin"
                            ? "bg-amber-100 text-amber-700 border-amber-200"
                            : "bg-blue-100 text-blue-700 border-blue-200"
                        }`}
                      >
                        {item.source || "web"}
                      </span>
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
                          onClick={() => viewDetails(item._id)}
                          className="p-2 rounded-sm hover:bg-black/5 text-primary opacity-60 hover:opacity-100 transition-all"
                          title="View Details"
                        >
                          <MdVisibility size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(item._id)}
                          className="p-2 rounded-sm hover:bg-black/5 text-blue-600 opacity-60 hover:opacity-100 transition-all flex items-center justify-center"
                          title="Edit Registration"
                          disabled={editingId === item._id}
                        >
                          {editingId === item._id ? (
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <MdEdit size={18} />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          disabled={deletingId === item._id}
                          className="p-2 rounded-sm hover:bg-red-100 text-red-600 transition-colors disabled:opacity-50"
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
            <p className="text-sm opacity-60" style={{ color: colors.text }}>
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
              of {pagination.total}
            </p>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="p-2 border rounded-sm hover:bg-black/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ borderColor: colors.accent + "20" }}
              >
                <MdChevronLeft size={20} />
              </button>
              <button
                disabled={page === pagination.totalPages}
                onClick={() => setPage(page + 1)}
                className="p-2 border rounded-sm hover:bg-black/5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ borderColor: colors.accent + "20" }}
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

export default Registrations;
