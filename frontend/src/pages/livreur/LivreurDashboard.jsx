import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { Card, PageHeader, StatCard } from "../../components/ui/DashboardUI";
import { OrderParties, OrderStepper, StatusBadge } from "../../components/ui/OrderUI";
import QRScanner from "../../components/ui/QRScanner";
import { livreurOrderService } from "../../services/orderService";

const STATUS_ACTIONS = {
  assigned:   [
    { label:"Récupéré",   next:"picked_up",  color:"#4F8EF7" },
    { label:"Annuler",    next:"cancelled",  color:"#F75050", outline:true },
  ],
  picked_up:  [
    { label:"En transit", next:"in_transit", color:"#8B5CF6" },
    { label:"Annuler",    next:"cancelled",  color:"#F75050", outline:true },
  ],
  in_transit: [
    { label:"Livré",      next:"delivered",  color:"#2DD4A0" },
    { label:"Annuler",    next:"cancelled",  color:"#F75050", outline:true },
  ],
};

function MyDeliveries(){
  const [orders,setOrders]=useState([]);
  const [selected,setSelected]=useState(null);
  const [loading,setLoading]=useState(true);
  const [updating,setUpdating]=useState(false);
  const [showQR,setShowQR]=useState(false);

  const load=()=>{
    setLoading(true);
    livreurOrderService.list().then(setOrders).finally(()=>setLoading(false));
  };

  useEffect(()=>{load();},[]);

  const updateStatus=async(id,status)=>{
    setUpdating(true);
    try{
      const u=await livreurOrderService.updateStatus(id,status);
      setOrders(p=>p.map(o=>o.id===u.id?u:o));
      setSelected(u);
    }catch(err){alert(err.response?.data?.detail||"Erreur");}
    finally{setUpdating(false);}
  };

  const handleQRScan=async(orderId)=>{
    setShowQR(false);
    try{
      const order=await livreurOrderService.detail(orderId);
      setSelected(order);
      if(!orders.find(o=>o.id===orderId)){
        setOrders(p=>[order,...p]);
      }
    }catch{alert("Commande introuvable ou non assignée.");}
  };

  const active=orders.filter(o=>["assigned","picked_up","in_transit"].includes(o.status));
  const done=orders.filter(o=>["delivered","cancelled"].includes(o.status));
  const counts=orders.reduce((a,o)=>{a[o.status]=(a[o.status]||0)+1;return a;},{});

  const OrderCard=({o})=>(
    <div onClick={()=>setSelected(o)} style={{background:selected?.id===o.id?"rgba(245,166,35,0.08)":"#21253A",border:`1px solid ${selected?.id===o.id?"#F5A623":"#2E3347"}`,borderRadius:12,padding:"14px 16px",cursor:"pointer",transition:"all 0.15s"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <span style={{color:"#F5A623",fontWeight:700}}>#{o.id}</span>
        <StatusBadge status={o.status}/>
      </div>
      <div style={{fontSize:13,color:"#E8EAF0",marginBottom:2}}>{o.receiver_name}</div>
      <div style={{fontSize:12,color:"#9CA3AF",marginBottom:2}}>📍 {o.receiver_address}</div>
      <div style={{fontSize:12,color:"#6B7280"}}>{o.origin_city} → {o.destination_city}</div>
      {o.total_price!=null&&<div style={{fontSize:12,color:"#2DD4A0",marginTop:4,fontWeight:600}}>{o.total_price.toFixed(2)} MAD · {o.payment_type==="sender"?"Expéditeur paie":"Destinataire paie"}</div>}
    </div>
  );

  return(
    <>
      <PageHeader
        title="Mes livraisons"
        subtitle="Commandes assignées et contrôle des statuts"
        action={
          <button onClick={()=>setShowQR(true)} style={{background:"#F5A623",color:"#0F1117",border:"none",borderRadius:9,padding:"8px 16px",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}>
            Scanner QR
          </button>
        }
      />

      <div style={{display:"flex",gap:14,flexWrap:"wrap",marginBottom:24}}>
        <StatCard label="Assignées" value={active.length+""} icon="📦"/>
        <StatCard label="En transit" value={(counts.in_transit||0)+""} color="#4F8EF7" icon="🚚"/>
        <StatCard label="Livrées" value={(counts.delivered||0)+""} color="#2DD4A0" icon="✓"/>
        <StatCard label="Annulées" value={(counts.cancelled||0)+""} color="#F75050" icon="✕"/>
      </div>

      {loading?<div style={{color:"#6B7280",textAlign:"center",padding:40}}>Chargement…</div>:(
        <div style={{display:"grid",gridTemplateColumns:selected?"1fr 1fr":"1fr",gap:16,alignItems:"start"}}>
          <div>
            {active.length>0&&(
              <>
                <div style={{fontSize:11,fontWeight:600,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>En cours</div>
                <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
                  {active.map(o=><OrderCard key={o.id} o={o}/>)}
                </div>
              </>
            )}
            {done.length>0&&(
              <>
                <div style={{fontSize:11,fontWeight:600,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:10}}>Terminées</div>
                <div style={{display:"flex",flexDirection:"column",gap:10}}>
                  {done.map(o=><OrderCard key={o.id} o={o}/>)}
                </div>
              </>
            )}
            {orders.length===0&&<div style={{color:"#6B7280",textAlign:"center",padding:40}}>Aucune livraison assignée</div>}
          </div>

          {selected&&(
            <Card title={`Commande #${selected.id}`}>
              <div style={{display:"flex",flexDirection:"column",gap:16}}>
                <OrderStepper status={selected.status}/>
                <OrderParties order={selected}/>

                <div style={{background:"#1A1D27",borderRadius:10,padding:"12px 14px"}}>
                  <div style={{fontSize:11,color:"#6B7280",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.05em"}}>Colis</div>
                  <div style={{color:"#E8EAF0",fontSize:13}}>{selected.package_description}</div>
                </div>

                {selected.total_price!=null&&(
                  <div style={{background:"#1A1D27",borderRadius:10,padding:"12px 14px"}}>
                    <div style={{fontSize:11,color:"#6B7280",marginBottom:4,textTransform:"uppercase",letterSpacing:"0.05em"}}>Paiement</div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{color:"#9CA3AF",fontSize:13}}>{selected.payment_type==="sender"?"Expéditeur paie":"Destinataire paie"}</span>
                      <span style={{color:"#2DD4A0",fontWeight:700,fontSize:16}}>{selected.total_price.toFixed(2)} MAD</span>
                    </div>
                  </div>
                )}

                {/* Status action buttons */}
                {STATUS_ACTIONS[selected.status]&&(
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    <div style={{fontSize:11,color:"#6B7280",textTransform:"uppercase",letterSpacing:"0.05em"}}>Mettre à jour le statut</div>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {STATUS_ACTIONS[selected.status].map(({label,next,color,outline})=>(
                        <button key={next}
                          onClick={()=>updateStatus(selected.id,next)}
                          disabled={updating}
                          style={{
                            flex:1,padding:"10px 14px",borderRadius:9,fontFamily:"inherit",fontSize:13,fontWeight:700,cursor:"pointer",
                            background:outline?"transparent":color,
                            color:outline?color:"#0F1117",
                            border:`1px solid ${color}`,
                            opacity:updating?0.5:1,transition:"opacity 0.15s",
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {["delivered","cancelled"].includes(selected.status)&&(
                  <div style={{background:selected.status==="delivered"?"rgba(45,212,160,0.1)":"rgba(247,80,80,0.1)",border:`1px solid ${selected.status==="delivered"?"rgba(45,212,160,0.3)":"rgba(247,80,80,0.3)"}`,borderRadius:10,padding:"12px 14px",textAlign:"center",color:selected.status==="delivered"?"#2DD4A0":"#F75050",fontWeight:600,fontSize:13}}>
                    {selected.status==="delivered"?"✓ Livraison confirmée":"✕ Livraison annulée"}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {showQR&&<QRScanner onScan={handleQRScan} onClose={()=>setShowQR(false)}/>}
    </>
  );
}

export default function LivreurDashboard(){
  const navItems=[{id:"deliveries",icon:"◎",label:"Mes livraisons",content:<MyDeliveries/>}];
  return <DashboardLayout role="livreur" navItems={navItems}/>;
}
