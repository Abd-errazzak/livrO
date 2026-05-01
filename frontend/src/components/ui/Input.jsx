export default function Input({ label, error, icon, ...props }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && (
        <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-sub)", letterSpacing: "0.04em" }}>
          {label}
        </label>
      )}
      <div style={{ position: "relative" }}>
        {icon && (
          <span style={{
            position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
            fontSize: 15, color: "var(--muted)", pointerEvents: "none",
          }}>
            {icon}
          </span>
        )}
        <input
          {...props}
          style={{
            width: "100%",
            background: "var(--surface)",
            border: `1px solid ${error ? "var(--danger)" : "var(--border)"}`,
            borderRadius: 10,
            padding: icon ? "11px 14px 11px 38px" : "11px 14px",
            color: "var(--text)",
            fontSize: 13,
            outline: "none",
            transition: "border-color 0.15s",
            ...props.style,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = error ? "var(--danger)" : "var(--accent)";
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? "var(--danger)" : "var(--border)";
            props.onBlur?.(e);
          }}
        />
      </div>
      {error && <span style={{ fontSize: 11, color: "var(--danger)" }}>{error}</span>}
    </div>
  );
}
