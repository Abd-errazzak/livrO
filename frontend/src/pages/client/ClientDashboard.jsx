import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { Card, PageHeader, StatCard } from "../../components/ui/DashboardUI";
import { OrderParties, OrderStepper, StatusBadge } from "../../components/ui/OrderUI";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Alert from "../../components/ui/Alert";
import FacturePage from "../shared/FacturePage";
import ProfilePage from "../../components/ui/ProfilePage";
import NotificationsPage from "../../components/ui/NotificationsPage";
import { clientOrderService } from "../../services/orderService";

const STATUS_LABELS = {
  pending:"En attente", assigned:"Assignée", picked_up:"Récupérée",
  in_transit:"En transit", delivered:"Livrée", cancelled:"Annulée",
};
const STATUS_COLORS = {
  pending:"#F5A623", assigned:"#4F8EF7", picked_up:"#8B5CF6",
  in_transit:"#06B6D4", delivered:"#2DD4A0", cancelled:"#F75050",
};
const STATUS_BG = {
  pending:"rgba(245,166,35,0.12)", assigned:"rgba(79,142,247,0.12)",
  picked_up:"rgba(139,92,246,0.12)", in_transit:"rgba(6,182,212,0.12)",
  delivered:"rgba(45,212,160,0.12)", cancelled:"rgba(247,80,80,0.12)",
};

// ── New Order Form ─────────────────────────────────────────────
function NewOrder({ onCreated }) {
  const empty = {
    sender_name:"", sender_phone:"", sender_address:"", origin_city:"",
    receiver_name:"", receiver_phone:"", receiver_address:"", destination_city:"",
    package_description:"", payment_type:"sender",
  };
  const [form,setForm]     = useState(empty);
  const [error,setError]   = useState("");
  const [success,setSuccess] = useState("");
  const [loading,setLoading] = useState(false);

  const set = k => e => { setForm(f=>({...f,[k]:e.target.value})); setError(""); setSuccess(""); };

  const handleSubmit = async e => {
    e.preventDefault(); setLoading(true);
    try {
      await clientOrderService.create(form);
      setSuccess("Commande créée avec succès ! Vous pouvez la suivre dans «Mes commandes».");
      setForm(empty);
      onCreated?.();
    } catch(err) {
      console.error("Order creation error:", err);
      console.error("Response data:", err.response?.data);
      console.error("Response status:", err.response?.status);
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map(d => d.msg || d).join(" · "));
      } else {
        setError(detail || err.message || "Erreur lors de la création.");
      }
    } finally { setLoading(false); }
  };

  return (
    <>
      <PageHeader title="Nouvelle commande" subtitle="Remplissez les informations d'expédition" />
      <form onSubmit={handleSubmit}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
          <Card title="Expéditeur">
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <Alert message={error}   type="error" />
              <Alert message={success} type="success" />
              <Input label="Nom complet"     placeholder="Karim Alaoui"       value={form.sender_name}    onChange={set("sender_name")} />
              <Input label="Téléphone"       placeholder="+212 6XX XXX XXX"   value={form.sender_phone}   onChange={set("sender_phone")} />
              <Input label="Adresse"         placeholder="12 Rue Atlas"        value={form.sender_address} onChange={set("sender_address")} />
              <Input label="Ville d'origine" placeholder="Fès"                value={form.origin_city}    onChange={set("origin_city")} />
            </div>
          </Card>

          <Card title="Destinataire">
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <Input label="Nom complet"          placeholder="Sara Benali"      value={form.receiver_name}    onChange={set("receiver_name")} />
              <Input label="Téléphone"            placeholder="+212 6XX XXX XXX" value={form.receiver_phone}   onChange={set("receiver_phone")} />
              <Input label="Adresse"              placeholder="7 Bd Hassan II"   value={form.receiver_address} onChange={set("receiver_address")} />
              <Input label="Ville de destination" placeholder="Casablanca"       value={form.destination_city} onChange={set("destination_city")} />
            </div>
          </Card>
        </div>

        <Card style={{ marginTop:16 }} title="Colis & paiement">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <label style={{ fontSize:12, fontWeight:500, color:"#9CA3AF" }}>Description du colis</label>
              <textarea
                value={form.package_description}
                onChange={set("package_description")}
                placeholder="Vêtements, documents, appareils…"
                rows={4}
                style={{ background:"#1A1D27", border:"1px solid #2E3347", borderRadius:10, padding:"11px 14px", color:"#E8EAF0", fontSize:13, fontFamily:"inherit", resize:"vertical" }}
              />
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              <label style={{ fontSize:12, fontWeight:500, color:"#9CA3AF" }}>Qui paie la livraison ?</label>
              {["sender","receiver"].map(v => (
                <button key={v} type="button" onClick={() => setForm(f=>({...f,payment_type:v}))} style={{
                  padding:"10px 14px", borderRadius:10, cursor:"pointer", textAlign:"left",
                  fontFamily:"inherit", fontSize:13,
                  border:`1px solid ${form.payment_type===v?"#2DD4A0":"#2E3347"}`,
                  background:form.payment_type===v?"rgba(45,212,160,0.1)":"#1A1D27",
                  color:form.payment_type===v?"#2DD4A0":"#9CA3AF",
                  fontWeight:form.payment_type===v?600:400,
                }}>
                  {v==="sender" ? "💳 Expéditeur paie" : "💳 Destinataire paie"}
                </button>
              ))}
              <div style={{ marginTop:8, padding:"10px 14px", background:"rgba(79,142,247,0.08)", border:"1px solid rgba(79,142,247,0.2)", borderRadius:10, fontSize:12, color:"#4F8EF7" }}>
                ℹ Le prix sera calculé et communiqué par notre équipe après validation.
              </div>
            </div>
          </div>
        </Card>

        <div style={{ marginTop:16 }}>
          <Button type="submit" fullWidth loading={loading}>Soumettre la commande</Button>
        </div>
      </form>
    </>
  );
}

