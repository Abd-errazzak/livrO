import api from "./api";

export const invoiceService = {
  getOrderData: (orderId) =>
    api.get(`/invoice/${orderId}`).then(r => r.data),

  getPriceSuggestion: (origin, destination) =>
    api.get("/manager/orders/price-suggestion", {
      params: { origin, destination },
    }).then(r => r.data),
};
