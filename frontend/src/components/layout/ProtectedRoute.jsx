import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
        <div style={{ color: "var(--text-sub)", fontSize: 13 }}>Chargement…</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to the user's own dashboard
    const HOME = { admin: "/admin", manager: "/manager", livreur: "/livreur", client: "/client" };
    return <Navigate to={HOME[user.role] || "/login"} replace />;
  }

  return children;
}
