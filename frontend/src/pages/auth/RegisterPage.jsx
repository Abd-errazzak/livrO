import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/layout/AuthLayout";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { useAuth } from "../../context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [form, setForm]       = useState({ full_name: "", email: "", phone: "", password: "", confirm: "" });
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
    if (!form.full_name.trim())     errs.full_name = "Le nom complet est requis";
    if (!form.email)                errs.email     = "L'email est requis";
    if (form.password.length < 8)  errs.password  = "Minimum 8 caractères";
    if (form.password !== form.confirm) errs.confirm = "Les mots de passe ne correspondent pas";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      await register({ full_name: form.full_name, email: form.email, password: form.password, phone: form.phone || undefined });
      navigate("/client");
    } catch (err) {
      setApiErr(err.response?.data?.detail || "Erreur lors de la création du compte.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Créer un compte client">
      <form onSubmit={handleSubmit} noValidate>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          <Alert message={apiError} />

          <Input
            label="Nom complet"
            type="text"
            placeholder="Karim Alaoui"
            value={form.full_name}
            onChange={set("full_name")}
            error={errors.full_name}
            icon="👤"
            autoComplete="name"
          />

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

          <Input
            label="Téléphone (optionnel)"
            type="tel"
            placeholder="+212 6XX XXX XXX"
            value={form.phone}
            onChange={set("phone")}
            error={errors.phone}
            icon="📱"
          />

          <Input
            label="Mot de passe"
            type={showPwd ? "text" : "password"}
            placeholder="Minimum 8 caractères"
            value={form.password}
            onChange={set("password")}
            error={errors.password}
            icon="🔒"
            autoComplete="new-password"
          />

          <div>
            <Input
              label="Confirmer le mot de passe"
              type={showPwd ? "text" : "password"}
              placeholder="••••••••"
              value={form.confirm}
              onChange={set("confirm")}
              error={errors.confirm}
              icon="🔒"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              style={{ marginTop: 6, background: "none", border: "none", color: "var(--text-sub)", fontSize: 12, cursor: "pointer", padding: 0 }}
            >
              {showPwd ? "Masquer" : "Afficher"} les mots de passe
            </button>
          </div>

          {/* Password strength indicator */}
          {form.password && (
            <PasswordStrength password={form.password} />
          )}

          <Button type="submit" fullWidth loading={loading} style={{ marginTop: 4 }}>
            Créer mon compte
          </Button>

          <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-sub)" }}>
            Déjà un compte ? <Link to="/login">Se connecter</Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}

function PasswordStrength({ password }) {
  const checks = [
    { label: "8+ caractères",       ok: password.length >= 8 },
    { label: "Majuscule",           ok: /[A-Z]/.test(password) },
    { label: "Chiffre",             ok: /\d/.test(password) },
    { label: "Caractère spécial",   ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const colors = ["var(--danger)", "var(--danger)", "var(--warning)", "var(--warning)", "var(--success)"];

  return (
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i < score ? colors[score] : "var(--border)",
            transition: "background 0.2s",
          }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {checks.map((c) => (
          <span key={c.label} style={{ fontSize: 11, color: c.ok ? "var(--success)" : "var(--muted)" }}>
            {c.ok ? "✓" : "○"} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}
