import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/layout/AuthLayout";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { useAuth } from "../../context/AuthContext";

const ROLE_REDIRECTS = {
  admin:   "/admin",
  manager: "/manager",
  livreur: "/livreur",
  client:  "/client",
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form, setForm]       = useState({ email: "", password: "" });
  const [errors, setErrors]   = useState({});
  const [apiError, setApiErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: "" }));
    setApiErr("");
  };

  const validate = () => {
    const errs = {};
    if (!form.email)    errs.email    = "L'email est requis";
    if (!form.password) errs.password = "Le mot de passe est requis";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(ROLE_REDIRECTS[user.role] || "/");
    } catch (err) {
      setApiErr(err.response?.data?.detail || "Erreur de connexion. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Connectez-vous à votre espace">
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          <Alert message={apiError} />

          <Input
            label="Adresse email"
            type="email"
            placeholder="vous@exemple.com"
            value={form.email}
            onChange={set("email")}
            error={errors.email}
            icon="✉"
            autoComplete="email"
          />

          <div>
            <Input
              label="Mot de passe"
              type={showPwd ? "text" : "password"}
              placeholder="••••••••"
              value={form.password}
              onChange={set("password")}
              error={errors.password}
              icon="🔒"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              style={{
                marginTop: 6, background: "none", border: "none",
                color: "var(--text-sub)", fontSize: 12, cursor: "pointer", padding: 0,
              }}
            >
              {showPwd ? "Masquer" : "Afficher"} le mot de passe
            </button>
          </div>

          <Button type="submit" fullWidth loading={loading}>
            Se connecter
          </Button>

          <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-sub)", marginTop: 4 }}>
            Pas encore de compte ?{" "}
            <Link to="/register">Créer un compte client</Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}
