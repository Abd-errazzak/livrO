export default function Alert({ type = "error", message }) {
  if (!message) return null;
  const colors = {
    error:   { bg: "rgba(247,80,80,0.1)",   border: "rgba(247,80,80,0.3)",   text: "var(--danger)",  icon: "⚠" },
    success: { bg: "rgba(45,212,160,0.1)",  border: "rgba(45,212,160,0.3)",  text: "var(--success)", icon: "✓" },
    info:    { bg: "rgba(79,142,247,0.1)",  border: "rgba(79,142,247,0.3)",  text: "var(--accent)",  icon: "ℹ" },
  };
  const c = colors[type];
  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.border}`, borderRadius: 10,
      padding: "11px 14px", display: "flex", alignItems: "flex-start", gap: 10,
      fontSize: 13, color: c.text,
    }}>
      <span style={{ flexShrink: 0, marginTop: 1 }}>{c.icon}</span>
      <span>{message}</span>
    </div>
  );
}
