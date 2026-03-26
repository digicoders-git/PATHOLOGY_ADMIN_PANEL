import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "../context/ThemeContext";
import { getAllBookings, updateBookingStatus, deleteBooking, uploadTestReport } from "../apis/booking";
import { toast } from "react-toastify";
import {
  MdDelete,
  MdSearch,
  MdChevronLeft,
  MdChevronRight,
  MdVisibility,
  MdCloudUpload,
  MdFilePresent,
  MdFilterList,
} from "react-icons/md";
import Loader from "./ui/Loader";
import Swal from "sweetalert2";
import ModernSelect from "../components/ui/ModernSelect";

const Bookings = () => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllBookings({
        page,
        limit: 10,
        status: statusFilter,
        search: searchTerm,
      });
      console.log("Bookings API Response:", res);
      if (res.success && res.data) {
        setData(Array.isArray(res.data) ? res.data : []);
        setPagination({
          page: res.page || 1,
          limit: 10,
          total: res.count || 0,
          totalPages: Math.ceil((res.count || 0) / 10) || 1,
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch bookings");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
        fetchData();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, page, statusFilter, fetchData]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await updateBookingStatus(id, { status: newStatus });
      if (res.success) {
        toast.success("Status updated successfully");
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Status update failed");
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This booking will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: colors.primary,
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await deleteBooking(id);
          if (res.success) {
            toast.success("Booking deleted");
            fetchData();
          }
        } catch (error) {
          toast.error("Deletion failed");
        }
      }
    });
  };

  const handleFileUpload = async (id, e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const res = await uploadTestReport(id, file);
      if (res.success) {
        toast.success("Report uploaded successfully");
        fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Upload failed");
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Test Bookings</h1>
          <p className="text-sm text-slate-500 mt-1">Monitor and manage patient test appointments</p>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-sm border shadow-sm flex flex-col lg:flex-row gap-4 items-center mb-6"
           style={{ backgroundColor: colors.background, borderColor: colors.accent + "20" }}>
        <div className="relative flex-1 w-full">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" size={20} />
          <input
            type="text"
            placeholder="Search by Patient Name or Lab..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-sm border outline-none focus:ring-1 transition-all"
            style={{ backgroundColor: colors.background, borderColor: colors.accent + "30", color: colors.text }}
          />
        </div>

        <ModernSelect
          value={statusFilter}
          onChange={(val) => { setStatusFilter(val); setPage(1); }}
          options={[
            { label: "All Status", value: "" },
            { label: "Pending", value: "Pending" },
            { label: "Confirmed", value: "Confirmed" },
            { label: "In Progress", value: "In Progress" },
            { label: "Completed", value: "Completed" },
            { label: "Cancelled", value: "Cancelled" },
          ]}
        />
      </div>

      {/* Table */}
      <div className="rounded-sm border shadow-sm overflow-hidden"
           style={{ backgroundColor: colors.background, borderColor: colors.accent + "20" }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ backgroundColor: colors.accent + "05" }}>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider opacity-60">Patient</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider opacity-60">Lab/Diagnostic</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider opacity-60 text-center">Collection / Payment</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider opacity-60 text-center">Amount</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider opacity-60">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider opacity-60 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {loading ? (
                <tr><td colSpan="7" className="py-20 text-center"><Loader /></td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan="7" className="py-20 text-center opacity-40">No bookings found</td></tr>
              ) : (
                data.map((item) => (
                  <tr key={item._id} className="hover:bg-black/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">{item.patient?.name || "Patient (Deleted/NA)"}</span>
                        <span className="text-[10px] opacity-60">{item.patient?.phone || "No Contact"}</span>
                        <div className="mt-1 flex gap-1">
                           <span className="text-[8px] bg-indigo-50 text-indigo-500 px-1 rounded uppercase font-bold">{item.sampleCollectionType}</span>
                           <span className={`text-[8px] px-1 rounded uppercase font-bold ${item.paymentMethod === 'Online' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>{item.paymentMethod}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{item.registration?.labName || "Lab Unauthorized/NA"}</span>
                        <span className="text-[10px] opacity-60 text-primary uppercase font-bold tracking-tighter">
                          {item.tests?.length || 0} Test(s)
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col gap-1 items-center">
                        <span className="text-xs font-bold">{new Date(item.scheduledDate).toLocaleDateString('en-GB')}</span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-sm ${item.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {item.paymentStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-sm text-slate-800">₹{item.finalAmount}</span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item._id, e.target.value)}
                        className={`text-[10px] font-black uppercase px-2 py-1 rounded-sm border outline-none ${
                          item.status === 'Completed' ? 'bg-green-100 text-green-700 border-green-200' :
                          item.status === 'Cancelled' ? 'bg-red-100 text-red-700 border-red-200' :
                          'bg-amber-100 text-amber-700 border-amber-200'
                        }`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {item.reportFile ? (
                           <a href={`${import.meta.env.VITE_API_BASE_URL}/${item.reportFile}`} target="_blank" rel="noreferrer"
                              className="p-2 rounded-sm hover:bg-black/5 text-blue-600" title="View Report">
                             <MdFilePresent size={18} />
                           </a>
                        ) : (
                          <label className="p-2 rounded-sm hover:bg-black/5 text-emerald-600 cursor-pointer" title="Upload Report">
                            <MdCloudUpload size={18} />
                            <input type="file" className="hidden" onChange={(e) => handleFileUpload(item._id, e)} />
                          </label>
                        )}
                        <button onClick={() => handleDelete(item._id)} className="p-2 rounded-sm hover:bg-red-100 text-red-600" title="Delete">
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
          <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: colors.accent + "10" }}>
            <p className="text-sm opacity-60">Page {page} of {pagination.totalPages}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(page - 1)} className="p-2 border rounded-sm hover:bg-black/5 disabled:opacity-30"><MdChevronLeft size={20} /></button>
              <button disabled={page === pagination.totalPages} onClick={() => setPage(page + 1)} className="p-2 border rounded-sm hover:bg-black/5 disabled:opacity-30"><MdChevronRight size={20} /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookings;
