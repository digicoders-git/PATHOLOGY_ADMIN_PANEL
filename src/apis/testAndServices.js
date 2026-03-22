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

export const bulkCreateTestServices = async (data) => {
  const response = await api.post("/test-service/bulk-create", data);
  return response.data;
};

// Category APIs
export const getCategories = async () => {
  const response = await api.get("/categories");
  return response.data;
};

export const createCategory = async (data) => {
  const response = await api.post("/categories", data);
  return response.data;
};

export const updateCategory = async (id, data) => {
  const response = await api.patch(`/categories/${id}`, data);
  return response.data;
};

export const deleteCategory = async (id) => {
  const response = await api.delete(`/categories/${id}`);
  return response.data;
};

export const getCategoryTree = async (id) => {
  const response = await api.get(`/categories/tree/${id}`);
  return response.data;
};

// Subcategory APIs
export const getSubcategories = async (category_id) => {
  const params = category_id ? { category_id } : {};
  const response = await api.get("/subcategories", { params });
  return response.data;
};

export const createSubcategory = async (data) => {
  const response = await api.post("/subcategories", data);
  return response.data;
};

export const updateSubcategory = async (id, data) => {
  const response = await api.patch(`/subcategories/${id}`, data);
  return response.data;
};

export const deleteSubcategory = async (id) => {
  const response = await api.delete(`/subcategories/${id}`);
  return response.data;
};
