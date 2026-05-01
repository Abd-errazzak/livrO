import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

// Auth pages
import LoginPage           from "./pages/auth/LoginPage";
import RegisterPage        from "./pages/auth/RegisterPage";
import AdminCreateUserPage from "./pages/auth/AdminCreateUserPage";

// Dashboard pages
import AdminDashboard   from "./pages/admin/AdminDashboard";
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import LivreurDashboard from "./pages/livreur/LivreurDashboard";
import ClientDashboard  from "./pages/client/ClientDashboard";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Admin */}
        <Route path="/admin/*" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/create-user" element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminCreateUserPage />
          </ProtectedRoute>
        } />

        {/* Manager */}
        <Route path="/manager/*" element={
          <ProtectedRoute allowedRoles={["manager"]}>
            <ManagerDashboard />
          </ProtectedRoute>
        } />

        {/* Livreur */}
        <Route path="/livreur/*" element={
          <ProtectedRoute allowedRoles={["livreur"]}>
            <LivreurDashboard />
          </ProtectedRoute>
        } />

        {/* Client */}
        <Route path="/client/*" element={
          <ProtectedRoute allowedRoles={["client"]}>
            <ClientDashboard />
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}
