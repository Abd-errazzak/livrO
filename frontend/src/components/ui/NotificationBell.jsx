import { useEffect, useState } from "react";
import { notificationService } from "../../services/profileService";

export default function NotificationBell({ onClick, role }) {
  const [count, setCount] = useState(0);

  // Poll every 30 seconds
  useEffect(() => {
    const fetch = () => {
      notificationService.unreadCount()
        .then(r => setCount(r.count))
        .catch(() => {});
    };
    fetch();
    const interval = setInterval(fetch, 30000);
    return () => clearInterval(interval);
  }, []);

  // Only clients receive notifications for now
  if (role !== "client") return null;

  return (
    <button
      onClick={onClick}
      title="Notifications"
      style={{
        position:"relative", background:"transparent",
        border:"1px solid #2E3347", borderRadius:8,
        width:34, height:34, display:"flex", alignItems:"center",
        justifyContent:"center", cursor:"pointer", flexShrink:0,
        color:"#9CA3AF", fontSize:16,
      }}
    >
      🔔
      {count > 0 && (
        <span style={{
          position:"absolute", top:-4, right:-4,
          background:"#F75050", color:"#fff",
          borderRadius:99, fontSize:10, fontWeight:700,
          padding:"1px 5px", minWidth:16, textAlign:"center",
          lineHeight:"16px", height:16,
          border:"2px solid #1A1D27",
        }}>
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
