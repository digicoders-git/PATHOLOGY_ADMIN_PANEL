import api from "./api";

// Pure Dynamic API calls for Admin Panel - NO DUMMY DATA
export const getAllTutorials = async (params = {}) => {
  const res = await api.get("/tutorials", { params });
  return res.data;
};

export const getTutorialCategories = async () => {
  const res = await api.get("/tutorials/categories");
  return res.data;
};

export const getActiveTutorials = async (params = {}) => {
  const res = await api.get("/tutorials/active", { params });
  return res.data;
};

export const createTutorial = async (data) => {
  const res = await api.post("/tutorials/create", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const updateTutorial = async (id, data) => {
  const res = await api.put(`/tutorials/update/${id}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deleteTutorial = async (id) => {
  const res = await api.delete(`/tutorials/delete/${id}`);
  return res.data;
};

export const toggleTutorialStatus = async (id) => {
  const res = await api.patch(`/tutorials/toggle/${id}`);
  return res.data;
};
