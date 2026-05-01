// Status display config
export const STATUS_CONFIG = {
  pending:    { label: "En attente",  color: "#F5A623", bg: "rgba(245,166,35,0.12)" },
  assigned:   { label: "Assignée",    color: "#4F8EF7", bg: "rgba(79,142,247,0.12)" },
  picked_up:  { label: "Récupérée",   color: "#8B5CF6", bg: "rgba(139,92,246,0.12)" },
  in_transit: { label: "En transit",  color: "#06B6D4", bg: "rgba(6,182,212,0.12)"  },
  delivered:  { label: "Livrée",      color: "#2DD4A0", bg: "rgba(45,212,160,0.12)" },
  cancelled:  { label: "Annulée",     color: "#F75050", bg: "rgba(247,80,80,0.12)"  },
};

export const PAYMENT_LABELS = {
  sender:   "Expéditeur paie",
  receiver: "Destinataire paie",
};

// Status badge
export function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 99,
      background: c.bg, color: c.color,
      fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
      {c.label}
    </span>
  );
}

// Progress stepper shown in order detail
const STEPS = ["pending", "assigned", "picked_up", "in_transit", "delivered"];

export function OrderStepper({ status }) {
  if (status === "cancelled") {
    return (
      <div style={{ padding: "12px 16px", background: "rgba(247,80,80,0.08)", borderRadius: 10, color: "#F75050", fontSize: 13, fontWeight: 500 }}>
        ✕ Commande annulée
      </div>
    );
  }
  const currentIdx = STEPS.indexOf(status);
  return (
    <div style={{ display: "flex", alignItems: "flex-start" }}>
      {STEPS.map((step, i) => {
        const done   = i <= currentIdx;
        const active = i === currentIdx;
        const cfg    = STATUS_CONFIG[step];
        return (
          <div key={step} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
              {i > 0 && <div style={{ flex: 1, height: 2, background: i <= currentIdx ? "#2DD4A0" : "#2E3347", transition: "background 0.3s" }} />}
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: done ? (active ? cfg.color : "#2DD4A0") : "#2E3347",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: done ? "#0F1117" : "#6B7280", fontSize: 11, fontWeight: 700,
                boxShadow: active ? `0 0 0 3px ${cfg.color}30` : "none",
                transition: "all 0.3s",
              }}>
                {done && !active ? "✓" : i + 1}
              </div>
              {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: i < currentIdx ? "#2DD4A0" : "#2E3347", transition: "background 0.3s" }} />}
            </div>
            <div style={{ fontSize: 10, color: done ? "#E8EAF0" : "#6B7280", marginTop: 7, textAlign: "center", fontWeight: done ? 600 : 400 }}>
              {cfg.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Order info card — two-column sender/receiver layout
export function OrderParties({ order }) {
  const Section = ({ title, name, phone, address, city }) => (
    <div style={{ flex: 1, background: "#1A1D27", borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>{title}</div>
      <div style={{ color: "#E8EAF0", fontWeight: 600, marginBottom: 4 }}>{name}</div>
      <div style={{ color: "#9CA3AF", fontSize: 12, marginBottom: 2 }}>📞 {phone}</div>
      <div style={{ color: "#9CA3AF", fontSize: 12, marginBottom: 2 }}>📍 {address}</div>
      <div style={{ color: "#4F8EF7", fontSize: 12, fontWeight: 500 }}>🏙 {city}</div>
    </div>
  );

  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
      <Section title="Expéditeur" name={order.sender_name} phone={order.sender_phone} address={order.sender_address} city={order.origin_city} />
      <div style={{ display: "flex", alignItems: "center", fontSize: 18, color: "#4F8EF7" }}>→</div>
      <Section title="Destinataire" name={order.receiver_name} phone={order.receiver_phone} address={order.receiver_address} city={order.destination_city} />
    </div>
  );
}
