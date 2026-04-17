import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout, { SectionLabel, Av } from "./AdminLayout";
import { getDashboard } from "../services/apiServices";

// ── Skeleton helpers ──────────────────────────────────────────────────────────
function Bar({ w }) {
  return (
    <div style={{
      height: 11, borderRadius: 4, width: w,
      background: "rgba(255,255,255,.06)",
      animation: "pulse 1.4s ease infinite",
    }} />
  );
}

function StatSkeleton() {
  return (
    <div className="card" style={{ padding: "22px 20px" }}>
      <Bar w={40} />
      <div style={{ marginTop: 10 }}><Bar w={80} /></div>
      <div style={{ marginTop: 6 }}><Bar w={120} /></div>
      <div style={{ marginTop: 4 }}><Bar w={100} /></div>
      <div style={{ marginTop: 8, height: 3, borderRadius: 2, background: "rgba(255,255,255,.06)" }} />
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const navigate   = useNavigate();
  const [visible, setVisible] = useState({});
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // Intersection observer for reveal animations — unchanged from original
  useEffect(() => {
    const obs = new IntersectionObserver(
      (es) => es.forEach((e) => {
        if (e.isIntersecting)
          setVisible((v) => ({ ...v, [e.target.dataset.reveal]: true }));
      }),
      { threshold: 0.06 }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const vis = (k) => visible[k];

  // Fetch dashboard data
  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getDashboard();
      setData(result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  // Fallback empty shapes so the page never crashes
  const stats    = data?.stats    ?? [];
  const users    = data?.users    ?? [];
  const tests    = data?.tests    ?? [];
  const activity = data?.activity ?? [];

  return (
    <AdminLayout pageKey="overview">

      {/* Header */}
      <div
        data-reveal="ov-head"
        className={`rv${vis("ov-head") ? " in" : ""}`}
        style={{ marginBottom: 32 }}
      >
        <SectionLabel>◎ Admin Dashboard</SectionLabel>
        <p style={{ color: "var(--slate)", fontSize: "var(--fs-secondary)" }}>
          Manage users, monitor tests, and track platform activity.
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          padding: "12px 16px", marginBottom: 20, borderRadius: 6,
          background: "rgba(192,112,112,.08)", border: "1px solid rgba(192,112,112,.25)",
          color: "#c07070", fontSize: "var(--fs-small)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          {error}
          <button
            onClick={fetchDashboard}
            style={{ background: "none", border: "none", color: "#c07070", cursor: "pointer", fontWeight: 700 }}
          >Retry</button>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div
        data-reveal="ov-stats"
        className={`rv${vis("ov-stats") ? " in" : ""}`}
        style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 32 }}
      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <StatSkeleton key={i} />)
          : stats.map((s, i) => (
            <div key={i} className="card" style={{ padding: "12px 10px", position: "relative", overflow: "hidden" }}>
              <div className="noise" />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>

              </div>
<div style={{
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 6
}}>
  {/* Label (left) */}
  <div style={{
    color: "var(--slate2)",
    fontSize: "var(--fs-small)",
    fontFamily: "var(--display)",
    fontWeight: 700,
    letterSpacing: ".1em",
    textTransform: "uppercase"
  }}>
    {s.label}
  </div>

  {/* Value (right) */}
  <div style={{
    fontFamily: "var(--serif)",
    fontSize: "30px",
    color: "var(--gold)",
    fontWeight: 500,
    letterSpacing: "-.02em",
    lineHeight: 1
  }}>
    {s.value}
  </div>
</div><div style={{ color: "var(--slate)", fontSize: "var(--fs-small)", marginTop: 4 }}>{s.delta}</div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${s.pct}%` }} />
              </div>
            </div>
          ))
        }
      </div>

      {/* ── Two-column: Candidates + Tests ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

        {/* Recent Candidates */}
        <div
          data-reveal="ov-users"
          className={`card rv${vis("ov-users") ? " in" : ""}`}
          style={{ padding: 0, overflow: "hidden" }}
        >
          <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid var(--border2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <SectionLabel>◉ Candidates</SectionLabel>
              <div style={{ fontFamily: "var(--display)", fontWeight: 700, color: "var(--ivory)", fontSize: "var(--fs-card)", marginTop: -8 }}>Recently Added</div>
            </div>
            <button className="btn-o" onClick={() => navigate("/UserManagement")}>View All</button>
          </div>
          <table className="tbl">
            <thead>
              <tr><th>Candidate</th><th>Joined</th><th>Status</th></tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td><Bar w={140} /></td>
                    <td><Bar w={60} /></td>
                    <td><Bar w={50} /></td>
                  </tr>
                ))
                : users.length === 0
                  ? (
                    <tr>
                      <td colSpan={3} style={{ textAlign: "center", color: "var(--slate2)", padding: "24px 0", fontSize: "var(--fs-small)" }}>
                        No candidates yet
                      </td>
                    </tr>
                  )
                  : users.map((u, i) => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Av init={u.init} idx={i} size={30} />
                          <div>
                            <div style={{ color: "var(--ivory)", fontWeight: 500, fontSize: "var(--fs-body)" }}>{u.name}</div>
                            <div style={{ color: "var(--slate2)", fontSize: "var(--fs-micro)" }}>{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span style={{ color: "var(--slate2)", fontSize: "var(--fs-small)" }}>{u.joined}</span></td>
                      <td><span className={u.status === "Active" ? "pill-active" : "pill-inactive"}>{u.status}</span></td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {/* Recent Tests */}
        <div
          data-reveal="ov-tests"
          className={`card rv${vis("ov-tests") ? " in" : ""}`}
          style={{ padding: 0, overflow: "hidden" }}
        >
          <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid var(--border2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <SectionLabel>◈ Tests</SectionLabel>
              <div style={{ fontFamily: "var(--display)", fontWeight: 700, color: "var(--ivory)", fontSize: "var(--fs-card)", marginTop: -8 }}>Recent Tests</div>
            </div>
            <button className="btn-o" onClick={() => navigate("/TestManagement")}>Manage</button>
          </div>
          <table className="tbl">
            <thead>
              <tr><th>Test</th><th>Attempts</th><th>Pass Mark</th><th>Created</th><th>Status</th></tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {[160, 50, 50, 50, 60].map((w, j) => <td key={j}><Bar w={w} /></td>)}
                  </tr>
                ))
                : tests.length === 0
                  ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", color: "var(--slate2)", padding: "24px 0", fontSize: "var(--fs-small)" }}>
                        No tests yet
                      </td>
                    </tr>
                  )
                  : tests.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <div style={{ color: "var(--ivory)", fontWeight: 500, fontSize: "var(--fs-body)", marginBottom: 2 }}>{t.title}</div>
                        <div style={{ color: "var(--slate2)", fontSize: "var(--fs-micro)" }}>{t.questions} questions · {t.duration}</div>
                      </td>
                      <td><span className="sp">{t.attempts}</span></td>
                      <td style={{ color: "var(--slate)" }}>{t.passMark}%</td>
                      <td style={{ color: "var(--slate2)" }}>{t.created}</td>
                      <td>
                        <span className={t.status === "Active" ? "pill-active" : "pill-draft"}>{t.status}</span>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Activity Feed ── */}
      <div
        data-reveal="ov-act"
        className={`card rv${vis("ov-act") ? " in" : ""}`}
        style={{ padding: 0, overflow: "hidden" }}
      >
        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid var(--border2)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <SectionLabel>◆ Feed</SectionLabel>
            <div style={{ fontFamily: "var(--display)", fontWeight: 700, color: "var(--ivory)", fontSize: "var(--fs-card)", marginTop: -8 }}>Live Activity</div>
          </div>
          <button className="btn-o" onClick={() => navigate("/RecentActivity")}>See All</button>
        </div>
        <div style={{ padding: "10px 20px 16px", display: "flex", flexDirection: "column", gap: 2 }}>
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border2)" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "rgba(255,255,255,.1)", flexShrink: 0 }} />
                <Bar w={280} />
                <Bar w={60} />
              </div>
            ))
            : activity.length === 0
              ? (
                <div style={{ padding: "24px 0", textAlign: "center", color: "var(--slate2)", fontSize: "var(--fs-small)" }}>
                  No activity yet
                </div>
              )
              : activity.map((a, i) => (
                <div
                  key={a.id}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 12,
                    padding: "10px 0",
                    borderBottom: i < activity.length - 1 ? "1px solid var(--border2)" : "none",
                  }}
                >
                  <div className="act-dot" style={{ background: a.color, marginTop: 6 }} />
                  <div style={{ flex: 1, color: "var(--ivory)", fontSize: "var(--fs-body)" }}>{a.text}</div>
                  <div style={{ color: "var(--slate2)", fontSize: "var(--fs-micro)", flexShrink: 0, fontFamily: "var(--display)", letterSpacing: ".04em" }}>{a.time}</div>
                </div>
              ))
          }
        </div>
      </div>

      <style>{`
        .rv { opacity:0; transform:translateY(18px); transition:opacity .6s cubic-bezier(.22,1,.36,1),transform .6s cubic-bezier(.22,1,.36,1); }
        .rv.in { opacity:1; transform:none; }
        @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }
      `}</style>
    </AdminLayout>
  );
}