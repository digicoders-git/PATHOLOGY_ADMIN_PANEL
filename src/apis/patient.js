import api from "./api";

const BASE_URL = "/patient";

export const getAllPatients = async (params = {}) => {
  const response = await api.get(`${BASE_URL}/all-patients`, { params });
  return response.data;
};

export const updatePatientStatus = async (id, data) => {
  const response = await api.patch(`${BASE_URL}/update-status/${id}`, data);
  return response.data;
};
