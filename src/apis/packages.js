import api from "./api";

export const getAllPackages = (params) =>
  api.get("/manage-package/", { params }).then((r) => r.data);

export const createPackage = (data) =>
  api.post("/manage-package/create", data, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);

export const updatePackage = (id, data) =>
  api.put(`/manage-package/${id}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then((r) => r.data);

export const deletePackage = (id) =>
  api.delete(`/manage-package/${id}`).then((r) => r.data);

export const togglePackageStatus = (id) =>
  api.patch(`/manage-package/status/${id}`).then((r) => r.data);
