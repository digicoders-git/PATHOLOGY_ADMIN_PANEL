import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { getAdminProfile, updateAdminProfile } from "../apis/auth";
import { toast } from "react-toastify";
import {
  MdPerson,
  MdEmail,
  MdLock,
  MdEdit,
  MdClose,
  MdPhotoCamera,
  MdVisibility,
  MdVisibilityOff,
  MdSave,
} from "react-icons/md";

const Profile = () => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [adminData, setAdminData] = useState({ name: "", email: "", profilePhoto: "" });
  const [security, setSecurity] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showPwd, setShowPwd] = useState({ current: false, new: false, confirm: false });
  const [previewImage, setPreviewImage] = useState(null);
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await getAdminProfile();
      if (res.data) {
        setAdminData({
          name: res.data.name || "",
          email: res.data.email || "",
          profilePhoto: res.data.profilePhoto || "",
        });
      }
    } catch {
      toast.error("Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setPreviewImage(URL.createObjectURL(f));
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFile(null);
    setPreviewImage(null);
    setSecurity({ currentPassword: "", newPassword: "", confirmPassword: "" });
    fetchProfile();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (security.newPassword || security.confirmPassword || security.currentPassword) {
      if (!security.currentPassword) return toast.warning("Current password is required.");
      if (security.newPassword !== security.confirmPassword) return toast.error("New passwords do not match.");
      if (security.newPassword.length < 6) return toast.warning("Password must be at least 6 characters.");
    }

    try {
      setUpdating(true);
      const formData = new FormData();
      formData.append("name", adminData.name);
      formData.append("email", adminData.email);
      if (security.newPassword) {
        formData.append("currentPassword", security.currentPassword);
        formData.append("password", security.newPassword);
      }
      if (file) formData.append("profilePhoto", file);

      const adminId = localStorage.getItem("admin-id");
      const res = await updateAdminProfile(adminId, formData);
      toast.success(res.message || "Profile updated successfully");
      setIsEditing(false);
      setFile(null);
      setPreviewImage(null);
      setSecurity({ currentPassword: "", newPassword: "", confirmPassword: "" });
      fetchProfile();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const inputClass = (editable) =>
    `w-full border rounded-sm px-3 py-2.5 text-sm outline-none transition-all ${
      editable ? "focus:ring-1" : "opacity-50 cursor-not-allowed"
    }`;

  const inputStyle = {
    backgroundColor: colors.background,
    borderColor: colors.accent + "30",
    color: colors.text,
  };

  if (loading)
    return (
      <div className="p-6 text-sm opacity-40 font-bold uppercase tracking-widest">
        Loading profile...
      </div>
    );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8 border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: colors.text }}>
            Profile Settings
          </h1>
          <p className="text-sm mt-1 opacity-50">Manage your account identity and security</p>
        </div>

        <div className="flex gap-3">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-black text-white text-[11px] font-black uppercase tracking-widest rounded transition-all hover:bg-slate-800"
            >
              <MdEdit size={16} /> Edit Profile
            </button>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-5 py-2.5 border rounded text-[11px] font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                style={{ borderColor: colors.accent + "30", color: colors.text }}
              >
                <MdClose size={16} /> Cancel
              </button>
              <button
                form="profile-form"
                type="submit"
                disabled={updating}
                className="flex items-center gap-2 px-6 py-2.5 bg-black text-white text-[11px] font-black uppercase tracking-widest rounded transition-all hover:bg-slate-800 disabled:opacity-40"
              >
                <MdSave size={16} /> {updating ? "Saving..." : "Save Changes"}
              </button>
            </>
          )}
        </div>
      </div>

      <form id="profile-form" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left — Avatar Card */}
          <div
            className="rounded-sm border shadow-sm p-6 flex flex-col items-center gap-4"
            style={{ backgroundColor: colors.background, borderColor: colors.accent + "20" }}
          >
            {/* Avatar */}
            <div className="relative">
              <div className="w-28 h-28 rounded-sm overflow-hidden border-2"
                style={{ borderColor: colors.accent + "20" }}>
                <img
                  src={
                    previewImage ||
                    adminData.profilePhoto ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(adminData.name || "Admin")}&background=111&color=fff&size=128`
                  }
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              {isEditing && (
                <label className="absolute -bottom-2 -right-2 p-2 bg-black text-white rounded-sm cursor-pointer hover:bg-slate-700 transition-all">
                  <MdPhotoCamera size={16} />
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </div>

            {/* Name & Role */}
            <div className="text-center">
              <p className="text-sm font-bold" style={{ color: colors.text }}>{adminData.name || "Admin"}</p>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mt-1">Administrator</p>
            </div>

            {/* Status Badge */}
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-3 py-1.5 rounded-sm bg-emerald-100 text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Logged In
            </span>

            {isEditing && (
              <p className="text-[10px] opacity-40 text-center font-bold uppercase tracking-widest">
                Click camera icon to change photo
              </p>
            )}
          </div>

          {/* Right — Forms */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Basic Info */}
            <div
              className="rounded-sm border shadow-sm overflow-hidden"
              style={{ backgroundColor: colors.background, borderColor: colors.accent + "20" }}
            >
              <div
                className="px-5 py-4 border-b flex items-center gap-2"
                style={{ borderColor: colors.accent + "10", backgroundColor: colors.accent + "05" }}
              >
                <MdPerson size={16} className="opacity-50" />
                <span className="text-xs font-black uppercase tracking-wider opacity-60">Basic Information</span>
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 block mb-2">Full Name</label>
                  <input
                    disabled={!isEditing}
                    name="name"
                    value={adminData.name}
                    onChange={(e) => setAdminData({ ...adminData, name: e.target.value })}
                    className={inputClass(isEditing)}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 block mb-2">Email Address</label>
                  <input
                    disabled={!isEditing}
                    name="email"
                    type="email"
                    value={adminData.email}
                    onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                    className={inputClass(isEditing)}
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* Security */}
            <div
              className="rounded-sm border shadow-sm overflow-hidden"
              style={{ backgroundColor: colors.background, borderColor: colors.accent + "20" }}
            >
              <div
                className="px-5 py-4 border-b flex items-center gap-2"
                style={{ borderColor: colors.accent + "10", backgroundColor: colors.accent + "05" }}
              >
                <MdLock size={16} className="opacity-50" />
                <span className="text-xs font-black uppercase tracking-wider opacity-60">Change Password</span>
                <span className="text-[9px] font-bold opacity-30 ml-1">(optional — leave blank to keep current)</span>
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Current Password */}
                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 block mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      disabled={!isEditing}
                      type={showPwd.current ? "text" : "password"}
                      name="currentPassword"
                      value={security.currentPassword}
                      onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })}
                      placeholder={isEditing ? "Enter current" : "••••••••"}
                      className={inputClass(isEditing) + " pr-10"}
                      style={inputStyle}
                    />
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => setShowPwd((p) => ({ ...p, current: !p.current }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100"
                      >
                        {showPwd.current ? <MdVisibilityOff size={16} /> : <MdVisibility size={16} />}
                      </button>
                    )}
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 block mb-2">New Password</label>
                  <div className="relative">
                    <input
                      disabled={!isEditing}
                      type={showPwd.new ? "text" : "password"}
                      name="newPassword"
                      value={security.newPassword}
                      onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
                      placeholder={isEditing ? "Min 6 characters" : "••••••••"}
                      className={inputClass(isEditing) + " pr-10"}
                      style={inputStyle}
                    />
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => setShowPwd((p) => ({ ...p, new: !p.new }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100"
                      >
                        {showPwd.new ? <MdVisibilityOff size={16} /> : <MdVisibility size={16} />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="text-[10px] font-black uppercase opacity-40 block mb-2">Confirm Password</label>
                  <div className="relative">
                    <input
                      disabled={!isEditing}
                      type={showPwd.confirm ? "text" : "password"}
                      name="confirmPassword"
                      value={security.confirmPassword}
                      onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })}
                      placeholder={isEditing ? "Repeat new password" : "••••••••"}
                      className={inputClass(isEditing) + " pr-10"}
                      style={inputStyle}
                    />
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() => setShowPwd((p) => ({ ...p, confirm: !p.confirm }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100"
                      >
                        {showPwd.confirm ? <MdVisibilityOff size={16} /> : <MdVisibility size={16} />}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Password match indicator */}
              {isEditing && security.newPassword && security.confirmPassword && (
                <div className="px-5 pb-4">
                  {security.newPassword === security.confirmPassword ? (
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                      ✓ Passwords match
                    </p>
                  ) : (
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">
                      ✗ Passwords do not match
                    </p>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      </form>
    </div>
  );
};

export default Profile;
