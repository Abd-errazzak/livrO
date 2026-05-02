import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const roleColors = {
  admin:   { accent: "#8B5CF6", glow: "rgba(139,92,246,0.15)" },
  manager: { accent: "#4F8EF7", glow: "rgba(79,142,247,0.15)" },
  livreur: { accent: "#F5A623", glow: "rgba(245,166,35,0.15)" },
  client:  { accent: "#2DD4A0", glow: "rgba(45,212,160,0.15)" },
};

const roleIcons = { admin: "⬡", manager: "◈", livreur: "◎", client: "◇" };

// Livr'O SVG Logo component
function LivrOLogo({ size = 28, accent = "#4F8EF7" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`bg-${accent}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accent}/>
          <stop offset="100%" stopColor="#2DD4A0"/>
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill={`url(#bg-${accent})`}/>
      <rect x="14" y="24" width="24" height="22" rx="3" fill="white" opacity="0.95"/>
      <line x1="14" y1="31" x2="38" y2="31" stroke={accent} strokeWidth="1.5"/>
      <line x1="26" y1="24" x2="26" y2="31" stroke={accent} strokeWidth="1.5"/>
      <path d="M40 35 L52 35 M47 29 L53 35 L47 41" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="26" cy="42" r="3" fill="#2DD4A0"/>
    </svg>
  );
}

export default function DashboardLayout({ navItems, role }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState(navItems[0]?.id);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const colors = roleColors[role] || roleColors.client;

  // Detect screen size
  useEffect(() => {
    const handle = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    handle();
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  const handleLogout = () => { logout(); navigate("/login"); };

  const handleNavClick = (id) => {
    setActivePage(id);
    if (isMobile) setSidebarOpen(false); // close sidebar on mobile after nav
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", minHeight:"100vh", background:"#0F1117" }}>

      {/* ── Top bar ── */}
      <div style={{
        height: 52, background:"#1A1D27", borderBottom:"1px solid #2E3347",
        display:"flex", alignItems:"center", padding:"0 16px", gap:10, flexShrink:0,
        position:"sticky", top:0, zIndex:200,
      }}>
        <button onClick={() => setSidebarOpen(v => !v)} style={{
          background:"none", border:"none", color:"#6B7280", cursor:"pointer",
          fontSize:18, padding:"4px 6px", lineHeight:1, flexShrink:0,
        }}>☰</button>

        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
          <LivrOLogo size={28} accent={colors.accent} />
          <span style={{ fontWeight:800, fontSize:15, color:"#E8EAF0", letterSpacing:"-0.3px" }}>
            Livr<span style={{ color: colors.accent }}>'</span>O
          </span>
        </div>

        <div style={{ flex:1 }} />

        {/* User info — hide name on very small screens */}
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{
            width:30, height:30, borderRadius:"50%",
            background:colors.glow, border:`1px solid ${colors.accent}40`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:13, color:colors.accent, flexShrink:0,
          }}>
            {roleIcons[role]}
          </div>
          {!isMobile && (
            <div style={{ lineHeight:1.3 }}>
              <div style={{ fontSize:12, fontWeight:600, color:"#E8EAF0" }}>{user?.full_name || "Utilisateur"}</div>
              <div style={{ fontSize:11, color:"#6B7280", textTransform:"capitalize" }}>{role}</div>
            </div>
          )}
        </div>

        <button onClick={handleLogout} style={{
          background:"transparent", border:"1px solid #2E3347", color:"#9CA3AF",
          borderRadius:8, padding: isMobile ? "5px 8px" : "5px 12px",
          fontSize:12, cursor:"pointer", fontFamily:"inherit", flexShrink:0,
        }}>
          {isMobile ? "⏻" : "Déconnexion"}
        </button>
      </div>

      {/* ── Body ── */}
      <div style={{ display:"flex", flex:1, overflow:"hidden", position:"relative" }}>

        {/* Mobile overlay */}
        {isMobile && sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:150 }}
          />
        )}

        {/* ── Sidebar ── */}
        <div style={{
          width: sidebarOpen ? 210 : 0,
          background:"#1A1D27",
          borderRight:"1px solid #2E3347",
          padding: sidebarOpen ? "16px 10px" : 0,
          overflow:"hidden",
          transition:"width 0.2s ease, padding 0.2s ease",
          display:"flex", flexDirection:"column", gap:2, flexShrink:0,
          // On mobile: fixed overlay sidebar
          ...(isMobile ? {
            position:"fixed", top:52, left:0, bottom:0, zIndex:160,
            width: sidebarOpen ? 220 : 0,
          } : {}),
        }}>
          <div style={{ fontSize:10, color:"#6B7280", fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", padding:"0 12px 10px", whiteSpace:"nowrap" }}>
            Navigation
          </div>

          {navItems.map(item => {
            const active = activePage === item.id;
            return (
              <button key={item.id} onClick={() => handleNavClick(item.id)} style={{
                display:"flex", alignItems:"center", gap:10, width:"100%",
                padding:"9px 12px", borderRadius:9, border:"none", cursor:"pointer",
                background: active ? colors.glow : "transparent",
                borderLeft: active ? `2px solid ${colors.accent}` : "2px solid transparent",
                color: active ? colors.accent : "#9CA3AF",
                fontSize:13, fontWeight: active ? 600 : 400, fontFamily:"inherit",
                transition:"all 0.15s", textAlign:"left", whiteSpace:"nowrap",
              }}>
                <span style={{ fontSize:15 }}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}

          <div style={{ flex:1 }} />
          <div style={{ padding:"12px", borderTop:"1px solid #2E3347", marginTop:8 }}>
            <div style={{ fontSize:11, color:"#6B7280" }}>Livr'O v1.0.1</div>
          </div>
        </div>

        {/* ── Page content ── */}
        <div style={{
          flex:1, overflowY:"auto",
          padding: isMobile ? "16px" : "28px 32px",
        }}>
          {navItems.find(n => n.id === activePage)?.content}
        </div>
      </div>

      {/* ── Mobile bottom nav bar ── */}
      {isMobile && (
        <div style={{
          position:"fixed", bottom:0, left:0, right:0,
          background:"#1A1D27", borderTop:"1px solid #2E3347",
          display:"flex", zIndex:200,
        }}>
          {navItems.map(item => {
            const active = activePage === item.id;
            return (
              <button key={item.id} onClick={() => handleNavClick(item.id)} style={{
                flex:1, display:"flex", flexDirection:"column", alignItems:"center",
                justifyContent:"center", padding:"8px 4px", border:"none", cursor:"pointer",
                background:"transparent", fontFamily:"inherit",
                color: active ? colors.accent : "#6B7280",
                borderTop: active ? `2px solid ${colors.accent}` : "2px solid transparent",
                transition:"all 0.15s",
                fontSize:10, fontWeight: active ? 600 : 400, gap:3,
              }}>
                <span style={{ fontSize:17 }}>{item.icon}</span>
                <span style={{ fontSize:9, whiteSpace:"nowrap", overflow:"hidden", maxWidth:60, textOverflow:"ellipsis" }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
