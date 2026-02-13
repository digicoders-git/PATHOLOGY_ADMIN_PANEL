import api from "./api";

// Test Services APIs
export const createTestService = async (data) => {
  const response = await api.post("/test-service/create", data);
  return response.data;
};

export const getTestServices = async (params) => {
  const response = await api.get("/test-service/get", { params });
  return response.data;
};

export const updateTestService = async (id, data) => {
  const response = await api.put(`/test-service/update/${id}`, data);
  return response.data;
};

export const deleteTestService = async (id) => {
  const response = await api.delete(`/test-service/delete/${id}`);
  return response.data;
};

export const updateTestServiceStatus = async (id, status) => {
  const response = await api.patch(`/test-service/status/${id}`, { status });
  return response.data;
};
