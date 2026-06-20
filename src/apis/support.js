import API from "./api";

// Get all support queries
export const getAllSupportQueries = async () => {
  try {
    const response = await API.get("/admin/support");
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get single support query by ID
export const getSupportQueryById = async (id) => {
  try {
    const response = await API.get(`/admin/support/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Update a support query (status, adminReply)
export const updateSupportQuery = async (id, data) => {
  try {
    const response = await API.put(`/admin/support/${id}`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete a support query
export const deleteSupportQuery = async (id) => {
  try {
    const response = await API.delete(`/admin/support/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Explicit Reply API
export const replyToSupportQuery = async (id, data) => {
  try {
    const response = await API.post(`/admin/support/${id}/reply`, data);
    return response.data;
  } catch (error) {
    throw error;
  }
};
