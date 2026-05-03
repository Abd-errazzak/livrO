import api from "./api";

// ── Profile ────────────────────────────────────────────────────
export const profileService = {
  update:         (data) => api.patch("/auth/me", data).then(r => r.data),
  changePassword: (data) => api.post("/auth/me/change-password", data).then(r => r.data),
};

// ── Notifications ──────────────────────────────────────────────
export const notificationService = {
  list:        (unread_only = false) => api.get("/notifications", { params: { unread_only } }).then(r => r.data),
  unreadCount: ()          => api.get("/notifications/unread-count").then(r => r.data),
  markRead:    (id)        => api.patch(`/notifications/${id}/read`).then(r => r.data),
  markAllRead: ()          => api.post("/notifications/read-all").then(r => r.data),
};
