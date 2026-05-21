import api from './api';

export const getPlans = async () => {
  try {
    const res = await api.get('/plans/get');
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: error.message };
  }
};

export const createPlan = async (data) => {
  try {
    const res = await api.post('/plans/create', data);
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: error.message };
  }
};

export const updatePlan = async (id, data) => {
  try {
    const res = await api.put(`/plans/${id}`, data);
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: error.message };
  }
};

export const deletePlan = async (id) => {
  try {
    const res = await api.delete(`/plans/${id}`);
    return res.data;
  } catch (error) {
    return error.response?.data || { success: false, message: error.message };
  }
};


