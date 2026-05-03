import { useEffect, useState, useCallback } from "react";
import { notificationService } from "../../services/profileService";
import { PageHeader, Card } from "../ui/DashboardUI";

const fmtTime = iso => {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60)   return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff/60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff/3600)}h`;
  return d.toLocaleDateString("fr-FR", { day:"2-digit", month:"short" });
};

const STATUS_ICONS = {
  "Commande assignée":   { icon:"👤", color:"#4F8EF7", bg:"rgba(79,142,247,0.12)" },
  "Colis récupéré":      { icon:"📦", color:"#8B5CF6", bg:"rgba(139,92,246,0.12)" },
  "En route":            { icon:"🚚", color:"#06B6D4", bg:"rgba(6,182,212,0.12)"  },
  "Colis livré ! 🎉":   { icon:"✓",  color:"#2DD4A0", bg:"rgba(45,212,160,0.12)" },
  "Commande annulée":    { icon:"✕",  color:"#F75050", bg:"rgba(247,80,80,0.12)"  },
};

const getStyle = (title) =>
  STATUS_ICONS[title] || { icon:"🔔", color:"#4F8EF7", bg:"rgba(79,142,247,0.12)" };

export default function NotificationsPage() {
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("all"); // all | unread

  const load = useCallback(() => {
    setLoading(true);
    notificationService.list(filter === "unread")
      .then(setNotifs)
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleMarkOne = async (id) => {
    await notificationService.markRead(id);
    setNotifs(prev => prev.map(n => n.id === id ? {...n, is_read: true} : n));
  };

  const handleMarkAll = async () => {
    await notificationService.markAllRead();
    setNotifs(prev => prev.map(n => ({...n, is_read: true})));
  };

  const unreadCount = notifs.filter(n => !n.is_read).length;

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Suivez les mises à jour de vos commandes"
        action={
          unreadCount > 0 && (
            <button onClick={handleMarkAll} style={{
              background:"transparent", border:"1px solid #2E3347",
              color:"#9CA3AF", borderRadius:9, padding:"7px 14px",
              fontSize:12, fontWeight:500, cursor:"pointer", fontFamily:"inherit",
            }}>
              Tout marquer comme lu
            </button>
          )
        }
      />

      {/* Filter + count */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
        {["all","unread"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding:"6px 14px", borderRadius:8, cursor:"pointer", fontFamily:"inherit",
            border:`1px solid ${filter===f ? "#4F8EF7" : "#2E3347"}`,
            background:filter===f ? "rgba(79,142,247,0.12)" : "transparent",
            color:filter===f ? "#4F8EF7" : "#9CA3AF",
            fontSize:12, fontWeight:filter===f ? 600 : 400,
          }}>
            {f === "all" ? "Toutes" : "Non lues"}
          </button>
        ))}
        {unreadCount > 0 && (
          <span style={{
            background:"#F75050", color:"#fff",
            borderRadius:99, padding:"2px 8px",
            fontSize:11, fontWeight:700,
          }}>
            {unreadCount} non {unreadCount === 1 ? "lue" : "lues"}
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign:"center", padding:48, color:"#6B7280" }}>Chargement…</div>
      ) : notifs.length === 0 ? (
        <Card>
          <div style={{ textAlign:"center", padding:"40px 20px" }}>
            <div style={{ fontSize:40, marginBottom:12 }}>🔔</div>
            <div style={{ color:"#9CA3AF", fontSize:14, fontWeight:500 }}>
              {filter === "unread" ? "Aucune notification non lue" : "Aucune notification"}
            </div>
            <div style={{ color:"#6B7280", fontSize:12, marginTop:6 }}>
              Vous serez notifié à chaque mise à jour de vos commandes.
            </div>
          </div>
        </Card>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {notifs.map(n => {
            const s = getStyle(n.title);
            return (
              <div
                key={n.id}
                style={{
                  background: n.is_read ? "#21253A" : "rgba(79,142,247,0.06)",
                  border:`1px solid ${n.is_read ? "#2E3347" : "rgba(79,142,247,0.25)"}`,
                  borderRadius:12, padding:"14px 16px",
                  display:"flex", alignItems:"flex-start", gap:14,
                  transition:"all 0.15s",
                }}
              >
                {/* Icon */}
                <div style={{
                  width:40, height:40, borderRadius:"50%", flexShrink:0,
                  background:s.bg, color:s.color,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:16, fontWeight:700,
                }}>
                  {s.icon}
                </div>

                {/* Content */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8, marginBottom:4 }}>
                    <span style={{
                      fontSize:13, fontWeight: n.is_read ? 500 : 700,
                      color: n.is_read ? "#9CA3AF" : "#E8EAF0",
                    }}>
                      {n.title}
                    </span>
                    <span style={{ fontSize:11, color:"#6B7280", flexShrink:0 }}>
                      {fmtTime(n.created_at)}
                    </span>
                  </div>
                  <div style={{ fontSize:13, color:"#9CA3AF", lineHeight:1.5 }}>
                    {n.message}
                  </div>
                  {n.order_id && (
                    <span style={{
                      marginTop:6, display:"inline-block",
                      fontSize:11, color:"#4F8EF7",
                      background:"rgba(79,142,247,0.1)",
                      padding:"2px 8px", borderRadius:6,
                    }}>
                      Commande #{n.order_id}
                    </span>
                  )}
                </div>

                {/* Unread dot + mark read */}
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, flexShrink:0 }}>
                  {!n.is_read && (
                    <>
                      <div style={{
                        width:8, height:8, borderRadius:"50%", background:"#4F8EF7",
                      }} />
                      <button onClick={() => handleMarkOne(n.id)} style={{
                        background:"none", border:"none", color:"#6B7280",
                        fontSize:11, cursor:"pointer", fontFamily:"inherit",
                        whiteSpace:"nowrap",
                      }}>
                        Lu
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
