import api from "./api";

export const getAllSlots = (params) =>
  api.get(`/pathology/all-slots`, { params }).then((r) => r.data);

export const getSlots = (labId, date) =>
  api.get(`/pathology/get-slots`, { params: { labId, date } }).then((r) => r.data);

export const generateSlots = (payload) =>
  api.post(`/pathology/generate-slots`, payload).then((r) => r.data);

export const deleteSlot = (id) =>
  api.delete(`/pathology/delete-slot/${id}`).then((r) => r.data);
