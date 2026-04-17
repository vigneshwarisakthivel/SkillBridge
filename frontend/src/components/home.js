import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/skill.png";

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

const TECH_STACK = [
  { name: "React",        note: "Component architecture & routing",  icon: "⬡" },
  { name: "Django",       note: "REST API & authentication",         icon: "⬡" },
  { name: "MongoDB",      note: "Flexible document storage",         icon: "⬡" },
  { name: "Socket.io",    note: "Real-time score updates",           icon: "⬡" },
  { name: "OpenAI API",   note: "AI-powered recommendations",        icon: "⬡" },
  { name: "JWT + Bcrypt", note: "Secure session management",         icon: "⬡" },
];

const STATS = [
  { value: "1.5K+", label: "Tests Conducted",        icon: "◉" },
  { value: "8K+",   label: "Candidates Evaluated",   icon: "◎" },
  { value: "92%",   label: "Test Completion Rate",   icon: "◆" },
  { value: "100%",  label: "Passcode Secured Access",icon: "◇" },
];
const AV_PALETTE = [
  ["#C9974A","#8B6225"],["#5C8A72","#2E5C47"],["#6B7FA3","#3A4F73"],
  ["#A05C7A","#6B2E4E"],["#7A8F5C","#4E6329"],["#5C7A8F","#2E4E6B"],
  ["#8F6B5C","#6B3A2E"],["#7A5C8F","#4E2E6B"],
];

// ─────────────────────────────────────────────────────────────────────────────
// PARTICLE CANVAS
// ─────────────────────────────────────────────────────────────────────────────

