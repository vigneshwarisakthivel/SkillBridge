import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as faceapi from "face-api.js";
import { getPublicTest, logMalpractice, submitTest } from "../services/apiServices";

// ─────────────────────────────────────────────────────────────────────────────
// PROCTORING CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const MAX_ALERTS           = 10;
const WARN_AT              = 7;
const ALERT_COOLDOWN       = 15000;
const DETECT_EVERY         = 5000;
const FRAME_EVERY          = 30000;
const NO_FACE_STREAK       = 3;
const MULTI_FACE_STREAK    = 2;
const HEAD_STREAK          = 5;
const EYE_STREAK           = 6;
const HEAD_YAW_THRESHOLD   = 0.28;
const EYE_HORIZ_THRESHOLD  = 130;
const EYE_VERT_THRESHOLD   = 95;
const IDENTITY_THRESHOLD   = 0.52;
const IDENTITY_STREAK      = 3;
const AUDIO_THRESHOLD      = 62;
const AUDIO_SUSTAIN_FRAMES = 35;
const AUDIO_DECAY          = 3;
const MODEL_URL = "https://justadudewhohacks.github.io/face-api.js/models";
const candidateName = localStorage.getItem("candidate_name");
const candidateEmail = localStorage.getItem("candidate_email");

console.log("NAME:", candidateName);
console.log("EMAIL:", candidateEmail);
// ─────────────────────────────────────────────────────────────────────────────
// CSS — exact copy of ADMIN_CSS variables + classes
// ─────────────────────────────────────────────────────────────────────────────
const PAGE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --ink:#0B0D11; --ink2:#0F1219; --ink3:#141820; --ink4:#1B2030;
    --gold:#C4A15E; --gold2:#E8D5B0; --gold3:#8B6830;
    --ivory:#F0E8D8; --slate:#8594AE; --slate2:#D1D5DB;
    --border:rgba(196,161,94,.14); --border2:rgba(196,161,94,.07);
    --glass:rgba(48,19,19,.02);
    --serif:'DM Serif Display',serif; --display:'Syne',sans-serif; --body:'DM Sans',sans-serif;
    --fs-title:28px; --fs-section:20px; --fs-card:18px;
    --fs-body:14px; --fs-secondary:13px; --fs-small:12px; --fs-micro:11px; --fs-xs:11px; --fs-sm:13px;
  }
  html,body,#root{height:100%;width:100%;background:var(--ink);}
  body{font-family:var(--body);background:var(--ink);color:var(--ivory);-webkit-font-smoothing:antialiased;font-size:var(--fs-body);line-height:1.6;}

  .btn-p{display:inline-flex;align-items:center;gap:8px;padding:6px 15px;border-radius:4px;border:none;cursor:pointer;background:var(--gold);color:var(--ink);font-family:var(--display);font-size:var(--fs-xs);font-weight:700;letter-spacing:.05em;transition:transform .2s,box-shadow .2s,background .2s;position:relative;overflow:hidden;}
  .btn-p::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.13),transparent);pointer-events:none;}
  .btn-p:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(196,161,94,.28);background:var(--gold2);}
  .btn-p:disabled{opacity:.4;cursor:not-allowed;transform:none;box-shadow:none;}

  .btn-ghost{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:4px;cursor:pointer;background:transparent;border:1px solid var(--border2);color:var(--slate);font-family:var(--display);font-size:var(--fs-xs);font-weight:600;letter-spacing:.04em;transition:border-color .2s,background .2s,color .2s;}
  .btn-ghost:hover{border-color:rgba(196,161,94,.22);color:var(--ivory);}
  .btn-ghost:disabled{opacity:.35;cursor:not-allowed;}

  .btn-o{display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:4px;cursor:pointer;background:transparent;border:1px solid rgba(196,161,94,.22);color:var(--gold2);font-family:var(--display);font-size:var(--fs-xs);font-weight:600;letter-spacing:.04em;transition:border-color .2s,background .2s,color .2s;}
  .btn-o:hover{border-color:var(--gold);background:rgba(196,161,94,.06);color:var(--ivory);}

  .card{background:var(--glass);border:1px solid var(--border2);border-radius:8px;transition:transform .28s cubic-bezier(.22,1,.36,1),box-shadow .28s ease,border-color .28s ease;}
  .card:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(0,0,0,.32),0 0 0 1px rgba(196,161,94,.12);border-color:var(--border);}
  .card-static{background:var(--glass);border:1px solid var(--border2);border-radius:8px;}

  .pill-active{display:inline-flex;align-items:center;gap:4px;padding:2px 10px;border-radius:2px;background:rgba(107,224,146,.08);border:1px solid rgba(107,224,146,.2);color:#6BE092;font-size:10px;font-weight:700;letter-spacing:.08em;font-family:var(--display);}
  .pill-draft{display:inline-flex;align-items:center;gap:4px;padding:2px 10px;border-radius:2px;background:rgba(196,161,94,.08);border:1px solid rgba(196,161,94,.25);color:#C4A15E;font-size:10px;font-weight:700;letter-spacing:.08em;font-family:var(--display);}
  .pill-inactive{display:inline-flex;align-items:center;gap:4px;padding:2px 10px;border-radius:2px;background:rgba(133,148,174,.07);border:1px solid rgba(133,148,174,.15);color:var(--slate);font-size:10px;font-weight:700;letter-spacing:.08em;font-family:var(--display);}

  .sp{display:inline-block;padding:2px 10px;border-radius:2px;background:rgba(196,161,94,.09);border:1px solid rgba(196,161,94,.2);color:var(--gold);font-size:var(--fs-xs);font-weight:700;letter-spacing:.1em;font-family:var(--display);}

  .input-field{width:100%;background:rgba(255,255,255,.03);border:1px solid var(--border2);border-radius:4px;padding:10px 14px;color:var(--ivory);font-family:var(--body);font-size:var(--fs-sm);outline:none;transition:border-color .2s;}
  .input-field:focus{border-color:rgba(196,161,94,.4);}
  .input-field::placeholder{color:var(--slate2);}

  .section-label{display:inline-flex;align-items:center;gap:7px;padding:4px 12px;border-radius:2px;margin-bottom:16px;background:rgba(196,161,94,.07);border:1px solid rgba(196,161,94,.2);color:#C4A15E;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;font-family:'Syne',sans-serif;}

  .bar-track{height:3px;background:rgba(196,161,94,.1);border-radius:2px;overflow:hidden;}
  .bar-fill{height:100%;border-radius:2px;background:linear-gradient(90deg,var(--gold3),var(--gold));transition:width 1.2s cubic-bezier(.22,1,.36,1);}

  .opt-row{display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:4px;cursor:pointer;border:1px solid var(--border2);background:transparent;transition:border-color .15s,background .15s;margin-bottom:6px;user-select:none;}
  .opt-row:hover{border-color:rgba(196,161,94,.22);background:rgba(196,161,94,.03);}
  .opt-row.sel{border-color:rgba(196,161,94,.35);background:rgba(196,161,94,.07);}

  .q-nav-btn{width:30px;height:30px;border-radius:4px;border:1px solid var(--border2);background:transparent;color:var(--slate);font-family:var(--display);font-weight:700;font-size:10px;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center;}
  .q-nav-btn:hover{border-color:rgba(196,161,94,.22);color:var(--ivory);}
  .q-nav-btn.answered{border-color:rgba(196,161,94,.3);color:var(--gold);background:rgba(196,161,94,.07);}
  .q-nav-btn.current{border-color:var(--gold);background:var(--gold);color:var(--ink);}
  .q-nav-btn.flagged{border-color:rgba(224,122,122,.3);color:#E07A7A;background:rgba(224,122,122,.06);}

  .alert-banner{position:fixed;top:0;left:0;right:0;z-index:9998;padding:8px 24px;text-align:center;font-family:var(--display);font-weight:700;font-size:var(--fs-xs);letter-spacing:.06em;box-shadow:0 4px 20px rgba(0,0,0,.4);animation:slideDown .25s ease;display:flex;align-items:center;justify-content:center;gap:8px;}
  .alert-banner.err{background:rgba(192,112,112,.95);color:#fff;}
  .alert-banner.warn{background:rgba(196,161,94,.92);color:var(--ink);}

  .live-dot{width:7px;height:7px;border-radius:50%;background:#6BE092;display:inline-block;animation:pulse 2s infinite;}

  ::-webkit-scrollbar{width:4px;}
  ::-webkit-scrollbar-track{background:var(--ink2);}
  ::-webkit-scrollbar-thumb{background:var(--gold3);border-radius:2px;}

  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  @keyframes slideDown{from{transform:translateY(-110%)}to{transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.8)}}
  @keyframes blink{0%,100%{opacity:1}50%{opacity:.25}}
  @keyframes scanline{0%{top:-10%}100%{top:110%}}
  @keyframes bounceIn{0%{opacity:0;transform:scale(.8)}65%{transform:scale(1.03)}100%{opacity:1;transform:scale(1)}}
  @keyframes glow{0%,100%{opacity:.5}50%{opacity:1}}
  .fade-up{animation:fadeUp .5s cubic-bezier(.22,1,.36,1) both;}
  .d1{animation-delay:.07s;}
  .d2{animation-delay:.14s;}
  .d3{animation-delay:.21s;}
`;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const eyeCenter = pts => ({ x: pts.reduce((s,p)=>s+p.x,0)/pts.length, y: pts.reduce((s,p)=>s+p.y,0)/pts.length });
const getHeadYaw = lm => { const jaw=lm.getJawOutline(), jw=jaw[jaw.length-1].x-jaw[0].x; return (lm.getNose()[3].x-(jaw[0].x+jw/2))/jw; };
const hasAnswer  = a  => a !== undefined && a !== null && a !== "" && !(Array.isArray(a) && a.length === 0);

// Shuffle array (Fisher-Yates)
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// Check if test is within its access window
function checkAccessWindow(test) {
  const now = new Date();
  if (test.start_date) {
    const start = new Date(test.start_date);
    if (now < start) return { allowed: false, reason: `This assessment opens on ${start.toLocaleDateString()} at ${start.toLocaleTimeString()}.` };
  }
  if (test.end_date) {
    let end = new Date(test.end_date);
    if (test.due_time) {
      const [h, m] = test.due_time.split(":");
      end.setHours(Number(h), Number(m), 0, 0);
    } else {
      end.setHours(23, 59, 59, 999);
    }
    if (now > end) return { allowed: false, reason: `This assessment closed on ${end.toLocaleDateString()}.` };
  }
  return { allowed: true };
}

function useTabVisibility(onSwitch) {
  useEffect(() => {
    const h = () => { if (document.hidden) onSwitch(); };
    document.addEventListener("visibilitychange", h);
    return () => document.removeEventListener("visibilitychange", h);
  }, [onSwitch]);
}

function useFullscreen(onExit) {
  const elementRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const enter = useCallback(async () => {
    const el = elementRef.current || document.documentElement;
    try { if (el.requestFullscreen) await el.requestFullscreen(); else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen(); } catch(e) {}
  }, []);
  useEffect(() => {
    const h = () => { const f = !!(document.fullscreenElement || document.webkitFullscreenElement); setIsFullscreen(f); if (!f) onExit?.(); };
    document.addEventListener("fullscreenchange", h); document.addEventListener("webkitfullscreenchange", h);
    return () => { document.removeEventListener("fullscreenchange", h); document.removeEventListener("webkitfullscreenchange", h); };
  }, [onExit]);
  return { elementRef, isFullscreen, enter };
}

function Spinner({ size = 14 }) {
  return <div style={{ width: size, height: size, borderRadius: "50%", border: "2px solid rgba(196,161,94,.15)", borderTopColor: "var(--gold)", animation: "spin .7s linear infinite", flexShrink: 0 }}/>;
}

// ─────────────────────────────────────────────────────────────────────────────
// BROWSER SECURITY ENFORCER
// Applies disable_* settings from the test config to the document
// ─────────────────────────────────────────────────────────────────────────────
function useBrowserSecurity(test) {
  useEffect(() => {
    if (!test) return;
    const handlers = [];

    if (test.disable_right_click) {
      const h = e => e.preventDefault();
      document.addEventListener("contextmenu", h);
      handlers.push(() => document.removeEventListener("contextmenu", h));
    }

    if (test.disable_copy_paste) {
      const hCopy  = e => e.preventDefault();
      const hPaste = e => e.preventDefault();
      const hCut   = e => e.preventDefault();
      document.addEventListener("copy",  hCopy);
      document.addEventListener("paste", hPaste);
      document.addEventListener("cut",   hCut);
      handlers.push(
        () => document.removeEventListener("copy",  hCopy),
        () => document.removeEventListener("paste", hPaste),
        () => document.removeEventListener("cut",   hCut),
      );
    }

    if (test.disable_printing) {
      const hKey = e => { if ((e.ctrlKey || e.metaKey) && e.key === "p") { e.preventDefault(); e.stopPropagation(); } };
      window.addEventListener("keydown", hKey);
      // Also inject CSS to hide print
      const style = document.createElement("style");
      style.id = "__no-print__";
      style.textContent = "@media print { body { display: none !important; } }";
      document.head.appendChild(style);
      handlers.push(
        () => window.removeEventListener("keydown", hKey),
        () => document.getElementById("__no-print__")?.remove(),
      );
    }

    if (test.disable_translate) {
      // Set meta tag to prevent auto-translate
      const meta = document.createElement("meta");
      meta.name = "google"; meta.content = "notranslate"; meta.id = "__no-translate__";
      document.head.appendChild(meta);
      handlers.push(() => document.getElementById("__no-translate__")?.remove());
    }

    // Disable keyboard shortcuts for developer tools / save
    const hShortcuts = e => {
      if ((e.ctrlKey || e.metaKey) && ["s", "u", "i", "j"].includes(e.key.toLowerCase())) e.preventDefault();
      if (e.key === "F12") e.preventDefault();
    };
    window.addEventListener("keydown", hShortcuts);
    handlers.push(() => window.removeEventListener("keydown", hShortcuts));

    return () => handlers.forEach(fn => fn());
  }, [test]);

  // Autocomplete / spellcheck attributes are applied inline on inputs (see input-field usage)
}

// ─────────────────────────────────────────────────────────────────────────────
// ALERT BANNER
// ─────────────────────────────────────────────────────────────────────────────
function AlertBanner({ message, type = "err", topOffset = 0 }) {
  if (!message) return null;
  return <div className={`alert-banner ${type}`} style={{ top: topOffset }}>{message}</div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// FULLSCREEN PROMPT
// ─────────────────────────────────────────────────────────────────────────────
function FullscreenPrompt({ onEnter }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "rgba(11,13,17,.97)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14, animation: "fadeIn .3s ease" }}>
      <div style={{ width: 44, height: 44, borderRadius: 6, background: "var(--ink2)", border: "1px solid var(--border2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⛶</div>
      <div style={{ fontFamily: "var(--serif)", fontSize: 20, color: "var(--ivory)", fontWeight: 400 }}>Fullscreen Required</div>
      <p style={{ color: "var(--slate)", fontSize: "var(--fs-small)", fontFamily: "var(--body)", textAlign: "center", maxWidth: 300, lineHeight: 1.75 }}>
        This assessment must be completed in fullscreen. Exiting fullscreen is logged as a violation.
      </p>
      <button className="btn-p" onClick={onEnter}>Enter Fullscreen →</button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMER
// ─────────────────────────────────────────────────────────────────────────────
function Timer({ totalSeconds, onExpire }) {
  const [left, setLeft] = useState(totalSeconds);
  useEffect(() => {
    if (left <= 0) { onExpire(); return; }
    const id = setTimeout(() => setLeft(s => s - 1), 1000);
    return () => clearTimeout(id);
  }, [left, onExpire]);
  const m = String(Math.floor(left / 60)).padStart(2, "0");
  const s = String(left % 60).padStart(2, "0");
  const pct = (left / totalSeconds) * 100;
  const color = pct > 50 ? "#6BE092" : pct > 20 ? "var(--gold)" : "#E07A7A";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "5px 11px", borderRadius: 4, background: "rgba(255,255,255,.03)", border: "1px solid var(--border2)" }}>
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: `conic-gradient(${color} ${pct}%, rgba(255,255,255,.05) 0)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <div style={{ width: 11, height: 11, borderRadius: "50%", background: "var(--ink2)" }}/>
      </div>
      <span style={{ fontFamily: "var(--display)", fontSize: 13, color, fontWeight: 700, letterSpacing: "-.3px", animation: pct <= 10 ? "blink 1s ease infinite" : "none" }}>{m}:{s}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IDENTITY CAPTURE
// ─────────────────────────────────────────────────────────────────────────────
function IdentityCapture({ onCaptureDone }) {
  const videoRef = useRef(null), streamRef = useRef(null);
  const [status, setStatus] = useState("loading");
  const [loadMsg, setLoadMsg] = useState("Initialising…");
  const [snapshot, setSnapshot] = useState(null);
  const [checking, setChecking] = useState(false);
  const [faceOk, setFaceOk] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoadMsg("Loading face detection models…");
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        setLoadMsg("Loading recognition engine…");
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        setLoadMsg("Starting camera…");
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" } });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream; setStatus("ready");
      } catch(e) { if (!cancelled) setStatus("error"); }
    })();
    return () => { cancelled = true; streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  useEffect(() => {
    if (status === "ready" && videoRef.current && streamRef.current) { videoRef.current.srcObject = streamRef.current; videoRef.current.play().catch(() => {}); }
  }, [status]);

  const capture = async () => {
    if (!videoRef.current || checking) return; setChecking(true);
    try {
      const dets = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: .5 })).withFaceLandmarks();
      if (dets.length === 0) { alert("No face detected — ensure your face is clearly visible."); return; }
      if (dets.length > 1) { alert("Multiple faces detected — only you should be in the frame."); return; }
      if (Math.abs(getHeadYaw(dets[0].landmarks)) > 0.25) { alert("Please face the camera directly."); return; }
      const c = document.createElement("canvas"); c.width = videoRef.current.videoWidth; c.height = videoRef.current.videoHeight;
      c.getContext("2d").drawImage(videoRef.current, 0, 0);
      setSnapshot(c.toDataURL("image/jpeg", .9)); setFaceOk(true); setStatus("captured");
    } finally { setChecking(false); }
  };

  const retake  = () => { setSnapshot(null); setFaceOk(false); setStatus("ready"); };
  const confirm = () => { streamRef.current?.getTracks().forEach(t => t.stop()); onCaptureDone(snapshot); };

  return (
    <div>
      <p style={{ color: "var(--slate)", fontFamily: "var(--body)", fontSize: "var(--fs-small)", lineHeight: 1.75, marginBottom: 14 }}>
        Take a clear, well-lit photo of your face. This will be used to verify your identity throughout the session.
      </p>
      {status === "error" && (
        <div style={{ padding: "10px 14px", borderRadius: 4, background: "rgba(224,122,122,.07)", border: "1px solid rgba(224,122,122,.2)", color: "#E07A7A", fontFamily: "var(--body)", fontSize: "var(--fs-small)" }}>
          Camera access denied. Please allow permissions and reload.
        </div>
      )}
      {status === "loading" && (
        <div style={{ padding: "44px 0", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
          <Spinner size={22}/><span style={{ fontFamily: "var(--display)", fontSize: "var(--fs-micro)", color: "var(--slate)", letterSpacing: ".08em" }}>{loadMsg}</span>
        </div>
      )}
      {(status === "ready" || status === "captured") && (
        <div style={{ position: "relative", borderRadius: 6, overflow: "hidden", background: "#060609", aspectRatio: "4/3", marginBottom: 10, border: "1px solid var(--border2)" }}>
          <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", display: status === "captured" ? "none" : "block", transform: "scaleX(-1)" }}/>
          {snapshot && <img src={snapshot} alt="ID" style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}/>}
          {status === "ready" && (
            <>
              <svg width="100%" height="100%" viewBox="0 0 640 480" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
                <defs><mask id="om2"><rect width="640" height="480" fill="white"/><ellipse cx="320" cy="240" rx="128" ry="165" fill="black"/></mask></defs>
                <rect width="640" height="480" fill="rgba(0,0,0,.5)" mask="url(#om2)"/>
                <ellipse cx="320" cy="240" rx="128" ry="165" fill="none" stroke="rgba(196,161,94,.55)" strokeWidth="1.5" strokeDasharray="7 5"/>
              </svg>
              <div style={{ position: "absolute", bottom: 10, left: 0, right: 0, textAlign: "center", fontFamily: "var(--display)", fontSize: "var(--fs-micro)", color: "rgba(196,161,94,.8)", letterSpacing: ".08em" }}>Align your face within the guide</div>
            </>
          )}
          {status === "captured" && faceOk && (
            <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", background: "rgba(107,224,146,.08)", border: "1px solid #6BE092", color: "#6BE092", fontFamily: "var(--display)", fontSize: "var(--fs-micro)", fontWeight: 700, padding: "3px 12px", borderRadius: 2, letterSpacing: ".08em", animation: "bounceIn .4s ease", whiteSpace: "nowrap" }}>✓ IDENTITY CAPTURED</div>
          )}
        </div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        {status === "ready" && <button className="btn-p" onClick={capture} disabled={checking} style={{ flex: 1, justifyContent: "center" }}>{checking ? <><Spinner size={11}/> Verifying…</> : "📸  Capture Photo"}</button>}
        {status === "captured" && <><button className="btn-ghost" onClick={retake} style={{ flex: 1, justifyContent: "center" }}>↺  Retake</button><button className="btn-p" onClick={confirm} style={{ flex: 2, justifyContent: "center" }}>Confirm &amp; Begin →</button></>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROCTORING SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────
function ProctoringPanel({ testId, studentId, referenceImageDataURL, onAlert, onTabSwitch, onForceExit, alertCount, tabSwitches, fsExits }) {
  const videoRef = useRef(null), streamRef = useRef(null);
  const audioCtxRef = useRef(null), analyserRef = useRef(null);
  const lastAlertRef = useRef({}), baselineEyesRef = useRef(null), refDescRef = useRef(null);
  const alertCountRef = useRef(0), calibratedRef = useRef(false);
  const streaks = useRef({ noFace: 0, multiFace: 0, head: 0, eye: 0, identity: 0 });
  const [camReady, setCamReady] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const fireAlert = useCallback((message, eventType, countIt = true, cooldown = ALERT_COOLDOWN) => {
    const now = Date.now(), last = lastAlertRef.current[eventType] || 0;
    if (now - last < cooldown) return;
    lastAlertRef.current[eventType] = now;
    logMalpractice({ test_id: testId,   name: candidateName,      // ✅ ADD THIS
  email: candidateEmail, event_type: eventType });
    onAlert(message, countIt);
    if (countIt) { alertCountRef.current++; if (alertCountRef.current >= MAX_ALERTS) onForceExit(alertCountRef.current); }
  }, [testId, studentId, onAlert, onForceExit]);

  useTabVisibility(useCallback(() => { fireAlert("⚠ Tab switch detected. Stay on this page.", "tab_switch", true, 8000); onTabSwitch(); }, [fireAlert, onTabSwitch]));

  useEffect(() => {
    if (!referenceImageDataURL) return;
    (async () => {
      try {
        const img = new Image(); img.src = referenceImageDataURL;
        await new Promise(r => { img.onload = r; });
        const det = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: .5 })).withFaceLandmarks().withFaceDescriptor();
        if (det) refDescRef.current = det.descriptor;
      } catch(e) {}
    })();
  }, [referenceImageDataURL]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" }, audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false } });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.onloadedmetadata = () => { videoRef.current.play(); setCamReady(true); setTimeout(calibrate, 4000); }; }
        setupAudio(stream);
      } catch(e) { onAlert("⚠ Camera/microphone access required for proctoring.", false); }
    })();
    return () => { cancelled = true; streamRef.current?.getTracks().forEach(t => t.stop()); audioCtxRef.current?.close(); };
  }, []);

  const setupAudio = stream => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const src = ctx.createMediaStreamSource(stream); const analyser = ctx.createAnalyser(); analyser.fftSize = 2048; src.connect(analyser);
    audioCtxRef.current = ctx; analyserRef.current = analyser;
    const buf = new Uint8Array(analyser.frequencyBinCount); let tf = 0;
    const tick = () => {
      if (!analyserRef.current) return; analyser.getByteFrequencyData(buf);
      const avg = buf.slice(14, 158).reduce((s, v) => s + v, 0) / 144;
      if (avg > AUDIO_THRESHOLD) { tf++; if (tf >= AUDIO_SUSTAIN_FRAMES) { fireAlert("⚠ Voice detected — remain silent.", "talking_audio", false, 20000); tf = 0; } }
      else { tf = Math.max(0, tf - AUDIO_DECAY); } requestAnimationFrame(tick);
    }; tick();
  };

  const calibrate = async () => {
    if (!videoRef.current) return;
    try {
      const det = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 416 })).withFaceLandmarks();
      if (det && Math.abs(getHeadYaw(det.landmarks)) < 0.15) { const lm = det.landmarks; baselineEyesRef.current = { left: eyeCenter(lm.getLeftEye()), right: eyeCenter(lm.getRightEye()) }; calibratedRef.current = true; }
      else { setTimeout(calibrate, 3000); }
    } catch(e) { setTimeout(calibrate, 3000); }
  };

  const detect = useCallback(async () => {
    if (!videoRef.current || !camReady) return;
    let dets; try { dets = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: .5 })).withFaceLandmarks().withFaceDescriptors(); } catch(e) { return; }
    if (dets.length === 0) { streaks.current.noFace++; streaks.current.multiFace = 0; if (streaks.current.noFace >= NO_FACE_STREAK) { fireAlert("⚠ Face not visible — stay in front of the camera.", "no_face", true); streaks.current.noFace = 0; } return; }
    streaks.current.noFace = 0;
    if (dets.length > 1) { streaks.current.multiFace++; if (streaks.current.multiFace >= MULTI_FACE_STREAK) { fireAlert("⚠ Another person detected in frame.", "multiple_faces", true); streaks.current.multiFace = 0; } return; }
    streaks.current.multiFace = 0;
    const det = dets[0]; const lm = det.landmarks;
    if (refDescRef.current && det.descriptor) { const dist = faceapi.euclideanDistance(refDescRef.current, det.descriptor); if (dist > IDENTITY_THRESHOLD) { streaks.current.identity++; if (streaks.current.identity >= IDENTITY_STREAK) { fireAlert("⚠ Identity mismatch detected.", "identity_mismatch", true); streaks.current.identity = 0; } } else { streaks.current.identity = 0; } }
    const yaw = getHeadYaw(lm);
    if (Math.abs(yaw) > HEAD_YAW_THRESHOLD) { streaks.current.head++; if (streaks.current.head >= HEAD_STREAK) { fireAlert(`⚠ Head turned ${yaw < 0 ? "left" : "right"} — face the screen.`, `head_turned_${yaw < 0 ? "left" : "right"}`, true); streaks.current.head = 0; } } else { streaks.current.head = 0; }
    if (calibratedRef.current && baselineEyesRef.current) {
      const bl = baselineEyesRef.current; const lc = eyeCenter(lm.getLeftEye()); const rc = eyeCenter(lm.getRightEye());
      const gaze = (Math.abs(lc.x - bl.left.x) > EYE_HORIZ_THRESHOLD && Math.abs(rc.x - bl.right.x) > EYE_HORIZ_THRESHOLD) || (Math.abs(lc.y - bl.left.y) > EYE_VERT_THRESHOLD && Math.abs(rc.y - bl.right.y) > EYE_VERT_THRESHOLD);
      if (gaze) { streaks.current.eye++; if (streaks.current.eye >= EYE_STREAK) { fireAlert("⚠ Prolonged gaze away from screen.", "eye_movement", true); streaks.current.eye = 0; setTimeout(calibrate, 2000); } } else { streaks.current.eye = 0; }
    }
  }, [camReady, fireAlert]);

  useEffect(() => { const id = setInterval(detect, DETECT_EVERY); return () => clearInterval(id); }, [detect]);

  useEffect(() => {
    const id = setInterval(() => {
      if (!videoRef.current || !camReady) return;
      const c = document.createElement("canvas"); c.width = videoRef.current.videoWidth / 2; c.height = videoRef.current.videoHeight / 2;
      c.getContext("2d").drawImage(videoRef.current, 0, 0, c.width, c.height);
      c.toBlob(async blob => {
        if (!blob) return;
        const fd = new FormData(); fd.append("frame", blob, "frame.jpg"); fd.append("test_id", testId); fd.append("name", candidateName);
fd.append("email", candidateEmail); fd.append("event_type", "object_detected");
        try { const base = import.meta?.env?.VITE_API_BASE_URL || "http://localhost:8000/api"; const res = await fetch(`${base}/log-malpractice/`, { method: "POST", body: fd }); const data = await res.json(); if (data.malpractice_detected) fireAlert(data.message || "⚠ Prohibited object detected.", "object_detected", true); } catch(e) {}
      }, "image/jpeg", .7);
    }, FRAME_EVERY);
    return () => clearInterval(id);
  }, [testId, studentId, camReady, fireAlert]);

  const violPct = (alertCount / MAX_ALERTS) * 100;
  const violColor = violPct === 0 ? "var(--slate)" : violPct < 50 ? "var(--gold)" : "#E07A7A";
  const checks = ["Face Detection", "Gaze Tracking", "Audio Monitor", "Identity Match", "Object Detect"];

  return (
    <aside style={{ width: collapsed ? 40 : 196, flexShrink: 0, background: "var(--ink2)", borderLeft: "1px solid var(--border2)", display: "flex", flexDirection: "column", transition: "width .25s ease", overflow: "hidden", position: "relative" }}>
      <button onClick={() => setCollapsed(v => !v)} style={{ position: "absolute", top: 9, left: collapsed ? 6 : 7, zIndex: 10, width: 24, height: 24, borderRadius: 3, border: "1px solid var(--border2)", background: "var(--ink3)", color: "var(--slate)", fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "left .25s" }}>{collapsed ? "›" : "‹"}</button>
      {collapsed && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, paddingTop: 44 }}>
          <div style={{ position: "relative", width: 24, height: 24, borderRadius: 3, overflow: "hidden", border: "1px solid var(--border2)" }}>
            <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}/>
            <div style={{ position: "absolute", bottom: 2, right: 2, width: 4, height: 4, borderRadius: "50%", background: camReady ? "#6BE092" : "#E07A7A", animation: "blink 1.8s ease infinite" }}/>
          </div>
          <span style={{ fontFamily: "var(--display)", fontSize: 9, color: violColor, fontWeight: 700, writingMode: "vertical-rl", transform: "rotate(180deg)", letterSpacing: ".06em" }}>{alertCount}/{MAX_ALERTS}</span>
        </div>
      )}
      {!collapsed && (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
          <div style={{ padding: "9px 10px 9px 36px", borderBottom: "1px solid var(--border2)", display: "flex", alignItems: "center", gap: 6 }}>
            <span className="live-dot"/><span style={{ fontFamily: "var(--display)", fontSize: 9, fontWeight: 700, color: "var(--slate)", letterSpacing: ".14em", textTransform: "uppercase" }}>PROCTORING</span>
          </div>
          <div style={{ padding: "8px 8px 0" }}>
            <div style={{ position: "relative", borderRadius: 4, overflow: "hidden", background: "#060609", aspectRatio: "4/3", border: "1px solid var(--border2)" }}>
              <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transform: "scaleX(-1)" }}/>
              {camReady && <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}><div style={{ position: "absolute", left: 0, right: 0, height: "1px", background: "linear-gradient(transparent,rgba(196,161,94,.07),transparent)", animation: "scanline 5s linear infinite" }}/></div>}
              <div style={{ position: "absolute", bottom: 5, left: 5, display: "flex", alignItems: "center", gap: 3, background: "rgba(0,0,0,.6)", borderRadius: 8, padding: "1px 5px 1px 3px" }}>
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: camReady ? "#6BE092" : "#E07A7A", animation: "blink 1.8s ease infinite", flexShrink: 0 }}/>
                <span style={{ fontFamily: "var(--display)", fontSize: 7, color: camReady ? "#6BE092" : "#E07A7A", fontWeight: 700, letterSpacing: ".06em" }}>{camReady ? "LIVE" : "INIT"}</span>
              </div>
            </div>
          </div>
          <div style={{ padding: "8px", borderBottom: "1px solid var(--border2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontFamily: "var(--display)", fontSize: 9, color: "var(--slate)", letterSpacing: ".1em", fontWeight: 700, textTransform: "uppercase" }}>Violations</span>
              <span style={{ fontFamily: "var(--display)", fontSize: 9, color: violColor, fontWeight: 700 }}>{alertCount}/{MAX_ALERTS}</span>
            </div>
            <div className="bar-track"><div className="bar-fill" style={{ width: `${violPct}%`, background: violColor }}/></div>
          </div>
          <div style={{ padding: "6px 8px", display: "flex", flexDirection: "column", gap: 4, borderBottom: "1px solid var(--border2)" }}>
            {[["Tab Exits", tabSwitches], ["FS Exits", fsExits]].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px", background: "var(--ink3)", borderRadius: 3, border: "1px solid var(--border2)" }}>
                <span style={{ fontFamily: "var(--display)", fontSize: 9, color: "var(--slate)", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>{label}</span>
                <span style={{ fontFamily: "var(--display)", fontSize: 9, color: val > 0 ? "var(--gold)" : "var(--slate)", fontWeight: 700 }}>{val}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: "6px 8px" }}>
            <div style={{ fontFamily: "var(--display)", fontSize: 9, color: "var(--slate)", letterSpacing: ".1em", fontWeight: 700, textTransform: "uppercase", marginBottom: 5 }}>Active Checks</div>
            {checks.map(label => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                <span style={{ fontFamily: "var(--body)", fontSize: 10, color: "var(--slate)" }}>{label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#6BE092", animation: "glow 2.5s ease infinite" }}/>
                  <span style={{ fontFamily: "var(--display)", fontSize: 8, color: "#6BE092", fontWeight: 700 }}>ON</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "auto", padding: "7px 8px", borderTop: "1px solid var(--border2)", fontFamily: "var(--display)", fontSize: 8, color: "var(--slate)", lineHeight: 1.6, textAlign: "center", letterSpacing: ".04em" }}>🔴 SESSION RECORDED</div>
        </div>
      )}
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONCLUSION SCREEN — shown after submit before CompletionScreen
// ─────────────────────────────────────────────────────────────────────────────
function ConclusionScreen({ test, forceExited, onDone }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <style>{PAGE_CSS}</style>
      <div style={{ width: "100%", maxWidth: 520, textAlign: "center" }} className="fade-up">
        <div style={{ width: 52, height: 52, borderRadius: 8, margin: "0 auto 18px", background: forceExited ? "rgba(224,122,122,.07)" : "rgba(107,224,146,.07)", border: `1px solid ${forceExited ? "rgba(224,122,122,.2)" : "rgba(107,224,146,.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>
          {forceExited ? "⚠" : "✓"}
        </div>
        <div style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 400, color: forceExited ? "#E07A7A" : "#6BE092", marginBottom: 8 }}>
          {forceExited ? "Assessment Terminated" : "Assessment Submitted"}
        </div>

        {/* Conclusion text from test config */}
        {test.conclusion && !forceExited && (
          <div className="card-static" style={{ padding: "16px 20px", margin: "16px 0", textAlign: "left" }}>
            <div style={{ fontFamily: "var(--display)", fontSize: 9, color: "var(--slate)", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>From the Assessment Team</div>
            <p style={{ fontFamily: "var(--body)", fontSize: "var(--fs-secondary)", color: "var(--ivory)", lineHeight: 1.85, margin: 0 }}>{test.conclusion}</p>
          </div>
        )}

        <p style={{ color: "var(--slate)", fontFamily: "var(--body)", fontSize: "var(--fs-small)", lineHeight: 1.85, maxWidth: 420, margin: "0 auto 20px" }}>
          {forceExited
            ? "Your assessment was automatically submitted due to multiple proctoring violations. The session has been flagged for administrative review."
            : "Your responses have been recorded successfully. The assessment team will review your submission and will be in touch via email regarding the outcome and next steps."
          }
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          {[["Submission", "Recorded"], ["Next Step", "Await email"]].map(([l, v]) => (
            <div key={l} className="card-static" style={{ padding: "12px 14px", textAlign: "left" }}>
              <div style={{ fontFamily: "var(--display)", fontSize: 9, color: "var(--slate)", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 3 }}>{l}</div>
              <div style={{ color: "var(--ivory)", fontFamily: "var(--body)", fontSize: "var(--fs-small)", fontWeight: 500 }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: "9px 14px", background: "rgba(255,255,255,.02)", border: "1px solid var(--border2)", borderRadius: 4, fontFamily: "var(--display)", fontSize: 9, color: "var(--slate)", letterSpacing: ".06em" }}>
          You may safely close this window.
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INSTRUCTION PAGE
// ─────────────────────────────────────────────────────────────────────────────
function InstructionPage({ test, onStartTest }) {
  const questions = test.questions || [];
  const [step, setStep] = useState("info");

  if (step === "identity") return (
    <div style={{ position: "fixed", inset: 0, background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, overflowY: "auto" }}>
      <style>{PAGE_CSS}</style>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <button className="btn-ghost" onClick={() => setStep("info")} style={{ marginBottom: 14 }}>← Back</button>
        <div className="card-static" style={{ overflow: "hidden" }}>
          <div style={{ padding: "11px 18px", borderBottom: "1px solid var(--border2)", background: "rgba(255,255,255,.015)", display: "flex", alignItems: "center", gap: 10 }}>
            <span className="sp">📸</span>
            <div>
              <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: "var(--fs-secondary)", color: "var(--ivory)", letterSpacing: ".04em" }}>Identity Verification</div>
              <div style={{ fontFamily: "var(--display)", fontSize: "var(--fs-micro)", color: "var(--slate)", marginTop: 1 }}>Take a clear photo of your face to begin</div>
            </div>
          </div>
          <div style={{ padding: "18px" }}><IdentityCapture onCaptureDone={onStartTest}/></div>
        </div>
      </div>
    </div>
  );

  const meta = [
    { label: "Questions",      value: questions.length },
    { label: "Time Limit",     value: `${Math.round(test.total_time_limit || 0)} min` },
    { label: "Total Marks",    value: test.total_marks },
    { label: "Pass Threshold", value: `${test.pass_criteria}%` },
    { label: "Subject",        value: test.subject },
    { label: "Difficulty",     value: test.difficulty },
  ];

  const rules = [
    "Camera and microphone remain active throughout the entire session.",
    "Your face must be clearly visible and centred in the frame at all times.",
    "No other person may be present or visible within the camera frame.",
    "No phone, notes, textbook, or external reference materials permitted.",
    "Do not speak or produce sustained noise during the assessment.",
    "Do not switch browser tabs or navigate away from this window at any point.",
    "Do not turn your head away from the screen for extended periods.",
    `${MAX_ALERTS} proctoring violations will trigger automatic session submission.`,
  ];

  // Security flags to display
  const securityFlags = [
    test.disable_right_click  && "Right-click disabled",
    test.disable_copy_paste   && "Copy/paste disabled",
    test.disable_printing     && "Printing disabled",
    test.disable_translate    && "Browser translate disabled",
    test.disable_autocomplete && "Autocomplete disabled",
    test.disable_spellcheck   && "Spellcheck disabled",
  ].filter(Boolean);

  return (
    <div style={{ position: "fixed", inset: 0, background: "var(--ink)", fontFamily: "var(--body)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{PAGE_CSS}</style>
      <header style={{ height: 52, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", background: "rgba(11,13,17,.95)", backdropFilter: "blur(18px)", borderBottom: "1px solid rgba(196,161,94,.12)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: "var(--display)", fontWeight: 800, letterSpacing: ".07em", fontSize: 14, background: "linear-gradient(135deg,#F5ECD7 0%,#C4A15E 40%,#E8D5B0 60%,#8B6830 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>SKILL BRIDGE</span>
          <span style={{ color: "rgba(196,161,94,.2)", fontSize: 12 }}>|</span>
          <span style={{ fontFamily: "var(--display)", fontSize: "var(--fs-micro)", color: "var(--slate)", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>Assessment Portal</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="live-dot"/>
          <span style={{ fontFamily: "var(--display)", fontSize: 9, color: "var(--slate)", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>Proctored Session</span>
        </div>
      </header>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px 60px" }}>
        <div style={{ marginBottom: 18 }} className="fade-up d1">
          <div className="section-label">◈ {test.category?.toUpperCase() || "ASSESSMENT"}</div>
          <h1 style={{ fontFamily: "var(--serif)", fontSize: "var(--fs-title)", fontWeight: 400, lineHeight: 1.15, color: "var(--ivory)", marginBottom: 4, marginTop: 0 }}>{test.title}</h1>
          {test.description && <p style={{ fontSize: "var(--fs-secondary)", color: "var(--slate)", lineHeight: 1.8, maxWidth: 600, fontWeight: 300, marginTop: 4 }}>{test.description}</p>}
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            <span className="pill-draft">{test.difficulty?.toUpperCase()}</span>
            <span className="pill-inactive">{test.subject}</span>
            {test.randomize_order && <span className="pill-inactive">RANDOMISED</span>}
            {test.allow_retakes && <span className="pill-inactive">RETAKES ALLOWED</span>}
          </div>
        </div>

        <div style={{ height: 1, background: "linear-gradient(to right, rgba(196,161,94,.14) 0%, transparent 70%)", marginBottom: 22 }}/>

        {/* ── Introduction / Instructions from test config ── */}
        {test.instructions && (
          <div className="card-static fade-up d1" style={{ padding: "16px 20px", marginBottom: 18, borderLeft: "2px solid var(--gold)" }}>
            <div style={{ fontFamily: "var(--display)", fontSize: 9, color: "var(--gold)", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 8 }}>
              ◈ Introduction &amp; Instructions
            </div>
            <p style={{ fontFamily: "var(--body)", fontSize: "var(--fs-secondary)", color: "var(--ivory)", lineHeight: 1.85, margin: 0 }}>{test.instructions}</p>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }} className="fade-up d2">
          {/* Left — Assessment details */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontFamily: "var(--display)", fontSize: 9, fontWeight: 700, color: "var(--slate)", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 2 }}>ASSESSMENT DETAILS</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {meta.map(({ label, value }) => (
                <div key={label} className="card-static" style={{ padding: "11px 14px" }}>
                  <div style={{ fontFamily: "var(--display)", fontSize: 9, color: "var(--slate)", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 3 }}>{label}</div>
                  <div style={{ fontFamily: "var(--body)", fontSize: "var(--fs-secondary)", fontWeight: 500, color: "var(--ivory)" }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Navigation behaviour */}
            <div className="card-static" style={{ padding: "12px 14px" }}>
              <div style={{ fontFamily: "var(--display)", fontSize: 9, color: "var(--slate)", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>Navigation</div>
              {[
                [test.allow_jump_around,  "You may jump between questions freely."],
                [test.only_move_forward,  "You can only move forward — no going back."],
                [test.allow_blank_answers,"You may submit without answering all questions."],
                [test.penalize_incorrect_answers, "Incorrect answers carry a mark penalty."],
                [test.randomize_order,    "Question order has been randomised."],
              ].filter(([flag]) => flag).map(([, text], i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <div style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--gold)", flexShrink: 0 }}/>
                  <span style={{ fontFamily: "var(--body)", fontSize: "var(--fs-small)", color: "var(--slate)" }}>{text}</span>
                </div>
              ))}
              {!test.allow_jump_around && !test.only_move_forward && !test.penalize_incorrect_answers && (
                <span style={{ fontFamily: "var(--body)", fontSize: "var(--fs-small)", color: "var(--slate)" }}>Standard — answer questions in order.</span>
              )}
            </div>

            {/* Security restrictions */}
            {securityFlags.length > 0 && (
              <div className="card-static" style={{ padding: "12px 14px" }}>
                <div style={{ fontFamily: "var(--display)", fontSize: 9, color: "var(--slate)", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>Browser Restrictions</div>
                {securityFlags.map((flag, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#E07A7A", flexShrink: 0 }}/>
                    <span style={{ fontFamily: "var(--body)", fontSize: "var(--fs-small)", color: "var(--slate)" }}>{flag}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right — Proctoring rules */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
              <span className="live-dot"/>
              <div style={{ fontFamily: "var(--display)", fontSize: 9, fontWeight: 700, color: "var(--slate)", letterSpacing: "1.5px", textTransform: "uppercase" }}>PROCTORING REQUIREMENTS</div>
            </div>
            <div className="card-static" style={{ padding: "2px 16px", flex: 1 }}>
              {rules.map((rule, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 11, padding: "9px 0", borderBottom: i < rules.length - 1 ? "1px solid var(--border2)" : "none" }}>
                  <span style={{ fontFamily: "var(--display)", fontSize: 9, color: "var(--gold3)", flexShrink: 0, marginTop: 2, minWidth: 18, fontWeight: 700 }}>{String(i + 1).padStart(2, "0")}.</span>
                  <span style={{ fontFamily: "var(--body)", fontSize: "var(--fs-small)", color: "var(--slate)", lineHeight: 1.7 }}>{rule}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Identity notice */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 16px", background: "rgba(107,224,146,.04)", border: "1px solid rgba(107,224,146,.12)", borderRadius: 6, marginBottom: 20 }}>
          <div style={{ width: 26, height: 26, borderRadius: 4, flexShrink: 0, background: "rgba(107,224,146,.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>📸</div>
          <div>
            <div style={{ fontFamily: "var(--display)", fontSize: 9, fontWeight: 700, color: "#6BE092", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 3 }}>IDENTITY VERIFICATION REQUIRED</div>
            <p style={{ fontFamily: "var(--body)", fontSize: "var(--fs-small)", color: "var(--slate)", lineHeight: 1.75, margin: 0 }}>
              Before your assessment begins, you will be asked to take a clear photo of your face. Ensure you are in a well-lit environment with your face clearly visible and centred in the frame.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <button className="btn-p" onClick={() => setStep("identity")} style={{ padding: "8px 28px" }}>Proceed to Identity Verification →</button>
          <p style={{ fontFamily: "var(--display)", fontSize: 9, color: "var(--slate)", textAlign: "center", lineHeight: 1.75, letterSpacing: ".04em" }}>
            By proceeding, you confirm you have read and agree to comply with all requirements listed above.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN TEST PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function TestTakingPage() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [phase, setPhase] = useState("instructions"); // instructions | active | submitted
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [forceExited, setForceExited] = useState(false);
  const [identityImg, setIdentityImg] = useState(null);
  const [showFS, setShowFS] = useState(false);
  const startTimeRef = useRef(null);
  const [alertMsg, setAlertMsg] = useState("");
  const [warnMsg, setWarnMsg] = useState("");
  const [alertCount, setAlertCount] = useState(0);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [fsExits, setFsExits] = useState(0);
  const alertCountRef = useRef(0);
  const candidateNameCheck  = localStorage.getItem("candidate_name");
  const candidateEmailCheck = localStorage.getItem("candidate_email");

  useEffect(() => {
    if (!candidateNameCheck || !candidateEmailCheck) {
      navigate(`/test/${uuid}`, { replace: true });
    }
  }, [candidateNameCheck, candidateEmailCheck, uuid, navigate]);
  const answersRef = useRef(answers);
  useEffect(() => { answersRef.current = answers; }, [answers]);

  // Randomised question order (computed once when test loads)
  const questions = useMemo(() => {
    if (!test) return [];
    const qs = test.questions || [];
    return test.randomize_order ? shuffle(qs) : qs;
  }, [test]);

  // Apply browser security from test settings
  useBrowserSecurity(phase === "active" ? test : null);

  const { elementRef, enter: enterFS } = useFullscreen(useCallback(() => {
    if (phase === "active") { setFsExits(n => n + 1); setShowFS(true); logMalpractice?.({ test_id: test?.id, event_type: "fullscreen_exit" }); handleProctoringAlert("⚠ Fullscreen exited — please re-enter to continue.", true); }
  }, [phase]));

  useEffect(() => {
    if (!uuid) return;
    getPublicTest(uuid).then(data => {
      // Check access window
      const access = checkAccessWindow(data);
      if (!access.allowed) { setError(access.reason); setLoading(false); return; }
      setTest(data); setLoading(false);
    }).catch(() => { setError("Test not found or no longer available."); setLoading(false); });
  }, [uuid]);

  const handleProctoringAlert = useCallback((message, countIt = true) => {
    setAlertMsg(message); setTimeout(() => setAlertMsg(""), 5000);
    if (!countIt) return;
    alertCountRef.current++; const count = alertCountRef.current; setAlertCount(count);
    if (count >= WARN_AT && count < MAX_ALERTS) setWarnMsg(`⚠ ${MAX_ALERTS - count} violation${MAX_ALERTS - count !== 1 ? "s" : ""} remaining before auto-submit.`);
    else if (count < WARN_AT) setWarnMsg("");
  }, []);

  const handleTabSwitch = useCallback(() => setTabSwitches(n => n + 1), []);

  const doSubmit = useCallback(async (fe = false, count = 0, currentAnswers = null) => {
    if (!test || submitting) return; setSubmitting(true);
    const timeTaken = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : 0;

    // Apply negative marking if enabled
    let finalAnswers = currentAnswers ?? answers;

    try {
const name = localStorage.getItem("candidate_name");
const email = localStorage.getItem("candidate_email");

console.log("SENDING:", name, email); // 🔍 debug

await submitTest({
  test_id: test.id,
  answers: finalAnswers,
  time_taken: timeTaken,
  alert_count: count || alertCountRef.current,
  force_exited: fe,
  penalize: test.penalize_incorrect_answers || false,

  // ✅ THIS IS THE FIX
  name: name,
  email: email,
});
      setForceExited(fe); setPhase("submitted");
      localStorage.removeItem("candidate_name");
localStorage.removeItem("candidate_email");
    } catch(e) { console.error(e); } finally { setSubmitting(false); }
  }, [test, answers, submitting]);

  const handleForceExit = useCallback(async count => { setWarnMsg(""); setAlertMsg("🚫 Assessment auto-submitted due to repeated violations."); await doSubmit(true, count, answersRef.current); }, [doSubmit]);
  const handleSubmit    = useCallback((fe = false) => doSubmit(fe, alertCountRef.current, answersRef.current), [doSubmit]);
  const handleExpire    = useCallback(() => doSubmit(false), [doSubmit]);

  const setAnswer   = (qid, val) => setAnswers(prev => ({ ...prev, [String(qid)]: val }));
  const toggleMulti = (qid, opt) => setAnswers(prev => { const cur = prev[String(qid)] || []; return { ...prev, [String(qid)]: cur.includes(opt) ? cur.filter(o => o !== opt) : [...cur, opt] }; });
  const toggleFlag  = qid => setFlagged(prev => ({ ...prev, [String(qid)]: !prev[String(qid)] }));

  const handleStartTest = photo => { setIdentityImg(photo); setPhase("active"); startTimeRef.current = Date.now(); enterFS(); };

  // Navigation helpers respecting only_move_forward / allow_jump_around
  const canGoBack  = !test?.only_move_forward && currentQ > 0;
  const canJump    = test?.allow_jump_around !== false && !test?.only_move_forward;

  // ── Loading / error states ──
  if (loading) return (
    <div style={{ position: "fixed", inset: 0, background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10 }}>
      <style>{PAGE_CSS}</style><Spinner size={26}/>
      <span style={{ fontFamily: "var(--display)", fontSize: "var(--fs-micro)", color: "var(--slate)", fontWeight: 700, letterSpacing: ".08em" }}>Loading assessment…</span>
    </div>
  );
  if (error) return (
    <div style={{ position: "fixed", inset: 0, background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{PAGE_CSS}</style>
      <div style={{ textAlign: "center" }}>
        <div className="card-static" style={{ padding: "24px 28px", maxWidth: 420 }}>
          <div style={{ fontFamily: "var(--display)", fontSize: 9, color: "#E07A7A", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>Assessment Unavailable</div>
          <div style={{ color: "var(--ivory)", fontFamily: "var(--body)", fontSize: "var(--fs-secondary)", lineHeight: 1.7 }}>{error}</div>
        </div>
      </div>
    </div>
  );
  if (!test) return null;
  if (phase === "submitted") return <ConclusionScreen test={test} forceExited={forceExited} onDone={() => {}}/>;
  if (phase === "instructions") return <InstructionPage test={test} onStartTest={handleStartTest}/>;

  // ── Active test ──
  const totalSecs    = Math.round((test.total_time_limit || 60) * 60);
  const q            = questions[currentQ];
  const answered     = answers[String(q?.id)];
  const isLast       = currentQ === questions.length - 1;
  const isFlagged    = flagged[String(q?.id)];
  const answeredCount = questions.filter(qq => hasAnswer(answers[String(qq.id)])).length;

  return (
    <div ref={elementRef} style={{ position: "fixed", inset: 0, background: "var(--ink)", color: "var(--ivory)", fontFamily: "var(--body)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{PAGE_CSS}</style>
      {showFS && <FullscreenPrompt onEnter={() => { enterFS(); setShowFS(false); }}/>}
      <AlertBanner message={alertMsg} type="err"  topOffset={0}/>
      <AlertBanner message={warnMsg}  type="warn" topOffset={alertMsg ? 36 : 0}/>

      {/* ── HEADER ── */}
      <header style={{ flexShrink: 0, height: 52, background: "rgba(11,13,17,.95)", backdropFilter: "blur(18px)", borderBottom: "1px solid rgba(196,161,94,.12)", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <span style={{ fontFamily: "var(--display)", fontWeight: 800, fontSize: 13, letterSpacing: ".07em", background: "linear-gradient(135deg,#F5ECD7 0%,#C4A15E 40%,#E8D5B0 60%,#8B6830 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", flexShrink: 0 }}>SKILL BRIDGE</span>
          <span style={{ color: "rgba(196,161,94,.2)", flexShrink: 0 }}>|</span>
          <span style={{ fontFamily: "var(--serif)", fontSize: 15, color: "var(--ivory)", fontWeight: 400, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 320 }}>{test.title}</span>
          <span className="pill-inactive" style={{ flexShrink: 0, whiteSpace: "nowrap" }}>{test.subject}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 68, height: 2, background: "rgba(196,161,94,.1)", borderRadius: 2 }}>
              <div style={{ height: "100%", borderRadius: 2, background: "linear-gradient(90deg,var(--gold3),var(--gold))", width: `${(answeredCount / questions.length) * 100}%`, transition: "width .3s" }}/>
            </div>
            <span style={{ fontFamily: "var(--display)", fontSize: 9, color: "var(--slate)", fontWeight: 700, letterSpacing: ".06em" }}>{answeredCount}/{questions.length}</span>
          </div>
          <Timer totalSeconds={totalSecs} onExpire={handleExpire}/>
        </div>
      </header>

      {/* ── BODY ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
        <main style={{ flex: 1, overflowY: "auto", padding: "20px 24px 60px" }}>

          {/* Q header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 13 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="sp">Q {currentQ + 1} / {questions.length}</span>
              <span className="pill-inactive">{q?.type?.replace(/([a-z])([A-Z])/g, "$1 $2")?.toUpperCase()}</span>
              {/* Penalty warning */}
              {test.penalize_incorrect_answers && (
                <span style={{ fontFamily: "var(--display)", fontSize: 9, color: "#E07A7A", fontWeight: 700, letterSpacing: ".06em", background: "rgba(224,122,122,.07)", border: "1px solid rgba(224,122,122,.2)", borderRadius: 2, padding: "2px 8px" }}>
                  ⚠ Negative marking
                </span>
              )}
            </div>
            <button className={isFlagged ? "btn-o" : "btn-ghost"} onClick={() => toggleFlag(q?.id)} style={isFlagged ? { borderColor: "rgba(224,122,122,.35)", color: "#E07A7A" } : {}}>
              {isFlagged ? "🚩 Flagged" : "⚑ Flag"}
            </button>
          </div>

          {/* Question card */}
          {q && (
            <div className="card-static" style={{ overflow: "hidden", marginBottom: 13 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 16px", borderBottom: "1px solid var(--border2)", background: "rgba(255,255,255,.015)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="sp" style={{ padding: "2px 8px" }}>Q{currentQ + 1}</span>
                  <span style={{ fontFamily: "var(--display)", fontSize: 9, color: "var(--slate)", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>
                    {q.marks || test.marks_per_question || 1} mark{(q.marks || test.marks_per_question || 1) !== 1 ? "s" : ""}
                    {test.penalize_incorrect_answers && " (penalty applies)"}
                  </span>
                </div>
                <span style={{ fontFamily: "var(--display)", fontSize: 9, fontWeight: 700, letterSpacing: ".06em", color: hasAnswer(answered) ? "#6BE092" : "var(--slate)" }}>
                  {hasAnswer(answered) ? "✓ ANSWERED" : "UNANSWERED"}
                </span>
              </div>

              <div style={{ padding: "16px 18px" }}>
                <p style={{ color: "var(--ivory)", fontSize: "var(--fs-body)", lineHeight: 1.8, marginBottom: 16, fontFamily: "var(--body)" }}>{q.text}</p>

                {/* Multiple choice */}
                {q.type === "multiplechoice" && (q.options || []).map((opt, oi) => {
                  const sel = String(answered) === String(oi);
                  return (
                    <div key={oi} className={`opt-row ${sel ? "sel" : ""}`} onClick={() => setAnswer(q.id, oi)}>
                      <div style={{ width: 14, height: 14, borderRadius: "50%", flexShrink: 0, border: `1.5px solid ${sel ? "var(--gold)" : "rgba(196,161,94,.22)"}`, background: sel ? "var(--gold)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}>
                        {sel && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--ink)" }}/>}
                      </div>
                      <span style={{ fontFamily: "var(--body)", fontSize: "var(--fs-secondary)", color: sel ? "var(--ivory)" : "var(--slate)", flex: 1, lineHeight: 1.5 }}>{opt}</span>
                    </div>
                  );
                })}

                {/* Multiple response */}
                {q.type === "multipleresponse" && (
                  <>
                    <div style={{ fontFamily: "var(--display)", fontSize: 9, color: "var(--slate)", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 8 }}>Select all that apply</div>
                    {(q.options || []).map((opt, oi) => {
                      const sel = (answers[String(q.id)] || []).includes(opt);
                      return (
                        <div key={oi} className={`opt-row ${sel ? "sel" : ""}`} onClick={() => toggleMulti(q.id, opt)}>
                          <div style={{ width: 12, height: 12, borderRadius: 2, flexShrink: 0, border: `1.5px solid ${sel ? "var(--gold)" : "rgba(196,161,94,.22)"}`, background: sel ? "var(--gold)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s" }}>
                            {sel && <span style={{ color: "var(--ink)", fontSize: 8, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                          </div>
                          <span style={{ fontFamily: "var(--body)", fontSize: "var(--fs-secondary)", color: sel ? "var(--ivory)" : "var(--slate)", flex: 1 }}>{opt}</span>
                        </div>
                      );
                    })}
                  </>
                )}

                {/* True / False */}
                {q.type === "truefalse" && (
                  <div style={{ display: "flex", gap: 10 }}>
                    {[{ val: "true", label: "True", icon: "✓" }, { val: "false", label: "False", icon: "✕" }].map(({ val, label, icon }) => {
                      const sel = String(answered) === val;
                      return (
                        <button key={val} onClick={() => setAnswer(q.id, val)} style={{ flex: 1, padding: "14px", borderRadius: 6, cursor: "pointer", border: `1px solid ${sel ? "rgba(196,161,94,.35)" : "var(--border2)"}`, background: sel ? "rgba(196,161,94,.07)" : "transparent", color: sel ? "var(--gold)" : "var(--slate)", display: "flex", flexDirection: "column", alignItems: "center", gap: 7, fontFamily: "var(--display)", fontWeight: 700, fontSize: "var(--fs-small)", letterSpacing: ".08em", transition: "all .18s" }}>
                          <div style={{ width: 26, height: 26, borderRadius: "50%", background: sel ? "var(--gold)" : "rgba(255,255,255,.04)", display: "flex", alignItems: "center", justifyContent: "center", color: sel ? "var(--ink)" : "var(--slate)", fontWeight: 900, fontSize: 12, transition: "all .18s" }}>{icon}</div>
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Fill in blank */}
                {q.type === "fillintheblank" && (
                  <>
                    <div style={{ fontFamily: "var(--display)", fontSize: 9, color: "var(--slate)", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 6 }}>Your Answer</div>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Type your answer…"
                      value={answers[String(q.id)] || ""}
                      onChange={e => setAnswer(q.id, e.target.value)}
                      autoComplete={test.disable_autocomplete ? "off" : "on"}
                      spellCheck={!test.disable_spellcheck}
                    />
                  </>
                )}
              </div>
            </div>
          )}

          {/* Navigator */}
          <div className="card-static" style={{ overflow: "hidden", marginBottom: 13 }}>
            <div style={{ padding: "8px 14px", borderBottom: "1px solid var(--border2)", background: "rgba(255,255,255,.015)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "var(--display)", fontSize: 9, color: "var(--slate)", fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase" }}>Question Navigator</span>
              <span style={{ fontFamily: "var(--display)", fontSize: 9, color: "var(--slate)", fontWeight: 700 }}>{answeredCount}/{questions.length} answered</span>
            </div>
            <div style={{ padding: "11px 12px" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
                {questions.map((_, i) => {
                  const qid  = questions[i].id;
                  const hasA = hasAnswer(answers[String(qid)]);
                  const flag = flagged[String(qid)];
                  const isCur = i === currentQ;
                  // Only clickable if jump is allowed and haven't passed only_move_forward restriction
                  const clickable = canJump || (test.only_move_forward && i < currentQ ? false : canJump);
                  return (
                    <button key={i} className={`q-nav-btn ${isCur ? "current" : flag ? "flagged" : hasA ? "answered" : ""}`}
                      onClick={() => canJump && setCurrentQ(i)}
                      style={{ cursor: canJump ? "pointer" : "default", opacity: test.only_move_forward && i < currentQ ? .35 : 1 }}>
                      {i + 1}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {[{ cls: "current", label: "Current" }, { cls: "answered", label: "Answered" }, { cls: "flagged", label: "Flagged" }, { cls: "", label: "Unanswered" }].map(({ cls, label }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div className={`q-nav-btn ${cls}`} style={{ width: 12, height: 12, borderRadius: 2, cursor: "default", flexShrink: 0 }}/>
                    <span style={{ fontFamily: "var(--display)", fontSize: 9, color: "var(--slate)" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Nav buttons */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button className="btn-ghost" onClick={() => setCurrentQ(n => Math.max(0, n - 1))} disabled={!canGoBack}>← Previous</button>
            <div style={{ display: "flex", gap: 8 }}>
              {/* Skip — only shown if blank answers are allowed */}
              {test.allow_blank_answers && !isLast && (
                <button className="btn-ghost" onClick={() => setCurrentQ(n => Math.min(questions.length - 1, n + 1))}>Skip</button>
              )}
              {isLast
                ? <button className="btn-p" onClick={() => handleSubmit(false)} disabled={submitting}>{submitting ? <><Spinner size={11}/> Submitting…</> : "Submit Assessment ✓"}</button>
                : <button className="btn-p" onClick={() => setCurrentQ(n => Math.min(questions.length - 1, n + 1))}>Next →</button>
              }
            </div>
          </div>
        </main>

        {/* ── PROCTORING SIDEBAR ── */}
        <ProctoringPanel testId={test.id} studentId={null} referenceImageDataURL={identityImg} onAlert={handleProctoringAlert} onTabSwitch={handleTabSwitch} onForceExit={handleForceExit} alertCount={alertCount} tabSwitches={tabSwitches} fsExits={fsExits}/>
      </div>
    </div>
  );
}