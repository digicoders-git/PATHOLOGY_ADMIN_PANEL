import api from "./api";

// Parent APIs
export const getAllParents = async (params) => {
  const response = await api.get("/parent/get", { params });
  return response.data;
};

export const createParent = async (data) => {
  const response = await api.post("/parent/create", data);
  return response.data;
};

export const updateParent = async (id, data) => {
  const response = await api.put(`/parent/update/${id}`, data);
  return response.data;
};

export const deleteParent = async (id) => {
  const response = await api.delete(`/parent/delete/${id}`);
  return response.data;
};

export const updateParentStatus = async (id, status) => {
  const response = await api.patch(`/parent/status/${id}`, { status });
  return response.data;
};
