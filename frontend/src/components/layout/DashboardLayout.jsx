import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const roleColors = {
  admin:   { accent: "#8B5CF6", glow: "rgba(139,92,246,0.15)" },
  manager: { accent: "#4F8EF7", glow: "rgba(79,142,247,0.15)" },
  livreur: { accent: "#F5A623", glow: "rgba(245,166,35,0.15)" },
  client:  { accent: "#2DD4A0", glow: "rgba(45,212,160,0.15)" },
};

const roleIcons = { admin: "⬡", manager: "◈", livreur: "◎", client: "◇" };

export default function DashboardLayout({ navItems, children, role }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState(navItems[0]?.id);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const colors = roleColors[role] || roleColors.client;

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#0F1117" }}>

      {/* Top bar */}
      <div style={{
        height: 52, background: "#1A1D27", borderBottom: "1px solid #2E3347",
        display: "flex", alignItems: "center", padding: "0 20px", gap: 12, flexShrink: 0,
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <button onClick={() => setSidebarOpen(v => !v)} style={{
          background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: 16, padding: 4,
        }}>☰</button>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: `linear-gradient(135deg, ${colors.accent}, #4F8EF7)`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13,
          }}>⬡</div>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#E8EAF0" }}>DeliverOS</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* User badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 30, height: 30, borderRadius: "50%",
            background: colors.glow, border: `1px solid ${colors.accent}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, color: colors.accent,
          }}>
            {roleIcons[role]}
          </div>
          <div style={{ lineHeight: 1.3 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#E8EAF0" }}>{user?.full_name || "Utilisateur"}</div>
            <div style={{ fontSize: 11, color: "#6B7280", textTransform: "capitalize" }}>{role}</div>
          </div>
        </div>

        <button onClick={handleLogout} style={{
          background: "transparent", border: "1px solid #2E3347", color: "#9CA3AF",
          borderRadius: 8, padding: "5px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit",
        }}>Déconnexion</button>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        <div style={{
          width: sidebarOpen ? 210 : 0, background: "#1A1D27",
          borderRight: "1px solid #2E3347", padding: sidebarOpen ? "16px 10px" : 0,
          overflow: "hidden", transition: "width 0.2s ease, padding 0.2s ease",
          display: "flex", flexDirection: "column", gap: 2, flexShrink: 0,
        }}>
          <div style={{ fontSize: 10, color: "#6B7280", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", padding: "0 12px 10px" }}>
            Navigation
          </div>
          {navItems.map(item => {
            const active = activePage === item.id;
            return (
              <button key={item.id} onClick={() => setActivePage(item.id)} style={{
                display: "flex", alignItems: "center", gap: 10, width: "100%",
                padding: "9px 12px", borderRadius: 9, border: "none", cursor: "pointer",
                background: active ? colors.glow : "transparent",
                borderLeft: active ? `2px solid ${colors.accent}` : "2px solid transparent",
                color: active ? colors.accent : "#9CA3AF",
                fontSize: 13, fontWeight: active ? 600 : 400, fontFamily: "inherit",
                transition: "all 0.15s", textAlign: "left", whiteSpace: "nowrap",
              }}>
                <span style={{ fontSize: 15 }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}

          <div style={{ flex: 1 }} />
          <div style={{ padding: "12px", borderTop: "1px solid #2E3347", marginTop: 8 }}>
            <div style={{ fontSize: 11, color: "#6B7280" }}>Version 1.0.0</div>
          </div>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
          {navItems.find(n => n.id === activePage)?.content}
        </div>
      </div>
    </div>
  );
}
