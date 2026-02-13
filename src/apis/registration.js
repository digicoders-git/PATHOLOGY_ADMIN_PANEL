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
