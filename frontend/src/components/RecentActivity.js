import React, { useState, useEffect, useCallback } from "react";
import AdminLayout, { SectionLabel } from "./AdminLayout";
import { Trash2 } from "lucide-react";
import { getActivity, deleteActivity, exportActivityCSV } from "../services/apiServices";

const TYPE_CONFIG = {
  attempt:  { color: "#6BE092", bg: "rgba(107,224,146,.08)",  border: "rgba(107,224,146,.2)",  label: "Attempt",  icon: "◎" },
  score:    { color: "#E0C96B", bg: "rgba(224,201,107,.08)",  border: "rgba(224,201,107,.2)",  label: "Score",    icon: "◇" },
  user:     { color: "#6BB0E0", bg: "rgba(107,176,224,.08)",  border: "rgba(107,176,224,.2)",  label: "User",     icon: "◉" },
  test:     { color: "#C4A15E", bg: "rgba(196,161,94,.08)",   border: "rgba(196,161,94,.2)",   label: "Test",     icon: "◈" },
  question: { color: "#C09FE0", bg: "rgba(192,159,224,.08)",  border: "rgba(192,159,224,.2)",  label: "Question", icon: "◆" },
};

const STEP = 5;

function SkeletonEntry() {
  const bar = (w) => (
    <div style={{ height: 11, borderRadius: 4, width: w, background: "rgba(255,255,255,.06)", animation: "pulse 1.4s ease infinite" }} />
  );
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 16, padding: "16px 0", borderBottom: "1px solid var(--border2)" }}>
      <div style={{ width: 9, height: 9, borderRadius: "50%", background: "rgba(255,255,255,.1)", marginTop: 4, flexShrink: 0 }} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        {bar(320)}{bar(120)}
      </div>
    </div>
  );
}

export default function RecentActivity() {
  const [activities, setActivities]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [filter, setFilter]           = useState("All");
  const [search, setSearch]           = useState("");
  const [visibleCount, setVisibleCount] = useState(STEP);

  // ── fetch ────────────────────────────────────────────────────────────────
  const fetchActivity = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getActivity();
      setActivities(data);
    } catch (e) {
      console.error(e);

    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchActivity(); }, [fetchActivity]);

  // ── filter (client-side, same logic as your original) ────────────────────
  const filtered = activities.filter((a) => {
    const mF = filter === "All" || a.type === filter.toLowerCase();
    const mQ = !search || a.text.toLowerCase().includes(search.toLowerCase());
    return mF && mQ;
  });

  // Reset visible count when filter/search changes
  useEffect(() => { setVisibleCount(STEP); }, [filter, search]);

  const visible = filtered.slice(0, visibleCount);

  // Group by date — same as your original
  const groups = visible.reduce((acc, a) => {
    if (!acc[a.date]) acc[a.date] = [];
    acc[a.date].push(a);
    return acc;
  }, {});

  // ── delete ───────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    // Optimistic remove
    setActivities((prev) => prev.filter((a) => a.id !== id));
    try {
      await deleteActivity(id);
    } catch (e) {
      console.error(e);
      // Re-fetch to restore if delete failed
      fetchActivity();
    }
  };

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <AdminLayout pageKey="activity">

      {/* Header */}
      <div className="fade-up" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div>
          <SectionLabel>◆ Live Activity Feed</SectionLabel>
          <p style={{ color: "var(--slate)", fontSize: "var(--fs-secondary)", marginTop: 6 }}>
            <span className="live-dot" /> Real-time platform events and user actions.
          </p>
        </div>
        <button className="btn-o fade-up d1" onClick={() => exportActivityCSV(filtered)}>
          ↓ Export Log
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: "12px 16px", marginBottom: 16, borderRadius: 6,
          background: "rgba(192,112,112,.08)", border: "1px solid rgba(192,112,112,.25)",
          color: "#c07070", fontSize: "var(--fs-small)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          {error}
          <button onClick={fetchActivity} style={{ background: "none", border: "none", color: "#c07070", cursor: "pointer", fontWeight: 700 }}>
            Retry
          </button>
        </div>
      )}

      {/* Feed */}
      <div className="fade-up d3">
        {loading ? (
          <div className="card-static" style={{ padding: "4px 20px" }}>
            {Array.from({ length: 5 }).map((_, i) => <SkeletonEntry key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card-static" style={{
            padding: "48px 24px", textAlign: "center",
            color: "var(--slate2)", fontFamily: "var(--display)",
            fontSize: "var(--fs-small)", letterSpacing: ".1em",
          }}>
            NO EVENTS FOUND
          </div>
        ) : Object.entries(groups).map(([date, events]) => (
          <div key={date} style={{ marginBottom: 24 }}>
            {/* Date separator */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{
                fontSize: "var(--fs-micro)", fontFamily: "var(--display)",
                fontWeight: 700, letterSpacing: ".14em",
                color: "var(--slate2)", textTransform: "uppercase",
              }}>{date}</div>
              <div style={{ flex: 1, height: 1, background: "var(--border2)" }} />
              <div style={{ fontSize: "var(--fs-micro)", color: "var(--slate2)", fontFamily: "var(--display)" }}>
                {events.length} events
              </div>
            </div>

            {/* Event cards */}
            <div className="card-static" style={{ padding: "4px 20px" }}>
              {events.map((a, i) => {
                const cfg = TYPE_CONFIG[a.type] || TYPE_CONFIG.attempt;
                return (
                  <div
                    key={a.id}
                    className="slide-in"
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 16,
                      padding: "16px 0",
                      borderBottom: i < events.length - 1 ? "1px solid var(--border2)" : "none",
                      animationDelay: `${i * 0.04}s`,
                    }}
                  >
                    {/* Timeline dot + connector */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                      <div style={{ width: 9, height: 9, borderRadius: "50%", background: cfg.color, marginTop: 4, flexShrink: 0 }} />
                      {i < events.length - 1 && (
                        <div style={{ width: 1, height: 32, background: "var(--border2)", margin: "4px auto" }} />
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 5 }}>
                        <div style={{ color: "var(--ivory)", fontSize: "var(--fs-body)", lineHeight: 1.4 }}>
                          {a.text}
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                          <div style={{
                            color: "var(--slate2)", fontSize: "var(--fs-micro)",
                            fontFamily: "var(--display)", letterSpacing: ".04em", whiteSpace: "nowrap",
                          }}>{a.time}</div>

                          <button
onClick={() => handleDelete(a.id)}
  title="Delete Activity"
  style={{
    flexShrink: 0,
    width: 28, height: 28,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "none",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    color: "var(--slate)",
    transition: "all .15s",
    marginTop: 1,
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.color = "#E07A7A";
    e.currentTarget.style.background = "rgba(224,122,122,.1)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.color = "var(--slate)";
    e.currentTarget.style.background = "none";
  }}
>
  <Trash2 size={14} />
</button>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="type-badge" style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
                          {cfg.icon} {cfg.label}
                        </span>
                        <span style={{ color: "var(--slate2)", fontSize: "var(--fs-micro)" }}>{a.detail}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* View more */}
        {!loading && visibleCount < filtered.length && (
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <button className="btn-o" onClick={() => setVisibleCount((n) => n + STEP)}>
              View More
            </button>
          </div>
        )}
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }`}</style>
    </AdminLayout>
  );
}