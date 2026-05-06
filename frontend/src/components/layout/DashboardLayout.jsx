import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "../ui/NotificationBell";

const roleColors = {
  admin:   { accent:"#8B5CF6", glow:"rgba(139,92,246,0.15)" },
  manager: { accent:"#4F8EF7", glow:"rgba(79,142,247,0.15)" },
  livreur: { accent:"#F5A623", glow:"rgba(245,166,35,0.15)" },
  client:  { accent:"#2DD4A0", glow:"rgba(45,212,160,0.15)" },
};
const roleIcons = { admin:"⬡", manager:"◈", livreur:"◎", client:"◇" };

function LivrOLogo({ size=28, accent="#4F8EF7" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`logobg${accent.replace("#","")}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={accent}/>
          <stop offset="100%" stopColor="#2DD4A0"/>
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill={`url(#logobg${accent.replace("#","")})`}/>
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const colors = roleColors[role] || roleColors.client;

  useEffect(() => {
    const handle = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile); // open on desktop, closed on mobile
    };
    handle();
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  const handleNavClick = id => {
    setActivePage(id);
    if (isMobile) setSidebarOpen(false);
  };

  const handleLogout = () => { logout(); navigate("/login"); };

  const activeContent = navItems.find(n => n.id === activePage)?.content;

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100dvh", background:"#0F1117", overflow:"hidden" }}>

      {/* ── Topbar ── */}
      <div style={{
        height:52, minHeight:52, background:"#1A1D27",
        borderBottom:"1px solid #2E3347",
        display:"flex", alignItems:"center",
        padding:"0 12px", gap:8, zIndex:200, flexShrink:0,
      }}>
        {/* Hamburger */}
        <button onClick={() => setSidebarOpen(v=>!v)} style={{
          background:"none", border:"none", color:"#9CA3AF",
          cursor:"pointer", fontSize:20, padding:"4px 8px",
          lineHeight:1, flexShrink:0, borderRadius:6,
        }}>☰</button>

        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:7, flexShrink:0 }}>
          <LivrOLogo size={26} accent={colors.accent} />
          <span style={{ fontWeight:800, fontSize:15, color:"#E8EAF0", letterSpacing:"-0.3px" }}>
            Livr<span style={{ color:colors.accent }}>'</span>O
          </span>
        </div>

        <div style={{ flex:1 }} />

        {/* Bell */}
        <NotificationBell role={role} onClick={() => handleNavClick("notifications")} />

        {/* Avatar */}
        <div style={{
          width:30, height:30, borderRadius:"50%", flexShrink:0,
          background:colors.glow, border:`1px solid ${colors.accent}50`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:12, color:colors.accent, fontWeight:700,
        }}>
          {user?.full_name?.[0]?.toUpperCase() || roleIcons[role]}
        </div>

        {/* Name — desktop only */}
        {!isMobile && (
          <div style={{ lineHeight:1.3, flexShrink:0 }}>
            <div style={{ fontSize:12, fontWeight:600, color:"#E8EAF0", maxWidth:120, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {user?.full_name || "Utilisateur"}
            </div>
            <div style={{ fontSize:10, color:"#6B7280", textTransform:"capitalize" }}>{role}</div>
          </div>
        )}

        {/* Logout */}
        <button onClick={handleLogout} style={{
          background:"transparent", border:"1px solid #2E3347",
          color:"#9CA3AF", borderRadius:8, flexShrink:0,
          padding: isMobile ? "5px 8px" : "5px 12px",
          fontSize:12, cursor:"pointer", fontFamily:"inherit",
        }}>
          {isMobile ? "⏻" : "Déconnexion"}
        </button>
      </div>

      {/* ── Body ── */}
      <div style={{ display:"flex", flex:1, minHeight:0, position:"relative" }}>

        {/* Mobile backdrop */}
        {isMobile && sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} style={{
            position:"fixed", inset:0, background:"rgba(0,0,0,0.55)",
            zIndex:150, top:52,
          }} />
        )}

        {/* ── Sidebar ── */}
        <div style={{
          background:"#1A1D27",
          borderRight:"1px solid #2E3347",
          display:"flex", flexDirection:"column",
          flexShrink:0, zIndex:160,
          transition:"width 0.2s ease",
          overflow:"hidden",
          // Desktop: static sidebar
          // Mobile: fixed overlay
          ...(isMobile ? {
            position:"fixed", top:52, left:0, bottom:0,
            width: sidebarOpen ? 220 : 0,
          } : {
            position:"relative",
            width: sidebarOpen ? 210 : 0,
          }),
        }}>
          <div style={{ width: isMobile ? 220 : 210, padding:"14px 10px", display:"flex", flexDirection:"column", gap:3, height:"100%", overflowY:"auto" }}>
            <div style={{ fontSize:10, color:"#6B7280", fontWeight:600, letterSpacing:"0.1em", textTransform:"uppercase", padding:"0 10px 10px", whiteSpace:"nowrap" }}>
              Navigation
            </div>
            {navItems.map(item => {
              const active = activePage === item.id;
              return (
                <button key={item.id} onClick={() => handleNavClick(item.id)} style={{
                  display:"flex", alignItems:"center", gap:10, width:"100%",
                  padding:"10px 12px", borderRadius:9, border:"none", cursor:"pointer",
                  background: active ? colors.glow : "transparent",
                  borderLeft: active ? `2px solid ${colors.accent}` : "2px solid transparent",
                  color: active ? colors.accent : "#9CA3AF",
                  fontSize:13, fontWeight: active ? 600 : 400,
                  fontFamily:"inherit", textAlign:"left", whiteSpace:"nowrap",
                  transition:"all 0.15s",
                }}>
                  <span style={{ fontSize:16, flexShrink:0 }}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
            <div style={{ flex:1 }} />
            <div style={{ padding:"12px 10px", borderTop:"1px solid #2E3347", marginTop:8 }}>
              <div style={{ fontSize:10, color:"#6B7280" }}>Livr'O v1.0.1</div>
              {!isMobile && user?.full_name && (
                <div style={{ fontSize:11, color:"#9CA3AF", marginTop:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {user.full_name}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Page content ── */}
        <div style={{
          flex:1, overflowY:"auto",
          padding: isMobile ? "16px 14px" : "24px 28px",
          // On mobile add bottom padding for nav bar
          paddingBottom: isMobile ? "76px" : (isMobile ? "16px" : "24px"),
          minWidth:0,
        }}>
          {activeContent}
        </div>
      </div>

      {/* ── Mobile bottom nav ── */}
      {isMobile && (
        <div style={{
          position:"fixed", bottom:0, left:0, right:0,
          background:"#1A1D27", borderTop:"1px solid #2E3347",
          display:"flex", zIndex:200, height:60,
        }}>
          {navItems.slice(0, 5).map(item => {
            const active = activePage === item.id;
            return (
              <button key={item.id} onClick={() => handleNavClick(item.id)} style={{
                flex:1, display:"flex", flexDirection:"column", alignItems:"center",
                justifyContent:"center", padding:"6px 2px", border:"none",
                cursor:"pointer", background:"transparent", fontFamily:"inherit",
                color: active ? colors.accent : "#6B7280",
                borderTop: active ? `2px solid ${colors.accent}` : "2px solid transparent",
                transition:"all 0.15s", gap:3,
              }}>
                <span style={{ fontSize:18 }}>{item.icon}</span>
                <span style={{
                  fontSize:9, whiteSpace:"nowrap",
                  overflow:"hidden", maxWidth:64,
                  textOverflow:"ellipsis", fontWeight: active ? 600 : 400,
                }}>
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
