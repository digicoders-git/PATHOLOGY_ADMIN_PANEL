import api from "./api";

// Dashboard Statistics API
export const getDashboardStats = async () => {
  const response = await api.get("/dashboard/stats");
  return response.data;
};
