import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTheme } from "../context/ThemeContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getAllRegistrations,
  updateRegistrationStatus,
  deleteRegistration,
  bulkCreateRegistrations,
  toggleFeatured,
} from "../apis/registration";
import { getAllParentsWithLabs } from "../apis/parent";
import { toast } from "react-toastify";
import {
  MdDelete,
  MdSearch,
  MdChevronLeft,
  MdChevronRight,
  MdVisibility,
  MdEdit,
  MdFileDownload,
  MdUploadFile,
  MdStar,
  MdStarOutline,
  MdKeyboardArrowDown,
  MdOutlineScience,
} from "react-icons/md";
import * as XLSX from "xlsx";
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
  const [featuringId, setFeaturingId] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  // Parent grouped data
  const [parentData, setParentData] = useState([]);
  const [parentLoading, setParentLoading] = useState(false);
  const [expandedParentId, setExpandedParentId] = useState(null);
  const [parentPagination, setParentPagination] = useState({ page: 1, totalPages: 1 });
  const [parentPage, setParentPage] = useState(1);

  const fetchParentData = useCallback(async () => {
    try {
      setParentLoading(true);
      const res = await getAllParentsWithLabs({ page: parentPage, limit: 10, search });
      if (res.success) { setParentData(res.data); setParentPagination(res.pagination); }
    } catch { toast.error("Failed to fetch parent data"); }
    finally { setParentLoading(false); }
  }, [parentPage, search]);

  const handleDownloadSample = () => {
    const sampleData = [
      {
        // Basic Information
        labName: "Sample Pathology Lab",
        labType: "Pathology",
        establishmentYear: 2010,
        registrationNumber: "REG123456",
        description: "Complete diagnostic services with modern equipment and experienced staff",
        
        // Contact Details
        phone: "9876543210",
        email: "lab@example.com",
        whatsapp: "9876543210",
        password: "password123",
        
        // Owner Information
        ownerName: "Dr. John Doe",
        ownerPhone: "9876543211",
        ownerEmail: "owner@example.com",
        
        // Address
        fullAddress: "123 Main Street, Medical Complex",
        areaName: "Sector 5",
        city: "Delhi",
        state: "Delhi",
        pincode: "110001",
        latitude: "28.6139",
        longitude: "77.2090",
        
        // Services (true/false)
        homeCollection: "true",
        is24x7: "false",
        emergency: "false",
        ambulanceService: "false",
        
        // Timings
        openTime: "08:00",
        closeTime: "20:00",
        weeklyOff: "Sunday",
        
        // Payment Details
        upiId: "lab@upi",
        bankName: "State Bank of India",
        accountNumber: "1234567890",
        ifscCode: "SBIN0001234",
        
        // Additional Fields
        staffCount: "15",
        source: "admin",
        status: "true",
      },
      {
        // Second sample with different data
        labName: "City Diagnostic Center",
        labType: "Diagnostic Center",
        establishmentYear: 2015,
        registrationNumber: "REG789012",
        description: "Advanced diagnostic center with radiology and pathology services",
        
        phone: "9876543220",
        email: "city@example.com",
        whatsapp: "9876543220",
        password: "citylab123",
        
        ownerName: "Dr. Jane Smith",
        ownerPhone: "9876543221",
        ownerEmail: "jane@example.com",
        
        fullAddress: "456 Health Avenue, Medical District",
        areaName: "Central Zone",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        latitude: "19.0760",
        longitude: "72.8777",
        
        homeCollection: "true",
        is24x7: "true",
        emergency: "true",
        ambulanceService: "true",
        
        openTime: "06:00",
        closeTime: "22:00",
        weeklyOff: "",
        
        upiId: "citylab@paytm",
        bankName: "HDFC Bank",
        accountNumber: "9876543210",
        ifscCode: "HDFC0001234",
        
        staffCount: "25",
        source: "admin",
        status: "true",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Registrations");
    XLSX.writeFile(wb, "registration_sample.xlsx");
  };

  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleImportExcel = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Reset file input for same file selection
    e.target.value = "";

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        if (data.length === 0) {
          toast.error("Excel file is empty");
          return;
        }
        
        setPreviewData(data);
        setShowPreview(true);
      } catch (err) {
        toast.error("Failed to parse Excel file");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = async () => {
    if (!previewData) return;
    try {
      setImporting(true);
      
      // Transform Excel data to match API expectations
      const transformedData = previewData.map((row) => ({
        // Basic Information
        labName: row.labName || "",
        labType: row.labType || "Pathology",
        establishmentYear: row.establishmentYear ? parseInt(row.establishmentYear) : null,
        registrationNumber: row.registrationNumber || "",
        description: row.description || "",
        
        // Contact Details
        phone: row.phone || "",
        email: row.email || "",
        whatsapp: row.whatsapp || "",
        password: row.password || "defaultpass123",
        
        // Owner Information
        ownerName: row.ownerName || "",
        ownerPhone: row.ownerPhone || "",
        ownerEmail: row.ownerEmail || "",
        
        // Address
        fullAddress: row.fullAddress || "",
        areaName: row.areaName || "",
        city: row.city || "",
        state: row.state || "",
        pincode: row.pincode || "",
        latitude: row.latitude || "",
        longitude: row.longitude || "",
        
        // Services (convert string to boolean)
        homeCollection: row.homeCollection === "true" || row.homeCollection === true,
        is24x7: row.is24x7 === "true" || row.is24x7 === true,
        emergency: row.emergency === "true" || row.emergency === true,
        ambulanceService: row.ambulanceService === "true" || row.ambulanceService === true,
        
        // Timings
        openTime: row.openTime || "",
        closeTime: row.closeTime || "",
        weeklyOff: row.weeklyOff || "",
        
        // Payment Details
        upiId: row.upiId || "",
        bankName: row.bankName || "",
        accountNumber: row.accountNumber || "",
        ifscCode: row.ifscCode || "",
        
        // Additional Fields
        staffCount: row.staffCount ? parseInt(row.staffCount) : null,
        source: row.source || "admin",
        status: row.status === "false" ? false : true, // Default to true unless explicitly false
      }));
      
      const res = await bulkCreateRegistrations(transformedData);
      if (res.success) {
        toast.success(res.message);
        if (res.data?.errors?.length) {
          res.data.errors.forEach(err => toast.warning(err, { autoClose: 6000 }));
        }
        setShowPreview(false);
        setPreviewData(null);
        fetchData();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Import failed");
    } finally {
      setImporting(false);
    }
  };

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

  useEffect(() => {
    if (regType === "parent") fetchParentData();
  }, [regType, fetchParentData]);

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

  const handleToggleFeatured = async (id, current) => {
    const result = await Swal.fire({
      title: current ? "Remove from Featured?" : "Mark as Featured?",
      text: current
        ? "This lab will no longer appear at the top of listings."
        : "This lab will be promoted to the top of all listings.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#111",
      cancelButtonColor: "#d33",
      confirmButtonText: current ? "Yes, remove it!" : "Yes, feature it!",
    });
    if (!result.isConfirmed) return;
    try {
      setFeaturingId(id);
      const res = await toggleFeatured(id);
      if (res.success) {
        toast.success(res.message);
        // Update individual tab data
        setData((prev) =>
          prev.map((item) =>
            item._id === id ? { ...item, isFeatured: res.isFeatured } : item
          )
        );
        // Update parent tab data
        setParentData((prev) =>
          prev.map((parent) => ({
            ...parent,
            labs: parent.labs.map((lab) =>
              lab._id === id ? { ...lab, isFeatured: res.isFeatured } : lab
            ),
          }))
        );
      }
    } catch {
      toast.error("Failed to update featured status");
    } finally {
      setFeaturingId(null);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Pathology Registrations</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and review laboratory applications</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-slate-100 rounded-lg p-1 mr-2">
            <button
              onClick={() => { setRegType("individual"); setPage(1); setParentIdFilter(""); }}
              className={`px-4 py-1.5 text-xs font-bold transition-all rounded-md flex items-center gap-2 ${regType === "individual" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
            >
              Individual <span className="text-[10px] opacity-60">({stats.individualCount || 0})</span>
            </button>
            <button
              onClick={() => { setRegType("parent"); setPage(1); }}
              className={`px-4 py-1.5 text-xs font-bold transition-all rounded-md flex items-center gap-2 ${regType === "parent" ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
            >
              Parent <span className="text-[10px] opacity-60">({stats.parentCount || 0})</span>
            </button>
          </div>

          <button
            onClick={handleDownloadSample}
            className="px-4 py-2 bg-white border border-slate-200 text-xs font-bold text-slate-600 rounded-lg hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2"
          >
            <MdFileDownload size={16} />
            Sample File
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-bold rounded-lg hover:bg-emerald-100 transition-all shadow-sm flex items-center gap-2"
          >
            <MdUploadFile size={16} />
            {importing ? "Importing..." : "Import Excel"}
          </button>

          <button
            onClick={() => navigate("/dashboard/create-registration")}
            className="px-5 py-2 bg-slate-900 border border-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2"
          >
            <span>+ New Registration</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleImportExcel}
          />
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
          {regType === "parent" ? (
            /* ── PARENT GROUPED VIEW ── */
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ backgroundColor: colors.accent + "05" }}>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider opacity-60 w-10"></th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider opacity-60">#</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider opacity-60">Parent Name</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider opacity-60 text-center">Total Labs</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider opacity-60 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {parentLoading ? (
                  <tr><td colSpan="5" className="py-20 text-center"><Loader /></td></tr>
                ) : parentData.length === 0 ? (
                  <tr><td colSpan="5" className="py-20 text-center opacity-40">No parent registrations found</td></tr>
                ) : (
                  parentData.map((parent, index) => (
                    <React.Fragment key={parent._id}>
                      {/* Parent Row */}
                      <tr
                        className="hover:bg-black/5 transition-colors cursor-pointer"
                        style={expandedParentId === parent._id ? { backgroundColor: colors.accent + "08" } : {}}
                        onClick={() => setExpandedParentId(expandedParentId === parent._id ? null : parent._id)}
                      >
                        <td className="px-6 py-4">
                          <MdKeyboardArrowDown
                            size={20}
                            className="transition-transform duration-200"
                            style={{
                              color: colors.primary,
                              transform: expandedParentId === parent._id ? "rotate(0deg)" : "rotate(-90deg)"
                            }}
                          />
                        </td>
                        <td className="px-6 py-4 text-sm font-medium opacity-40">
                          {(parentPagination.page - 1) * 10 + index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold" style={{ color: colors.text }}>{parent.name}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-bold">
                            {parent.labCount || 0} LABS
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            parent.status ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                          }`}>
                            {parent.status ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>

                      {/* Expanded Labs */}
                      {expandedParentId === parent._id && (
                        <tr>
                          <td colSpan={5} className="px-10 py-5" style={{ backgroundColor: colors.accent + "04" }}>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4 flex items-center gap-2">
                              <MdOutlineScience size={13} /> Labs under {parent.name}
                            </p>
                            {parent.labCount === 0 ? (
                              <p className="text-xs text-slate-300 italic">No labs registered under this parent.</p>
                            ) : (
                              <div className="overflow-x-auto rounded-lg border border-slate-100">
                                <table className="w-full text-left border-collapse min-w-[900px]">
                                  <thead>
                                    <tr className="bg-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-500 border-b">
                                      <th className="px-4 py-2.5">#</th>
                                      <th className="px-4 py-2.5">Lab</th>
                                      <th className="px-4 py-2.5">Type</th>
                                      <th className="px-4 py-2.5">Location</th>
                                      <th className="px-4 py-2.5">Contact</th>
                                      <th className="px-4 py-2.5">Owner</th>
                                      <th className="px-4 py-2.5 text-center">Services</th>
                                      <th className="px-4 py-2.5 text-center">Status</th>
                                      <th className="px-4 py-2.5 text-right">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 bg-white">
                                    {parent.labs.map((lab, idx) => (
                                      <tr key={lab._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 text-xs text-slate-400 font-bold">{idx + 1}</td>
                                        <td className="px-4 py-3">
                                          <div className="flex items-center gap-2.5">
                                            {lab.labLogo ? (
                                              <img src={lab.labLogo} className="w-8 h-8 rounded object-cover shrink-0 border border-slate-100" alt="" />
                                            ) : (
                                              <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center shrink-0">
                                                <MdOutlineScience size={14} className="text-slate-400" />
                                              </div>
                                            )}
                                            <div>
                                              <p className="text-xs font-bold text-slate-800">{lab.labName}</p>
                                              <p className="text-[10px] text-slate-400">{lab.registrationNumber || "—"}</p>
                                            </div>
                                          </div>
                                        </td>
                                        <td className="px-4 py-3">
                                          <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">{lab.labType || "—"}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                          <p className="text-xs font-semibold text-slate-600">{lab.city || "—"}, {lab.state || "—"}</p>
                                          <p className="text-[10px] text-slate-400">{lab.pincode || ""}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                          <p className="text-xs text-slate-600">{lab.phone || "—"}</p>
                                          <p className="text-[10px] text-slate-400 truncate max-w-[130px]">{lab.email || ""}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                          <p className="text-xs font-semibold text-slate-600">{lab.ownerName || "—"}</p>
                                          <p className="text-[10px] text-slate-400">{lab.ownerPhone || ""}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="flex flex-wrap gap-1 justify-center">
                                            {lab.homeCollection && <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">Home</span>}
                                            {lab.is24x7 && <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">24x7</span>}
                                            {lab.emergency && <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">Emergency</span>}
                                            {lab.ambulanceService && <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold">Ambulance</span>}
                                            {!lab.homeCollection && !lab.is24x7 && !lab.emergency && !lab.ambulanceService && <span className="text-[9px] text-slate-300">—</span>}
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                            lab.status ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                                          }`}>
                                            {lab.status ? "Active" : "Inactive"}
                                          </span>
                                        </td>
                                      <td className="px-4 py-3 text-right">
                                          <div className="flex justify-end gap-1">
                                            <button
                                              onClick={(e) => { e.stopPropagation(); handleToggleFeatured(lab._id, lab.isFeatured); }}
                                              disabled={featuringId === lab._id}
                                              className="p-1.5 rounded transition-all" title={lab.isFeatured ? "Remove Featured" : "Mark Featured"}>
                                              {featuringId === lab._id
                                                ? <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                                                : lab.isFeatured
                                                  ? <MdStar size={16} className="text-amber-400" />
                                                  : <MdStarOutline size={16} className="opacity-30 hover:opacity-70 hover:text-amber-400" />}
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); viewDetails(lab._id); }}
                                              className="p-1.5 rounded hover:bg-black/5 opacity-60 hover:opacity-100 transition-all" title="View">
                                              <MdVisibility size={16} />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleEdit(lab._id); }}
                                              className="p-1.5 rounded hover:bg-black/5 text-blue-600 opacity-60 hover:opacity-100 transition-all" title="Edit">
                                              <MdEdit size={16} />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(lab._id); }}
                                              className="p-1.5 rounded hover:bg-red-50 text-red-600 opacity-60 hover:opacity-100 transition-all" title="Delete">
                                              <MdDelete size={16} />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            /* ── INDIVIDUAL FLAT VIEW ── */
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
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider opacity-60 text-center">
                  Featured
                </th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider opacity-60 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-20 text-center">
                    <Loader />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-20 text-center opacity-40">
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
                        onChange={() => handleStatusToggle(item._id, item.status)}
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleFeatured(item._id, item.isFeatured)}
                        disabled={featuringId === item._id}
                        title={item.isFeatured ? "Remove from Featured" : "Mark as Featured"}
                        className="transition-all disabled:opacity-40"
                      >
                        {featuringId === item._id ? (
                          <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                        ) : item.isFeatured ? (
                          <MdStar size={22} className="text-amber-400" />
                        ) : (
                          <MdStarOutline size={22} className="opacity-25 hover:opacity-70 hover:text-amber-400 transition-all" />
                        )}
                      </button>
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
          )}
        </div>

        {/* Pagination */}
        {regType === "parent" ? (
          !parentLoading && parentData.length > 0 && parentPagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: colors.accent + "10" }}>
              <p className="text-sm opacity-60" style={{ color: colors.text }}>Page {parentPagination.page} of {parentPagination.totalPages}</p>
              <div className="flex gap-2">
                <button disabled={parentPage === 1} onClick={() => setParentPage(parentPage - 1)}
                  className="p-2 border rounded-sm hover:bg-black/5 transition-all disabled:opacity-30" style={{ borderColor: colors.accent + "20" }}>
                  <MdChevronLeft size={20} />
                </button>
                <button disabled={parentPage >= parentPagination.totalPages} onClick={() => setParentPage(parentPage + 1)}
                  className="p-2 border rounded-sm hover:bg-black/5 transition-all disabled:opacity-30" style={{ borderColor: colors.accent + "20" }}>
                  <MdChevronRight size={20} />
                </button>
              </div>
            </div>
          )
        ) : (
          !loading && data.length > 0 && (
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
          )
        )}
      </div>

      {/* Excel Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-sm border shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Preview Excel Data</h2>
                <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-1">Review the list before confirming import ({previewData?.length} labs found)</p>
              </div>
              <button 
                onClick={() => setShowPreview(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
                disabled={importing}
              >
                <MdDelete size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-0">
              <table className="w-full text-left border-collapse min-w-[1400px]">
                <thead className="sticky top-0 bg-white shadow-sm z-10">
                  <tr className="bg-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-600 border-b">
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Lab Details</th>
                    <th className="px-4 py-3">Owner Info</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Services</th>
                    <th className="px-4 py-3">Timings</th>
                    <th className="px-4 py-3">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-all">
                      <td className="px-4 py-3 text-xs text-slate-400 font-bold">{idx + 1}</td>
                      
                      {/* Lab Details */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="text-sm font-bold text-slate-700">{row.labName || '---'}</div>
                          <div className="text-[10px] text-slate-500">{row.labType || '---'}</div>
                          <div className="text-[10px] text-slate-400">Est: {row.establishmentYear || '---'}</div>
                          <div className="text-[10px] text-blue-600 font-medium">{row.registrationNumber || '---'}</div>
                        </div>
                      </td>
                      
                      {/* Owner Info */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-slate-600">{row.ownerName || '---'}</div>
                          <div className="text-[10px] text-slate-500">{row.ownerPhone || '---'}</div>
                          <div className="text-[10px] text-slate-500">{row.ownerEmail || '---'}</div>
                        </div>
                      </td>
                      
                      {/* Contact */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="text-sm text-slate-600">{row.phone || '---'}</div>
                          <div className="text-[10px] text-slate-500">{row.email || '---'}</div>
                          <div className="text-[10px] text-green-600">{row.whatsapp || '---'}</div>
                        </div>
                      </td>
                      
                      {/* Location */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="text-[10px] text-slate-600">{row.city || '---'}, {row.state || '---'}</div>
                          <div className="text-[10px] text-slate-500">{row.areaName || '---'}</div>
                          <div className="text-[10px] text-slate-400">{row.pincode || '---'}</div>
                          {row.latitude && row.longitude && (
                            <div className="text-[9px] text-blue-500">{row.latitude}, {row.longitude}</div>
                          )}
                        </div>
                      </td>
                      
                      {/* Services */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {(row.homeCollection === 'true' || row.homeCollection === true) && (
                            <span className="text-[9px] bg-green-100 text-green-700 px-1 py-0.5 rounded">Home Collection</span>
                          )}
                          {(row.is24x7 === 'true' || row.is24x7 === true) && (
                            <span className="text-[9px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded block mt-1">24x7</span>
                          )}
                          {(row.emergency === 'true' || row.emergency === true) && (
                            <span className="text-[9px] bg-red-100 text-red-700 px-1 py-0.5 rounded block mt-1">Emergency</span>
                          )}
                          {(row.ambulanceService === 'true' || row.ambulanceService === true) && (
                            <span className="text-[9px] bg-purple-100 text-purple-700 px-1 py-0.5 rounded block mt-1">Ambulance</span>
                          )}
                        </div>
                      </td>
                      
                      {/* Timings */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="text-[10px] text-slate-600">{row.openTime || '---'} - {row.closeTime || '---'}</div>
                          <div className="text-[10px] text-slate-500">Off: {row.weeklyOff || 'None'}</div>
                        </div>
                      </td>
                      
                      {/* Payment */}
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <div className="text-[10px] text-slate-600">{row.upiId || '---'}</div>
                          <div className="text-[10px] text-slate-500">{row.bankName || '---'}</div>
                          <div className="text-[10px] text-slate-400">{row.ifscCode || '---'}</div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t flex justify-end gap-3 bg-slate-50">
              <button
                onClick={() => setShowPreview(false)}
                className="px-6 py-2.5 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-200 rounded-sm transition-all"
                disabled={importing}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                disabled={importing}
                className="px-8 py-2.5 bg-black text-white text-[11px] font-black uppercase tracking-widest rounded-sm hover:opacity-80 transition-all flex items-center gap-2"
              >
                {importing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    CONFIRMING...
                  </>
                ) : (
                  'CONFIRM IMPORT'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Registrations;
