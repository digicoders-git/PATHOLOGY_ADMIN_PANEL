import api from "./api";

// Admin APIs
export const adminLogin = async (data) => {
  const response = await api.post("/admin/login", data);
  return response.data;
};

export const getAdminProfile = async () => {
  const adminId = localStorage.getItem("admin-id");
  const response = await api.get(`/admin/get/${adminId}`);
  return response.data;
};

export const updateAdminProfile = async (id, data) => {
  const response = await api.put(`/admin/update/${id}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};
