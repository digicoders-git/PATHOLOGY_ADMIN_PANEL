import axios from 'axios';
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('admin-token')}` }
});

export const getPlans = async (status = '') => {
  try {
    const res = await axios.get(`${API_URL}/plans/get?status=${status}`);
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: error.message };
  }
};

export const createPlan = async (data) => {
  try {
    const res = await axios.post(`${API_URL}/plans/create`, data, getAuthHeader());
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: error.message };
  }
};

export const updatePlan = async (id, data) => {
  try {
    const res = await axios.put(`${API_URL}/plans/${id}`, data, getAuthHeader());
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: error.message };
  }
};

export const deletePlan = async (id) => {
  try {
    const res = await axios.delete(`${API_URL}/plans/${id}`, getAuthHeader());
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: error.message };
  }
};
