import api from "./api";

// Dashboard Statistics API
export const getDashboardStats = async () => {
  const response = await api.get("/dashboard/stats");
  return response.data;
};

// Global Settings APIs
export const getSettings = async () => {
  const response = await api.get("/dashboard/settings");
  return response.data;
};

export const updateSetting = async (key, value) => {
  const response = await api.post("/dashboard/settings", { key, value });
  return response.data;
};
