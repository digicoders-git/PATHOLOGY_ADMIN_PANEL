import React, { useState, useEffect, useCallback } from "react";
import { MdSearch, MdPerson, MdEmail, MdPhone, MdLocationOn, MdRefresh, MdDelete } from "react-icons/md";
import { useTheme } from "../context/ThemeContext";
import { getAllPatients, updatePatientStatus } from "../apis/patient";
import Loader from "./ui/Loader";
import Swal from "sweetalert2";

const Patients = () => {
    const { colors } = useTheme();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const res = await getAllPatients({
                search: searchTerm,
                page: page,
                limit: 10
            });
            console.log("Patients API Response:", res);
            if (res.success) {
                setData(res.patients || []);
                setPagination({
                    page: page,
                    limit: 10,
                    total: res.count || 0,
                    totalPages: Math.ceil((res.count || 0) / 10) || 1
                });
            }
        } catch (error) {
            console.error(error);
            Swal.fire("Error", "Failed to fetch patients", "error");
        } finally {
            setLoading(false);
        }
    }, [searchTerm, page]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 500);
        return () => clearTimeout(timer);
    }, [fetchData]);

    const handleStatusToggle = async (id, currentStatus) => {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: `You want to ${currentStatus ? 'Deactivate' : 'Activate'} this patient?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: colors.primary,
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, change it!",
        });

        if (result.isConfirmed) {
            try {
                const res = await updatePatientStatus(id, {});
                if (res.success) {
                    Swal.fire("Success", res.message, "success");
                    fetchData();
                }
            } catch (error) {
                Swal.fire("Error", "Failed to update status", "error");
            }
        }
    };

    return (
        <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: colors.background }}>
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight" style={{ color: colors.primary }}>
                        PATIENT <span className="text-blue-500">RECORDS</span>
                    </h1>
                    <p className="opacity-60 text-sm font-medium" style={{ color: colors.text }}>Manage and view all registered patients/users</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchData}
                        className="p-2 bg-white rounded-xl shadow-sm border border-black/5 hover:bg-gray-50 transition-colors"
                    >
                        <MdRefresh className="w-6 h-6 opacity-60" />
                    </button>
                    <div className="relative group">
                        <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 opacity-40 group-focus-within:text-blue-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search patients..."
                            className="bg-white pl-12 pr-4 py-3 rounded-2xl w-full md:w-80 shadow-sm border border-black/5 outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-black/5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                             <MdPerson className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold opacity-40 uppercase tracking-widest">Total Patients</p>
                            <p className="text-2xl font-black">{pagination.total}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[2rem] shadow-xl shadow-blue-900/5 border border-black/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr style={{ backgroundColor: colors.accent + "05" }}>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider opacity-60">Profile</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider opacity-60">Patient Name</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider opacity-60">Contact Info</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider opacity-60">Age/Gender</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider opacity-60">Status</th>
                                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider opacity-60 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5">
                            {loading ? (
                                <tr><td colSpan="6" className="py-20 text-center"><Loader /></td></tr>
                            ) : data.length === 0 ? (
                                <tr><td colSpan="6" className="py-20 text-center opacity-40">No patients found</td></tr>
                            ) : (
                                data.map((patient) => (
                                    <tr key={patient._id} className="hover:bg-black/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-gray-100 border-2 border-white shadow-sm ring-1 ring-black/5">
                                                {patient.profileImage ? (
                                                    <img src={`${import.meta.env.VITE_API_BASE_URL}/${patient.profileImage}`} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-500">
                                                        <MdPerson className="w-6 h-6" />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold capitalize">{patient.name || "Unnamed"}</span>
                                                <span className="text-[10px] opacity-60 flex items-center gap-1">
                                                    <MdLocationOn className="w-3 h-3" /> {patient.address || "-"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs font-medium flex items-center gap-1">
                                                    <MdPhone className="w-3.5 h-3.5 opacity-40" /> {patient.mobile}
                                                </span>
                                                <span className="text-[10px] opacity-40 flex items-center gap-1 lowercase">
                                                    <MdEmail className="w-3.5 h-3.5" /> {patient.email || "N/A"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold capitalize">{patient.gender || "Not Set"}</span>
                                                <span className="text-[10px] opacity-40">Age: {patient.age || 0}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${patient.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                                {patient.isActive ? 'Active' : 'Blocked'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleStatusToggle(patient._id, patient.isActive)}
                                                    className={`p-2 rounded-xl transition-all shadow-sm border ${patient.isActive ? 'text-red-500 hover:bg-red-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                                                    title={patient.isActive ? "Deactivate" : "Activate"}
                                                >
                                                    {patient.isActive ? <MdDelete className="w-5 h-5" /> : <MdRefresh className="w-5 h-5" />}
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
                <div className="p-6 border-t border-black/5 flex items-center justify-between">
                    <p className="text-xs font-bold opacity-40 uppercase tracking-widest">
                        Page {pagination.page} of {pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                        <button 
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="px-4 py-2 bg-white border border-black/5 rounded-xl text-xs font-bold disabled:opacity-30 hover:bg-gray-50 transition-colors"
                        >
                            PREV
                        </button>
                        <button 
                            disabled={page === pagination.totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="px-4 py-2 bg-white border border-black/5 rounded-xl text-xs font-bold disabled:opacity-30 hover:bg-gray-50 transition-colors"
                        >
                            NEXT
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Patients;
