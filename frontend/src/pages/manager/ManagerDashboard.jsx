import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { ActionButton, Card, PageHeader, StatCard, Table } from "../../components/ui/DashboardUI";
import { OrderParties, OrderStepper, StatusBadge } from "../../components/ui/OrderUI";
import { managerOrderService } from "../../services/orderService";
import { invoiceService } from "../../services/invoiceService";
import api from "../../services/api";

function AllOrders() {
  const [orders,setOrders]=useState([]);
  const [livreurs,setLivreurs]=useState([]);
  const [selected,setSelected]=useState(null);
  const [filter,setFilter]=useState("all");
  const [loading,setLoading]=useState(true);
  const [assigning,setAssigning]=useState(false);
  const [assignLivreur,setAssignLivreur]=useState("");
  const [basePrice,setBasePrice]=useState("");
  const [adjustment,setAdjustment]=useState("0");
  const [priceSuggestion,setPriceSuggestion]=useState(null);

  const statusList=["all","pending","assigned","picked_up","in_transit","delivered","cancelled"];
  const statusLabels={"all":"Tous","pending":"En attente","assigned":"Assignée","picked_up":"Récupérée","in_transit":"En transit","delivered":"Livrée","cancelled":"Annulée"};

  useEffect(()=>{
    managerOrderService.list(filter!=="all"?{status:filter}:{}).then(setOrders).finally(()=>setLoading(false));
    api.get("/auth/users",{params:{role:"livreur"}}).then(r=>setLivreurs(r.data)).catch(()=>{});
  },[filter]);

  useEffect(()=>{
    if(selected?.status==="pending"&&selected.origin_city&&selected.destination_city){
      invoiceService.getPriceSuggestion(selected.origin_city,selected.destination_city)
        .then(s=>{ setPriceSuggestion(s); setBasePrice(s.base_price.toString()); })
        .catch(()=>{});
    }
  },[selected]);

  const total=(parseFloat(basePrice)||0)+(parseFloat(adjustment)||0);

  const handleAssign=async()=>{
    if(!assignLivreur||!selected||!basePrice)return;
    setAssigning(true);
    try{
      const u=await managerOrderService.assign(selected.id,parseInt(assignLivreur),parseFloat(basePrice),parseFloat(adjustment)||0);
      setOrders(p=>p.map(o=>o.id===u.id?u:o));
      setSelected(u);
      setAssignLivreur(""); setBasePrice(""); setAdjustment("0");
    }catch(err){
      const msg = err.response?.data?.detail;
      alert(Array.isArray(msg) ? msg.map(e=>e.msg||e).join(", ") : msg || err.message || "Erreur");
    }
    finally{setAssigning(false);}
  };

  const handleCancel=async id=>{
    try{const u=await managerOrderService.cancel(id);setOrders(p=>p.map(o=>o.id===u.id?u:o));if(selected?.id===id)setSelected(u);}
    catch(err){
      const msg = err.response?.data?.detail;
      alert(Array.isArray(msg) ? msg.map(e=>e.msg||e).join(", ") : msg || err.message || "Erreur");
    }
  };

  const counts=orders.reduce((a,o)=>{a[o.status]=(a[o.status]||0)+1;return a;},{});

  return(
    <>
      <PageHeader title="Toutes les commandes" subtitle="Gérez, assignez et tarifiez les livraisons"/>
      <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:24}}>
        <StatCard label="Total" value={orders.length+""}/>
        <StatCard label="En attente" value={(counts.pending||0)+""} color="#F5A623" icon="⏳"/>
        <StatCard label="En cours" value={((counts.assigned||0)+(counts.picked_up||0)+(counts.in_transit||0))+""} color="#4F8EF7" icon="🛵"/>
        <StatCard label="Livrées" value={(counts.delivered||0)+""} color="#2DD4A0" icon="✓"/>
      </div>

      <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
        {statusList.map(s=>(
          <button key={s} onClick={()=>{setFilter(s);setSelected(null);}} style={{padding:"6px 14px",borderRadius:8,border:`1px solid ${filter===s?"#4F8EF7":"#2E3347"}`,background:filter===s?"rgba(79,142,247,0.12)":"transparent",color:filter===s?"#4F8EF7":"#9CA3AF",fontSize:12,fontWeight:filter===s?600:400,cursor:"pointer",fontFamily:"inherit"}}>
            {statusLabels[s]}
          </button>
        ))}
      </div>

      {loading?<div style={{color:"#6B7280",textAlign:"center",padding:40}}>Chargement…</div>:(
        <div style={{display:"grid",gridTemplateColumns:selected?"1fr 1fr":"1fr",gap:16}}>
          <Card>
            <Table
              headers={["#","Expéditeur","Destinataire","Trajet","Statut","Prix",""]}
              rows={orders.map(o=>[
                <span style={{color:"#4F8EF7",fontWeight:700,cursor:"pointer"}} onClick={()=>setSelected(o)}>#{o.id}</span>,
                o.sender_name, o.receiver_name,
                <span style={{fontSize:12}}>{o.origin_city} → {o.destination_city}</span>,
                <StatusBadge status={o.status}/>,
                o.total_price!=null?<span style={{color:"#2DD4A0",fontWeight:600}}>{o.total_price.toFixed(2)} MAD</span>:<span style={{color:"#6B7280",fontSize:12}}>—</span>,
                <ActionButton variant="secondary" onClick={()=>setSelected(o)}>Détails</ActionButton>,
              ])}
            />
          </Card>

          {selected&&(
            <Card title={`Commande #${selected.id}`} action={
              !["delivered","cancelled"].includes(selected.status)&&
              <ActionButton variant="danger" onClick={()=>handleCancel(selected.id)}>Annuler</ActionButton>
            }>
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <OrderStepper status={selected.status}/>
                <OrderParties order={selected}/>

                <div style={{background:"#1A1D27",borderRadius:10,padding:"12px 14px"}}>
                  <div style={{fontSize:11,color:"#6B7280",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.05em"}}>Colis</div>
                  <div style={{color:"#E8EAF0",fontSize:13}}>{selected.package_description}</div>
                </div>

                {/* Pricing display (assigned+) */}
                {selected.total_price!=null&&(
                  <div style={{background:"#1A1D27",borderRadius:10,padding:"12px 14px"}}>
                    <div style={{fontSize:11,color:"#6B7280",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>Tarification</div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"#9CA3AF",marginBottom:4}}>
                      <span>Prix de base</span><span>{selected.base_price?.toFixed(2)} MAD</span>
                    </div>
                    {selected.price_adjustment!==0&&<div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"#9CA3AF",marginBottom:4}}>
                      <span>Ajustement</span><span>{selected.price_adjustment>0?"+":""}{selected.price_adjustment?.toFixed(2)} MAD</span>
                    </div>}
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:15,fontWeight:700,color:"#2DD4A0",borderTop:"1px solid #2E3347",paddingTop:8,marginTop:4}}>
                      <span>Total</span><span>{selected.total_price?.toFixed(2)} MAD</span>
                    </div>
                  </div>
                )}

                {/* Assign + price form (pending only) */}
                {selected.status==="pending"&&(
                  <div style={{background:"#1A1D27",borderRadius:10,padding:"14px 16px"}}>
                    <div style={{fontSize:11,color:"#6B7280",marginBottom:12,textTransform:"uppercase",letterSpacing:"0.05em"}}>Assigner & tarifier</div>

                    <div style={{marginBottom:10}}>
                      <label style={{fontSize:12,color:"#9CA3AF",display:"block",marginBottom:4}}>Livreur</label>
                      <select value={assignLivreur} onChange={e=>setAssignLivreur(e.target.value)} style={{width:"100%",background:"#21253A",border:"1px solid #2E3347",borderRadius:8,padding:"9px 12px",color:"#E8EAF0",fontSize:13,fontFamily:"inherit"}}>
                        <option value="">Choisir un livreur…</option>
                        {livreurs.map(l=><option key={l.id} value={l.id}>{l.full_name}</option>)}
                      </select>
                    </div>

                    {priceSuggestion&&(
                      <div style={{background:"rgba(79,142,247,0.08)",border:"1px solid rgba(79,142,247,0.2)",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#4F8EF7",marginBottom:10}}>
                        Prix suggéré : <strong>{priceSuggestion.base_price} MAD</strong> ({priceSuggestion.origin} → {priceSuggestion.destination})
                      </div>
                    )}

                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
                      <div>
                        <label style={{fontSize:12,color:"#9CA3AF",display:"block",marginBottom:4}}>Prix de base (MAD)</label>
                        <input type="number" min="0" step="0.5" value={basePrice} onChange={e=>setBasePrice(e.target.value)}
                          style={{width:"100%",background:"#21253A",border:"1px solid #2E3347",borderRadius:8,padding:"9px 12px",color:"#E8EAF0",fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}/>
                      </div>
                      <div>
                        <label style={{fontSize:12,color:"#9CA3AF",display:"block",marginBottom:4}}>Ajustement (MAD)</label>
                        <input type="number" step="0.5" value={adjustment} onChange={e=>setAdjustment(e.target.value)}
                          style={{width:"100%",background:"#21253A",border:"1px solid #2E3347",borderRadius:8,padding:"9px 12px",color:"#E8EAF0",fontSize:13,fontFamily:"inherit",boxSizing:"border-box"}}/>
                      </div>
                    </div>

                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
                      <span style={{fontSize:13,color:"#9CA3AF"}}>Total estimé</span>
                      <span style={{fontSize:16,fontWeight:700,color:"#2DD4A0"}}>{total.toFixed(2)} MAD</span>
                    </div>

                    <ActionButton onClick={handleAssign} color="#4F8EF7">
                      {assigning?"En cours…":"✓ Confirmer l'assignation"}
                    </ActionButton>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}
    </>
  );
}

export default function ManagerDashboard(){
  const navItems=[{id:"orders",icon:"▣",label:"Commandes",content:<AllOrders/>}];
  return <DashboardLayout role="manager" navItems={navItems}/>;
}
