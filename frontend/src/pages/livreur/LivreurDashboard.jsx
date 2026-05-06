import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { Card, PageHeader, StatCard } from "../../components/ui/DashboardUI";
import { OrderParties, OrderStepper, StatusBadge } from "../../components/ui/OrderUI";
import QRScanner from "../../components/ui/QRScanner";
import DeliveryMap from "../../components/ui/DeliveryMap";
import { livreurOrderService } from "../../services/orderService";

const STATUS_ACTIONS = {
  assigned:   [
    { label: "▶ Récupéré",    next: "picked_up",  color: "#4F8EF7" },
    { label: "✕ Annuler",     next: "cancelled",  color: "#F75050", outline: true },
  ],
  picked_up:  [
    { label: "🚚 En transit", next: "in_transit", color: "#8B5CF6" },
    { label: "✕ Annuler",     next: "cancelled",  color: "#F75050", outline: true },
  ],
  in_transit: [
    { label: "✓ Livré",       next: "delivered",  color: "#2DD4A0" },
    { label: "✕ Annuler",     next: "cancelled",  color: "#F75050", outline: true },
  ],
};

const STATUS_COLORS = { assigned:"#4F8EF7", picked_up:"#8B5CF6", in_transit:"#F5A623" };
const STATUS_LABELS = { assigned:"Assignée", picked_up:"Récupérée", in_transit:"En transit", delivered:"Livrée", cancelled:"Annulée" };

// ── Shared order loader hook ───────────────────────────────────
function useOrders() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    livreurOrderService.list()
      .then(setOrders)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateOrder = (updated) =>
    setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));

  return { orders, loading, updateOrder, reload: load };
}

