import { useEffect, useRef, useState } from "react";

export default function QRScanner({ onScan, onClose }) {
  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const streamRef   = useRef(null);
  const rafRef      = useRef(null);
  const [status, setStatus] = useState("Chargement de la caméra…");
  const [error,  setError]  = useState("");

  useEffect(() => {
    let jsQR = null;

    const loadLib = () =>
      new Promise(resolve => {
        if (window.jsQR) { resolve(window.jsQR); return; }
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js";
        s.onload = () => resolve(window.jsQR);
        document.head.appendChild(s);
      });

    const start = async () => {
      try {
        jsQR = await loadLib();
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setStatus("Pointez la caméra sur le QR code");
          scan(jsQR);
        }
      } catch (err) {
        setError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
      }
    };

    const scan = (lib) => {
      const tick = () => {
        const video  = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
          rafRef.current = requestAnimationFrame(tick);
          return;
        }
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = lib(img.data, img.width, img.height);
        if (code) {
          // Expected format: DELIVEROS:ORDER:123
          const match = code.data.match(/^DELIVEROS:ORDER:(\d+)$/);
          if (match) {
            onScan(parseInt(match[1]));
            return;
          } else {
            setStatus("QR code non reconnu — réessayez");
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    start();

    return () => {
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [onScan]);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1100, flexDirection: "column", gap: 16, padding: 20,
    }}>
      <div style={{ color: "#E8EAF0", fontSize: 16, fontWeight: 600 }}>Scanner le QR code</div>

      {error ? (
        <div style={{ color: "#F75050", fontSize: 13, maxWidth: 300, textAlign: "center" }}>{error}</div>
      ) : (
        <div style={{ position: "relative", width: 300, height: 300, borderRadius: 16, overflow: "hidden" }}>
          <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover" }} muted playsInline />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          {/* Scanner overlay */}
          <div style={{
            position: "absolute", inset: 0,
            border: "3px solid #4F8EF7", borderRadius: 16, pointerEvents: "none",
            boxShadow: "inset 0 0 0 9999px rgba(0,0,0,0.35)",
          }} />
          {/* Corner marks */}
          {[
            { top: 12, left: 12 }, { top: 12, right: 12 },
            { bottom: 12, left: 12 }, { bottom: 12, right: 12 },
          ].map((pos, i) => (
            <div key={i} style={{
              position: "absolute", width: 24, height: 24, ...pos,
              borderTop: i < 2 ? "3px solid #4F8EF7" : "none",
              borderBottom: i >= 2 ? "3px solid #4F8EF7" : "none",
              borderLeft: i % 2 === 0 ? "3px solid #4F8EF7" : "none",
              borderRight: i % 2 === 1 ? "3px solid #4F8EF7" : "none",
            }} />
          ))}
        </div>
      )}

      <div style={{ color: "#9CA3AF", fontSize: 13 }}>{status}</div>

      <button onClick={onClose} style={{
        marginTop: 8, background: "transparent", border: "1px solid #4B5563",
        color: "#9CA3AF", borderRadius: 10, padding: "10px 24px",
        fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
      }}>
        Annuler
      </button>
    </div>
  );
}
