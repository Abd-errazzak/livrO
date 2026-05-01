import { useEffect, useRef, useState } from "react";
import { invoiceService } from "../../services/invoiceService";

const STATUS_FR = {
  pending:"En attente", assigned:"Assignée", picked_up:"Récupérée",
  in_transit:"En transit", delivered:"Livrée", cancelled:"Annulée",
};
const PAYMENT_FR = { sender:"Expéditeur", receiver:"Destinataire" };

const fmt = iso => iso
  ? new Date(iso).toLocaleDateString("fr-FR", { day:"2-digit", month:"long", year:"numeric" })
  : "—";

const fmtTime = iso => iso
  ? new Date(iso).toLocaleString("fr-FR", { day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit" })
  : "—";

// Build the full invoice HTML as a string (self-contained, no external deps except qrcode cdn)
function buildInvoiceHTML(order) {
  const qrValue = `DELIVEROS:ORDER:${order.id}`;
  const orderNum = String(order.id).padStart(6, "0");
  const now = fmtTime(new Date().toISOString());

  const priceLine = (label, value, color = "#374151") =>
    value != null && value !== 0
      ? `<tr>
           <td style="padding:6px 0;color:#6B7280;font-size:13px;">${label}</td>
           <td style="padding:6px 0;color:${color};font-size:13px;text-align:right;font-weight:500;">${typeof value === "number" ? value.toFixed(2) + " MAD" : value}</td>
         </tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Facture DeliverOS N° ${orderNum}</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      background: #fff;
      color: #111827;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #111827; }
    .logo-name { font-size: 26px; font-weight: 700; color: #111827; letter-spacing: -0.5px; }
    .logo-sub { font-size: 12px; color: #6B7280; margin-top: 4px; }
    .invoice-label { font-size: 22px; font-weight: 700; color: #4F8EF7; }
    .invoice-num { font-size: 14px; font-weight: 600; margin-top: 4px; }
    .invoice-date { font-size: 12px; color: #6B7280; margin-top: 2px; }
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
    .party-box { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 14px 16px; }
    .party-title { font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 8px; }
    .party-name { font-weight: 600; color: #111827; margin-bottom: 4px; }
    .party-info { font-size: 12px; color: #6B7280; margin-bottom: 2px; }
    .party-city { font-size: 12px; color: #4F8EF7; font-weight: 500; }
    table.details { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
    table.details thead tr { background: #111827; }
    table.details thead th { padding: 10px 14px; text-align: left; color: #fff; font-weight: 600; font-size: 12px; }
    table.details tbody td { padding: 12px 14px; border-bottom: 1px solid #E5E7EB; }
    .status-pill { background: #F3F4F6; color: #374151; padding: 3px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; }
    .livreur-box { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; font-size: 13px; }
    .bottom { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; }
    .qr-section { text-align: center; }
    .qr-label { font-size: 11px; color: #6B7280; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; }
    .qr-box { border: 2px solid #E5E7EB; border-radius: 8px; padding: 8px; display: inline-block; background: #fff; }
    .qr-value { font-size: 10px; color: #9CA3AF; margin-top: 6px; }
    .price-table { min-width: 220px; }
    .price-total-row td { border-top: 2px solid #111827; padding-top: 10px; margin-top: 8px; }
    .price-total-label { font-weight: 700; font-size: 15px; color: #111827; }
    .price-total-value { font-weight: 700; font-size: 20px; color: #4F8EF7; text-align: right; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #E5E7EB; font-size: 11px; color: #9CA3AF; text-align: center; }
    @media print {
      body { padding: 20px; }
      @page { margin: 1cm; size: A4; }
    }
  </style>
</head>
<body>

  <!-- Header -->
  <div class="header">
    <div>
      <div class="logo-name">DeliverOS</div>
      <div class="logo-sub">Système de gestion des livraisons</div>
      <div class="logo-sub">contact@deliveros.ma · +212 5XX XX XX XX</div>
    </div>
    <div style="text-align:right">
      <div class="invoice-label">FACTURE</div>
      <div class="invoice-num">N° ${orderNum}</div>
      <div class="invoice-date">Date : ${fmt(order.created_at)}</div>
      ${order.delivered_at ? `<div class="invoice-date">Livré le : ${fmt(order.delivered_at)}</div>` : ""}
    </div>
  </div>

  <!-- Parties -->
  <div class="parties">
    <div class="party-box">
      <div class="party-title">Expéditeur</div>
      <div class="party-name">${order.sender_name}</div>
      <div class="party-info">📞 ${order.sender_phone}</div>
      <div class="party-info">📍 ${order.sender_address}</div>
      <div class="party-city">🏙 ${order.origin_city}</div>
    </div>
    <div class="party-box">
      <div class="party-title">Destinataire</div>
      <div class="party-name">${order.receiver_name}</div>
      <div class="party-info">📞 ${order.receiver_phone}</div>
      <div class="party-info">📍 ${order.receiver_address}</div>
      <div class="party-city">🏙 ${order.destination_city}</div>
    </div>
  </div>

  <!-- Order details -->
  <table class="details">
    <thead>
      <tr>
        <th>Description du colis</th>
        <th>Trajet</th>
        <th>Paiement</th>
        <th>Statut</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${order.package_description}</td>
        <td>${order.origin_city} → ${order.destination_city}</td>
        <td>${PAYMENT_FR[order.payment_type]} paie</td>
        <td><span class="status-pill">${STATUS_FR[order.status] || order.status}</span></td>
      </tr>
    </tbody>
  </table>

  <!-- Livreur -->
  ${order.livreur ? `
  <div class="livreur-box">
    <strong>Livreur assigné :</strong> ${order.livreur.full_name}
    ${order.livreur.phone ? ` · ${order.livreur.phone}` : ""}
    ${order.assigned_at ? ` · Assigné le ${fmtTime(order.assigned_at)}` : ""}
  </div>` : ""}

  <!-- Bottom: QR + Price -->
  <div class="bottom">

    <!-- QR Code -->
    <div class="qr-section">
      <div class="qr-label">Scanner pour accéder au colis</div>
      <div class="qr-box">
        <div id="qrcode"></div>
      </div>
      <div class="qr-value">${qrValue}</div>
    </div>

    <!-- Pricing -->
    <table class="price-table">
      <tbody>
        ${priceLine("Prix de base", order.base_price)}
        ${priceLine("Ajustement", order.price_adjustment)}
        <tr class="price-total-row">
          <td class="price-total-label">Total</td>
          <td class="price-total-value">${order.total_price != null ? order.total_price.toFixed(2) + " MAD" : "—"}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Footer -->
  <div class="footer">
    DeliverOS · Facture générée le ${now} · Ce document fait foi de reçu de livraison.
  </div>

  <script>
    // Generate QR code after page loads
    window.onload = function() {
      if (window.QRCode) {
        new QRCode(document.getElementById("qrcode"), {
          text: "${qrValue}",
          width: 120,
          height: 120,
          colorDark: "#000000",
          colorLight: "#ffffff",
          correctLevel: QRCode.CorrectLevel.H
        });
      }
      // Ready to print manually via Ctrl+P or browser menu
    };
  <\/script>
</body>
</html>`;
}

export default function FacturePage({ orderId, onClose }) {
  const [order,   setOrder]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    invoiceService.getOrderData(orderId)
      .then(setOrder)
      .catch(() => setError("Impossible de charger la facture. Vérifiez que la commande existe."))
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleDownload = () => {
    const html = buildInvoiceHTML(order);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `facture-deliveros-${String(order.id).padStart(6, "0")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.75)",
      display:"flex", alignItems:"center", justifyContent:"center",
      zIndex:1000, padding:20,
    }}>
      <div style={{
        background:"#1A1D27", borderRadius:16, padding:28,
        width:"100%", maxWidth:500,
        border:"1px solid #2E3347",
      }}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:"#E8EAF0" }}>Facture N° {String(orderId).padStart(6,"0")}</div>
            <div style={{ fontSize:12, color:"#6B7280", marginTop:3 }}>Commande #{orderId}</div>
          </div>
          <button onClick={onClose} style={{
            background:"transparent", border:"1px solid #2E3347",
            color:"#9CA3AF", borderRadius:8, padding:"6px 14px",
            fontSize:13, cursor:"pointer", fontFamily:"inherit",
          }}>✕ Fermer</button>
        </div>

        {loading && (
          <div style={{ textAlign:"center", padding:40, color:"#6B7280" }}>Chargement de la facture…</div>
        )}

        {error && (
          <div style={{ background:"rgba(247,80,80,0.1)", border:"1px solid rgba(247,80,80,0.3)", borderRadius:10, padding:"14px 16px", color:"#F75050", fontSize:13 }}>
            {error}
          </div>
        )}

        {order && !loading && (
          <>
            {/* Order summary */}
            <div style={{ background:"#21253A", border:"1px solid #2E3347", borderRadius:12, padding:"16px 18px", marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                <span style={{ fontSize:12, color:"#6B7280" }}>Trajet</span>
                <span style={{ fontSize:13, color:"#E8EAF0", fontWeight:500 }}>{order.origin_city} → {order.destination_city}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                <span style={{ fontSize:12, color:"#6B7280" }}>Expéditeur</span>
                <span style={{ fontSize:13, color:"#E8EAF0" }}>{order.sender_name}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                <span style={{ fontSize:12, color:"#6B7280" }}>Destinataire</span>
                <span style={{ fontSize:13, color:"#E8EAF0" }}>{order.receiver_name}</span>
              </div>
              {order.total_price != null && (
                <div style={{ display:"flex", justifyContent:"space-between", borderTop:"1px solid #2E3347", paddingTop:10, marginTop:4 }}>
                  <span style={{ fontSize:13, color:"#6B7280", fontWeight:600 }}>Total</span>
                  <span style={{ fontSize:18, color:"#2DD4A0", fontWeight:700 }}>{order.total_price.toFixed(2)} MAD</span>
                </div>
              )}
            </div>

            {/* Info box */}
            <div style={{ background:"rgba(45,212,160,0.08)", border:"1px solid rgba(45,212,160,0.2)", borderRadius:10, padding:"12px 14px", fontSize:12, color:"#2DD4A0", marginBottom:20 }}>
              ✓ La facture sera téléchargée automatiquement. Ouvrez-la dans votre navigateur et utilisez <strong>Imprimer → Enregistrer en PDF</strong>.
            </div>

            {/* Action button */}
            <button
              onClick={handleDownload}
              style={{
                width:"100%", padding:"13px", borderRadius:10,
                background:"#4F8EF7", color:"#fff", border:"none",
                fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
                display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              }}
            >
              ⬇ Télécharger la Facture
            </button>
          </>
        )}
      </div>
    </div>
  );
}
