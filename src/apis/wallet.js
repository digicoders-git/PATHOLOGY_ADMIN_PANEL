import api from "./api.js";

// Get all withdrawal requests
export const getWithdrawalRequests = async (params = {}) => {
  const res = await api.get("/admin/wallet/withdrawals", { params });
  return res.data;
};

// Accept or Reject a withdrawal request
export const updateWithdrawalStatus = async (id, status) => {
  const res = await api.put(`/admin/wallet/withdrawals/${id}/status`, { status });
  return res.data;
};
