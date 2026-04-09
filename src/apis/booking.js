import api from "./api";

const BASE_URL = "/booking";

export const getAllBookings = async (params = {}) => {
  const response = await api.get(`${BASE_URL}/get`, { params });
  return response.data;
};

export const getBookingById = async (id) => {
  const response = await api.get(`${BASE_URL}/get/${id}`);
  return response.data;
};

export const updateBookingStatus = async (id, data) => {
  const response = await api.put(`${BASE_URL}/status/${id}`, data);
  return response.data;
};

export const deleteBooking = async (id) => {
  const response = await api.delete(`${BASE_URL}/${id}`);
  return response.data;
};

export const uploadTestReport = async (id, file) => {
  const formData = new FormData();
  formData.append("testReport", file);
  const response = await api.post(`${BASE_URL}/upload-report/${id}`, formData);
  return response.data;
};
