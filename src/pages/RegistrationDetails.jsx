import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { getRegistrationById, getLabWalletTransactions, updateApprovalStatus } from "../apis/registration";
import { MdArrowBack, MdDownload, MdVisibility, MdAccountBalanceWallet, MdCardGiftcard, MdHistory, MdPendingActions, MdCheckCircle, MdCancel } from "react-icons/md";
import Loader from "./ui/Loader";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import CreditWalletModal from "../components/CreditWalletModal";

const RegistrationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [walletTransactions, setWalletTransactions] = useState([]);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [approving, setApproving] = useState(false);

  const handleApprovalAction = async (newStatus) => {
    if (newStatus === "approved") {
      const result = await Swal.fire({
        title: "Approve Lab Registration?",
        text: `Are you sure you want to approve "${data.labName}"? The partner will be allowed to log in and 100 welcome bonus points will be credited to their wallet.`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#10b981",
        cancelButtonColor: "#64748b",
        confirmButtonText: "Yes, Approve & Unlock Bonus",
      });
      if (!result.isConfirmed) return;

      try {
        setApproving(true);
        const res = await updateApprovalStatus(id, "approved");
        if (res.success) {
          toast.success("Lab approved successfully!");
          setData(res.data);
        }
      } catch (err) {
        toast.error(err?.response?.data?.message || err.message || "Approval failed");
      } finally {
        setApproving(false);
      }
    } else if (newStatus === "rejected") {
      const { value: reason } = await Swal.fire({
        title: "Reject Lab Registration",
        input: "text",
        inputLabel: "Rejection Reason (Optional)",
        inputPlaceholder: "Enter reason for rejection...",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        confirmButtonText: "Reject",
      });
      if (reason === undefined) return;

      try {
        setApproving(true);
        const res = await updateApprovalStatus(id, "rejected", reason);
        if (res.success) {
          toast.info("Lab marked as rejected");
          setData(res.data);
        }
      } catch (err) {
        toast.error(err?.response?.data?.message || err.message || "Failed to reject");
      } finally {
        setApproving(false);
      }
    } else if (newStatus === "hold") {
      const { value: query } = await Swal.fire({
        title: "Put Registration on Hold / Query",
        text: "Specify what information or document is mismatched or needs clarification. The lab will see this message.",
        input: "textarea",
        inputLabel: "Admin Query / Correction Needed",
        inputValue: data.adminQuery || "",
        inputPlaceholder: "e.g., Certificate is blurry or address proof mismatch...",
        inputValidator: (val) => !val?.trim() ? "Please enter a query!" : null,
        showCancelButton: true,
        confirmButtonColor: "#f59e0b",
        confirmButtonText: "Send Query & Put on Hold",
      });
      if (!query) return;

      try {
        setApproving(true);
        const res = await updateApprovalStatus(id, "hold", query);
        if (res.success) {
          toast.warning("Lab put on hold with query sent successfully!");
          setData(res.data);
        }
      } catch (err) {
        toast.error(err?.response?.data?.message || err.message || "Failed to update status");
      } finally {
        setApproving(false);
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getRegistrationById(id);
        if (res.success) {
          setData(res.data);
          try {
            const txRes = await getLabWalletTransactions(id);
            if (txRes.success) {
              setWalletTransactions(txRes.data.transactions || []);
            }
          } catch (e) {
            console.error("Failed to load lab wallet transactions:", e);
          }
        } else {
          toast.error("Registration not found");
          navigate("/dashboard/registrations");
        }
      } catch (error) {
        toast.error("Failed to load details");
        navigate("/dashboard/registrations");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  const refreshWalletData = async () => {
    try {
      const res = await getRegistrationById(id);
      if (res.success) setData(res.data);
      const txRes = await getLabWalletTransactions(id);
      if (txRes.success) setWalletTransactions(txRes.data.transactions || []);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate("/dashboard/registrations")}
          className="flex items-center gap-2 px-4 py-2 rounded-sm hover:bg-black/5 transition-all text-sm font-bold uppercase tracking-tight"
          style={{ color: colors.text }}
        >
          <MdArrowBack size={20} /> Back to List
        </button>
        <div className="text-right">
          <h1
            className="text-2xl font-black uppercase tracking-tight"
            style={{ color: colors.primary }}
          >
            Registration Record
          </h1>
          <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest">
            ID: {data._id}
          </p>
        </div>
      </div>

      {/* Pending Approval Banner */}
      {(data.approvalStatus === "pending" || (!data.status && data.approvalStatus !== "rejected" && data.approvalStatus !== "hold")) && (
        <div className="mb-6 p-5 rounded-lg bg-amber-50 border border-amber-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <MdPendingActions size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                Lab Partner Registration Pending Approval
              </h4>
              <p className="text-xs text-amber-700 mt-0.5">
                This lab registered through the mobile app. Approve them to grant login access or send a query if details are mismatched.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-auto shrink-0 flex-wrap">
            <button
              onClick={() => handleApprovalAction("approved")}
              disabled={approving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <MdCheckCircle size={16} /> Approve Partner
            </button>
            <button
              onClick={() => handleApprovalAction("hold")}
              disabled={approving}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <MdPendingActions size={16} /> Put on Hold / Query
            </button>
            <button
              onClick={() => handleApprovalAction("rejected")}
              disabled={approving}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <MdCancel size={16} /> Reject
            </button>
          </div>
        </div>
      )}

      {/* On Hold / Query Banner */}
      {data.approvalStatus === "hold" && (
        <div className="mb-6 p-5 rounded-lg bg-orange-50 border border-orange-300 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
              <MdPendingActions size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-200 text-orange-900 border border-orange-300">
                  ⏸️ Verification on Hold
                </span>
                <h4 className="text-sm font-bold text-orange-950">
                  Admin Query Sent to Lab
                </h4>
              </div>
              <p className="text-xs font-medium text-orange-900 mt-1 bg-white/80 p-2 rounded border border-orange-200">
                "{data.adminQuery || "No query details specified."}"
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end md:self-auto shrink-0 flex-wrap">
            <button
              onClick={() => handleApprovalAction("approved")}
              disabled={approving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <MdCheckCircle size={16} /> Approve Lab
            </button>
            <button
              onClick={() => handleApprovalAction("hold")}
              disabled={approving}
              className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-all shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <MdPendingActions size={16} /> Edit Query
            </button>
            <button
              onClick={() => handleApprovalAction("rejected")}
              disabled={approving}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <MdCancel size={16} /> Reject
            </button>
          </div>
        </div>
      )}

      {data.approvalStatus === "rejected" && (
        <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <MdCancel size={20} />
          </div>
          <p className="text-xs font-bold text-rose-800">
            This lab registration was rejected by Admin.
          </p>
        </div>
      )}

      <div
        className="bg-white rounded-sm border shadow-sm overflow-hidden"
        style={{ borderColor: colors.accent + "20" }}
      >
        {/* Banner area if available */}
        <div className="h-32 bg-slate-100 relative">
          {data.labBanner && (
            <img
              src={data.labBanner}
              alt="Banner"
              className="w-full h-full object-cover opacity-80"
            />
          )}
          <div className="absolute -bottom-10 left-8">
            <div className="w-24 h-24 bg-white rounded-sm border shadow-md p-2 flex items-center justify-center overflow-hidden">
              {data.labLogo ? (
                <img
                  src={data.labLogo}
                  alt="Logo"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-xs font-bold opacity-20 uppercase">
                  No Logo
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pt-14 p-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-black/5 pb-8">
            <div>
              <h2 className="text-3xl font-black uppercase text-primary leading-tight">
                {data.labName}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span
                  className={`uppercase tracking-widest px-2 py-0.5 rounded-sm text-[10px] font-bold ${data.parent ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}
                >
                  {data.parent ? "Parent Lab" : "Individual Lab"}
                </span>
                {data.parent && (
                  <span
                    className="text-sm font-bold opacity-80"
                    style={{ color: colors.text }}
                  >
                    ({data.parent.name})
                  </span>
                )}
                <span className="text-sm font-bold opacity-40">•</span>
                <span className="text-sm font-bold opacity-60">
                  Established: {data.establishmentYear || "N/A"}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span
                className={`px-4 py-1 rounded-sm text-[10px] font-black uppercase border ${
                  data.source === "admin"
                    ? "bg-amber-100 text-amber-700 border-amber-200"
                    : data.source === "app"
                    ? "bg-purple-100 text-purple-700 border-purple-200"
                    : "bg-blue-100 text-blue-700 border-blue-200"
                }`}
              >
                Source: {data.source || "web"}
              </span>

              {data.approvalStatus === "pending" ? (
                <span className="bg-amber-100 text-amber-800 border border-amber-300 px-4 py-1 rounded-sm text-[10px] font-black uppercase">
                  ⏳ Pending Approval
                </span>
              ) : data.approvalStatus === "rejected" ? (
                <span className="bg-rose-100 text-rose-700 border border-rose-200 px-4 py-1 rounded-sm text-[10px] font-black uppercase">
                  ✕ Rejected
                </span>
              ) : (
                <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-1 rounded-sm text-[10px] font-black uppercase">
                  ✓ Approved
                </span>
              )}

              {data.status ? (
                <span className="bg-green-100 text-green-700 px-4 py-1 rounded-sm text-[10px] font-black uppercase">
                  Active Record
                </span>
              ) : (
                <span className="bg-red-100 text-red-700 px-4 py-1 rounded-sm text-[10px] font-black uppercase">
                  Inactive Record
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mt-10">
            {/* Contact & Address */}
            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-secondary border-b pb-2">
                Contact & Location
              </h4>
              <div className="grid gap-4">
                <InfoItem label="Email Address" value={data.email} />
                <InfoItem label="Primary Phone" value={data.phone} />
                <InfoItem label="WhatsApp" value={data.whatsapp} />
                <InfoItem label="Full Address" value={data.fullAddress} />
                <InfoItem label="Area Name" value={data.areaName} />
                <InfoItem
                  label="City & State"
                  value={`${data.city}, ${data.state} - ${data.pincode}`}
                />
                <div className="grid grid-cols-2 gap-4">
                   <InfoItem label="Latitude" value={data.latitude} />
                   <InfoItem label="Longitude" value={data.longitude} />
                </div>
                <InfoItem label="Account Password" value={data.password} />
              </div>
            </div>

            {/* Google Map Display */}
            <div className="md:col-span-2 space-y-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-secondary border-b pb-2">
                Exact Laboratory Location
              </h4>
              <div className="w-full h-80 rounded-sm border-2 border-slate-100 overflow-hidden shadow-sm bg-slate-50 relative group">
                {data.latitude && data.longitude ? (
                  <iframe
                    title="Lab Location"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBEss4wpsQ0o9WPBjDgHsSByUzFuo2oSNE&q=${data.latitude},${data.longitude}&zoom=16`}
                    allowFullScreen
                  ></iframe>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-400 text-xs font-bold uppercase italic">
                    Location coordinates not available
                  </div>
                )}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a 
                      href={`https://www.google.com/maps/search/?api=1&query=${data.latitude},${data.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-white px-4 py-2 rounded-sm shadow-xl text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all"
                    >
                        Open in Google Maps
                    </a>
                </div>
              </div>
            </div>

            {/* Owner Details */}
            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-secondary border-b pb-2">
                Owner & Compliance
              </h4>
              <div className="grid gap-4">
                <InfoItem label="Owner Name" value={data.ownerName} />
                <InfoItem label="Owner Phone" value={data.ownerPhone} />
                <InfoItem label="Owner Email" value={data.ownerEmail} />
                <InfoItem
                  label="Registration No"
                  value={data.registrationNumber}
                />
                <InfoItem
                  label="GSTIN Number"
                  value={
                    data.gstin
                      ? data.gstin
                      : data.isGstRegistered === false
                      ? "Non-GST Lab (Exempted)"
                      : "N/A"
                  }
                />
                {/* <InfoItem label="License No" value={data.license || "N/A"} /> */}
              </div>
            </div>

            {/* Operations */}
            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-secondary border-b pb-2">
                Operation Metrics
              </h4>
              <div className="grid gap-4">
                <InfoItem
                  label="Opening Hours"
                  value={data.openTime || "N/A"}
                />
                <InfoItem
                  label="Closing Hours"
                  value={data.closeTime || "N/A"}
                />
                <InfoItem
                  label="Weekly Holiday"
                  value={data.weeklyOff || "N/A"}
                />
                <div className="pt-2">
                  <span className="text-[10px] uppercase font-bold opacity-40 block mb-2">
                    Service Availability
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    <StatusBadge
                      label="Home Collection"
                      active={data.homeCollection}
                    />
                    <StatusBadge label="24x7 Service" active={data.is24x7} />
                    <StatusBadge
                      label="Emergency Care"
                      active={data.emergency}
                    />
                    <StatusBadge
                      label="Ambulance Service"
                      active={data.ambulanceService}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Info */}
            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-secondary border-b pb-2">
                Billing & Payment
              </h4>
              <div className="grid gap-4">
                <InfoItem label="Bank Name" value={data.bankName || "N/A"} />
                <InfoItem
                  label="Account Number"
                  value={data.accountNumber || "N/A"}
                />
                <InfoItem label="IFSC Code" value={data.ifscCode || "N/A"} />
                <InfoItem label="UPI ID" value={data.upiId || "N/A"} />
              </div>
            </div>

            {/* Wallet & Points Management Card */}
            <div className="space-y-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-emerald-700 border-b pb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MdAccountBalanceWallet size={16} /> Wallet & Points Management
                </span>
              </h4>
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200/80 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">
                      Current Wallet Balance
                    </span>
                    <span className="text-3xl font-black text-emerald-900 tracking-tight">
                      ₹{data.walletBalance || 0}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsWalletModalOpen(true)}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-black text-xs uppercase tracking-wider shadow-sm hover:shadow-md transition-all flex items-center gap-1.5"
                  >
                    <MdCardGiftcard size={16} />
                    Credit Points
                  </button>
                </div>

                {/* Recent Wallet History */}
                <div className="mt-4 pt-3 border-t border-emerald-200/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
                    <MdHistory size={14} /> Recent Transactions ({walletTransactions.length})
                  </span>
                  {walletTransactions.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-1">No transactions recorded yet.</p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                      {walletTransactions.slice(0, 5).map((tx) => (
                        <div key={tx._id} className="bg-white/80 border border-slate-100 rounded-lg p-2.5 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-slate-800 line-clamp-1">{tx.description}</p>
                            <p className="text-[10px] text-slate-400">
                              {new Date(tx.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                              })}
                            </p>
                          </div>
                          <span className={`font-black text-sm whitespace-nowrap ml-2 ${tx.type === "credit" ? "text-emerald-600" : "text-rose-600"}`}>
                            {tx.type === "credit" ? "+" : "-"}₹{tx.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Test Services */}
            <div className="lg:col-span-2 space-y-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-secondary border-b pb-2">
                Available Tests & Custom Pricing
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <span className="text-[10px] uppercase font-bold opacity-40 block mb-3">
                    Associated Tests
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {data.selectedTests?.length > 0 ? (
                      data.selectedTests.map((test) => (
                        <span
                          key={test._id}
                          className="bg-slate-50 border border-slate-200 px-3 py-1 rounded-sm text-[10px] font-bold uppercase"
                        >
                          {test.title}
                        </span>
                      ))
                    ) : (
                      <p className="text-xs italic opacity-40 px-1 text-primary">
                        No standard tests selected
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold opacity-40 block mb-3">
                    Custom Pricing List
                  </span>
                  <div className="space-y-2">
                    {data.testPricing?.length > 0 ? (
                      data.testPricing.map((t, i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center bg-slate-50 p-2 rounded-sm border border-slate-100"
                        >
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase">
                              {t.test?.title || "Unknown Test"}
                            </span>
                            {t.discountPrice && (
                              <span className="text-[9px] text-green-600 font-bold uppercase">
                                Disc. Price: ₹{t.discountPrice}
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-xs font-black ${t.discountPrice ? "line-through opacity-40" : "text-secondary"}`}
                          >
                            ₹{t.price}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs italic opacity-40 px-1 text-primary">
                        No custom pricing items
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Documents Section */}
            <div className="lg:col-span-3 mt-4 space-y-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-secondary border-b pb-2">
                Documentation & Gallery
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {data.pathologyDocs && (
                  <DocCard label="Pathology Docs" url={data.pathologyDocs} />
                )}
                {data.cmoCertificate && (
                  <DocCard label="CMO Certificate (Clinical Establishment ACT)" url={data.cmoCertificate} />
                )}
                {data.labBanner && (
                  <DocCard label="Lab Banner" url={data.labBanner} isImage />
                )}
                {data.labLogo && (
                  <DocCard label="Lab Logo" url={data.labLogo} isImage />
                )}
                {data.Certification?.map((cert, i) => (
                  <DocCard
                    key={i}
                    label={cert.name || `Certification ${i + 1}`}
                    url={cert.file}
                  />
                ))}
              </div>
            </div>
        </div>
      </div>
    </div>

      {/* Credit Wallet Modal */}
      <CreditWalletModal
        isOpen={isWalletModalOpen}
        lab={data}
        onClose={() => setIsWalletModalOpen(false)}
        onSuccess={() => {
          refreshWalletData();
        }}
      />
    </div>
  );
};

const InfoItem = ({ label, value }) => (
  <div>
    <span className="text-[10px] uppercase font-bold opacity-40 block mb-1">
      {label}
    </span>
    <p className="text-sm font-semibold break-words leading-relaxed">
      {value || "Not Provided"}
    </p>
  </div>
);

const StatusBadge = ({ label, active }) => (
  <span
    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-sm ${active ? "bg-green-100 text-green-700 border border-green-200" : "bg-slate-100 text-slate-400 border border-slate-200"}`}
  >
    {label}
  </span>
);

const DocCard = ({ label, url, isImage }) => (
  <a
    href={url}
    target="_blank"
    rel="noreferrer"
    className="group bg-slate-50 border border-slate-200 p-4 rounded-sm hover:border-secondary transition-all flex flex-col items-center justify-center gap-3 text-center"
  >
    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-secondary group-hover:scale-110 transition-transform">
      {isImage ? <MdVisibility size={20} /> : <MdDownload size={20} />}
    </div>
    <span className="text-[10px] font-black uppercase line-clamp-2">
      {label}
    </span>
  </a>
);

export default RegistrationDetails;
