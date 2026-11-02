import api from "./api";

// Pure Dynamic API calls for Media & Events - NO DUMMY DATA
export const getAllMediaEvents = async (params = {}) => {
  const res = await api.get("/media-events", { params });
  return res.data;
};

export const getActiveMediaEvents = async (params = {}) => {
  const res = await api.get("/media-events/active", { params });
  return res.data;
};

export const getMediaEventCategories = async () => {
  const res = await api.get("/media-events/categories");
  return res.data;
};

export const createMediaEvent = async (data) => {
  const res = await api.post("/media-events/create", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const updateMediaEvent = async (id, data) => {
  const res = await api.put(`/media-events/update/${id}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const deleteMediaEvent = async (id) => {
  const res = await api.delete(`/media-events/delete/${id}`);
  return res.data;
};

export const toggleMediaEventStatus = async (id) => {
  const res = await api.patch(`/media-events/toggle/${id}`);
  return res.data;
};

export const resolveMediaImageUrl = (img) => {
  if (!img) return null;
  if (typeof img === "object") {
    img = img.local || img.cloudinary || "";
  }
  if (typeof img !== "string" || !img) return null;
  img = img.trim();
  if (
    img.startsWith("http://") ||
    img.startsWith("https://") ||
    img.startsWith("data:") ||
    img.startsWith("blob:")
  ) {
    return img;
  }
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "https://api.laboindia.com";
  const cleanPath = img.replace(/^\/+/, "");
  return `${baseUrl}/${cleanPath}`;
};
