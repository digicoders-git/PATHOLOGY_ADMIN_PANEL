import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useNavigate, useParams } from "react-router-dom";
import { getAllParents } from "../apis/parent";
import { getRegistrationById, updateRegistration } from "../apis/registration";
import { getTestServices } from "../apis/testAndServices";
import { toast } from "react-toastify";
import {
  MdArrowBack,
  MdCloudUpload,
  MdAdd,
  MdDelete,
  MdCheckBox,
  MdCheckBoxOutlineBlank,
} from "react-icons/md";
import ModernSelect from "../components/ui/ModernSelect";
import Loader from "./ui/Loader";

const EditRegistration = () => {
  const { colors } = useTheme();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [parents, setParents] = useState([]);
  const [availableTests, setAvailableTests] = useState([]);

  const [formData, setFormData] = useState({
    parent: "",
    labName: "",
    labLogo: null,
    labBanner: null,
    labType: "Pathology",
    description: "",
    establishmentYear: "",
    registrationNumber: "",
    fullAddress: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    email: "",
    whatsapp: "",
    ownerName: "",
    ownerPhone: "",
    ownerEmail: "",
    selectedTests: [],
    homeCollection: false,
    is24x7: false,
    emergency: false,
    openTime: "",
    closeTime: "",
    weeklyOff: "",
    upiId: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    staffCount: "",
    pathologyDocs: null,
    certifications: [{ name: "", file: null }],
    pricingItems: [{ test: "", price: "" }],
    status: true,
  });

  const [existingFiles, setExistingFiles] = useState({
    labLogo: null,
    labBanner: null,
    pathologyDocs: null,
    certifications: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitialLoading(true);
        const [parentsRes, testsRes, regRes] = await Promise.all([
          getAllParents({ limit: 1000 }),
          getTestServices({ limit: 1000 }),
          getRegistrationById(id),
        ]);

        if (parentsRes.success) setParents(parentsRes.data);
        if (testsRes.success) setAvailableTests(testsRes.data);

        if (regRes.success) {
          const reg = regRes.data;
          setFormData({
            parent: reg.parent?._id || "",
            labName: reg.labName || "",
            labType: reg.labType || "Pathology",
            description: reg.description || "",
            establishmentYear: reg.establishmentYear || "",
            registrationNumber: reg.registrationNumber || "",
            fullAddress: reg.fullAddress || "",
            city: reg.city || "",
            state: reg.state || "",
            pincode: reg.pincode || "",
            phone: reg.phone || "",
            email: reg.email || "",
            whatsapp: reg.whatsapp || "",
            ownerName: reg.ownerName || "",
            ownerPhone: reg.ownerPhone || "",
            ownerEmail: reg.ownerEmail || "",
            selectedTests: reg.selectedTests
              ? reg.selectedTests.map((t) =>
                  typeof t === "object" ? t._id : t,
                )
              : [],
            homeCollection: reg.homeCollection || false,
            is24x7: reg.is24x7 || false,
            emergency: reg.emergency || false,
            openTime: reg.openTime || "",
            closeTime: reg.closeTime || "",
            weeklyOff: reg.weeklyOff || "",
            upiId: reg.upiId || "",
            bankName: reg.bankName || "",
            accountNumber: reg.accountNumber || "",
            ifscCode: reg.ifscCode || "",
            staffCount: reg.staffCount || "",
            certifications:
              reg.Certification && reg.Certification.length > 0
                ? reg.Certification.map((c) => ({
                    name: c.name,
                    file: null,
                    existingFile: c.file,
                  }))
                : [{ name: "", file: null }],
            pricingItems:
              reg.test && reg.test.length > 0
                ? reg.test.map((t) => ({ test: t.name, price: t.price }))
                : [{ test: "", price: "" }],
            status: reg.status !== undefined ? reg.status : true,
          });

          setExistingFiles({
            labLogo: reg.labLogo,
            labBanner: reg.labBanner,
            pathologyDocs: reg.pathologyDocs,
            certifications: reg.Certification || [],
          });
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
        toast.error("Failed to load registration data");
      } finally {
        setInitialLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "file") {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
      return;
    }

    if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTestToggle = (id) => {
    setFormData((prev) => ({
      ...prev,
      selectedTests: prev.selectedTests.includes(id)
        ? prev.selectedTests.filter((t) => t !== id)
        : [...prev.selectedTests, id],
    }));
  };

  const handleAddCert = () => {
    setFormData((prev) => ({
      ...prev,
      certifications: [...prev.certifications, { name: "", file: null }],
    }));
  };

  const handleCertChange = (index, field, value) => {
    const newCerts = [...formData.certifications];
    newCerts[index][field] = value;
    setFormData((prev) => ({ ...prev, certifications: newCerts }));
  };

  const handleRemoveCert = (index) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index),
    }));
  };

  const handleAddPricing = () => {
    setFormData((prev) => ({
      ...prev,
      pricingItems: [...prev.pricingItems, { test: "", price: "" }],
    }));
  };

  const handlePricingChange = (index, field, value) => {
    const newPricing = [...formData.pricingItems];
    newPricing[index][field] = value;
    setFormData((prev) => ({ ...prev, pricingItems: newPricing }));
  };

  const handleRemovePricing = (index) => {
    setFormData((prev) => ({
      ...prev,
      pricingItems: prev.pricingItems.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.labName || !formData.ownerName || !formData.phone) {
      return toast.error("Required fields: Lab Name, Owner Name, Lab Phone");
    }

    try {
      setLoading(true);
      const data = new FormData();

      const mapping = {
        parent: formData.parent,
        labName: formData.labName,
        labType: formData.labType,
        establishmentYear: formData.establishmentYear,
        registrationNumber: formData.registrationNumber,
        description: formData.description,
        fullAddress: formData.fullAddress,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        phone: formData.phone,
        email: formData.email,
        whatsapp: formData.whatsapp,
        ownerName: formData.ownerName,
        ownerPhone: formData.ownerPhone,
        ownerEmail: formData.ownerEmail,
        homeCollection: formData.homeCollection,
        is24x7: formData.is24x7,
        emergency: formData.emergency,
        openTime: formData.openTime,
        closeTime: formData.closeTime,
        weeklyOff: formData.weeklyOff,
        upiId: formData.upiId,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        ifscCode: formData.ifscCode,
        staffCount: formData.staffCount,
        status: formData.status,
      };

      Object.keys(mapping).forEach((key) => {
        data.append(key, mapping[key]);
      });

      if (formData.labLogo instanceof File)
        data.append("labLogo", formData.labLogo);
      if (formData.labBanner instanceof File)
        data.append("labBanner", formData.labBanner);
      if (formData.pathologyDocs instanceof File)
        data.append("pathologyDocs", formData.pathologyDocs);

      data.append("selectedTests", JSON.stringify(formData.selectedTests));

      const testArray = formData.pricingItems
        .filter((item) => item.test && item.price)
        .map((item) => ({ name: item.test, price: item.price }));
      data.append("test", JSON.stringify(testArray));

      const certData = formData.certifications.map((c) => ({
        name: c.name,
        file: c.existingFile || null,
      }));
      data.append("Certification", JSON.stringify(certData));

      formData.certifications.forEach((c) => {
        if (c.file instanceof File) data.append("certificationFiles", c.file);
      });

      const res = await updateRegistration(id, data);
      if (res.success) {
        toast.success("Laboratory updated successfully");
        navigate("/dashboard/registrations");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update registration",
      );
    } finally {
      setLoading(false);
    }
  };

  const groupStyle = `p-5 rounded border mb-6 shadow-sm`;
  const labelStyle = `block text-[11px] font-bold uppercase tracking-wider mb-2 opacity-60`;
  const inputStyle = {
    width: "100%",
    padding: "10px",
    border: `1px solid ${colors.accent}30`,
    borderRadius: "4px",
    fontSize: "14px",
    outline: "none",
    background: colors.background,
    color: colors.text,
  };

  if (initialLoading)
    return (
      <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-4">
        <Loader />
        <p className="text-sm font-bold uppercase tracking-widest opacity-40">
          Loading Lab Data...
        </p>
      </div>
    );

  return (
    <div
      className="p-6 w-full mx-auto"
      style={{ backgroundColor: colors.background, color: colors.text }}
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-black/5 rounded-full transition-all"
          >
            <MdArrowBack size={24} />
          </button>
          <h1 className="text-xl font-bold uppercase tracking-tight">
            Edit Laboratory Registration
          </h1>
        </div>
      </div>

      <form id="registration-form" onSubmit={handleSubmit} className="mb-20">
        {/* Reuse the structure from CreateRegistration with populated values */}
        <div
          className={groupStyle}
          style={{
            backgroundColor: colors.background,
            borderColor: colors.accent + "20",
          }}
        >
          <h2 className="text-xs font-black uppercase mb-4 border-b pb-2 opacity-80">
            Organization Link
          </h2>
          <div className="w-full">
            <label className={labelStyle}>Parent Organization</label>
            <ModernSelect
              fullWidth
              value={formData.parent}
              onChange={(val) =>
                setFormData((prev) => ({ ...prev, parent: val }))
              }
              options={[
                { label: "-- No Parent (Individual) --", value: "" },
                ...parents.map((p) => ({ label: p.name, value: p._id })),
              ]}
            />
          </div>
        </div>

        <div
          className={groupStyle}
          style={{
            backgroundColor: colors.background,
            borderColor: colors.accent + "20",
          }}
        >
          <h2 className="text-xs font-black uppercase mb-4 border-b pb-2 opacity-80">
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="w-full">
              <label className={labelStyle}>Lab Name *</label>
              <input
                type="text"
                name="labName"
                value={formData.labName}
                onChange={handleChange}
                style={inputStyle}
                required
              />
            </div>
            <div className="w-full">
              <label className={labelStyle}>Lab Type</label>
              <ModernSelect
                fullWidth
                value={formData.labType}
                onChange={(val) =>
                  setFormData((prev) => ({ ...prev, labType: val }))
                }
                options={[
                  { label: "Pathology", value: "Pathology" },
                  { label: "Diagnostic Center", value: "Diagnostic Center" },
                  { label: "Radiology", value: "Radiology" },
                ]}
              />
            </div>
            <div className="w-full">
              <label className={labelStyle}>Establishment Year</label>
              <input
                type="number"
                name="establishmentYear"
                value={formData.establishmentYear}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
            <div className="md:col-span-3">
              <label className={labelStyle}>Registration Number *</label>
              <input
                type="text"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
                style={inputStyle}
                required
              />
            </div>
            <div className="md:col-span-3">
              <label className={labelStyle}>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                style={{ ...inputStyle, minHeight: "80px" }}
              />
            </div>
          </div>
        </div>

        {/* Media / Files with previews of existing ones */}
        <div
          className={groupStyle}
          style={{
            backgroundColor: colors.background,
            borderColor: colors.accent + "20",
          }}
        >
          <h2 className="text-xs font-black uppercase mb-4 border-b pb-2 opacity-80">
            Logo & Banner
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div
              className="border border-dashed p-4 rounded text-center"
              style={{ borderColor: colors.accent + "30" }}
            >
              <label className={labelStyle}>Lab Logo</label>
              {existingFiles.labLogo && !formData.labLogo && (
                <img
                  src={existingFiles.labLogo}
                  alt="Existing Logo"
                  className="w-16 h-16 object-cover mx-auto mb-2 rounded border"
                />
              )}
              <input
                type="file"
                name="labLogo"
                onChange={handleChange}
                className="hidden"
                id="logo-input"
              />
              <label
                htmlFor="logo-input"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <MdCloudUpload size={24} className="opacity-40" />
                <span className="text-[10px] font-bold">
                  {formData.labLogo ? formData.labLogo.name : "Change Logo"}
                </span>
              </label>
            </div>
            <div
              className="border border-dashed p-4 rounded text-center"
              style={{ borderColor: colors.accent + "30" }}
            >
              <label className={labelStyle}>Lab Banner</label>
              {existingFiles.labBanner && !formData.labBanner && (
                <img
                  src={existingFiles.labBanner}
                  alt="Existing Banner"
                  className="w-full h-16 object-cover mb-2 rounded border"
                />
              )}
              <input
                type="file"
                name="labBanner"
                onChange={handleChange}
                className="hidden"
                id="banner-input"
              />
              <label
                htmlFor="banner-input"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <MdCloudUpload size={24} className="opacity-40" />
                <span className="text-[10px] font-bold">
                  {formData.labBanner
                    ? formData.labBanner.name
                    : "Change Banner"}
                </span>
              </label>
            </div>
          </div>
        </div>

        <div
          className={groupStyle}
          style={{
            backgroundColor: colors.background,
            borderColor: colors.accent + "20",
          }}
        >
          <h2 className="text-xs font-black uppercase mb-4 border-b pb-2 opacity-80">
            Contact & Owner Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className={labelStyle}>Primary Phone *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label className={labelStyle}>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelStyle}>WhatsApp</label>
              <input
                type="tel"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className={labelStyle}>Owner Name *</label>
              <input
                type="text"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label className={labelStyle}>Owner Phone</label>
              <input
                type="tel"
                name="ownerPhone"
                value={formData.ownerPhone}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelStyle}>Owner Email</label>
              <input
                type="email"
                name="ownerEmail"
                value={formData.ownerEmail}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        <div
          className={groupStyle}
          style={{
            backgroundColor: colors.background,
            borderColor: colors.accent + "20",
          }}
        >
          <h2 className="text-xs font-black uppercase mb-4 border-b pb-2 opacity-80">
            Location
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="md:col-span-3">
              <label className={labelStyle}>Full Address</label>
              <input
                type="text"
                name="fullAddress"
                value={formData.fullAddress}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelStyle}>City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelStyle}>State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelStyle}>Pincode</label>
              <input
                type="tel"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Services / Tests */}
        <div
          className={groupStyle}
          style={{
            backgroundColor: colors.background,
            borderColor: colors.accent + "20",
          }}
        >
          <h2 className="text-xs font-black uppercase mb-4 border-b pb-2 opacity-80">
            Tests & Services
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {["homeCollection", "is24x7", "emergency"].map((key) => (
              <div
                key={key}
                onClick={() => setFormData((p) => ({ ...p, [key]: !p[key] }))}
                className={`flex items-center gap-3 p-4 border rounded cursor-pointer transition-all ${formData[key] ? "bg-black/5 border-black/40" : "bg-transparent border-black/10 hover:border-black/20"}`}
              >
                <div className="text-xl">
                  {formData[key] ? <MdCheckBox /> : <MdCheckBoxOutlineBlank />}
                </div>
                <span className="text-[11px] font-bold uppercase tracking-tight opacity-80">
                  {key.replace(/([A-Z])/g, " $1")}
                </span>
              </div>
            ))}
          </div>
          <label className={labelStyle}>Available Tests</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {availableTests.map((test) => (
              <div
                key={test._id}
                onClick={() => handleTestToggle(test._id)}
                className={`flex items-center gap-3 p-4 border rounded cursor-pointer transition-all ${formData.selectedTests.includes(test._id) ? "bg-black/5 border-black/40" : "bg-transparent border-black/10 hover:border-black/20"}`}
              >
                <div className="text-xl">
                  {formData.selectedTests.includes(test._id) ? (
                    <MdCheckBox />
                  ) : (
                    <MdCheckBoxOutlineBlank />
                  )}
                </div>
                <span className="text-[11px] font-bold uppercase tracking-tight opacity-80">
                  {test.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Pricing */}
        <div
          className={groupStyle}
          style={{
            backgroundColor: colors.background,
            borderColor: colors.accent + "20",
          }}
        >
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-xs font-black uppercase opacity-80">
              Custom Test Pricing
            </h2>
            <button
              type="button"
              onClick={handleAddPricing}
              className="text-[10px] font-bold uppercase flex items-center gap-1 opacity-60 hover:opacity-100"
            >
              <MdAdd size={16} /> Add Test
            </button>
          </div>
          {formData.pricingItems.map((item, idx) => (
            <div key={idx} className="flex gap-4 mb-3 items-end">
              <div className="flex-1">
                <label className={labelStyle}>Test Name</label>
                <input
                  type="text"
                  value={item.test}
                  onChange={(e) =>
                    handlePricingChange(idx, "test", e.target.value)
                  }
                  style={inputStyle}
                />
              </div>
              <div className="w-32">
                <label className={labelStyle}>Price (₹)</label>
                <input
                  type="number"
                  value={item.price}
                  onChange={(e) =>
                    handlePricingChange(idx, "price", e.target.value)
                  }
                  style={inputStyle}
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemovePricing(idx)}
                className="p-2 mb-1 text-red-500 rounded hover:bg-black/5"
              >
                <MdDelete size={20} />
              </button>
            </div>
          ))}
        </div>

        {/* Certifications */}
        <div
          className={groupStyle}
          style={{
            backgroundColor: colors.background,
            borderColor: colors.accent + "20",
          }}
        >
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-xs font-black uppercase opacity-80">
              Certifications
            </h2>
            <button
              type="button"
              onClick={handleAddCert}
              className="text-[10px] font-bold uppercase flex items-center gap-1 opacity-60 hover:opacity-100"
            >
              <MdAdd size={16} /> Add Certificate
            </button>
          </div>
          {formData.certifications.map((cert, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 border rounded bg-black/5 relative"
              style={{ borderColor: colors.accent + "10" }}
            >
              <div>
                <label className={labelStyle}>Certificate Name</label>
                <input
                  type="text"
                  value={cert.name}
                  onChange={(e) =>
                    handleCertChange(idx, "name", e.target.value)
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label className={labelStyle}>Attachment</label>
                {cert.existingFile && !cert.file && (
                  <a
                    href={cert.existingFile}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-blue-600 underline block mb-1"
                  >
                    View Current File
                  </a>
                )}
                <input
                  type="file"
                  onChange={(e) =>
                    handleCertChange(idx, "file", e.target.files[0])
                  }
                  style={inputStyle}
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveCert(idx)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-all"
              >
                <MdDelete size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-10">
          <button
            type="submit"
            disabled={loading}
            className="px-10 py-4 bg-black text-white font-bold text-xs uppercase tracking-widest rounded transition-all hover:opacity-80 disabled:opacity-50 flex items-center gap-3"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Updating...
              </>
            ) : (
              "Update Registration"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditRegistration;
