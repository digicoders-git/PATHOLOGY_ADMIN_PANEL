import api from "./api";

export const getAllOffers = async (params) => {
  const res = await api.get("/offers", { params });
  return res.data;
};

export const getActiveOffers = async (params) => {
  const res = await api.get("/offers/active", { params });
  return res.data;
};

export const createOffer = async (data) => {
  const res = await api.post("/offers/create", data);
  return res.data;
};

export const updateOffer = async (id, data) => {
  const res = await api.put(`/offers/update/${id}`, data);
  return res.data;
};

export const deleteOffer = async (id) => {
  const res = await api.delete(`/offers/delete/${id}`);
  return res.data;
};

export const toggleOfferStatus = async (id) => {
  const res = await api.patch(`/offers/toggle/${id}`);
  return res.data;
};