// ── My Orders ──────────────────────────────────────────────────
function MyOrders({ refresh }) {
  const [orders,setOrders]     = useState([]);
  const [selected,setSelected] = useState(null);
  const [loading,setLoading]   = useState(true);
  const [cancelling,setCancelling] = useState(false);
  const [factureId,setFactureId]   = useState(null);

  useEffect(() => {
    clientOrderService.list()
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [refresh]);

  const handleCancel = async id => {
    setCancelling(true);
    try {
      const u = await clientOrderService.cancel(id);
      setOrders(p => p.map(o => o.id===u.id ? u : o));
      if (selected?.id===id) setSelected(u);
    } catch(err) {
      alert(err.response?.data?.detail || "Erreur");
    } finally { setCancelling(false); }
  };

  const counts = orders.reduce((a,o) => { a[o.status]=(a[o.status]||0)+1; return a; }, {});

  return (
    <>
      <PageHeader title="Mes commandes" subtitle="Historique et suivi de vos expéditions" />

      <div style={{ display:"flex", gap:14, flexWrap:"wrap", marginBottom:24 }}>
        <StatCard label="Total"    value={orders.length+""}                                                                         icon="📦" />
        <StatCard label="En cours" value={((counts.assigned||0)+(counts.picked_up||0)+(counts.in_transit||0))+""}  color="#4F8EF7" icon="🛵" />
        <StatCard label="Livrées"  value={(counts.delivered||0)+""}                                                 color="#2DD4A0" icon="✓" />
        <StatCard label="Annulées" value={(counts.cancelled||0)+""}                                                 color="#F75050" icon="✕" />
      </div>

      {loading ? (
        <div style={{ color:"#6B7280", textAlign:"center", padding:40 }}>Chargement…</div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:selected?"1fr 1fr":"1fr", gap:16 }}>

          {/* Order list */}
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {orders.length===0 && (
              <div style={{ color:"#6B7280", textAlign:"center", padding:40 }}>Aucune commande</div>
            )}
            {orders.map(o => (
              <div
                key={o.id}
                onClick={() => setSelected(o)}
                style={{
                  background: selected?.id===o.id ? "rgba(79,142,247,0.08)" : "#21253A",
                  border:`1px solid ${selected?.id===o.id ? "#4F8EF7" : "#2E3347"}`,
                  borderRadius:12, padding:"14px 16px", cursor:"pointer", transition:"all 0.15s",
                }}
              >
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <span style={{ color:"#4F8EF7", fontWeight:700 }}>#{o.id}</span>
                  <span style={{ background:STATUS_BG[o.status], color:STATUS_COLORS[o.status], padding:"3px 10px", borderRadius:99, fontSize:11, fontWeight:600 }}>
                    {STATUS_LABELS[o.status]}
                  </span>
                </div>
                <div style={{ fontSize:13, color:"#E8EAF0", marginBottom:2 }}>
                  {o.origin_city} → {o.destination_city}
                </div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <span style={{ fontSize:12, color:"#6B7280" }}>{o.sender_name} → {o.receiver_name}</span>
                  {o.total_price!=null && (
                    <span style={{ fontSize:13, color:"#2DD4A0", fontWeight:700 }}>{o.total_price.toFixed(2)} MAD</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Detail panel */}
          {selected && (
            <Card
              title={`Commande #${selected.id}`}
              action={
                <div style={{ display:"flex", gap:8 }}>
                  {/* Download facture — only if price is set */}
                  {selected.total_price!=null && (
                    <button
                      onClick={() => setFactureId(selected.id)}
                      style={{
                        background:"rgba(79,142,247,0.12)", border:"1px solid rgba(79,142,247,0.3)",
                        color:"#4F8EF7", borderRadius:8, padding:"5px 12px",
                        fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
                      }}
                    >
                      Facture PDF
                    </button>
                  )}
                  {selected.status==="pending" && (
                    <button
                      onClick={() => handleCancel(selected.id)}
                      disabled={cancelling}
                      style={{
                        background:"transparent", border:"1px solid #F75050",
                        color:"#F75050", borderRadius:8, padding:"5px 12px",
                        fontSize:12, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
                        opacity:cancelling?0.5:1,
                      }}
                    >
                      Annuler
                    </button>
                  )}
                </div>
              }
            >
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <OrderStepper status={selected.status} />
                <OrderParties order={selected} />

                {/* Package */}
                <div style={{ background:"#1A1D27", borderRadius:10, padding:"12px 14px" }}>
                  <div style={{ fontSize:11, color:"#6B7280", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.05em" }}>Colis</div>
                  <div style={{ color:"#E8EAF0", fontSize:13 }}>{selected.package_description}</div>
                </div>

                {/* Pricing */}
                {selected.total_price!=null ? (
                  <div style={{ background:"#1A1D27", borderRadius:10, padding:"12px 14px" }}>
                    <div style={{ fontSize:11, color:"#6B7280", marginBottom:8, textTransform:"uppercase", letterSpacing:"0.05em" }}>Tarif</div>
                    {selected.base_price!=null && (
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"#9CA3AF", marginBottom:4 }}>
                        <span>Prix de base</span><span>{selected.base_price.toFixed(2)} MAD</span>
                      </div>
                    )}
                    {selected.price_adjustment!=null && selected.price_adjustment!==0 && (
                      <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"#9CA3AF", marginBottom:4 }}>
                        <span>Ajustement</span>
                        <span>{selected.price_adjustment>0?"+":""}{selected.price_adjustment.toFixed(2)} MAD</span>
                      </div>
                    )}
                    <div style={{ display:"flex", justifyContent:"space-between", fontSize:16, fontWeight:700, color:"#2DD4A0", borderTop:"1px solid #2E3347", paddingTop:8, marginTop:4 }}>
                      <span>Total</span>
                      <span>{selected.total_price.toFixed(2)} MAD</span>
                    </div>
                    <div style={{ fontSize:12, color:"#6B7280", marginTop:6 }}>
                      {selected.payment_type==="sender" ? "💳 Payé par l'expéditeur" : "💳 Payé par le destinataire"}
                    </div>
                  </div>
                ) : (
                  <div style={{ background:"rgba(245,166,35,0.08)", border:"1px solid rgba(245,166,35,0.2)", borderRadius:10, padding:"12px 14px", fontSize:13, color:"#F5A623" }}>
                    ⏳ Le tarif sera communiqué après assignation du livreur.
                  </div>
                )}

                {/* Livreur info */}
                {selected.livreur && (
                  <div style={{ background:"#1A1D27", borderRadius:10, padding:"12px 14px" }}>
                    <div style={{ fontSize:11, color:"#6B7280", marginBottom:4, textTransform:"uppercase", letterSpacing:"0.05em" }}>Livreur</div>
                    <div style={{ color:"#E8EAF0", fontWeight:500 }}>{selected.livreur.full_name}</div>
                    {selected.livreur.phone && (
                      <div style={{ color:"#9CA3AF", fontSize:12 }}>📞 {selected.livreur.phone}</div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Facture modal */}
      {factureId && (
        <FacturePage orderId={factureId} onClose={() => setFactureId(null)} />
      )}
    </>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function ClientDashboard() {
  const [refreshKey,setRefreshKey] = useState(0);
  const navItems = [
    { id:"orders",        icon:"▣", label:"Mes commandes",     content:<MyOrders refresh={refreshKey} /> },
    { id:"new",           icon:"⊕", label:"Nouvelle commande", content:<NewOrder onCreated={() => setRefreshKey(k=>k+1)} /> },
    { id:"notifications", icon:"🔔", label:"Notifications",     content:<NotificationsPage /> },
    { id:"profile",       icon:"👤", label:"Mon profil",        content:<ProfilePage /> },
  ];
  return <DashboardLayout role="client" navItems={navItems} />;
}
