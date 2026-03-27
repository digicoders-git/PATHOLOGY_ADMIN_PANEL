import api from "./api";

export const getAllLabTestPricing = (params) =>
  api.get("/lab-test-pricing/get", { params }).then((r) => r.data);

export const deleteLabTestPricing = (id) =>
  api.delete(`/lab-test-pricing/delete/${id}`).then((r) => r.data);

export const updateLabTestPricingStatus = (id, status) =>
  api.patch(`/lab-test-pricing/status/${id}`, { status }).then((r) => r.data);
