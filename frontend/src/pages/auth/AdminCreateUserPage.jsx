import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Alert from "../../components/ui/Alert";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { authService } from "../../services/authService";

export default function AdminCreateUserPage() {
  const navigate = useNavigate();

  const [form, setForm]         = useState({ full_name: "", email: "", phone: "", password: "", role: "manager" });
  const [errors, setErrors]     = useState({});
  const [apiError, setApiErr]   = useState("");
  const [success, setSuccess]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPwd, setShowPwd]   = useState(false);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: "" }));
    setApiErr(""); setSuccess("");
  };

  const validate = () => {
    const errs = {};
    if (!form.full_name.trim())    errs.full_name = "Le nom complet est requis";
    if (!form.email)               errs.email     = "L'email est requis";
    if (form.password.length < 8)  errs.password  = "Minimum 8 caractères";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const user = await authService.adminCreateUser({
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        role: form.role,
        phone: form.phone || undefined,
      });
      setSuccess(`Compte ${user.role} créé pour ${user.full_name} (${user.email})`);
      setForm({ full_name: "", email: "", phone: "", password: "", role: "manager" });
    } catch (err) {
      setApiErr(err.response?.data?.detail || "Erreur lors de la création du compte.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ background: "none", border: "none", color: "var(--text-sub)", cursor: "pointer", fontSize: 13, padding: 0 }}
        >
          ← Retour
        </button>
        <h2 style={{ color: "var(--text)", fontSize: 18, fontWeight: 600, marginTop: 12 }}>
          Créer un compte équipe
        </h2>
        <p style={{ color: "var(--text-sub)", fontSize: 13, marginTop: 4 }}>
          Seul l'administrateur peut créer des comptes Manager et Livreur.
        </p>
      </div>

      <div style={{
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: 14, padding: "24px",
      }}>
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            <Alert message={apiError} type="error" />
            <Alert message={success} type="success" />

            {/* Role selector */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: "var(--text-sub)" }}>Rôle du compte</label>
              <div style={{ display: "flex", gap: 10 }}>
                {[
                  { value: "manager", label: "◈ Manager", color: "var(--accent)" },
                  { value: "livreur", label: "◎ Livreur", color: "var(--warning)" },
                ].map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, role: r.value }))}
                    style={{
                      flex: 1, padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                      border: `1px solid ${form.role === r.value ? r.color : "var(--border)"}`,
                      background: form.role === r.value ? `${r.color}15` : "var(--surface)",
                      color: form.role === r.value ? r.color : "var(--text-sub)",
                      fontSize: 13, fontWeight: 600, transition: "all 0.15s",
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Nom complet"
              type="text"
              placeholder="Said Moussaoui"
              value={form.full_name}
              onChange={set("full_name")}
              error={errors.full_name}
              icon="👤"
            />

            <Input
              label="Adresse email"
              type="email"
              placeholder="said@deliveros.com"
              value={form.email}
              onChange={set("email")}
              error={errors.email}
              icon="✉"
            />

            <Input
              label="Téléphone (optionnel)"
              type="tel"
              placeholder="+212 6XX XXX XXX"
              value={form.phone}
              onChange={set("phone")}
              icon="📱"
            />

            <div>
              <Input
                label="Mot de passe temporaire"
                type={showPwd ? "text" : "password"}
                placeholder="Minimum 8 caractères"
                value={form.password}
                onChange={set("password")}
                error={errors.password}
                icon="🔒"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                style={{ marginTop: 6, background: "none", border: "none", color: "var(--text-sub)", fontSize: 12, cursor: "pointer", padding: 0 }}
              >
                {showPwd ? "Masquer" : "Afficher"} le mot de passe
              </button>
            </div>

            <div style={{
              background: "rgba(79,142,247,0.08)", border: "1px solid rgba(79,142,247,0.2)",
              borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "var(--text-sub)",
            }}>
              ℹ L'utilisateur devra changer son mot de passe lors de sa première connexion.
            </div>

            <Button type="submit" fullWidth loading={loading} style={{ marginTop: 4 }}>
              Créer le compte {form.role}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
