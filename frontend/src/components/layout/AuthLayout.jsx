export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div style={{
      minHeight:"100vh", background:"var(--bg)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:"24px 16px",
    }}>
      {/* Background glow */}
      <div style={{
        position:"fixed", top:"20%", left:"50%", transform:"translateX(-50%)",
        width:600, height:400, borderRadius:"50%",
        background:"radial-gradient(ellipse, rgba(79,142,247,0.07) 0%, transparent 70%)",
        pointerEvents:"none",
      }}/>

      <div style={{ width:"100%", maxWidth:420, position:"relative" }}>
        {/* Logo */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", marginBottom:14 }}>
            <svg width="52" height="52" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="authbg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#4F8EF7"/>
                  <stop offset="100%" stopColor="#2DD4A0"/>
                </linearGradient>
              </defs>
              <rect width="64" height="64" rx="16" fill="url(#authbg)"/>
              <rect x="14" y="24" width="24" height="22" rx="3" fill="white" opacity="0.95"/>
              <line x1="14" y1="31" x2="38" y2="31" stroke="#4F8EF7" strokeWidth="1.5"/>
              <line x1="26" y1="24" x2="26" y2="31" stroke="#4F8EF7" strokeWidth="1.5"/>
              <path d="M40 35 L52 35 M47 29 L53 35 L47 41" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="26" cy="42" r="3" fill="#2DD4A0"/>
            </svg>
          </div>
          <h1 style={{ fontSize:26, fontWeight:800, color:"var(--text)", margin:"0 0 6px", letterSpacing:"-0.5px" }}>
            Livr<span style={{ color:"#4F8EF7" }}>'</span>O
          </h1>
          {title && <p style={{ fontSize:14, color:"var(--text-sub)", margin:0 }}>{title}</p>}
        </div>

        {/* Card */}
        <div style={{
          background:"var(--card)", border:"1px solid var(--border)",
          borderRadius:16, padding:"28px 28px 24px",
          boxShadow:"0 20px 60px rgba(0,0,0,0.4)",
        }}>
          {subtitle && (
            <p style={{ fontSize:13, color:"var(--text-sub)", marginBottom:20, lineHeight:1.5 }}>
              {subtitle}
            </p>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}