// ── My Deliveries tab ──────────────────────────────────────────
function MyDeliveries() {
  const { orders, loading, updateOrder } = useOrders();
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [showQR,   setShowQR]   = useState(false);

  const updateStatus = async (id, status) => {
    setUpdating(true);
    try {
      const u = await livreurOrderService.updateStatus(id, status);
      updateOrder(u);
      setSelected(u);
    } catch (err) {
      alert(err.response?.data?.detail || "Erreur");
    } finally { setUpdating(false); }
  };

  const handleQRScan = async (orderId) => {
    setShowQR(false);
    try {
      const order = await livreurOrderService.detail(orderId);
      setSelected(order);
    } catch { alert("Commande introuvable ou non assignée."); }
  };

  const active = orders.filter(o => ["assigned","picked_up","in_transit"].includes(o.status));
  const done   = orders.filter(o => ["delivered","cancelled"].includes(o.status));
  const counts = orders.reduce((a,o) => { a[o.status]=(a[o.status]||0)+1; return a; }, {});

  const OrderCard = ({ o }) => (
    <div onClick={() => setSelected(o)} style={{
      background: selected?.id===o.id ? "rgba(245,166,35,0.08)" : "#21253A",
      border: `1px solid ${selected?.id===o.id ? "#F5A623" : "#2E3347"}`,
      borderRadius: 12, padding: "14px 16px", cursor: "pointer", transition: "all 0.15s",
    }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
        <span style={{ color:"#F5A623", fontWeight:700 }}>#{o.id}</span>
        <StatusBadge status={o.status} />
      </div>
      <div style={{ fontSize:13, color:"#E8EAF0", marginBottom:2 }}>{o.receiver_name}</div>
      <div style={{ fontSize:12, color:"#9CA3AF", marginBottom:2 }}>📍 {o.receiver_address}</div>
      <div style={{ fontSize:12, color:"#6B7280" }}>{o.origin_city} → {o.destination_city}</div>
      {o.total_price!=null && (
        <div style={{ fontSize:12, color:"#2DD4A0", marginTop:4, fontWeight:600 }}>
          {o.total_price.toFixed(2)} MAD · {o.payment_type==="sender"?"Expéditeur paie":"Destinataire paie"}
        </div>
      )}
    </div>
  );

  return (
    <>
      <PageHeader
        title="Mes livraisons"
        subtitle="Commandes qui vous sont assignées"
        action={
          <button onClick={() => setShowQR(true)} style={{
            background:"#F5A623", color:"#0F1117", border:"none",
            borderRadius:9, padding:"8px 16px", fontSize:12,
            fontWeight:700, cursor:"pointer", fontFamily:"inherit",
          }}>
            Scanner QR
          </button>
        }
      />

      <div style={{ display:"flex", gap:14, flexWrap:"wrap", marginBottom:24 }}>
        <StatCard label="Assignées"  value={active.length+""}            icon="📦" />
        <StatCard label="En transit" value={(counts.in_transit||0)+""} color="#4F8EF7" icon="🚚" />
        <StatCard label="Livrées"    value={(counts.delivered||0)+""} color="#2DD4A0"  icon="✓" />
        <StatCard label="Annulées"   value={(counts.cancelled||0)+""} color="#F75050"  icon="✕" />
      </div>

      {loading ? (
        <div style={{ color:"#6B7280", textAlign:"center", padding:40 }}>Chargement…</div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns: selected ? "1fr 1fr" : "1fr", gap:16, alignItems:"start" }}>

          {/* List */}
          <div>
            {active.length > 0 && (
              <>
                <div style={{ fontSize:11, fontWeight:600, color:"#6B7280", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>En cours</div>
                <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
                  {active.map(o => <OrderCard key={o.id} o={o} />)}
                </div>
              </>
            )}
            {done.length > 0 && (
              <>
                <div style={{ fontSize:11, fontWeight:600, color:"#6B7280", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:10 }}>Terminées</div>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {done.map(o => <OrderCard key={o.id} o={o} />)}
                </div>
              </>
            )}
            {orders.length === 0 && (
              <div style={{ color:"#6B7280", textAlign:"center", padding:40 }}>Aucune livraison assignée</div>
            )}
          </div>

          {/* Detail panel */}
          {selected && (
            <Card title={`Détails — #${selected.id}`}>
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <OrderStepper status={selected.status} />
                <OrderParties order={selected} />

                <div style={{ background:"#1A1D27", borderRadius:10, padding:"12px 14px" }}>
                  <div style={{ fontSize:11, color:"#6B7280", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.05em" }}>Colis</div>
                  <div style={{ color:"#E8EAF0", fontSize:13 }}>{selected.package_description}</div>
                </div>

                {selected.total_price!=null && (
                  <div style={{ background:"#1A1D27", borderRadius:10, padding:"12px 14px" }}>
                    <div style={{ fontSize:11, color:"#6B7280", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.05em" }}>Paiement</div>
                    <div style={{ display:"flex", justifyContent:"space-between" }}>
                      <span style={{ color:"#9CA3AF", fontSize:13 }}>
                        {selected.payment_type==="sender" ? "Expéditeur paie" : "Destinataire paie"}
                      </span>
                      <span style={{ color:"#2DD4A0", fontWeight:700, fontSize:16 }}>
                        {selected.total_price.toFixed(2)} MAD
                      </span>
                    </div>
                  </div>
                )}

                {/* Google Maps links */}
                {(selected.sender_location || selected.receiver_location) && (
                  <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                    {selected.sender_location && (
                      <a href={selected.sender_location} target="_blank" rel="noopener noreferrer" style={{
                        display:"inline-flex", alignItems:"center", gap:6,
                        background:"rgba(79,142,247,0.12)", border:"1px solid rgba(79,142,247,0.3)",
                        color:"#4F8EF7", padding:"7px 14px", borderRadius:8,
                        fontSize:12, fontWeight:600, textDecoration:"none",
                      }}>📦 Expéditeur sur Maps ↗</a>
                    )}
                    {selected.receiver_location && (
                      <a href={selected.receiver_location} target="_blank" rel="noopener noreferrer" style={{
                        display:"inline-flex", alignItems:"center", gap:6,
                        background:"rgba(45,212,160,0.12)", border:"1px solid rgba(45,212,160,0.3)",
                        color:"#2DD4A0", padding:"7px 14px", borderRadius:8,
                        fontSize:12, fontWeight:600, textDecoration:"none",
                      }}>🏠 Destinataire sur Maps ↗</a>
                    )}
                  </div>
                )}

                {/* Status buttons */}
                {STATUS_ACTIONS[selected.status] && (
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    <div style={{ fontSize:11, color:"#6B7280", textTransform:"uppercase", letterSpacing:"0.05em" }}>Mettre à jour</div>
                    <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                      {STATUS_ACTIONS[selected.status].map(({ label, next, color, outline }) => (
                        <button key={next}
                          onClick={() => updateStatus(selected.id, next)}
                          disabled={updating}
                          style={{
                            flex:1, padding:"10px 14px", borderRadius:9,
                            fontFamily:"inherit", fontSize:13, fontWeight:700, cursor:"pointer",
                            background: outline ? "transparent" : color,
                            color: outline ? color : "#0F1117",
                            border: `1px solid ${color}`,
                            opacity: updating ? 0.5 : 1, transition:"opacity 0.15s",
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {["delivered","cancelled"].includes(selected.status) && (
                  <div style={{
                    background: selected.status==="delivered" ? "rgba(45,212,160,0.1)" : "rgba(247,80,80,0.1)",
                    border: `1px solid ${selected.status==="delivered" ? "rgba(45,212,160,0.3)" : "rgba(247,80,80,0.3)"}`,
                    borderRadius:10, padding:"12px 14px", textAlign:"center",
                    color: selected.status==="delivered" ? "#2DD4A0" : "#F75050",
                    fontWeight:600, fontSize:13,
                  }}>
                    {selected.status==="delivered" ? "✓ Livraison confirmée" : "✕ Livraison annulée"}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {showQR && <QRScanner onScan={handleQRScan} onClose={() => setShowQR(false)} />}
    </>
  );
}

// ── Map tab ────────────────────────────────────────────────────
function MapTab() {
  const { orders, loading } = useOrders();
  const [selected,  setSelected]  = useState(null);
  const [isMobile,  setIsMobile]  = useState(window.innerWidth < 768);

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  const active = orders.filter(o => ["assigned","picked_up","in_transit"].includes(o.status));

  // Auto-select first active order
  useEffect(() => {
    if (active.length > 0 && !selected) {
      setSelected(active[0]);
    }
  }, [orders]);

  return (
    <>
      <PageHeader
        title="Carte des livraisons"
        subtitle="Vos commandes actives sur la carte"
      />

      {loading ? (
        <div style={{ textAlign:"center", padding:48, color:"#6B7280" }}>Chargement…</div>
      ) : active.length === 0 ? (
        <div style={{
          background:"#21253A", border:"1px solid #2E3347",
          borderRadius:14, padding:"56px 20px", textAlign:"center",
        }}>
          <div style={{ fontSize:48, marginBottom:14 }}>🗺</div>
          <div style={{ color:"#9CA3AF", fontSize:15, fontWeight:600 }}>Aucune livraison active</div>
          <div style={{ color:"#6B7280", fontSize:13, marginTop:6 }}>
            La carte s'affichera dès qu'une commande vous sera assignée.
          </div>
        </div>
      ) : (
        <div style={{
          display:"flex",
          flexDirection:"column",
          gap:16,
        }}>

          {/* ── Map ── */}
          <div style={{
            background:"#21253A", border:"1px solid #2E3347",
            borderRadius:14, overflow:"hidden", position:"relative",
            height: isMobile ? 260 : "calc(100vh - 320px)",
            minHeight: 220,
          }}>
            <DeliveryMap
              orders={orders}
              selectedOrder={selected}
              onSelectOrder={setSelected}
            />

            {/* Legend overlay */}
            <div style={{
              position:"absolute", bottom:12, left:12, zIndex:999,
              background:"rgba(15,17,23,0.85)", borderRadius:10,
              padding:"8px 12px", backdropFilter:"blur(4px)",
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                <span style={{ fontSize:14 }}>📦</span>
                <span style={{ fontSize:11, color:"#9CA3AF" }}>Expéditeur</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                <span style={{ fontSize:14 }}>🏠</span>
                <span style={{ fontSize:11, color:"#9CA3AF" }}>Destinataire</span>
              </div>
              <div style={{ borderTop:"1px solid #2E3347", paddingTop:5, marginTop:2 }}>
                <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:3 }}>
                  <span style={{ width:8, height:8, borderRadius:"50%", background:"#2DD4A0", display:"inline-block" }}/>
                  <span style={{ fontSize:10, color:"#6B7280" }}>Position exacte</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ width:8, height:8, borderRadius:"50%", background:"#F5A623", display:"inline-block" }}/>
                  <span style={{ fontSize:10, color:"#6B7280" }}>Ville approximative</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Order list — horizontal scroll on mobile, vertical on desktop ── */}
          <div style={{
            display:"flex",
            flexDirection: isMobile ? "row" : "column",
            gap:10,
            overflowX: isMobile ? "auto" : "visible",
            overflowY: isMobile ? "visible" : "auto",
            paddingBottom: isMobile ? 8 : 0,
          }}>

            <div style={{ fontSize:11, fontWeight:600, color:"#6B7280", textTransform:"uppercase", letterSpacing:"0.08em" }}>
              {active.length} commande{active.length > 1 ? "s" : ""} active{active.length > 1 ? "s" : ""}
            </div>

            {active.map(o => (
              <div
                key={o.id}
                onClick={() => setSelected(o)}
                style={{
                  background: selected?.id===o.id ? "rgba(245,166,35,0.08)" : "#21253A",
                  border: `1px solid ${selected?.id===o.id ? STATUS_COLORS[o.status] || "#F5A623" : "#2E3347"}`,
                  borderRadius:12, padding:"13px 14px", cursor:"pointer",
                  transition:"all 0.15s",
                  minWidth: isMobile ? 220 : "auto",
                  flexShrink: 0,
                }}
              >
                {/* Order ID + status */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <span style={{ color:"#F5A623", fontWeight:700, fontSize:13 }}>#{o.id}</span>
                  <span style={{
                    background:`${STATUS_COLORS[o.status]}18`,
                    color: STATUS_COLORS[o.status],
                    padding:"2px 8px", borderRadius:99,
                    fontSize:10, fontWeight:600,
                  }}>
                    {STATUS_LABELS[o.status]}
                  </span>
                </div>

                {/* Sender */}
                <div style={{ display:"flex", alignItems:"flex-start", gap:8, marginBottom:6 }}>
                  <span style={{ fontSize:14, flexShrink:0 }}>📦</span>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:"#E8EAF0" }}>{o.sender_name}</div>
                    <div style={{ fontSize:11, color:"#6B7280" }}>{o.origin_city}</div>
                    {/* Exact location indicator */}
                    {o.sender_location && (
                      <span style={{ fontSize:10, color:"#2DD4A0" }}>✓ Position exacte</span>
                    )}
                  </div>
                </div>

                <div style={{ textAlign:"center", color:"#4F8EF7", fontSize:11, marginBottom:6 }}>↓</div>

                {/* Receiver */}
                <div style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
                  <span style={{ fontSize:14, flexShrink:0 }}>🏠</span>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, color:"#E8EAF0" }}>{o.receiver_name}</div>
                    <div style={{ fontSize:11, color:"#6B7280" }}>{o.destination_city}</div>
                    {/* Exact location indicator */}
                    {o.receiver_location && (
                      <span style={{ fontSize:10, color:"#2DD4A0" }}>✓ Position exacte</span>
                    )}
                  </div>
                </div>

                {/* Price */}
                {o.total_price!=null && (
                  <div style={{ marginTop:8, textAlign:"right", fontSize:12, fontWeight:700, color:"#2DD4A0" }}>
                    {o.total_price.toFixed(2)} MAD
                  </div>
                )}

                {/* Google Maps quick links */}
                {(o.sender_location || o.receiver_location) && (
                  <div style={{ display:"flex", gap:6, marginTop:8, flexWrap:"wrap" }}>
                    {o.sender_location && (
                      <a href={o.sender_location} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{ fontSize:10, color:"#4F8EF7", background:"rgba(79,142,247,0.1)", padding:"3px 8px", borderRadius:6, textDecoration:"none" }}>
                        📦 Maps ↗
                      </a>
                    )}
                    {o.receiver_location && (
                      <a href={o.receiver_location} target="_blank" rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{ fontSize:10, color:"#2DD4A0", background:"rgba(45,212,160,0.1)", padding:"3px 8px", borderRadius:6, textDecoration:"none" }}>
                        🏠 Maps ↗
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ── Main export ────────────────────────────────────────────────
export default function LivreurDashboard() {
  const navItems = [
    { id:"deliveries", icon:"◎", label:"Mes livraisons", content:<MyDeliveries /> },
    { id:"map",        icon:"🗺", label:"Carte",          content:<MapTab /> },
  ];
  return <DashboardLayout role="livreur" navItems={navItems} />;
}