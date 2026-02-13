import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { getAdminProfile, updateAdminProfile } from "../apis/auth";
import { toast } from "react-toastify";
import Loader from "./ui/Loader";

const Profile = () => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [adminData, setAdminData] = useState({
    name: "",
    email: "",
    password: "",
    profilePhoto: "",
  });
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
          ...res.data,
          password: "", // Don't show password
        });
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setAdminData({ ...adminData, [e.target.name]: e.target.value });
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
    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append("name", adminData.name);
      formData.append("email", adminData.email);
      if (adminData.password) {
        formData.append("password", adminData.password);
      }
      if (file) {
        formData.append("profilePhoto", file);
      }

      const adminId = localStorage.getItem("admin-id");
      const res = await updateAdminProfile(adminId, formData);
      toast.success(res.message || "Profile updated successfully");
      fetchProfile(); // Refresh data
      setFile(null);
      setPreviewImage(null);
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  if (loading)
    return (
      <div className="flex h-full items-center justify-center">
        <Loader />
      </div>
    );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div
        className="rounded-2xl border shadow-lg overflow-hidden"
        style={{
          backgroundColor: colors.background,
          borderColor: colors.accent + "30",
        }}
      >
        <div
          className="p-8 border-b"
          style={{ borderColor: colors.accent + "20" }}
        >
          <h2 className="text-2xl font-bold" style={{ color: colors.text }}>
            Admin Profile
          </h2>
          <p style={{ color: colors.textSecondary }}>
            View and update your personal information
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex flex-col items-center space-y-4">
              <div
                className="relative w-32 h-32 rounded-full overflow-hidden border-4"
                style={{ borderColor: colors.primary + "30" }}
              >
                <img
                  src={
                    previewImage ||
                    adminData.profilePhoto ||
                    "https://via.placeholder.com/150"
                  }
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <label
                className="cursor-pointer px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                style={{
                  backgroundColor: colors.primary + "10",
                  color: colors.primary,
                }}
              >
                Change Photo
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*"
                />
              </label>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  style={{ color: colors.textSecondary }}
                >
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={adminData.name}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border focus:ring-2 outline-none transition-all"
                  style={{
                    backgroundColor: colors.background,
                    borderColor: colors.accent + "30",
                    color: colors.text,
                  }}
                  placeholder="Enter Name"
                  required
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  style={{ color: colors.textSecondary }}
                >
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={adminData.email}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border focus:ring-2 outline-none transition-all"
                  style={{
                    backgroundColor: colors.background,
                    borderColor: colors.accent + "30",
                    color: colors.text,
                  }}
                  placeholder="Enter Email"
                  required
                />
              </div>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  style={{ color: colors.textSecondary }}
                >
                  New Password (Optional)
                </label>
                <input
                  type="password"
                  name="password"
                  value={adminData.password}
                  onChange={handleChange}
                  className="w-full p-3 rounded-xl border focus:ring-2 outline-none transition-all"
                  style={{
                    backgroundColor: colors.background,
                    borderColor: colors.accent + "30",
                    color: colors.text,
                  }}
                  placeholder="Leave blank to keep current"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 flex justify-end">
            <button
              type="submit"
              disabled={updating}
              className="px-8 py-3 rounded-xl font-bold text-white shadow-lg transform hover:scale-[1.02] transition-all disabled:opacity-50"
              style={{ backgroundColor: colors.primary }}
            >
              {updating ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
