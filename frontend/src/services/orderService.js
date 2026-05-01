import api from "./api";

// ── Client ─────────────────────────────────────────────────────
export const clientOrderService = {
  create:  (payload) => api.post("/client/orders", payload).then(r => r.data),
  list:    ()        => api.get("/client/orders").then(r => r.data),
  detail:  (id)      => api.get(`/client/orders/${id}`).then(r => r.data),
  cancel:  (id)      => api.patch(`/client/orders/${id}/cancel`).then(r => r.data),
};

// ── Manager ────────────────────────────────────────────────────
export const managerOrderService = {
  list:   (params) => api.get("/manager/orders", { params }).then(r => r.data),
  detail: (id)     => api.get(`/manager/orders/${id}`).then(r => r.data),
  assign: (id, livreur_id, base_price, price_adjustment = 0) =>
    api.patch(`/manager/orders/${id}/assign`, { livreur_id, base_price, price_adjustment }).then(r => r.data),
  cancel: (id)     => api.patch(`/manager/orders/${id}/cancel`).then(r => r.data),
};

// ── Livreur ────────────────────────────────────────────────────
export const livreurOrderService = {
  list:         ()          => api.get("/livreur/orders").then(r => r.data),
  detail:       (id)        => api.get(`/livreur/orders/${id}`).then(r => r.data),
  updateStatus: (id, status) =>
    api.patch(`/livreur/orders/${id}/status`, { status }).then(r => r.data),
};
