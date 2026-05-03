import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { ActionButton, Card, PageHeader, StatCard, Table } from "../../components/ui/DashboardUI";
import { StatusBadge } from "../../components/ui/OrderUI";
import Alert from "../../components/ui/Alert";
import api from "../../services/api";
import FacturePage from "../shared/FacturePage";

// ── helpers ───────────────────────────────────────────────────
const ROLE_COLOR  = { admin:"#8B5CF6", manager:"#4F8EF7", livreur:"#F5A623", client:"#2DD4A0" };
const ROLE_LABEL  = { admin:"Admin", manager:"Manager", livreur:"Livreur", client:"Client" };
const fmt = iso => iso ? new Date(iso).toLocaleString("fr-FR",{day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}) : "—";

function RolePill({ role }) {
  const c = ROLE_COLOR[role] || "#9CA3AF";
  return (
    <span style={{ background:`${c}18`, color:c, padding:"3px 10px", borderRadius:99, fontSize:11, fontWeight:600 }}>
      {ROLE_LABEL[role] || role}
    </span>
  );
}

// ── Overview ──────────────────────────────────────────────────
function Overview() {
  const [stats,   setStats]   = useState(null);
  const [orders,  setOrders]   = useState([]);
  const [loading, setLoading]  = useState(true);
  const [error,   setError]    = useState("");
  const [factureId, setFactureId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, o] = await Promise.all([
          api.get("/auth/stats"),
          api.get("/auth/recent-orders?limit=8"),
        ]);
        setStats(s.data);
        setOrders(o.data);
      } catch(err) {
        const status = err?.response?.status;
        const detail = err?.response?.data?.detail;
        console.error("Admin overview error:", status, detail);
        if (status === 403) setError("Accès refusé — vérifiez que votre compte a bien le rôle Admin.");
        else if (status === 401) setError("Session expirée — veuillez vous reconnecter.");
        else if (status === 404) setError("Endpoints introuvables — vérifiez que le backend est à jour.");
        else setError(`Erreur ${status || "réseau"}: ${detail || err?.message || "Impossible de charger les données."}`);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Loader />;

  return (
    <>
      <PageHeader title="Vue d'ensemble" subtitle="Activité globale de la plateforme en temps réel" />
      <Alert message={error} type="error" />

      {/* Order stats */}
      <div style={{ marginBottom: 8, fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.08em" }}>Commandes</div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24 }}>
        <StatCard label="Total"        value={stats?.orders.total ?? "0"}                               icon="📦" />
        <StatCard label="En attente"   value={stats?.orders.pending ?? "0"}      color="#F5A623"        icon="⏳" />
        <StatCard label="En cours"     value={stats?.orders.in_progress ?? "0"}  color="#4F8EF7"        icon="🚚" />
        <StatCard label="Livrées"      value={stats?.orders.delivered ?? "0"}    color="#2DD4A0"        icon="✓"  />
        <StatCard label="Annulées"     value={stats?.orders.cancelled ?? "0"}    color="#F75050"        icon="✕"  />
        <StatCard label="Taux succès"  value={(stats?.orders.success_rate ?? "0") + "%"} color="#2DD4A0" trend={stats?.orders.total > 0 ? `sur ${stats.orders.total} commandes` : ""} icon="📊" />
      </div>

      {/* User stats */}
      <div style={{ marginBottom: 8, fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.08em" }}>Utilisateurs</div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 28 }}>
        <StatCard label="Total"          value={stats?.users.total ?? "0"}                        icon="👥" />
        <StatCard label="Livreurs actifs" value={stats?.users.active_livreurs ?? "0"} color="#F5A623" icon="🛵" />
        <StatCard label="Managers"        value={stats?.users.managers ?? "0"}        color="#4F8EF7" icon="◈"  />
        <StatCard label="Clients"         value={stats?.users.clients ?? "0"}         color="#2DD4A0" icon="◇"  />
      </div>

      {/* Recent orders table */}
      <Card title="Commandes récentes">
        <Table
          headers={["#", "Client", "Livreur", "Trajet", "Statut", "Date"]}
          rows={orders.map(o => [
            <span style={{ color: "#4F8EF7", fontWeight: 700 }}>#{o.id}</span>,
            o.client?.full_name || "—",
            o.livreur?.full_name || <span style={{ color: "#6B7280" }}>Non assigné</span>,
            <span style={{ fontSize: 12 }}>{o.origin_city} → {o.destination_city}</span>,
            <StatusBadge status={o.status} />,
            <span style={{ color: "#6B7280", fontSize: 12 }}>{fmt(o.created_at)}</span>,
          ])}
          emptyMessage="Aucune commande pour le moment"
        />
      </Card>
    </>
  );
}

// ── Users management ──────────────────────────────────────────
function Users({ onCreateUser }) {
  const [users,   setUsers]   = useState([]);
  const [filter,  setFilter]  = useState("all");
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [toggling, setToggling] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = filter !== "all" ? { role: filter } : {};
    api.get("/auth/list-users", { params })
      .then(r => setUsers(r.data))
      .catch(err => {
        const s = err?.response?.status;
        const d = err?.response?.data?.detail;
        console.error("Admin users error:", s, d);
        if (s === 403) setError("Accès refusé — rôle Admin requis.");
        else if (s === 404) setError("Endpoint /users introuvable — backend à jour ?");
        else setError(`Erreur ${s || "réseau"}: ${d || err?.message || "Impossible de charger les utilisateurs."}`);
      })
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (userId) => {
    setToggling(userId);
    try {
      const updated = await api.patch(`/auth/toggle-user/${userId}`).then(r => r.data);
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    } catch (err) {
      setError(err.response?.data?.detail || "Erreur lors de la modification.");
    } finally { setToggling(null); }
  };

  const roles = ["all", "admin", "manager", "livreur", "client"];
  const roleLabels = { all: "Tous", admin: "Admins", manager: "Managers", livreur: "Livreurs", client: "Clients" };

  return (
    <>
      <PageHeader
        title="Utilisateurs"
        subtitle="Gérez tous les comptes de la plateforme"
        action={
          <ActionButton onClick={onCreateUser} color="#8B5CF6">
            + Créer un compte
          </ActionButton>
        }
      />
      <Alert message={error} type="error" />

      {/* Role filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {roles.map(r => (
          <button key={r} onClick={() => setFilter(r)} style={{
            padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
            border: `1px solid ${filter === r ? "#8B5CF6" : "#2E3347"}`,
            background: filter === r ? "rgba(139,92,246,0.12)" : "transparent",
            color: filter === r ? "#8B5CF6" : "#9CA3AF",
            fontSize: 12, fontWeight: filter === r ? 600 : 400,
          }}>
            {roleLabels[r]}
          </button>
        ))}
      </div>

      {loading ? <Loader /> : (
        <Card>
          <Table
            headers={["Nom", "Email", "Rôle", "Téléphone", "Statut", "Créé le", "Action"]}
            emptyMessage="Aucun utilisateur trouvé"
            rows={users.map(u => [
              <span style={{ fontWeight: 500, color: "#E8EAF0" }}>{u.full_name}</span>,
              <span style={{ color: "#9CA3AF", fontSize: 12 }}>{u.email}</span>,
              <RolePill role={u.role} />,
              u.phone || <span style={{ color: "#6B7280" }}>—</span>,
              <span style={{
                padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
                background: u.is_active ? "rgba(45,212,160,0.12)" : "rgba(107,114,128,0.12)",
                color: u.is_active ? "#2DD4A0" : "#9CA3AF",
              }}>
                {u.is_active ? "Actif" : "Inactif"}
              </span>,
              <span style={{ color: "#6B7280", fontSize: 12 }}>{fmt(u.created_at)}</span>,
              <button
                onClick={() => handleToggle(u.id)}
                disabled={toggling === u.id}
                style={{
                  background: "transparent",
                  border: `1px solid ${u.is_active ? "#F75050" : "#2DD4A0"}`,
                  color: u.is_active ? "#F75050" : "#2DD4A0",
                  borderRadius: 7, padding: "4px 10px", fontSize: 11,
                  fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                  opacity: toggling === u.id ? 0.5 : 1,
                }}
              >
                {toggling === u.id ? "…" : u.is_active ? "Désactiver" : "Activer"}
              </button>,
            ])}
          />
        </Card>
      )}
    </>
  );
}

// ── Roles & permissions (static — defined by system) ──────────
function Roles() {
  const roleList = [
    { role: "Admin",   color: "#8B5CF6", perms: ["Gestion complète", "Journaux d'activité", "Paramètres système", "Créer managers & livreurs", "Activer / désactiver comptes"] },
    { role: "Manager", color: "#4F8EF7", perms: ["Voir toutes les commandes", "Assigner livreurs", "Annuler commandes", "Filtrer par statut / ville"] },
    { role: "Livreur", color: "#F5A623", perms: ["Voir commandes assignées", "Mettre à jour statut (récupéré → transit → livré)", "Annuler si bloqué"] },
    { role: "Client",  color: "#2DD4A0", perms: ["Créer commandes", "Suivre livraison en temps réel", "Annuler si en attente"] },
  ];

  const transitions = [
    { from: "pending",    to: "assigned",   by: "Manager" },
    { from: "assigned",   to: "picked_up",  by: "Livreur" },
    { from: "picked_up",  to: "in_transit", by: "Livreur" },
    { from: "in_transit", to: "delivered",  by: "Livreur" },
  ];

  const STATUS_COLORS = { pending:"#F5A623", assigned:"#4F8EF7", picked_up:"#8B5CF6", in_transit:"#06B6D4", delivered:"#2DD4A0" };
  const STATUS_LABELS = { pending:"En attente", assigned:"Assignée", picked_up:"Récupérée", in_transit:"En transit", delivered:"Livrée" };

  return (
    <>
      <PageHeader title="Rôles & permissions" subtitle="Définition des accès par rôle et flux de statuts" />
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 28 }}>
        {roleList.map(({ role, color, perms }) => (
          <Card key={role}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
              <span style={{ fontWeight: 700, color: "#E8EAF0", fontSize: 14 }}>{role}</span>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {perms.map(p => (
                <span key={p} style={{ background:`${color}18`, color, padding:"4px 12px", borderRadius:6, fontSize:11, fontWeight:500 }}>{p}</span>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Card title="Flux des statuts de commande">
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "8px 0" }}>
          {transitions.map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <span style={{ background:`${STATUS_COLORS[t.from]}18`, color:STATUS_COLORS[t.from], padding:"4px 12px", borderRadius:99, fontSize:11, fontWeight:600 }}>
                  {STATUS_LABELS[t.from]}
                </span>
                <span style={{ fontSize: 10, color: "#6B7280" }}>{t.by}</span>
              </div>
              <span style={{ color: "#4F8EF7", fontSize: 16 }}>→</span>
              {i === transitions.length - 1 && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <span style={{ background:`${STATUS_COLORS[t.to]}18`, color:STATUS_COLORS[t.to], padding:"4px 12px", borderRadius:99, fontSize:11, fontWeight:600 }}>
                    {STATUS_LABELS[t.to]}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

// ── Activity Logs (recent orders as log) ─────────────────────
function Logs() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    api.get("/auth/recent-orders?limit=30")
      .then(r => setOrders(r.data))
      .catch(() => setError("Impossible de charger les journaux."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader title="Journaux d'activité" subtitle="30 dernières commandes créées ou mises à jour" />
      <Alert message={error} type="error" />
      {loading ? <Loader /> : (
        <Card>
          <Table
            headers={["#", "Client", "Trajet", "Livreur", "Statut", "Date", "Facture"]}
            emptyMessage="Aucune activité enregistrée"
            rows={orders.map(o => [
              <span style={{ color: "#4F8EF7", fontWeight: 700 }}>#{o.id}</span>,
              o.client?.full_name || "—",
              <span style={{ fontSize: 12 }}>{o.origin_city} → {o.destination_city}</span>,
              o.livreur?.full_name || <span style={{ color: "#6B7280" }}>Non assigné</span>,
              <StatusBadge status={o.status} />,
              <span style={{ color: "#6B7280", fontSize: 12 }}>{fmt(o.created_at)}</span>,
              o.status === "delivered" || o.total_price != null
                ? <button onClick={() => setFactureId(o.id)} style={{ background:"transparent", border:"1px solid #4F8EF7", color:"#4F8EF7", borderRadius:6, padding:"3px 10px", fontSize:11, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>Facture</button>
                : <span style={{ color:"#6B7280", fontSize:12 }}>—</span>,
            ])}
          />
        </Card>
      )}
      {factureId && <FacturePage orderId={factureId} onClose={() => setFactureId(null)} />}
    </>
  );
}

// ── Loader ────────────────────────────────────────────────────
function Loader() {
  return (
    <div style={{ textAlign: "center", padding: 48, color: "#6B7280", fontSize: 13 }}>
      Chargement…
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate = useNavigate();

  const navItems = [
    { id: "overview", icon: "▣", label: "Vue d'ensemble",     content: <Overview /> },
    { id: "users",    icon: "⊕", label: "Utilisateurs",       content: <Users onCreateUser={() => navigate("/admin/create-user")} /> },
    { id: "roles",    icon: "◈", label: "Rôles & permissions", content: <Roles /> },
    { id: "logs",     icon: "≡", label: "Journaux",            content: <Logs /> },
  ];

  return <DashboardLayout role="admin" navItems={navItems} />;
}
