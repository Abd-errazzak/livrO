// ── Badge ──────────────────────────────────────────────────────
const statusColors = {
  "En attente": { bg: "rgba(245,166,35,0.12)", text: "#F5A623", dot: "#F5A623" },
  "En cours":   { bg: "rgba(79,142,247,0.12)",  text: "#4F8EF7", dot: "#4F8EF7" },
  "Livrée":     { bg: "rgba(45,212,160,0.12)",  text: "#2DD4A0", dot: "#2DD4A0" },
  "Échouée":    { bg: "rgba(247,80,80,0.12)",   text: "#F75050", dot: "#F75050" },
  "Annulée":    { bg: "rgba(107,114,128,0.12)", text: "#9CA3AF", dot: "#9CA3AF" },
  "Disponible": { bg: "rgba(45,212,160,0.12)",  text: "#2DD4A0", dot: "#2DD4A0" },
  "Occupé":     { bg: "rgba(245,166,35,0.12)",  text: "#F5A623", dot: "#F5A623" },
  "Actif":      { bg: "rgba(45,212,160,0.12)",  text: "#2DD4A0", dot: "#2DD4A0" },
  "Inactif":    { bg: "rgba(107,114,128,0.12)", text: "#9CA3AF", dot: "#9CA3AF" },
};

export function Badge({ status }) {
  const c = statusColors[status] || { bg: "rgba(107,114,128,0.12)", text: "#9CA3AF", dot: "#9CA3AF" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 99,
      background: c.bg, color: c.text, fontSize: 11, fontWeight: 600,
      letterSpacing: "0.04em", textTransform: "uppercase",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
      {status}
    </span>
  );
}

// ── StatCard ───────────────────────────────────────────────────
export function StatCard({ label, value, trend, color = "#4F8EF7", icon }) {
  return (
    <div style={{
      background: "#21253A", border: "1px solid #2E3347",
      borderRadius: 14, padding: "18px 22px", flex: 1, minWidth: 130,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ fontSize: 11, color: "#6B7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
          {label}
        </div>
        {icon && <span style={{ fontSize: 16, opacity: 0.5 }}>{icon}</span>}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
      {trend && <div style={{ fontSize: 12, color: "#2DD4A0", marginTop: 6 }}>{trend}</div>}
    </div>
  );
}

// ── Card ───────────────────────────────────────────────────────
export function Card({ children, style = {}, title, action }) {
  return (
    <div style={{
      background: "#21253A", border: "1px solid #2E3347",
      borderRadius: 14, padding: "20px 24px", ...style,
    }}>
      {title && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontWeight: 600, color: "#E8EAF0", fontSize: 13 }}>{title}</div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

// ── Table ──────────────────────────────────────────────────────
export function Table({ headers, rows, emptyMessage = "Aucune donnée" }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr>
            {headers.map(h => (
              <th key={h} style={{
                textAlign: "left", padding: "10px 14px", color: "#6B7280",
                fontWeight: 500, borderBottom: "1px solid #2E3347",
                fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em",
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} style={{ padding: "24px 14px", color: "#6B7280", textAlign: "center", fontSize: 13 }}>
                {emptyMessage}
              </td>
            </tr>
          ) : rows.map((row, i) => (
            <tr key={i} style={{ borderBottom: "1px solid #2E3347" }}>
              {row.map((cell, j) => (
                <td key={j} style={{ padding: "12px 14px", color: "#E8EAF0", verticalAlign: "middle" }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── PageHeader ─────────────────────────────────────────────────
export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
      <div>
        <h2 style={{ color: "#E8EAF0", margin: "0 0 4px", fontSize: 20, fontWeight: 700 }}>{title}</h2>
        {subtitle && <p style={{ color: "#9CA3AF", margin: 0, fontSize: 13 }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ── ActionButton ───────────────────────────────────────────────
export function ActionButton({ children, onClick, variant = "primary", color = "#4F8EF7" }) {
  const styles = {
    primary: { background: color, color: "#fff", border: "none" },
    secondary: { background: "transparent", color: "#9CA3AF", border: "1px solid #2E3347" },
    danger: { background: "transparent", color: "#F75050", border: "1px solid #F75050" },
  };
  return (
    <button onClick={onClick} style={{
      ...styles[variant],
      borderRadius: 9, padding: "8px 16px", fontSize: 12, fontWeight: 600,
      cursor: "pointer", fontFamily: "inherit", transition: "opacity 0.15s",
    }}
      onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
    >
      {children}
    </button>
  );
}
