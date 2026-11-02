import api from "./api";

// Pure Dynamic API calls for Catalogues - NO DUMMY DATA
export const getAllCatalogues = async (params = {}) => {
  const res = await api.get("/catalogues", { params });
  return res.data;
};

export const getActiveCatalogues = async (params = {}) => {
  const res = await api.get("/catalogues/active", { params });
  return res.data;
};

export const createCatalogue = async (data) => {
  const res = await api.post("/catalogues/create", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const updateCatalogue = async (id, data) => {
  const res = await api.put(`/catalogues/update/${id}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deleteCatalogue = async (id) => {
  const res = await api.delete(`/catalogues/delete/${id}`);
  return res.data;
};

export const toggleCatalogueStatus = async (id) => {
  const res = await api.patch(`/catalogues/toggle/${id}`);
  return res.data;
};

export const resolveCatalogueImageUrl = (img) => {
  if (!img) return "/catalogue-hero.png";
  if (typeof img === "object") {
    img = img.local || img.cloudinary || "";
  }
  if (typeof img !== "string" || !img) return "/catalogue-hero.png";
  if (img.startsWith("http://") || img.startsWith("https://") || img.startsWith("data:")) {
    return img;
  }
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://api.laboindia.com";
  const cleanPath = img.replace(/^\/+/, "");
  return `${baseUrl}/${cleanPath}`;
};
