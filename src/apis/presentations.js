import api from "./api";

// Pure Dynamic API calls for Presentations - NO DUMMY DATA
export const getAllPresentations = async (params = {}) => {
  const res = await api.get("/presentations", { params });
  return res.data;
};

export const getPresentationCategories = async () => {
  const res = await api.get("/presentations/categories");
  return res.data;
};

export const getActivePresentations = async (params = {}) => {
  const res = await api.get("/presentations/active", { params });
  return res.data;
};

export const createPresentation = async (data) => {
  const res = await api.post("/presentations/create", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const updatePresentation = async (id, data) => {
  const res = await api.put(`/presentations/update/${id}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deletePresentation = async (id) => {
  const res = await api.delete(`/presentations/delete/${id}`);
  return res.data;
};

export const togglePresentationStatus = async (id) => {
  const res = await api.patch(`/presentations/toggle/${id}`);
  return res.data;
};