function ParticleCanvas() {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let W = canvas.parentElement.offsetWidth;
    let H = canvas.parentElement.offsetHeight;
    canvas.width = W; canvas.height = H;

    const count = Math.min(60, Math.floor(W * H / 12000));
    const particles = Array.from({ length: count }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28,
      r: Math.random() * 1.5 + 0.4, alpha: Math.random() * 0.5 + 0.15,
      pulse: Math.random() * Math.PI * 2,
    }));

    const resize = () => {
      W = canvas.parentElement.offsetWidth; H = canvas.parentElement.offsetHeight;
      canvas.width = W; canvas.height = H;
    };
    window.addEventListener("resize", resize);

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.pulse += 0.012;
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        const a = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse));
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(196,161,94,${a})`; ctx.fill();
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(196,161,94,${0.07 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}/>;
}

// ─────────────────────────────────────────────────────────────────────────────
// ORB FIELD
// ─────────────────────────────────────────────────────────────────────────────

function OrbField() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      <div style={{ position: "absolute", top: "-15%", left: "10%",  width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle, rgba(196,161,94,0.11) 0%, transparent 70%)", filter: "blur(40px)" }}/>
      <div style={{ position: "absolute", top: "20%",  right: "-8%", width: 360, height: 360, borderRadius: "50%", background: "radial-gradient(circle, rgba(126,184,160,0.08) 0%, transparent 70%)", filter: "blur(50px)" }}/>
      <div style={{ position: "absolute", bottom: "5%",left: "30%",  width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle, rgba(155,142,196,0.07) 0%, transparent 70%)", filter: "blur(40px)" }}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCORE RING
// ─────────────────────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 72, color = "#C4A15E", delay = 0 }) {
  const [prog, setProg] = useState(0);
  const r    = (size - 10) / 2;
  const circ = 2 * Math.PI * r;

  useEffect(() => {
    const t = setTimeout(() => {
      let frame;
      const start = performance.now();
      const dur   = 900;
      const animate = (now) => {
        const p    = Math.min((now - start) / dur, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        setProg(ease * score);
        if (p < 1) frame = requestAnimationFrame(animate);
      };
      frame = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(frame);
    }, delay);
    return () => clearTimeout(t);
  }, [score, delay]);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(196,161,94,0.12)" strokeWidth={5}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
        strokeDasharray={circ} strokeDashoffset={circ - (prog / 100) * circ}
        strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.05s linear" }}/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO DASHBOARD MOCKUP
// ─────────────────────────────────────────────────────────────────────────────

function HeroDashboard() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(v => v + 1), 2400);
    return () => clearInterval(t);
  }, []);

  const bars     = [68, 82, 74, 91, 78, 95, 88];
  const animated = bars.map((b, i) => b - (tick % 3 === i % 3 ? 8 : 0));

  return (
<div style={{
  position: "relative",
  width: "100%",
  maxWidth: 560, // 👈 increased from 440
  background: "rgba(15,18,25,0.92)",
  border: "1px solid rgba(196,161,94,0.2)",
  borderRadius: 16, // 👈 slightly bigger radius
  padding: "22px 22px 18px", // 👈 more breathing space
  boxShadow: "0 40px 100px rgba(0,0,0,0.7), 0 0 60px rgba(196,161,94,0.12), inset 0 1px 0 rgba(196,161,94,0.12)",
  backdropFilter: "blur(20px)",
  transform: "perspective(900px) rotateY(-4deg) rotateX(2deg) translateX(-30px) translateY(-10px) scale(1.12)",
  
}}>
      {/* Title bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
        <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#E05C5C" }}/>
        <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#E0A05C" }}/>
        <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#5CE07A" }}/>
        <div style={{ flex: 1, textAlign: "center", fontFamily: "'Syne',sans-serif", fontSize: 10, color: "rgba(196,161,94,0.6)", letterSpacing: "1.5px", textTransform: "uppercase" }}>Admin Dashboard</div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7, marginBottom: 14 }}>
        {[["Tests Sent","24","#C4A15E"],["Passed","18","#7EB8A0"],["Pending","6","#9B8EC4"]].map(([label, val, color]) => (
          <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 7, padding: "9px 8px", textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "rgba(133,148,174,0.9)", fontFamily: "'Syne',sans-serif", letterSpacing: "1px", textTransform: "uppercase", marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 16, fontFamily: "'DM Serif Display',serif", color, fontWeight: 400 }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 7, border: "1px solid rgba(255,255,255,0.05)", padding: "10px 10px 7px", marginBottom: 12 }}>
        <div style={{ fontSize: 9, color: "rgba(133,148,174,0.7)", fontFamily: "'Syne',sans-serif", letterSpacing: "1.2px", textTransform: "uppercase", marginBottom: 8 }}>Weekly Completion</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 52 }}>
          {["M","T","W","T","F","S","S"].map((day, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
              <div style={{ width: "100%", height: animated[i] * 0.5, background: i === 5 ? "#C4A15E" : "rgba(196,161,94,0.28)", borderRadius: "3px 3px 0 0", transition: "height 0.8s cubic-bezier(.22,1,.36,1)", minHeight: 4 }}/>
              <div style={{ fontSize: 7, color: "rgba(133,148,174,0.5)", fontFamily: "'Syne',sans-serif" }}>{day}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Topic progress bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {[["React",92,"#C4A15E"],["Django",88,"#7EB8A0"],["MongoDB",95,"#9B8EC4"]].map(([topic, pct, color]) => (
          <div key={topic} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 10, color: "rgba(240,232,216,0.7)", fontFamily: "'Syne',sans-serif", width: 70, flexShrink: 0 }}>{topic}</div>
            <div style={{ flex: 1, height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 2 }}/>
            </div>
            <div style={{ fontSize: 9, color, fontFamily: "'Syne',sans-serif", width: 28, textAlign: "right" }}>{pct}%</div>
          </div>
        ))}
      </div>

      {/* AI chip badge */}
      <div style={{ position: "absolute", top: -11, right: 14, background: "linear-gradient(135deg,#1B2030,#0F1219)", border: "1px solid rgba(155,142,196,0.4)", borderRadius: 20, padding: "3px 9px", display: "flex", alignItems: "center", gap: 5 }}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#9B8EC4", boxShadow: "0 0 6px rgba(155,142,196,0.8)", animation: "pulse 2s infinite" }}/>
        <span style={{ fontSize: 8, color: "#9B8EC4", fontFamily: "'Syne',sans-serif", letterSpacing: "1.5px", textTransform: "uppercase" }}>AI Active</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FLOAT CARD
// ─────────────────────────────────────────────────────────────────────────────

function FloatCard({ style, children }) {
  return (
    <div style={{
      position: "absolute",
      background: "rgba(11,13,17,0.92)",
      border: "1px solid rgba(196,161,94,0.18)",
      borderRadius: 9,
      padding: "9px 13px",
      backdropFilter: "blur(20px)",
      boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function Av({ init, idx = 0, size = 48 }) {
  const [bg, dark] = AV_PALETTE[idx % AV_PALETTE.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg,${bg},${dark})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Serif Display',serif", color: "#fff",
      fontSize: Math.floor(size * 0.32), letterSpacing: "0.03em",
      border: `1.5px solid ${bg}55`, boxShadow: `0 0 0 3px ${bg}18`,
    }}>{init}</div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 7,
      padding: "4px 12px", borderRadius: 2, marginBottom: 14,
      background: "rgba(196,161,94,0.07)", border: "1px solid rgba(196,161,94,0.2)",
      color: "#C4A15E", fontSize: 10, fontWeight: 700, letterSpacing: "2.5px",
      textTransform: "uppercase", fontFamily: "'Syne',sans-serif",
    }}>{children}</div>
  );
}

// Gold gradient text
const G = {
  background: "linear-gradient(135deg,#F5ECD7 0%,#C4A15E 50%,#E8D5B0 100%)",
  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
};

// Logo gradient text — matches AdminLayout exactly
const LOGO_GRADIENT = {
  background: "linear-gradient(135deg,#F5ECD7 0%,#C4A15E 40%,#E8D5B0 60%,#8B6830 100%)",
  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const navigate = useNavigate();
  const [activeNav,  setActiveNav]  = useState("hero");
  const [activePerf, setActivePerf] = useState(null);
  const [visible,    setVisible]    = useState({});
  const [navScrolled,setNavScrolled]= useState(false);
  const scrollRef = useRef(null);

  const sectionRefs = {
    hero: useRef(null), about: useRef(null), features: useRef(null),
    performers: useRef(null), testimonials: useRef(null), cta: useRef(null),
  };

  const smoothScroll = (key) => {
    const el = sectionRefs[key]?.current;
    const c  = scrollRef.current;
    if (el && c) c.scrollTo({ top: el.offsetTop - 62, behavior: "smooth" });
  };

  // Scroll spy + nav colour
// Scroll spy + nav colour
useEffect(() => {
  const c = scrollRef.current;
  if (!c) return;
  const fn = () => {
    setNavScrolled(c.scrollTop > 40);
    const top = c.scrollTop + 80;
    let cur = "hero";
    Object.keys(sectionRefs).forEach(k => {
      if (sectionRefs[k].current && sectionRefs[k].current.offsetTop <= top) cur = k;
    });
    setActiveNav(cur);
  };
  c.addEventListener("scroll", fn);
  return () => c.removeEventListener("scroll", fn);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);


  // Intersection observer for reveal animations
  useEffect(() => {
    const obs = new IntersectionObserver(
      es => es.forEach(e => { if (e.isIntersecting) setVisible(v => ({ ...v, [e.target.dataset.reveal]: true })); }),
      { threshold: 0.06 }
    );
    document.querySelectorAll("[data-reveal]").forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const vis  = k => visible[k];

  // ─── CSS ───────────────────────────────────────────────────────────────────
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    :root{
      --ink:#0B0D11; --ink2:#0E1016; --ink3:#141820; --ink4:#1B2030;
      --gold:#C4A15E; --gold2:#E8D5B0; --gold3:#8B6830; --gold4:#F5ECD7;
      --ivory:#F0E8D8; --slate:#8594AE; --slate2:#56617A;
      --green:#7EB8A0; --purple:#9B8EC4; --red:#E08080; --blue:#6FA8DC;
      --border:rgba(196,161,94,.16); --border2:rgba(196,161,94,.08);
      --glass:rgba(255,255,255,.018);
      --serif:'DM Serif Display',serif; --display:'Syne',sans-serif; --body:'DM Sans',sans-serif;

      --fs-title:28px;
      --fs-section:20px;
      --fs-card:16px;
      --fs-body:14px;
      --fs-secondary:13px;
      --fs-small:12px;
      --fs-micro:11px;

      --fs-hero:42px;
      --fs-subhero:15px;
    }
    body{
      font-family:var(--body);
      background:var(--ink);
      color:var(--ivory);
      -webkit-font-smoothing:antialiased;
      font-size:var(--fs-body);
      line-height:1.65;
    }
    #sb-main::-webkit-scrollbar{width:3px;}
    #sb-main::-webkit-scrollbar-track{background:transparent;}
    #sb-main::-webkit-scrollbar-thumb{background:var(--gold3);border-radius:2px;}

    @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.6;transform:scale(0.85)}}
    @keyframes float{0%,100%{transform:perspective(900px) rotateY(-4deg) rotateX(2deg) translateY(0px)}50%{transform:perspective(900px) rotateY(-4deg) rotateX(2deg) translateY(-8px)}}
    @keyframes floatSm{0%,100%{transform:translateY(0px)}50%{transform:translateY(-5px)}}
    @keyframes fadeSlideUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}

    .rv{opacity:0;transform:translateY(20px);transition:opacity .65s cubic-bezier(.22,1,.36,1),transform .65s cubic-bezier(.22,1,.36,1);}
    .rv.in{opacity:1;transform:none;}
    .rl{opacity:0;transform:translateX(-22px);transition:opacity .65s cubic-bezier(.22,1,.36,1),transform .65s cubic-bezier(.22,1,.36,1);}
    .rl.in{opacity:1;transform:none;}
    .rr{opacity:0;transform:translateX(22px);transition:opacity .65s cubic-bezier(.22,1,.36,1),transform .65s cubic-bezier(.22,1,.36,1);}
    .rr.in{opacity:1;transform:none;}

    .card{
      background:rgba(255,255,255,.018);
      border:1px solid rgba(196,161,94,.08);
      border-radius:10px;
       padding: 18px;  
      transition:transform .3s cubic-bezier(.22,1,.36,1),box-shadow .3s ease,border-color .3s ease,background .3s ease;
    }
    .card:hover{
      transform:translateY(-3px);
      box-shadow:0 16px 48px rgba(0,0,0,.36),0 0 0 1px rgba(196,161,94,.16);
      border-color:rgba(196,161,94,.18);
      background:rgba(255,255,255,.026);
    }
.section{
  margin: 40px 0;   /* 🔥 reduce vertical spacing */
}
    .feat-card{
      background:rgba(255,255,255,.018);
      border:1px solid rgba(196,161,94,.08);
      border-radius:10px;
      transition:all .32s cubic-bezier(.22,1,.36,1);
      position:relative;
      overflow:hidden;
    }
    .feat-card:hover{
      transform:translateY(-4px) scale(1.01);
      box-shadow:0 20px 56px rgba(0,0,0,.42);
      border-color:rgba(196,161,94,.22);
    }

    .perf-card{
      background:rgba(255,255,255,.018);
      border:1px solid rgba(196,161,94,.08);
      border-radius:10px;
      cursor:pointer;
      transition:all .3s cubic-bezier(.22,1,.36,1);
      position:relative;
      overflow:hidden;
    }
    .perf-card:hover{
      transform:translateY(-5px);
      border-color:rgba(196,161,94,.28);
      background:rgba(196,161,94,.04);
    }

    .btn-p{
      display:inline-flex;align-items:center;gap:8px;
      padding:10px 22px;border-radius:4px;border:none;cursor:pointer;
      background:linear-gradient(135deg,var(--gold),#D4AB6A);
      color:var(--ink);
      font-family:var(--display);font-size:var(--fs-secondary);font-weight:700;letter-spacing:.05em;
      transition:all .2s ease;position:relative;overflow:hidden;
      box-shadow:0 4px 18px rgba(196,161,94,.22);
    }
    .btn-p::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.16),transparent 60%);pointer-events:none;}
    .btn-p:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(196,161,94,.38);background:linear-gradient(135deg,#D4AB6A,#E8D5B0);}
    .btn-p:active{transform:translateY(0px);}

    .btn-o{
      display:inline-flex;align-items:center;gap:7px;
      padding:9px 20px;border-radius:4px;cursor:pointer;
      background:transparent;border:1px solid rgba(196,161,94,.26);
      color:var(--gold2);
      font-family:var(--display);font-size:var(--fs-secondary);font-weight:600;letter-spacing:.04em;
      transition:all .2s ease;
    }
    .btn-o:hover{border-color:rgba(196,161,94,.5);background:rgba(196,161,94,.06);color:var(--ivory);box-shadow:0 4px 14px rgba(0,0,0,.18);}

    .nav-lnk{
      background:none;border:none;cursor:pointer;
      font-family:var(--display);font-size:var(--fs-micro);font-weight:700;letter-spacing:.1em;
      color:var(--slate);padding:6px 10px;border-radius:4px;
      transition:color .18s,background .18s;text-transform:uppercase;
    }
    .nav-lnk:hover{color:var(--ivory);background:rgba(255,255,255,.04);}
    .nav-lnk.active{color:var(--gold);}

    .sh{
      font-family:var(--serif);
      font-size:var(--fs-title);
      color:var(--ivory);font-weight:400;
      letter-spacing:-.018em;line-height:1.18;
      margin-bottom:8px;
    }
    .ss{color:var(--slate);font-size:var(--fs-body);line-height:1.8;max-width:460px;margin:0 auto 10px ;}

    .g3{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;}
    .g4{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;}
    .g2{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:start;}

    .rule{width:28px;height:2px;background:linear-gradient(90deg,var(--gold),transparent);border-radius:1px;margin:8px 0 16px;}
    .sp{display:inline-block;padding:3px 10px;border-radius:2px;background:rgba(196,161,94,.1);border:1px solid rgba(196,161,94,.22);color:var(--gold);font-size:var(--fs-micro);font-weight:700;letter-spacing:.12em;font-family:var(--display);}
    .bdg{display:inline-block;padding:2px 8px;border-radius:2px;margin-bottom:8px;background:rgba(255,255,255,.04);border:1px solid rgba(196,161,94,.12);color:var(--slate);font-size:10px;font-family:var(--display);letter-spacing:.06em;}

    .ttag{padding:9px 12px;border-radius:7px;background:rgba(255,255,255,.02);border:1px solid rgba(196,161,94,.08);transition:all .2s ease;cursor:default;}
    .ttag:hover{border-color:rgba(196,161,94,.2);background:rgba(196,161,94,.04);transform:translateY(-1px);}

    .tl-dot{width:8px;height:8px;border-radius:50%;background:var(--gold);box-shadow:0 0 0 3px rgba(196,161,94,.14);flex-shrink:0;margin-top:4px;}
    .tl-line{width:1px;background:rgba(196,161,94,.1);flex:1;margin:3px auto;}

    .stsep{width:1px;height:36px;background:rgba(196,161,94,.12);}

    .stat-num{font-family:var(--serif);font-size:2rem;color:var(--gold);font-weight:400;letter-spacing:-.03em;line-height:1;}

    .section-divider{height:1px;background:linear-gradient(90deg,transparent,rgba(196,161,94,.14) 30%,rgba(196,161,94,.14) 70%,transparent);margin:0;}

    .grid-bg{background-image:linear-gradient(rgba(196,161,94,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(196,161,94,.04) 1px,transparent 1px);background-size:72px 72px;}

    .dots{display:flex;justify-content:center;gap:5px;margin-top:20px;}
    .dot{height:3px;border-radius:999px;border:none;cursor:pointer;transition:all .36s ease;background:rgba(196,161,94,.15);}
    .dot.on{background:var(--gold);}

    .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.78);backdrop-filter:blur(12px);z-index:9999;display:flex;align-items:center;justify-content:center;animation:fadeIn .18s ease;}
    .modal-box{background:var(--ink3);border:1px solid rgba(196,161,94,.22);border-radius:12px;padding:32px 28px;text-align:center;max-width:320px;width:90%;box-shadow:0 40px 80px rgba(0,0,0,.6),0 0 0 1px rgba(196,161,94,.08);animation:fadeSlideUp .24s cubic-bezier(.22,1,.36,1);}

    .hero-dash{animation:float 6s ease-in-out infinite;}
    .hero-notif1{animation:floatSm 4s ease-in-out infinite;}
    .hero-notif2{animation:floatSm 5s ease-in-out 0.8s infinite;}

    /* Role cards */
    .role-card{
      background:rgba(255,255,255,.018);
      border:1px solid rgba(196,161,94,.08);
      border-radius:12px;
      padding:20px 18px;
      transition:all .3s cubic-bezier(.22,1,.36,1);
    }
    .role-card:hover{
      transform:translateY(-4px);
      border-color:rgba(196,161,94,.22);
      background:rgba(196,161,94,.03);
      box-shadow:0 20px 56px rgba(0,0,0,.36);
    }
    .role-badge{
      display:inline-flex;align-items:center;gap:6px;
      padding:4px 10px;border-radius:2px;margin-bottom:16px;
      font-family:var(--display);font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;
    }
    .role-step{
      display:flex;align-items:flex-start;gap:10px;
      padding:6px 0;border-bottom:1px solid rgba(196,161,94,.06);
    }
    .role-step:last-child{border-bottom:none;}
    .step-num{
      width:20px;height:20px;border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-family:var(--display);font-size:9px;font-weight:700;
      flex-shrink:0;margin-top:1px;
    }

    @media(max-width:900px){
      .g3,.g2{grid-template-columns:1fr!important;}
      .g4{grid-template-columns:1fr 1fr!important;}
      .nav-center{display:none!important;}
      .stsep{display:none;}
      :root{--fs-hero:32px;--fs-title:22px;}
      .hero-right{display:none!important;}
      .btn-login-desk{display:none!important;}
      .roles-grid{grid-template-columns:1fr!important;}
    }
    @media(max-width:480px){
      :root{--fs-hero:26px;}
    }
  `;

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: "var(--ink)" }}>

        {/* ═══════════════════════════════════════════════════════════════════
            NAVBAR
        ═══════════════════════════════════════════════════════════════════ */}
        <nav style={{
          height: 62, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 28px",
          background: navScrolled ? "rgba(11,13,17,0.97)" : "rgba(11,13,17,0.75)",
          backdropFilter: "blur(22px)",
          borderBottom: navScrolled ? "1px solid rgba(196,161,94,0.12)" : "1px solid transparent",
          transition: "all 0.35s ease",
          zIndex: 100,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", flexShrink: 0 }} onClick={() => smoothScroll("hero")}>
            <img src={logo} alt="Skill Bridge" style={{ height: 34, filter: "brightness(2.5) contrast(1.2)" }}/>
            <span style={{ fontFamily: "var(--display)", fontSize: 14, fontWeight: 800, letterSpacing: ".08em", ...LOGO_GRADIENT }}>
              SKILL BRIDGE
            </span>
          </div>

          <div className="nav-center" style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {[["Home","hero"],["About","about"],["Features","performers"],["How It Works","features"]].map(([label, key]) => (
              <button key={key} className={`nav-lnk${activeNav === key ? " active" : ""}`} onClick={() => smoothScroll(key)}>{label}</button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
            <button className="btn-login-desk btn-o" style={{ padding: "7px 16px", fontSize: 12 }} onClick={() => navigate("/login")}>
              Admin Login
            </button>
            <button className="btn-p" style={{ fontSize: 12, padding: "8px 18px" }} onClick={() => navigate("/register")}>
              Get Started →
            </button>
          </div>
        </nav>

        {/* ═══════════════════════════════════════════════════════════════════
            SCROLL BODY
        ═══════════════════════════════════════════════════════════════════ */}
        <div id="sb-main" ref={scrollRef} style={{ flex: 1, overflowY: "auto" }}>

          {/* ─────────────────────────────────────────────────────────────────
              HERO
          ───────────────────────────────────────────────────────────────── */}
          <section ref={sectionRefs.hero} style={{
            position: "relative", minHeight: "calc(100vh - 62px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "40px 36px 45px", overflow: "hidden",
          }}>
            <div className="grid-bg" style={{ position: "absolute", inset: 0, opacity: 0.6 }}/>
            <OrbField/>
            <ParticleCanvas/>
            <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%,-50%)", width: 560, height: 560, borderRadius: "50%", background: "radial-gradient(circle, rgba(196,161,94,0.06) 0%, transparent 65%)", pointerEvents: "none" }}/>

           <div style={{
  position: "relative",
  width: "100%",
  maxWidth: 1100,
  margin: "0 auto",
transform: "translateX(-30px)", // 👈 subtle left shift
  display: "grid",
  gridTemplateColumns: "1.1fr 0.9fr", // 👈 give left side more space
  gap: 48,
  alignItems: "center"
}}>

              {/* LEFT */}
              <div style={{ animation: "fadeSlideUp 0.85s ease both" }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "4px 12px", borderRadius: 2, marginBottom: 22, background: "rgba(196,161,94,0.07)", border: "1px solid rgba(196,161,94,0.2)", color: "var(--gold2)", fontSize: 10, fontFamily: "var(--display)", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#7EB8A0", boxShadow: "0 0 6px rgba(126,184,160,0.8)", animation: "pulse 2s infinite" }}/>
                  Full-Stack Portfolio · React · Django · MongoDB
                </div>

                <h1 style={{ fontFamily: "var(--serif)", fontSize: "var(--fs-hero)", lineHeight: 1.1, fontWeight: 400, color: "var(--ivory)", letterSpacing: "-.024em", marginBottom: 4 }}>
                  Candidate Assessment,
                </h1>
                <h1 style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: "var(--fs-hero)", lineHeight: 1.1, fontWeight: 400, letterSpacing: "-.024em", marginBottom: 24, ...G }}>
                  Done Right.
                </h1>

                <p style={{ color: "var(--slate)", fontSize: "var(--fs-card)", lineHeight: 1.75, maxWidth: 480, marginBottom: 8, fontWeight: 400 }}>
                  Skill Bridge is a production-grade assessment platform — built for teams who need to screen candidates with confidence. Admins create tests, share passcodes, and let the platform handle the rest.
                </p>
                <p style={{ color: "var(--slate2)", fontSize: "var(--fs-secondary)", lineHeight: 1.72, maxWidth: 440, marginBottom: 34 }}>
                  Proctored sessions · AI-powered analytics · automated result emails · live leaderboards.
                </p>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 44 }}>
                  <button className="btn-p" style={{ fontSize: 14, padding: "10px 20px" }} onClick={() => navigate("/register")}>Admin Sign Up →</button>
<button
  className="btn-o"
  onClick={() =>
    window.open(
      "https://github.com/vigneshwarisakthivel/SkillBridge",
      "_blank"
    )
  }
>
  View Source on GitHub
</button>
                </div>

<div
  style={{
    display: "flex",
    alignItems: "center",
    borderTop: "1px solid rgba(196,161,94,0.1)",
    paddingTop: 26,
    flexWrap: "nowrap", // 👈 prevent wrapping
    width: "100%"
  }}
>
  {STATS.map((s, i) => (
    <React.Fragment key={s.label}>
      <div
        style={{
          textAlign: "center",
          flex: 1,              // 👈 equal width for all 4
          minWidth: 0,          // 👈 prevents overflow issues
          padding: "0 8px"      // 👈 reduce padding (24px was too big)
        }}
      >
        <div className="stat-num">{s.value}</div>
        <div
          style={{
            color: "var(--slate2)",
            fontSize: 10,
            marginTop: 4,
            fontFamily: "var(--display)",
            letterSpacing: ".12em",
            textTransform: "uppercase",
            fontWeight: 700
          }}
        >
          {s.label}
        </div>
      </div>

      {i < STATS.length - 1 && (
        <div
          className="stsep"
          style={{
            width: 1,
            height: 28,
            background: "rgba(196,161,94,0.2)"
          }}
        />
      )}
    </React.Fragment>
  ))}
</div>
              </div>

              {/* RIGHT */}
              <div className="hero-right" style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", animation: "fadeSlideUp 1.05s 0.18s ease both" }}>
                <div className="hero-dash"><HeroDashboard/></div>

                <FloatCard className="hero-notif1" style={{ bottom: -8, left: -28, minWidth: 180 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#5C8A72,#2E5C47)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>✉</div>
                    <div>
                      <div style={{ fontSize: 11, fontFamily: "var(--display)", fontWeight: 700, color: "var(--ivory)", letterSpacing: ".04em" }}>Result Sent!</div>
                      <div style={{ fontSize: 10, color: "var(--slate)", marginTop: 1 }}>Candidate advanced ✓</div>
                    </div>
                  </div>
                </FloatCard>

                <FloatCard className="hero-notif2" style={{ top: 10, right: -28, minWidth: 162 }}>
                  <div style={{ fontSize: 10, color: "var(--slate2)", fontFamily: "var(--display)", letterSpacing: ".05em", marginBottom: 4 }}>New Test Attempt</div>
                  <div style={{ fontSize: 11, color: "var(--purple)", fontWeight: 700, fontFamily: "var(--display)" }}>Passcode: SB-2941</div>
                  <div style={{ fontSize: 10, color: "var(--slate)", marginTop: 2 }}>React Fundamentals · 45 min</div>
                </FloatCard>

                <FloatCard style={{ bottom: 74, right: -38, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ position: "relative", width: 60, height: 60 }}>
                    <ScoreRing score={94} size={60} delay={800}/>
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--serif)", fontSize: 13, color: "var(--gold)" }}>94%</div>
                  </div>
                  <div style={{ fontSize: 9, color: "var(--slate2)", fontFamily: "var(--display)", letterSpacing: ".08em" }}>AVG SCORE</div>
                </FloatCard>
              </div>
            </div>
          </section>

          <div className="section-divider"/>

          {/* ─────────────────────────────────────────────────────────────────
              ABOUT
          ───────────────────────────────────────────────────────────────── */}
          <section ref={sectionRefs.about} style={{ padding: "40px 36px 45px", maxWidth: 1100, margin: "0 auto" }}>
            <div data-reveal="about" className={`rv${vis("about") ? " in" : ""}`} style={{ textAlign: "center", marginBottom: 48 }}>
              <SectionLabel>◎ About the Project</SectionLabel>
              <h2 className="sh">Built for Real<span style={G}> <em>Hiring Workflows</em></span></h2>
              <p className="ss">A full-stack assessment platform built to mirror how engineering teams actually screen candidates — secure, proctored, and decision-ready from day one.</p>
            </div>

            <div className="g2">
              {/* Timeline */}
              <div data-reveal="about-l" className={`rl${vis("about-l") ? " in" : ""}`}>
                <div className="card" style={{ padding: "24px 22px" }}>
                  <div className="rule"/>
                  <div style={{ fontFamily: "var(--display)", fontSize: 10, fontWeight: 700, color: "var(--gold3)", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 18 }}>Development Timeline</div>
                  {[
                    ["Planning & Architecture",   "Designed the dual-role system — admin and candidate — along with DB schema, auth flow, passcode mechanics, and proctoring strategy."],
                    ["Backend Development",        "REST API built with Django: admin auth, test creation, question bank management, passcode generation, score storage, and result logic."],
                    ["Frontend Development",       "React interface for both roles — admin dashboard for managing tests and reviewing results, candidate portal for passcode entry and test-taking."],
                    ["Proctoring System",          "Implemented tab-switch detection, webcam monitoring, and clipboard blocking to ensure every session is trustworthy and audit-ready."],
                    ["Result & Email Automation",  "Automated pass/fail logic: passing candidates receive a next-steps email automatically; no action is taken for those who don't meet the threshold."],
                    ["Deployment & Optimization",  "Full deployment, performance tuning, and UI polish to professional standards — ready for live candidate screening."],
                  ].map(([period, txt], i, arr) => (
                    <div key={period} style={{ display: "flex", gap: 14 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 12 }}>
                        <div className="tl-dot"/>
                        {i < arr.length - 1 && <div className="tl-line" style={{ height: 36 }}/>}
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", marginBottom: 2, fontFamily: "var(--display)", letterSpacing: ".08em" }}>{period}</div>
                        <div style={{ color: "var(--slate)", fontSize: "var(--fs-secondary)", lineHeight: 1.7, paddingBottom: 14 }}>{txt}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right column */}
              <div data-reveal="about-r" className={`rr${vis("about-r") ? " in" : ""}`} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Tech stack */}
                <div className="card" style={{ padding: "22px 20px" }}>
                  <div className="rule"/>
                  <div style={{ fontFamily: "var(--display)", fontSize: 10, fontWeight: 700, color: "var(--gold3)", letterSpacing: ".14em", textTransform: "uppercase", marginBottom: 14 }}>Tech Stack</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {TECH_STACK.map(t => (
                      <div key={t.name} className="ttag">
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--gold)", opacity: 0.7 }}/>
                          <div style={{ fontFamily: "var(--display)", fontWeight: 700, color: "var(--ivory)", fontSize: "var(--fs-secondary)" }}>{t.name}</div>
                        </div>
                        <div style={{ color: "var(--slate2)", fontSize: 11, lineHeight: 1.5 }}>{t.note}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {[
                  { icon: "◎", title: "Key Challenge", color: "var(--green)", body: "Building a frictionless candidate experience — no account creation, just a passcode and email — while keeping every session proctored and the admin in full control of results." },
                  { icon: "◆", title: "What I Learned", color: "var(--purple)", body: "This project taught me how real hiring tools are designed: role separation, secure access patterns, automated communication, and building interfaces that feel professional under pressure." },
                ].map(v => (
                  <div key={v.title} className="card" style={{ padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ width: 34, height: 34, borderRadius: 7, background: `${v.color}18`, border: `1px solid ${v.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: v.color, flexShrink: 0 }}>{v.icon}</div>
                    <div>
                      <div style={{ fontFamily: "var(--display)", fontWeight: 700, color: "var(--ivory)", fontSize: "var(--fs-body)", marginBottom: 4, letterSpacing: ".02em" }}>{v.title}</div>
                      <div style={{ color: "var(--slate)", fontSize: "var(--fs-secondary)", lineHeight: 1.72 }}>{v.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div className="section-divider"/>

          {/* ─────────────────────────────────────────────────────────────────
              HOW IT WORKS — ROLES SECTION (new)
          ───────────────────────────────────────────────────────────────── */}
          <section style={{ background: "rgba(255,255,255,0.008)",padding: "40px 36px 45px" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
              <div data-reveal="roles" className={`rv${vis("roles") ? " in" : ""}`} style={{ textAlign: "center", marginBottom: 44 }}>
                <SectionLabel>◉ Two Roles</SectionLabel>
                <h2 className="sh">Built Around How<span style={G}> <em>Teams Actually Work</em></span></h2>
                <p className="ss">Two distinct roles — each with a focused, purpose-built experience. Admins control everything. Candidates just show up with a passcode.</p>
              </div>

              <div className="roles-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

                {/* Admin card */}
                <div data-reveal="role-admin" className={`role-card rv${vis("role-admin") ? " in" : ""}`}>
                  <div style={{ position: "absolute", top: 0, left: 24, right: 24, height: 1, background: "linear-gradient(90deg,transparent,rgba(196,161,94,0.5),transparent)" }}/>
                  <div className="role-badge" style={{ background: "rgba(196,161,94,0.1)", border: "1px solid rgba(196,161,94,0.25)", color: "#C4A15E" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#C4A15E" }}/>
                    Admin
                  </div>
                  <div style={{ fontFamily: "var(--serif)", fontSize: "var(--fs-section)", color: "var(--ivory)", marginBottom: 6, fontWeight: 400 }}>Full Control of the Pipeline</div>
                  <div style={{ color: "var(--slate)", fontSize: "var(--fs-secondary)", lineHeight: 1.72, marginBottom: 20 }}>
                    The admin manages everything — from building the question bank to reviewing who moves forward. Candidates are never created manually; the passcode handles access.
                  </div>
                  {[
                    ["Create tests", "Set name, duration, pass threshold, and assign questions from the question bank."],
                    ["Build question bank", "Add, edit, and categorise questions that feed into any test."],
                    ["Send test link + passcode", "Share the test URL and a unique passcode directly with candidates via any channel."],
                    ["Monitor activity", "View recent activity, completion status, and per-candidate scores from the dashboard."],
                    ["Email passing candidates", "Candidates who meet the threshold receive an automated email to move to the next step. Those who don't are not contacted."],
                  ].map(([title, desc], i) => (
                    <div key={title} className="role-step">
                      <div className="step-num" style={{ background: "rgba(196,161,94,0.12)", color: "#C4A15E", border: "1px solid rgba(196,161,94,0.25)" }}>{i + 1}</div>
                      <div>
                        <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: "var(--fs-secondary)", color: "var(--ivory)", marginBottom: 2 }}>{title}</div>
                        <div style={{ color: "var(--slate)", fontSize: 12, lineHeight: 1.65 }}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Candidate card */}
                <div data-reveal="role-candidate" className={`role-card rv${vis("role-candidate") ? " in" : ""}`} style={{ transitionDelay: "90ms" }}>
                  <div style={{ position: "absolute", top: 0, left: 24, right: 24, height: 1, background: "linear-gradient(90deg,transparent,rgba(126,184,160,0.5),transparent)" }}/>
                  <div className="role-badge" style={{ background: "rgba(126,184,160,0.1)", border: "1px solid rgba(126,184,160,0.25)", color: "#7EB8A0" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7EB8A0" }}/>
                    Candidate
                  </div>
                  <div style={{ fontFamily: "var(--serif)", fontSize: "var(--fs-section)", color: "var(--ivory)", marginBottom: 6, fontWeight: 400 }}>Zero Friction Entry</div>
                  <div style={{ color: "var(--slate)", fontSize: "var(--fs-secondary)", lineHeight: 1.72, marginBottom: 20 }}>
                    Candidates don't create accounts. They receive a test link and passcode, enter their email, and go straight into the test — no registration, no onboarding.
                  </div>
                  {[
                    ["Receive test link + passcode", "Admin shares a URL and a unique passcode. That's all the candidate needs."],
                    ["Enter email + passcode", "No account required. Email and passcode are the only credentials needed to access the test."],
                    ["Complete proctored test", "Webcam monitoring, tab-switch detection, and clipboard blocking are active throughout. The session is fully audited."],
                    ["Instant score on completion", "Score is calculated and recorded immediately after submission."],
                    ["Next-step email if passed", "Passing candidates receive a notification email automatically. No email is sent to those below the threshold."],
                  ].map(([title, desc], i) => (
                    <div key={title} className="role-step">
                      <div className="step-num" style={{ background: "rgba(126,184,160,0.12)", color: "#7EB8A0", border: "1px solid rgba(126,184,160,0.25)" }}>{i + 1}</div>
                      <div>
                        <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: "var(--fs-secondary)", color: "var(--ivory)", marginBottom: 2 }}>{title}</div>
                        <div style={{ color: "var(--slate)", fontSize: 12, lineHeight: 1.65 }}>{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </section>

          <div className="section-divider"/>




          {/* ─────────────────────────────────────────────────────────────────
              TESTIMONIALS
          ───────────────────────────────────────────────────────────────── */}
<section
  ref={sectionRefs.performers}
  style={{ background: "rgba(255,255,255,0.012)",padding: "40px 36px 45px" }}
>
  <div style={{ maxWidth: 1100, margin: "0 auto" }}>

    <div
      data-reveal="test"
      className={`rv${vis("test") ? " in" : ""}`}
      style={{ textAlign: "center", marginBottom: 28 }}
    >
      <SectionLabel>◇ Features</SectionLabel>

      <h2 className="sh">
        Built for <span style={G}><em>Modern Hiring</em></span>
      </h2>

      <p className="ss" style={{ maxWidth: 440 }}>
        A streamlined assessment platform designed to simplify hiring workflows,
        ensure test integrity, and deliver a seamless experience for both admins and candidates.
      </p>
    </div>

    <div className="g3">
      {[
        {
          title: "Instant Candidate Access",
          desc: "Candidates can start tests immediately using just an email and passcode, eliminating signup friction.",
        },
        {
          title: "Secure Proctored Testing",
          desc: "Built-in proctoring ensures fair assessments and maintains integrity throughout the test.",
        },
        {
          title: "Centralized Admin Control",
          desc: "Manage tests, users, and activity from a single dashboard with complete visibility.",
        },
        {
          title: "Real-Time Monitoring",
          desc: "Track candidate progress and platform activity live for faster and better decisions.",
        },
        {
          title: "Automated Evaluation Flow",
          desc: "Identify top performers quickly and move qualified candidates to the next stage.",
        },
        {
          title: "Scalable Full-Stack Design",
          desc: "Powered by React and Django, built to handle growing users and assessments efficiently.",
        },
      ].map((item, i) => (
        <div
          key={i}
          className={`card rv${vis("test") ? " in" : ""}`}
          style={{
            padding: "20px 18px",
            transitionDelay: `${i * 80}ms`,
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Top accent line */}
          <div style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: "linear-gradient(90deg,var(--gold),transparent)"
          }}/>

          <div className="rule"/>

          <div style={{
            fontFamily: "var(--display)",
            fontWeight: 700,
            color: "var(--ivory)",
            fontSize: "var(--fs-card)",
            marginBottom: 8
          }}>
            {item.title}
          </div>

          <p style={{
            color: "var(--slate)",
            fontSize: "var(--fs-secondary)",
            lineHeight: 1.7
          }}>
            {item.desc}
          </p>
        </div>
      ))}
    </div>

  </div>
</section>

          <div className="section-divider"/>

          {/* ─────────────────────────────────────────────────────────────────
              PERFORMERS / LEADERBOARD
          ───────────────────────────────────────────────────────────────── */}
<section
  ref={sectionRefs.features}
  style={{ padding: "40px 36px 45px", maxWidth: 1100, margin: "0 auto" }}
>
  <div
    data-reveal="perf"
    className={`rv${vis("perf") ? " in" : ""}`}
    style={{ textAlign: "center", marginBottom: 28 }}
  >
    <SectionLabel>◈ Workflow</SectionLabel>
    <h2 className="sh">
      How the Platform <span style={G}><em>Works</em></span>
    </h2>
    <p className="ss" style={{ maxWidth: 420 }}>
      A streamlined process from test creation to candidate selection, designed for efficiency and security.
    </p>
  </div>

  <div className="g4">
    {[
      {
        title: "Create Test",
        desc: "Admin creates tests and question banks with customizable settings.",
      },
      {
        title: "Share Access",
        desc: "Secure test link and passcode are shared with candidates.",
      },
      {
        title: "Take Test",
        desc: "Candidates log in using email and complete tests with proctoring.",
      },
      {
        title: "Evaluate",
        desc: "Results are analyzed and top candidates are shortlisted.",
      },
    ].map((item, i) => (
      <div
        key={i}
        className={`card rv${vis("perf") ? " in" : ""}`}
        style={{
          padding: "18px 14px",
          textAlign: "center",
          transitionDelay: `${i * 80}ms`,
        }}
      >
        <div className="sp" style={{ marginBottom: 10 }}>
          STEP {i + 1}
        </div>

        <div
          style={{
            fontFamily: "var(--display)",
            fontWeight: 700,
            color: "var(--ivory)",
            fontSize: "var(--fs-card)",
            marginBottom: 6,
          }}
        >
          {item.title}
        </div>

        <div
          style={{
            color: "var(--slate2)",
            fontSize: "var(--fs-small)",
            lineHeight: 1.6,
          }}
        >
          {item.desc}
        </div>
      </div>
    ))}
  </div>
</section>
          <div className="section-divider"/>
          {/* ─────────────────────────────────────────────────────────────────
              CTA
          ───────────────────────────────────────────────────────────────── */}
          <section ref={sectionRefs.cta} style={{ padding: "40px 36px 45px", textAlign: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 50% 70% at 50% 100%, rgba(196,161,94,0.07), transparent)", pointerEvents: "none" }}/>
            <div className="grid-bg" style={{ position: "absolute", inset: 0, opacity: 0.5 }}/>
            <OrbField/>

            <div data-reveal="cta" className={`rv${vis("cta") ? " in" : ""}`} style={{ maxWidth: 520, margin: "0 auto", position: "relative" }}>
              <div style={{ position: "absolute", top: -52, left: "50%", transform: "translateX(-50%)", width: 110, height: 55, borderTop: "1px solid rgba(196,161,94,0.18)", borderRadius: "100% 100% 0 0", pointerEvents: "none" }}/>
              <SectionLabel>◆ Explore</SectionLabel>
              <h2 className="sh" style={{ fontSize: "clamp(24px, 3.8vw, 36px)", marginBottom: 14 }}>
                See It in<span style={G}> <em>Action.</em></span>
              </h2>
              <p style={{ color: "var(--slate)", lineHeight: 1.82, fontSize: "var(--fs-card)", maxWidth: 420, margin: "0 auto 36px" }}>
                Create a free admin account to build tests, generate passcodes, and explore the full candidate screening workflow — or browse the source code directly.
              </p>
              <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                <button className="btn-p" style={{ fontSize: 14, padding: "10px 20px" }} onClick={() => navigate("/register")}>Create Admin Account →</button>

              </div>
            </div>
          </section>

          {/* ─────────────────────────────────────────────────────────────────
              FOOTER
          ───────────────────────────────────────────────────────────────── */}
          <footer style={{ background: "#060810", borderTop: "1px solid rgba(196,161,94,0.08)", padding: "16px 28px" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "center", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <img src={logo} alt="Skill Bridge" style={{ height: 24, filter: "brightness(2.5) contrast(1.2)", opacity: 0.7 }}/>
                <span style={{ color: "var(--slate2)", fontSize: "var(--fs-secondary)" }}>
                  © {new Date().getFullYear()} Skill Bridge — Portfolio Project by Vigneshwari Sakthivel
                </span>
              </div>

            </div>
          </footer>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          PERFORMER MODAL
      ═══════════════════════════════════════════════════════════════════ */}
      {activePerf && (
        <div className="modal-bg" onClick={() => setActivePerf(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 1, background: "linear-gradient(90deg,transparent,rgba(196,161,94,0.5),transparent)", borderRadius: 1 }}/>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16, position: "relative" }}>
              <Av init={activePerf.init} idx={activePerf.id - 1} size={68}/>
              <div style={{ position: "absolute", top: -4, right: "calc(50% - 50px)", width: 22, height: 22, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, fontFamily: "var(--display)", color: "#0B0D11", background: activePerf.rank <= 3 ? ["linear-gradient(135deg,#FFD700,#B8860B)","linear-gradient(135deg,#C0C0C0,#808080)","linear-gradient(135deg,#CD7F32,#8B4513)"][activePerf.rank - 1] : "rgba(196,161,94,0.3)" }}>
                {activePerf.rank}
              </div>
            </div>
            <div className="rule" style={{ margin: "0 auto 14px", width: 22 }}/>
            <div style={{ fontFamily: "var(--serif)", color: "var(--ivory)", fontSize: "1.25rem", fontWeight: 400, marginBottom: 4, letterSpacing: "-.01em" }}>{activePerf.name}</div>
            <div style={{ color: "var(--slate2)", fontSize: 10, fontFamily: "var(--display)", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 14 }}>{activePerf.subject}</div>
            <div style={{ position: "relative", width: 80, height: 80, margin: "0 auto 14px" }}>
              <ScoreRing score={activePerf.score} size={80} delay={0}/>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: "var(--serif)", fontSize: "1.15rem", color: "var(--gold)" }}>{activePerf.score}%</span>
              </div>
            </div>
            <div style={{ color: "var(--slate)", fontSize: "var(--fs-secondary)", marginBottom: 20 }}>{activePerf.badge}</div>
            <button className="btn-o" style={{ padding: "8px 22px" }} onClick={() => setActivePerf(null)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}