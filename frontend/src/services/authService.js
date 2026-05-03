import api from "./api";

export const authService = {
  login: (email, password) =>
    api.post("/auth/login", { email, password }).then((r) => r.data),

  registerClient: (payload) =>
    api.post("/auth/register", payload).then((r) => r.data),

  adminCreateUser: (payload) =>
    api.post("/auth/create-user", payload).then((r) => r.data),

  me: () => api.get("/auth/me").then((r) => r.data),

  refresh: (refresh_token) =>
    api.post("/auth/refresh", { refresh_token }).then((r) => r.data),
};
