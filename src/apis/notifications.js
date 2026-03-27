import api from "./api";

export const getNotifications = (params) =>
  api.get("/notifications", { params }).then((r) => r.data);

export const getUnreadCount = () =>
  api.get("/notifications/unread-count").then((r) => r.data);

export const markAsRead = (id) =>
  api.patch(`/notifications/${id}/read`).then((r) => r.data);

export const markAllAsRead = () =>
  api.patch("/notifications/mark-all-read").then((r) => r.data);

export const deleteNotification = (id) =>
  api.delete(`/notifications/${id}`).then((r) => r.data);

export const deleteAllNotifications = () =>
  api.delete("/notifications/clear-all").then((r) => r.data);
