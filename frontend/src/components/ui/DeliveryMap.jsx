import { useEffect, useRef } from "react";
import { getBestCoords } from "../../utils/geocode";

const ACTIVE = ["assigned", "picked_up", "in_transit"];

const STATUS_COLOR = {
  assigned:   "#4F8EF7",
  picked_up:  "#8B5CF6",
  in_transit: "#F5A623",
};

const STATUS_LABEL = {
  assigned:   "Assignée",
  picked_up:  "Récupérée",
  in_transit: "En transit",
};

export default function DeliveryMap({ orders, selectedOrder, onSelectOrder }) {
  const mapRef     = useRef(null);
  const mapObj     = useRef(null);
  const markersRef = useRef([]);

  // ── Init map once ──────────────────────────────────────────
  useEffect(() => {
    const init = () => {
      if (!mapRef.current || mapObj.current) return;
      const L = window.L;

      const map = L.map(mapRef.current, {
        center: [31.7917, -7.0926],
        zoom: 6,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      mapObj.current = map;
    };

    // Load Leaflet CSS
    if (!document.querySelector('link[href*="leaflet"]')) {
      const link = document.createElement("link");
      link.rel  = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    // Load Leaflet JS then init
    if (window.L) {
      init();
    } else {
      const s = document.createElement("script");
      s.src    = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      s.onload = init;
      document.head.appendChild(s);
    }

    return () => {
      if (mapObj.current) {
        mapObj.current.remove();
        mapObj.current = null;
      }
    };
  }, []);

  // ── Redraw markers on orders / selection change ────────────
  useEffect(() => {
    const L = window.L;
    if (!L || !mapObj.current) return;

    // Clear all previous markers and lines
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const active = orders.filter(o => ACTIVE.includes(o.status));
    if (active.length === 0) return;

    const bounds = [];

    active.forEach(order => {
      const isSelected = selectedOrder?.id === order.id;
      const color      = STATUS_COLOR[order.status] || "#4F8EF7";
      const pinSize    = isSelected ? 44 : 34;

      // Get best coordinates for sender and receiver
      const sender   = getBestCoords(order.sender_location,   order.origin_city);
      const receiver = getBestCoords(order.receiver_location, order.destination_city);

      const sc = sender.coords;
      const rc = receiver.coords;

      // ── Sender icon (📦) ────────────────────────────────────
      const senderIcon = L.divIcon({
        html: `
          <div style="
            position:relative;
            width:${pinSize}px;
            height:${pinSize}px;
          ">
            <div style="
              position:absolute; inset:0;
              background:${color};
              border-radius:50% 50% 50% 0;
              transform:rotate(-45deg);
              border:${isSelected ? 3 : 2}px solid white;
              box-shadow:0 3px 12px rgba(0,0,0,0.4);
            "></div>
            <span style="
              position:absolute; inset:0;
              display:flex; align-items:center; justify-content:center;
              font-size:${pinSize * 0.42}px;
              line-height:1;
              padding-bottom:${pinSize * 0.1}px;
            ">📦</span>
          </div>`,
        className: "",
        iconSize:   [pinSize, pinSize],
        iconAnchor: [pinSize / 2, pinSize],
        popupAnchor:[0, -pinSize],
      });

      // ── Receiver icon (🏠) ──────────────────────────────────
      const receiverIcon = L.divIcon({
        html: `
          <div style="
            position:relative;
            width:${pinSize}px;
            height:${pinSize}px;
          ">
            <div style="
              position:absolute; inset:0;
              background:#2DD4A0;
              border-radius:50% 50% 50% 0;
              transform:rotate(-45deg);
              border:${isSelected ? 3 : 2}px solid white;
              box-shadow:0 3px 12px rgba(0,0,0,0.4);
            "></div>
            <span style="
              position:absolute; inset:0;
              display:flex; align-items:center; justify-content:center;
              font-size:${pinSize * 0.42}px;
              line-height:1;
              padding-bottom:${pinSize * 0.1}px;
            ">🏠</span>
          </div>`,
        className: "",
        iconSize:   [pinSize, pinSize],
        iconAnchor: [pinSize / 2, pinSize],
        popupAnchor:[0, -pinSize],
      });

      // ── Popup content ───────────────────────────────────────
      const popup = `
        <div style="font-family:system-ui;min-width:180px;padding:2px">
          <b style="font-size:14px">Commande #${order.id}</b>
          <div style="font-size:12px;color:#555;margin-top:6px">
            <b>Statut:</b> ${STATUS_LABEL[order.status]}
          </div>
          <div style="font-size:12px;color:#555;margin-top:3px">
            <b>De:</b> ${order.sender_name}
            ${sender.exact ? '<span style="color:#2DD4A0"> ✓</span>' : '<span style="color:#F5A623"> ~</span>'}
          </div>
          <div style="font-size:12px;color:#555;margin-top:3px">
            <b>Vers:</b> ${order.receiver_name}
            ${receiver.exact ? '<span style="color:#2DD4A0"> ✓</span>' : '<span style="color:#F5A623"> ~</span>'}
          </div>
          ${order.total_price != null
            ? `<div style="font-size:13px;font-weight:700;color:#4F8EF7;margin-top:6px">${order.total_price.toFixed(2)} MAD</div>`
            : ""}
          ${order.sender_location
            ? `<a href="${order.sender_location}" target="_blank" style="display:block;margin-top:8px;font-size:11px;color:#4F8EF7">📦 Ouvrir expéditeur ↗</a>`
            : ""}
          ${order.receiver_location
            ? `<a href="${order.receiver_location}" target="_blank" style="display:block;margin-top:3px;font-size:11px;color:#2DD4A0">🏠 Ouvrir destinataire ↗</a>`
            : ""}
        </div>`;

      // ── Add sender marker ───────────────────────────────────
      const sm = L.marker(sc, { icon: senderIcon })
        .addTo(mapObj.current)
        .bindPopup(popup, { maxWidth: 240 })
        .on("click", () => onSelectOrder?.(order));
      markersRef.current.push(sm);

      // ── Add receiver marker ─────────────────────────────────
      const rm = L.marker(rc, { icon: receiverIcon })
        .addTo(mapObj.current)
        .bindPopup(popup, { maxWidth: 240 })
        .on("click", () => onSelectOrder?.(order));
      markersRef.current.push(rm);

      // ── Route line between sender and receiver ──────────────
      const line = L.polyline([sc, rc], {
        color,
        weight:    isSelected ? 4 : 2,
        opacity:   isSelected ? 0.85 : 0.45,
        dashArray: order.status === "assigned" ? "8 6" : null,
      }).addTo(mapObj.current);
      markersRef.current.push(line);

      bounds.push(sc, rc);
    });

    // Fit map to show all pins with padding
    if (bounds.length > 0) {
      mapObj.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    }
  }, [orders, selectedOrder]);

  return (
    <div
      ref={mapRef}
      style={{ width: "100%", height: "100%", borderRadius: 12, overflow: "hidden", zIndex: 1 }}
    />
  );
}
