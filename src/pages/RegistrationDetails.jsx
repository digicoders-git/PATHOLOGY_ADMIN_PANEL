import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { getRegistrationById } from "../apis/registration";
import { MdArrowBack, MdDownload, MdVisibility } from "react-icons/md";
import Loader from "./ui/Loader";
import { toast } from "react-toastify";

const RegistrationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getRegistrationById(id);
        if (res.success) {
          setData(res.data);
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
            <div className="flex gap-2">
              <span
                className={`px-4 py-1 rounded-sm text-[10px] font-black uppercase border ${
                  data.source === "admin"
                    ? "bg-amber-100 text-amber-700 border-amber-200"
                    : "bg-blue-100 text-blue-700 border-blue-200"
                }`}
              >
                Source: {data.source || "web"}
              </span>
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
                <InfoItem
                  label="City & State"
                  value={`${data.city}, ${data.state} - ${data.pincode}`}
                />
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
                <InfoItem label="License No" value={data.license || "N/A"} />
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
                    {data.test?.length > 0 ? (
                      data.test.map((t, i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center bg-slate-50 p-2 rounded-sm border border-slate-100"
                        >
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase">
                              {t.name?.title || t.name}
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
