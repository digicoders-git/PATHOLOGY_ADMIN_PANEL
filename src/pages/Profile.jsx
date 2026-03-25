import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { getAdminProfile, updateAdminProfile } from "../apis/auth";
import { toast } from "react-toastify";
import Loader from "./ui/Loader";
import { MdVisibility, MdVisibilityOff, MdLock, MdPerson, MdEmail, MdPhotoCamera ,MdEdit ,MdClose } from "react-icons/md";

const Profile = () => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [adminData, setAdminData] = useState({
    name: "",
    email: "",
    profilePhoto: "",
  });
  
  // Security State
  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
    } catch (error) {
      toast.error(error.message || "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminChange = (e) => {
    setAdminData({ ...adminData, [e.target.name]: e.target.value });
  };

  const handleSecurityChange = (e) => {
    setSecurity({ ...security, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewImage(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Password Validation
    if (security.newPassword || security.confirmPassword || security.currentPassword) {
      if (!security.currentPassword) {
        return toast.warning("Current password is required to change password.");
      }
      if (security.newPassword !== security.confirmPassword) {
        return toast.error("New passwords do not match!");
      }
      if (security.newPassword.length < 6) {
        return toast.warning("Password must be at least 6 characters long.");
      }
    }

    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append("name", adminData.name);
      formData.append("email", adminData.email);
      
      if (security.newPassword) {
        formData.append("currentPassword", security.currentPassword); 
        formData.append("password", security.newPassword);
      }
      
      if (file) {
        formData.append("profilePhoto", file);
      }

      const adminId = localStorage.getItem("admin-id");
      const res = await updateAdminProfile(adminId, formData);
      toast.success(res.message || "Updated successfully!");
      
      setIsEditing(false); // Lock fields again
      setSecurity({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setFile(null);
      setPreviewImage(null);
      fetchProfile(); 
    } catch (error) {
      toast.error(error?.response?.data?.message || "Update failed. Check your password.");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="flex h-full items-center justify-center"><Loader /></div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none italic uppercase">Account Management</h2>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 ml-1">Personal Identity & Security Settings</p>
        </div>
        {!isEditing ? (
           <button 
              onClick={() => setIsEditing(true)}
              className="px-8 py-3 bg-white border-2 border-slate-900 text-slate-900 text-[10px] font-black rounded-2xl hover:bg-slate-900 hover:text-white transition-all shadow-xl uppercase tracking-widest flex items-center gap-2"
           >
              <MdEdit size={18} /> Edit Profile
           </button>
        ) : (
           <div className="flex gap-3">
              <button 
                 onClick={() => { setIsEditing(false); setSecurity({ currentPassword: "", newPassword: "", confirmPassword: "" }); }}
                 className="px-6 py-3 bg-red-50 text-red-600 text-[10px] font-black rounded-2xl hover:bg-red-100 transition-all shadow-sm uppercase tracking-widest flex items-center gap-2 border border-red-200"
              >
                 <MdClose size={18} /> Cancel
              </button>
              <button 
                 form="profile-form"
                 type="submit"
                 disabled={updating}
                 className="px-8 py-3 bg-slate-900 text-white text-[10px] font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl uppercase tracking-widest flex items-center gap-2"
              >
                 {updating ? "Saving..." : "Save Changes"}
              </button>
           </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-8">
           <div className={`bg-white rounded-[40px] shadow-2xl border-t-8 border-slate-800 overflow-hidden text-center p-10 relative group ${!isEditing ? "opacity-90" : ""}`}>
              <div className="relative z-10">
                 <div className="relative w-32 h-32 mx-auto mb-6">
                    <img
                      src={previewImage || adminData.profilePhoto || "https://ui-avatars.com/api/?name=" + adminData.name + "&background=random"}
                      alt="Profile"
                      className={`w-full h-full object-cover rounded-[35px] border-4 border-white shadow-xl transition-all ${!isEditing ? "grayscale-[50%]" : ""}`}
                    />
                    {isEditing && (
                       <label className="absolute bottom-[-10px] right-[-10px] p-3 bg-blue-600 text-white rounded-2xl cursor-pointer hover:bg-blue-700 transition-all shadow-lg animate-bounce">
                          <MdPhotoCamera size={20} />
                          <input type="file" className="hidden" onChange={handleFileChange} />
                       </label>
                    )}
                 </div>
                 <h4 className="text-xl font-black text-slate-800 uppercase tracking-tighter">{adminData.name}</h4>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Administrator Access</p>
                 <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div> Logged In
                 </div>
              </div>
           </div>
        </div>

        {/* Edit Section */}
        <div className="lg:col-span-2 space-y-8">
           <form id="profile-form" onSubmit={handleSubmit} className="space-y-8">
              {/* Identity Section */}
              <div className={`bg-white rounded-[40px] shadow-2xl border border-slate-100 p-10 transition-all ${!isEditing ? "bg-slate-50/50 grayscale-[20%]" : "ring-4 ring-blue-50"}`}>
                 <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-6">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><MdPerson size={24} /></div>
                    <div>
                       <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-800">Basic Information</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter leading-none mt-1">{isEditing ? "Modify your identity" : "Identity is currently locked"}</p>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                       <input 
                          disabled={!isEditing}
                          name="name"
                          value={adminData.name}
                          onChange={handleAdminChange}
                          className={`w-full p-4 bg-slate-50 border-none rounded-2xl text-[11px] font-black outline-none transition-all shadow-inner ${isEditing ? "focus:bg-white border-l-4 border-blue-500" : "cursor-not-allowed text-slate-400"}`} 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email System Address</label>
                       <input 
                          disabled={!isEditing}
                          name="email"
                          value={adminData.email}
                          onChange={handleAdminChange}
                          className={`w-full p-4 bg-slate-50 border-none rounded-2xl text-[11px] font-black outline-none transition-all shadow-inner ${isEditing ? "focus:bg-white border-l-4 border-blue-500" : "cursor-not-allowed text-slate-400" }`} 
                       />
                    </div>
                 </div>
              </div>

              {/* Security Section (Always editable or only when editing?) User said "edit karne par active ho jaye" so I'll follow the same for all. */}
              <div className={`bg-white rounded-[40px] shadow-2xl border border-slate-100 p-10 border-l-8 border-slate-900 transition-all ${!isEditing ? "bg-slate-50/50" : ""}`}>
                 <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-6">
                    <div className="p-3 bg-slate-100 text-slate-900 rounded-2xl"><MdLock size={24} /></div>
                    <div>
                       <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-800">Security Credentials</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter leading-none mt-1">Change Access Password</p>
                    </div>
                 </div>
                 <div className="space-y-6">
                    <div className="relative space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-red-500 italic">Verify Current Password</label>
                       <input 
                          disabled={!isEditing}
                          type={showCurrent ? "text" : "password"}
                          name="currentPassword"
                          value={security.currentPassword}
                          onChange={handleSecurityChange}
                          placeholder={isEditing ? "REQUIRED TO COMMIT CHANGES" : "••••••••••••"}
                          className={`w-full p-4 pr-12 bg-slate-50 border-none rounded-2xl text-[11px] font-black outline-none transition-all shadow-inner ${isEditing ? "focus:bg-white" : "cursor-not-allowed"}`} 
                       />
                       {isEditing && (
                          <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-[38px] text-slate-400 hover:text-slate-900 transition-all">{showCurrent ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}</button>
                       )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                       <div className="relative space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                          <input 
                             disabled={!isEditing}
                             type={showNew ? "text" : "password"}
                             name="newPassword"
                             value={security.newPassword}
                             onChange={handleSecurityChange}
                             placeholder={isEditing ? "••••••••" : "••••••••"}
                             className={`w-full p-4 pr-12 bg-slate-50 border-none rounded-2xl text-[11px] font-black outline-none transition-all shadow-inner ${isEditing ? "focus:bg-white" : "cursor-not-allowed"}`} 
                          />
                          {isEditing && (
                             <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-[38px] text-slate-400 hover:text-slate-900 transition-all">{showNew ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}</button>
                          )}
                       </div>
                       <div className="relative space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Identity</label>
                          <input 
                             disabled={!isEditing}
                             type={showConfirm ? "text" : "password"}
                             name="confirmPassword"
                             value={security.confirmPassword}
                             onChange={handleSecurityChange}
                             placeholder={isEditing ? "••••••••" : "••••••••"}
                             className={`w-full p-4 pr-12 bg-slate-50 border-none rounded-2xl text-[11px] font-black outline-none transition-all shadow-inner ${isEditing ? "focus:bg-white" : "cursor-not-allowed" }`} 
                          />
                          {isEditing && (
                             <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-[38px] text-slate-400 hover:text-slate-900 transition-all">{showConfirm ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}</button>
                          )}
                       </div>
                    </div>
                 </div>
              </div>

              {isEditing && (
                 <button 
                    type="submit" 
                    disabled={updating}
                    className="w-full py-5 bg-slate-900 text-white rounded-[25px] font-black text-[11px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-2xl border-b-8 border-slate-700 active:border-b-0 active:translate-y-2 disabled:opacity-50"
                 >
                    {updating ? "Syncing Identity..." : "Commit Life Changes"}
                 </button>
              )}
           </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
