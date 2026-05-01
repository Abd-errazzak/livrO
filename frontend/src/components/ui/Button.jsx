export default function Button({ children, loading, variant = "primary", fullWidth, style = {}, ...props }) {
  const variants = {
    primary: {
      background: "var(--accent)",
      color: "#fff",
      border: "none",
    },
    secondary: {
      background: "transparent",
      color: "var(--text-sub)",
      border: "1px solid var(--border)",
    },
    danger: {
      background: "transparent",
      color: "var(--danger)",
      border: "1px solid var(--danger)",
    },
  };

  return (
    <button
      {...props}
      disabled={loading || props.disabled}
      style={{
        ...variants[variant],
        borderRadius: 10,
        padding: "11px 20px",
        fontSize: 13,
        fontWeight: 600,
        cursor: loading || props.disabled ? "not-allowed" : "pointer",
        opacity: loading || props.disabled ? 0.65 : 1,
        transition: "opacity 0.15s, transform 0.1s",
        width: fullWidth ? "100%" : "auto",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        ...style,
      }}
      onMouseEnter={(e) => { if (!loading && !props.disabled) e.currentTarget.style.opacity = "0.88"; }}
      onMouseLeave={(e) => { if (!loading && !props.disabled) e.currentTarget.style.opacity = "1"; }}
    >
      {loading ? <span style={{ fontSize: 13 }}>⏳</span> : null}
      {children}
    </button>
  );
}
