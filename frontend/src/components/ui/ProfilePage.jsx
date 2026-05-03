import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { profileService } from "../../services/profileService";
import { Card, PageHeader } from "../ui/DashboardUI";
import Input from "../ui/Input";
import Button from "../ui/Button";
import Alert from "../ui/Alert";

const ROLE_LABELS = { admin:"Admin", manager:"Manager", livreur:"Livreur", client:"Client" };
const ROLE_COLORS = { admin:"#8B5CF6", manager:"#4F8EF7", livreur:"#F5A623", client:"#2DD4A0" };

export default function ProfilePage() {
  const { user, login } = useAuth();

  // Profile form
  const [profile, setProfile]   = useState({ full_name: user?.full_name || "", phone: user?.phone || "" });
  const [profErr, setProfErr]   = useState("");
  const [profOk,  setProfOk]    = useState("");
  const [profLoad, setProfLoad] = useState(false);

  // Password form
  const [pwd, setPwd]         = useState({ current_password:"", new_password:"", confirm:"" });
  const [pwdErr, setPwdErr]   = useState("");
  const [pwdOk,  setPwdOk]    = useState("");
  const [pwdLoad, setPwdLoad] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const setP = k => e => { setProfile(f => ({...f,[k]:e.target.value})); setProfErr(""); setProfOk(""); };
  const setW = k => e => { setPwd(f => ({...f,[k]:e.target.value})); setPwdErr(""); setPwdOk(""); };

  const handleProfile = async e => {
    e.preventDefault(); setProfLoad(true);
    try {
      await profileService.update({ full_name: profile.full_name, phone: profile.phone });
      setProfOk("Profil mis à jour avec succès !");
    } catch(err) {
      const d = err.response?.data?.detail;
      setProfErr(Array.isArray(d) ? d.map(x=>x.msg||x).join(" · ") : d || "Erreur.");
    } finally { setProfLoad(false); }
  };

  const handlePassword = async e => {
    e.preventDefault();
    if (pwd.new_password !== pwd.confirm) { setPwdErr("Les mots de passe ne correspondent pas."); return; }
    if (pwd.new_password.length < 8) { setPwdErr("Minimum 8 caractères."); return; }
    setPwdLoad(true);
    try {
      await profileService.changePassword({ current_password: pwd.current_password, new_password: pwd.new_password });
      setPwdOk("Mot de passe modifié avec succès !");
      setPwd({ current_password:"", new_password:"", confirm:"" });
    } catch(err) {
      const d = err.response?.data?.detail;
      setPwdErr(Array.isArray(d) ? d.map(x=>x.msg||x).join(" · ") : d || "Erreur.");
    } finally { setPwdLoad(false); }
  };

  const roleColor = ROLE_COLORS[user?.role] || "#4F8EF7";

  return (
    <>
      <PageHeader title="Mon profil" subtitle="Gérez vos informations personnelles" />

      {/* Avatar + role badge */}
      <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:24 }}>
        <div style={{
          width:64, height:64, borderRadius:"50%",
          background:`linear-gradient(135deg, ${roleColor}30, ${roleColor}10)`,
          border:`2px solid ${roleColor}50`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:26, color:roleColor,
        }}>
          {user?.full_name?.[0]?.toUpperCase() || "?"}
        </div>
        <div>
          <div style={{ fontSize:18, fontWeight:700, color:"#E8EAF0" }}>{user?.full_name}</div>
          <div style={{ fontSize:12, color:"#9CA3AF", marginTop:3 }}>{user?.email}</div>
          <span style={{
            marginTop:6, display:"inline-block",
            background:`${roleColor}18`, color:roleColor,
            padding:"2px 10px", borderRadius:99, fontSize:11, fontWeight:600,
          }}>
            {ROLE_LABELS[user?.role] || user?.role}
          </span>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>

        {/* ── Edit profile ── */}
        <Card title="Informations personnelles">
          <form onSubmit={handleProfile}>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <Alert message={profErr} type="error" />
              <Alert message={profOk}  type="success" />
              <Input
                label="Nom complet"
                value={profile.full_name}
                onChange={setP("full_name")}
                placeholder="Votre nom complet"
                icon="👤"
              />
              <Input
                label="Téléphone"
                value={profile.phone}
                onChange={setP("phone")}
                placeholder="+212 6XX XXX XXX"
                icon="📱"
              />
              <div style={{ background:"#1A1D27", borderRadius:10, padding:"10px 14px" }}>
                <div style={{ fontSize:11, color:"#6B7280", marginBottom:4 }}>Email (non modifiable)</div>
                <div style={{ fontSize:13, color:"#9CA3AF" }}>{user?.email}</div>
              </div>
              <Button type="submit" fullWidth loading={profLoad}>
                Enregistrer les modifications
              </Button>
            </div>
          </form>
        </Card>

        {/* ── Change password ── */}
        <Card title="Changer le mot de passe">
          <form onSubmit={handlePassword}>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <Alert message={pwdErr} type="error" />
              <Alert message={pwdOk}  type="success" />
              <Input
                label="Mot de passe actuel"
                type={showPwd ? "text" : "password"}
                value={pwd.current_password}
                onChange={setW("current_password")}
                placeholder="••••••••"
                icon="🔒"
              />
              <Input
                label="Nouveau mot de passe"
                type={showPwd ? "text" : "password"}
                value={pwd.new_password}
                onChange={setW("new_password")}
                placeholder="Minimum 8 caractères"
                icon="🔑"
              />
              <Input
                label="Confirmer le nouveau mot de passe"
                type={showPwd ? "text" : "password"}
                value={pwd.confirm}
                onChange={setW("confirm")}
                placeholder="••••••••"
                icon="🔑"
              />

              {/* Password strength */}
              {pwd.new_password && (
                <div>
                  <div style={{ display:"flex", gap:4, marginBottom:5 }}>
                    {[0,1,2,3].map(i => {
                      const score = [
                        pwd.new_password.length >= 8,
                        /[A-Z]/.test(pwd.new_password),
                        /\d/.test(pwd.new_password),
                        /[^A-Za-z0-9]/.test(pwd.new_password),
                      ].filter(Boolean).length;
                      const colors = ["#F75050","#F75050","#F5A623","#F5A623","#2DD4A0"];
                      return <div key={i} style={{ flex:1, height:3, borderRadius:2, background: i < score ? colors[score] : "#2E3347" }} />;
                    })}
                  </div>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {[
                      { label:"8+ car.", ok: pwd.new_password.length >= 8 },
                      { label:"Majuscule", ok: /[A-Z]/.test(pwd.new_password) },
                      { label:"Chiffre", ok: /\d/.test(pwd.new_password) },
                      { label:"Spécial", ok: /[^A-Za-z0-9]/.test(pwd.new_password) },
                    ].map(c => (
                      <span key={c.label} style={{ fontSize:11, color: c.ok ? "#2DD4A0" : "#6B7280" }}>
                        {c.ok ? "✓" : "○"} {c.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button type="button" onClick={() => setShowPwd(v=>!v)} style={{
                background:"none", border:"none", color:"#6B7280", fontSize:12,
                cursor:"pointer", padding:0, textAlign:"left",
              }}>
                {showPwd ? "Masquer" : "Afficher"} les mots de passe
              </button>

              <Button type="submit" fullWidth loading={pwdLoad}>
                Modifier le mot de passe
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
