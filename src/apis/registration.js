import api from "./api";

// Registration APIs
export const getAllRegistrations = async (params) => {
  const response = await api.get("/registrations/get", { params });
  return response.data;
};

export const getRegistrationById = async (id) => {
  const response = await api.get(`/registrations/get/${id}`);
  return response.data;
};

export const updateRegistrationStatus = async (id, status) => {
  const response = await api.patch(`/registrations/status/${id}`, { status });
  return response.data;
};

export const updateApprovalStatus = async (id, approvalStatus, reason = "") => {
  try {
    const response = await api.patch(`/registrations/approval/${id}`, { approvalStatus, reason });
    return response.data;
  } catch (err) {
    if (err?.response?.status === 404) {
      const status = approvalStatus === "approved";
      return await updateRegistrationStatus(id, status);
    }
    throw err;
  }
};

export const deleteRegistration = async (id) => {
  const response = await api.delete(`/registrations/${id}`);
  return response.data;
};

export const createRegistration = async (data) => {
  const response = await api.post("/registrations/create", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updateRegistration = async (id, data) => {
  const response = await api.put(`/registrations/${id}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const importRegistrationsExcel = async (file) => {
  const formData = new FormData();
  formData.append("excelFile", file);
  const response = await api.post("/registrations/import-excel", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const bulkCreateRegistrations = async (labs) => {
  const response = await api.post("/registrations/bulk-create", { labs });
  return response.data;
};

export const toggleFeatured = async (id) => {
  const response = await api.patch(`/registrations/featured/${id}`);
  return response.data;
};

export const creditLabWallet = async (data) => {
  const response = await api.post("/registrations/wallet/credit", data);
  return response.data;
};

export const getLabWalletTransactions = async (labId) => {
  const response = await api.get(`/registrations/${labId}/wallet-transactions`);
  return response.data;
};
