import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout, { SectionLabel } from "./AdminLayout";
import Papa from "papaparse";
import {
  createTest,
  getSecureUUID,
  getAllQuestions,
  getTests,
  uploadAllowedEmails,
} from "../services/apiServices";
import { createPortal } from "react-dom";
// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const BASE_URL = window.location.origin + "/test";

const STEPS = [
  { id: 0, label: "Test Details",     sub: "Name, subject & difficulty",       icon: "01" },
  { id: 1, label: "Build Questions",  sub: "Add & configure questions",         icon: "02" },
  { id: 2, label: "Question Bank",    sub: "Import or reuse questions",         icon: "03" },
  { id: 3, label: "Scoring & Time",   sub: "Marks, duration, limits",           icon: "04" },
  { id: 4, label: "Pass Criteria",    sub: "Set the passing threshold",         icon: "05" },
  { id: 5, label: "Configuration",    sub: "Security, access & notifications",  icon: "06" },
  { id: 6, label: "Review & Publish", sub: "Confirm and go live",               icon: "07" },
];

const Q_TYPES = [
  { type: "multiplechoice",   label: "Multiple Choice",   desc: "One correct answer from options",  icon: "◉" },
  { type: "multipleresponse", label: "Multiple Response", desc: "Several correct answers possible", icon: "◈" },
  { type: "truefalse",        label: "True / False",      desc: "Binary true or false question",    icon: "◎" },
  { type: "fillintheblank",   label: "Fill in the Blank", desc: "Student types the exact answer",   icon: "◆" },
];

// ─────────────────────────────────────────────────────────────────────────────
// CSV FORMAT GUIDE (shown to user)
// Columns: type, question, option1, option2, option3, option4, correct_answer
//
// type values accepted (case-insensitive):
//   multiplechoice   → correct_answer = the text of the correct option
//   multipleresponse → correct_answer = pipe-separated correct options e.g. "Paris|Rome"
//   truefalse        → correct_answer = "true" or "false"
//   fillintheblank   → correct_answer = the expected text
//   (omitted/blank)  → defaults to multiplechoice if options present, fillintheblank otherwise
// ─────────────────────────────────────────────────────────────────────────────

const DESIGN_TOKENS = {
  surface:  "var(--surface,  #141418)",
  surface2: "var(--surface2, #1a1a22)",
  border:   "var(--border,   #222230)",
  border2:  "var(--border2,  #2a2a3a)",
  ivory:    "var(--ivory,    #f0ead6)",
  slate:    "var(--slate,    #9a99b0)",
  slate2:   "var(--slate2,   #5c5c74)",
  gold:     "var(--gold,     #c9a84c)",
  gold2:    "var(--gold2,    #a88838)",
  gold3:    "var(--gold3,    #6b5a28)",
  goldBg:   "rgba(201,168,76,.08)",
  goldBg2:  "rgba(201,168,76,.15)",
  green:    "#4caf7d",
  red:      "#c07070",
  serif:    "var(--serif)",
  display:  "var(--display)",
};
const T = DESIGN_TOKENS;

const css = {
  input: {
    display: "block", width: "100%",
    background: T.surface2, border: `1px solid ${T.border2}`,
    borderRadius: 6, color: T.ivory,
    padding: "10px 13px",
    fontSize: "var(--fs-secondary)",
    fontFamily: T.display,
    outline: "none", transition: "border-color .18s, box-shadow .18s",
    boxSizing: "border-box",
  },
  label: {
    display: "block", color: T.slate2,
    fontSize: "var(--fs-micro)", fontFamily: T.display,
    fontWeight: 700, letterSpacing: ".1em",
    textTransform: "uppercase", marginBottom: 6,
  },
  sectionTitle: {
    display: "flex", alignItems: "center", gap: 8,
    color: T.ivory, fontFamily: T.display, fontWeight: 700,
    fontSize: "var(--fs-micro)", letterSpacing: ".1em", textTransform: "uppercase",
    marginTop: 28, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${T.border}`,
  },
  pill: (active) => ({
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "6px 14px", borderRadius: 4,
    border: `1px solid ${active ? T.gold : T.border2}`,
    background: active ? T.goldBg : "transparent",
    color: active ? T.gold : T.slate,
    fontFamily: T.display, fontWeight: 700,
    fontSize: "var(--fs-micro)", letterSpacing: ".06em",
    cursor: "pointer", transition: "all .15s", userSelect: "none",
  }),
  btn: (variant = "primary") => ({
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "9px 20px", borderRadius: 6,
    border: variant === "primary" ? "none" : `1px solid ${T.border2}`,
    background: variant === "primary" ? T.gold : "transparent",
    color: variant === "primary" ? "#0e0e12" : T.slate,
    fontFamily: T.display, fontWeight: 700,
    fontSize: "var(--fs-micro)", letterSpacing: ".08em",
    cursor: "pointer", transition: "all .15s", userSelect: "none",
  }),
  card: {
    background: T.surface, border: `1px solid ${T.border}`,
    borderRadius: 8, padding: "18px 20px", marginBottom: 10,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// CSV PARSER — supports all 4 question types
// ─────────────────────────────────────────────────────────────────────────────
function parseQuestionsFromCSV(csvText) {
  const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  const parsed = [];
  const errors = [];

  result.data.forEach((row, idx) => {
    const rowNum = idx + 2; // 1-based, account for header
    const rawType = (row.type || "").trim().toLowerCase().replace(/[\s_-]/g, "");
    const questionText = (row.question || "").trim();

    if (!questionText) {
      errors.push(`Row ${rowNum}: missing question text — skipped`);
      return;
    }

    // Detect type — accept common aliases
    let type = "multiplechoice"; // default
    if (rawType === "multiplechoice" || rawType === "mc" || rawType === "multiple" || rawType === "single") {
      type = "multiplechoice";
    } else if (rawType === "multipleresponse" || rawType === "mr" || rawType === "multiselect" || rawType === "checkbox") {
      type = "multipleresponse";
    } else if (rawType === "truefalse" || rawType === "tf" || rawType === "boolean" || rawType === "bool") {
      type = "truefalse";
    } else if (rawType === "fillintheblank" || rawType === "fitb" || rawType === "fill" || rawType === "blank" || rawType === "short") {
      type = "fillintheblank";
    } else if (rawType === "") {
      // Auto-detect: if no options provided → fillintheblank, else multiplechoice
      const opts = [row.option1, row.option2, row.option3, row.option4].filter((o) => o && o.trim());
      type = opts.length > 0 ? "multiplechoice" : "fillintheblank";
    } else {
      errors.push(`Row ${rowNum}: unknown type "${row.type}" — defaulted to multiplechoice`);
      type = "multiplechoice";
    }

    const correctRaw = (row.correct_answer || "").trim();

    if (type === "multiplechoice") {
      const opts = [row.option1, row.option2, row.option3, row.option4]
        .map((o) => (o || "").trim())
        .filter(Boolean);

      if (opts.length < 2) {
        errors.push(`Row ${rowNum}: multiplechoice needs at least 2 options — skipped`);
        return;
      }

      const correctIdx = opts.findIndex(
        (o) => o.toLowerCase() === correctRaw.toLowerCase()
      );

      if (correctIdx === -1 && correctRaw) {
        errors.push(`Row ${rowNum}: correct_answer "${correctRaw}" not found in options — answer left unset`);
      }

      parsed.push({
        type: "multiplechoice",
        text: questionText,
        options: opts,
        correctAnswer: correctIdx >= 0 ? correctIdx : null,
      });

    } else if (type === "multipleresponse") {
      const opts = [row.option1, row.option2, row.option3, row.option4]
        .map((o) => (o || "").trim())
        .filter(Boolean);

      if (opts.length < 2) {
        errors.push(`Row ${rowNum}: multipleresponse needs at least 2 options — skipped`);
        return;
      }

      // correct_answer is pipe-separated e.g. "Paris|Rome" or comma-separated "Paris,Rome"
      const separator = correctRaw.includes("|") ? "|" : ",";
      const correctVals = correctRaw
        .split(separator)
        .map((s) => s.trim())
        .filter(Boolean);

      const correctAnswers = correctVals.filter((cv) =>
        opts.some((o) => o.toLowerCase() === cv.toLowerCase())
      );

      const mismatches = correctVals.filter(
        (cv) => !opts.some((o) => o.toLowerCase() === cv.toLowerCase())
      );
      if (mismatches.length) {
        errors.push(`Row ${rowNum}: these correct answers not found in options: ${mismatches.join(", ")}`);
      }

      parsed.push({
        type: "multipleresponse",
        text: questionText,
        options: opts,
        correctAnswers,
      });

    } else if (type === "truefalse") {
      const lower = correctRaw.toLowerCase();
      let correctAnswer = null;
      if (lower === "true" || lower === "t" || lower === "yes" || lower === "1") {
        correctAnswer = true;
      } else if (lower === "false" || lower === "f" || lower === "no" || lower === "0") {
        correctAnswer = false;
      } else {
        errors.push(`Row ${rowNum}: truefalse correct_answer must be "true" or "false", got "${correctRaw}"`);
      }

      parsed.push({
        type: "truefalse",
        text: questionText,
        correctAnswer,
      });

    } else if (type === "fillintheblank") {
      if (!correctRaw) {
        errors.push(`Row ${rowNum}: fillintheblank has no correct_answer — answer left blank`);
      }
      parsed.push({
        type: "fillintheblank",
        text: questionText,
        correctAnswer: correctRaw,
      });
    }
  });

  return { questions: parsed, errors };
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────
function Field({ label, hint, children, required }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={css.label}>
        {label}{required && <span style={{ color: T.gold, marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {hint && (
        <div style={{ color: T.slate2, fontSize: "var(--fs-micro)", fontFamily: T.display, marginTop: 5 }}>
          {hint}
        </div>
      )}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", min, style: sx = {} }) {
  const [f, setF] = useState(false);
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} min={min}
      style={{ ...css.input, borderColor: f ? T.gold2 : T.border2, boxShadow: f ? `0 0 0 3px ${T.goldBg}` : "none", ...sx }}
      onFocus={() => setF(true)} onBlur={() => setF(false)} />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  const [f, setF] = useState(false);
  return (
    <textarea value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} rows={rows}
      style={{ ...css.input, resize: "vertical", lineHeight: 1.6, borderColor: f ? T.gold2 : T.border2, boxShadow: f ? `0 0 0 3px ${T.goldBg}` : "none" }}
      onFocus={() => setF(true)} onBlur={() => setF(false)} />
  );
}

function Sel({ value, onChange, options, placeholder }) {
  const [f, setF] = useState(false);
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      style={{
        ...css.input, cursor: "pointer",
        borderColor: f ? T.gold2 : T.border2,
        boxShadow: f ? `0 0 0 3px ${T.goldBg}` : "none",
        appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%235c5c74'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: 32,
      }}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o.value} value={o.value} style={{ background: T.surface2 }}>{o.label}</option>)}
    </select>
  );
}

function Toggle({ checked, onChange, label, description }) {
  return (
    <div onClick={() => onChange(!checked)} style={{
      display: "flex", alignItems: "flex-start", gap: 12,
      padding: "12px 14px", borderRadius: 6, cursor: "pointer",
      border: `1px solid ${checked ? T.border2 : T.border}`,
      background: checked ? T.goldBg : "transparent",
      marginBottom: 8, transition: "all .15s",
    }}>
      <div style={{
        width: 36, height: 20, borderRadius: 10, flexShrink: 0, marginTop: 1,
        background: checked ? T.gold : T.border2, position: "relative", transition: "all .2s",
      }}>
        <div style={{
          width: 12, height: 12, borderRadius: "50%", background: "#fff",
          position: "absolute", top: 4, left: checked ? 20 : 4, transition: "left .2s",
          boxShadow: "0 1px 3px rgba(0,0,0,.3)",
        }} />
      </div>
      <div>
        <div style={{ color: checked ? T.ivory : T.slate, fontSize: "var(--fs-secondary)", fontFamily: T.display, fontWeight: 700, letterSpacing: ".04em" }}>{label}</div>
        {description && <div style={{ color: T.slate2, fontSize: "var(--fs-micro)", fontFamily: T.display, marginTop: 2 }}>{description}</div>}
      </div>
    </div>
  );
}

function Chk({ checked, onChange, label }) {
  return (
    <div onClick={() => onChange(!checked)} style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "8px 12px", borderRadius: 5, cursor: "pointer",
      background: checked ? T.goldBg : "transparent",
      border: `1px solid ${checked ? T.border2 : T.border}`,
      marginBottom: 6, transition: "all .15s",
    }}>
      <div style={{
        width: 14, height: 14, borderRadius: 3, flexShrink: 0,
        border: `1.5px solid ${checked ? T.gold : T.border2}`,
        background: checked ? T.gold : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s",
      }}>
        {checked && <span style={{ color: "#0e0e12", fontSize: 9, fontWeight: 900, lineHeight: 1 }}>✓</span>}
      </div>
      <span style={{ color: checked ? T.ivory : T.slate, fontSize: "var(--fs-small)", fontFamily: T.display, fontWeight: 600, letterSpacing: ".04em" }}>{label}</span>
    </div>
  );
}

function SH({ icon, children }) {
  return (
    <div style={css.sectionTitle}>
      <span style={{ color: T.gold3 }}>{icon}</span>
      <span>{children}</span>
    </div>
  );
}

function StatMini({ icon, label, value }) {
  return (
    <div style={{ ...css.card, padding: "16px 18px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
      <div style={{ color: T.slate2, fontSize: 16 }}>{icon}</div>
      <div style={{ fontFamily: T.serif, fontSize: "var(--fs-section)", color: T.gold, fontWeight: 400, lineHeight: 1 }}>{value}</div>
      <div style={{ color: T.slate2, fontSize: "var(--fs-micro)", fontFamily: T.display, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}



function Modal({ open, onClose, title, subtitle, children, footer }) {
  if (!open) return null;

  return createPortal(
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(14,14,18,.88)",
      display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(4px)",
    }}>
      <div style={{
        width: "100%", maxWidth: 520,
        background: T.surface, border: `1px solid ${T.border2}`,
        borderRadius: 10, overflow: "hidden",
        boxShadow: "0 24px 60px rgba(0,0,0,.5)",
      }}>
        <div style={{
          padding: "20px 24px 16px", borderBottom: `1px solid ${T.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        }}>
          <div>
            <div style={{ color: T.gold, fontSize: "var(--fs-micro)", fontFamily: T.display, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 4 }}>
              SKILL BRIDGE
            </div>
            <div style={{ color: T.ivory, fontFamily: T.serif, fontSize: "var(--fs-card)", fontWeight: 400 }}>{title}</div>
            {subtitle && (
              <div style={{ color: T.slate, fontSize: "var(--fs-small)", fontFamily: T.display, marginTop: 3 }}>{subtitle}</div>
            )}
          </div>
          <button onClick={onClose}
            style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 4, color: T.slate2, padding: "4px 10px", fontSize: "var(--fs-micro)", fontFamily: T.display, cursor: "pointer" }}
            onMouseOver={(e) => { e.currentTarget.style.color = T.ivory; }}
            onMouseOut={(e) => { e.currentTarget.style.color = T.slate2; }}
          >✕</button>
        </div>
        <div style={{ padding: "20px 24px" }}>{children}</div>
        {footer && (
          <div style={{ padding: "14px 24px 20px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 10, justifyContent: "flex-end" }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body   // ← renders directly on body, escapes AdminLayout entirely
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// IMPORT FROM PREVIOUS TESTS MODAL
// ─────────────────────────────────────────────────────────────────────────────
function ImportQuestionsModal({ open, onClose, onImport }) {
  const [tests, setTests]               = useState([]);
  const [loading, setLoading]           = useState(false);
  const [search, setSearch]             = useState("");
  const [activeTestId, setActiveTestId] = useState(null);
  const [selected, setSelected]         = useState([]);

  useEffect(() => {
    if (!open) { setSelected([]); setActiveTestId(null); setSearch(""); return; }
    setLoading(true);
    getTests()
      .then((d) => setTests(Array.isArray(d) ? d : []))
      .catch(() => setTests([]))
      .finally(() => setLoading(false));
  }, [open]);

  const questionsByTest = React.useMemo(() => {
    const map = {};
    tests.forEach((t) => { map[t.id] = Array.isArray(t.questions) ? t.questions : []; });
    return map;
  }, [tests]);

  const filteredTests = tests.filter((t) => {
    const q = search.toLowerCase();
    return !q || (t.title || t.name || "").toLowerCase().includes(q) || (t.subject || "").toLowerCase().includes(q);
  });

  const activeTest       = tests.find((t) => t.id === activeTestId) || null;
  const visibleQuestions = activeTestId !== null ? (questionsByTest[activeTestId] || []) : [];

  const toggle = (q) =>
    setSelected((p) => p.some((x) => x.id === q.id) ? p.filter((x) => x.id !== q.id) : [...p, q]);

  const selectAllVisible = () => {
    const allSel = visibleQuestions.every((q) => selected.some((s) => s.id === q.id));
    if (allSel) setSelected((p) => p.filter((s) => !visibleQuestions.some((q) => q.id === s.id)));
    else setSelected((p) => [...p, ...visibleQuestions.filter((q) => !selected.some((s) => s.id === q.id))]);
  };

  const normaliseQ = (q) => {
    const type = (q.type || "multiplechoice").toLowerCase().replace(/[\s_-]/g, "");
    if (type === "multipleresponse") return { type: "multipleresponse", text: q.text || q.question || "", options: Array.isArray(q.options) ? q.options : [], correctAnswers: Array.isArray(q.correct_answer) ? q.correct_answer : Array.isArray(q.correctAnswers) ? q.correctAnswers : [] };
    if (type === "truefalse") { const ca = q.correct_answer ?? q.correctAnswer ?? null; return { type: "truefalse", text: q.text || q.question || "", correctAnswer: ca === true || ca === "true" ? true : ca === false || ca === "false" ? false : null }; }
    if (type === "fillintheblank") return { type: "fillintheblank", text: q.text || q.question || "", correctAnswer: q.correct_answer ?? q.correctAnswer ?? "" };
    return { type: "multiplechoice", text: q.text || q.question || "", options: Array.isArray(q.options) ? q.options : [], correctAnswer: q.correct_answer ?? q.correctAnswer ?? null };
  };

  const handleImport = () => { onImport(selected.map(normaliseQ)); onClose(); };

  const answerLine = (q) => {
    const type = (q.type || "").toLowerCase().replace(/[\s_-]/g, "");
    const ca = q.correct_answer ?? q.correctAnswer;
    if (type === "truefalse") return `Answer: ${ca === true || ca === "true" ? "True" : "False"}`;
    if (type === "fillintheblank") return ca ? `Answer: "${ca}"` : null;
    if (type === "multipleresponse") { const arr = Array.isArray(q.correct_answer ?? q.correctAnswers) ? (q.correct_answer ?? q.correctAnswers) : []; return arr.length ? `Correct: ${arr.join(", ")}` : null; }
    if (Array.isArray(q.options)) { const idx = q.correct_answer ?? q.correctAnswer; if (typeof idx === "number" && q.options[idx]) return `Correct: ${q.options[idx]}`; if (typeof idx === "string" && idx !== "N/A") return `Correct: ${idx}`; }
    return null;
  };

  const typeLabel = (t) => ({ multiplechoice: "Multiple Choice", multipleresponse: "Multiple Response", truefalse: "True / False", fillintheblank: "Fill in Blank" })[(t || "").toLowerCase().replace(/[\s_-]/g, "")] || t;

  if (!open) return null;
  return createPortal(
    <div style={{
      position: "fixed", inset: 0, zIndex: 999999,
      background: "rgba(0,0,0,.85)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        width: "min(900px, 96vw)", height: "min(620px, 92vh)",
        background: "var(--ink2)", border: "1px solid var(--border)",
        borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "0 25px 60px rgba(0,0,0,.6)",
      }}>

        {/* Header */}
        <div style={{
          padding: "20px 24px", borderBottom: "1px solid var(--border2)",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          flexShrink: 0, background: "var(--ink3)",
        }}>
          <div>
            <div style={{
              fontFamily: "var(--display)", fontWeight: 700,
              fontSize: "var(--fs-card)", color: "var(--ivory)",
              letterSpacing: ".01em", marginBottom: 4,
            }}>
              Import from Previous Tests
            </div>
            <div style={{
              fontFamily: "var(--body)", fontSize: "var(--fs-secondary)",
              color: "var(--slate)",
            }}>
              Select a test on the left, then pick questions to reuse
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ flexShrink: 0 }}>
            x
          </button>
        </div>

        {/* Body: two-pane grid */}
        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", flex: 1, minHeight: 0 }}>

          {/* Left pane */}
          <div style={{
            borderRight: "1px solid var(--border2)",
            display: "flex", flexDirection: "column", overflow: "hidden",
            background: "var(--ink3)",
          }}>
            {/* Search */}
            <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border2)", flexShrink: 0 }}>
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tests…"
                className="search-input"
                style={{ width: "100%", padding: "8px 12px", fontSize: "var(--fs-secondary)" }}
              />
            </div>

            {/* Count row */}
            <div style={{
              padding: "7px 14px", borderBottom: "1px solid var(--border2)", flexShrink: 0,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: "var(--fs-small)", color: "var(--slate)", letterSpacing: ".08em", textTransform: "uppercase" }}>Tests</span>
              <span style={{ fontFamily: "var(--body)", fontSize: "var(--fs-small)", color: "var(--slate)" }}>{filteredTests.length}</span>
            </div>

            {/* Test list */}
            <div style={{ overflowY: "auto", flex: 1 }}>
              {loading ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "var(--slate)", fontFamily: "var(--body)", fontSize: "var(--fs-secondary)" }}>Loading…</div>
              ) : filteredTests.length === 0 ? (
                <div style={{ padding: "40px 0", textAlign: "center", color: "var(--slate)", fontFamily: "var(--body)", fontSize: "var(--fs-secondary)" }}>No tests found</div>
              ) : filteredTests.map((t) => {
                const active   = activeTestId === t.id;
                const qCount   = (questionsByTest[t.id] || []).length;
                const selCount = (questionsByTest[t.id] || []).filter((q) => selected.some((s) => s.id === q.id)).length;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTestId(active ? null : t.id)}
                    style={{
                      width: "100%", textAlign: "left",
                      padding: "12px 14px",
                      background: active ? "rgba(196,161,94,.09)" : "transparent",
                      border: "none", borderBottom: "1px solid var(--border2)",
                      borderLeft: `2px solid ${active ? "var(--gold)" : "transparent"}`,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{
                      fontFamily: "var(--display)", fontWeight: 700,
                      fontSize: "var(--fs-secondary)",
                      color: active ? "var(--ivory)" : "var(--slate2)",
                      marginBottom: 3, lineHeight: 1.35,
                    }}>
                      {t.title || t.name || `Test #${t.id}`}
                    </div>
                    {(t.subject || t.difficulty) && (
                      <div style={{ fontFamily: "var(--body)", fontSize: "var(--fs-small)", color: "var(--slate)", marginBottom: 6 }}>
                        {[t.subject, t.difficulty].filter(Boolean).join(" · ")}
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <span style={{
                        fontFamily: "var(--display)", fontWeight: 700,
                        fontSize: "var(--fs-small)",
                        padding: "2px 8px", borderRadius: 2,
                        background: "rgba(196,161,94,.07)", border: "1px solid rgba(196,161,94,.18)",
                        color: "var(--gold)",
                      }}>{qCount} Q</span>
                      {selCount > 0 && (
                        <span style={{
                          fontFamily: "var(--display)", fontWeight: 700,
                          fontSize: "var(--fs-small)",
                          padding: "2px 8px", borderRadius: 2,
                          background: "rgba(107,224,146,.08)", border: "1px solid rgba(107,224,146,.2)",
                          color: "#6BE092",
                        }}>✓ {selCount}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

          </div>

          {/* Right pane */}
          <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {activeTestId === null ? (
              <div style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                gap: 10, padding: 40, textAlign: "center",
              }}>
                <div style={{ color: "var(--border)", fontSize: 36, fontFamily: "var(--serif)" }}>◈</div>
                <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: "var(--fs-body)", color: "var(--slate2)" }}>
                  Select a test
                </div>
                <div style={{ fontFamily: "var(--body)", fontSize: "var(--fs-secondary)", color: "var(--slate)", maxWidth: 220, lineHeight: 1.6 }}>
                  Choose a test from the left to view and pick questions
                </div>
              </div>
            ) : (
              <>
                {/* Right sub-header */}
                <div style={{
                  padding: "10px 16px", borderBottom: "1px solid var(--border2)",
                  background: "var(--ink3)", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontFamily: "var(--display)", fontWeight: 700,
                      fontSize: "var(--fs-body)", color: "var(--ivory)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {activeTest?.title || activeTest?.name || `Test #${activeTestId}`}
                    </div>
                    <div style={{ fontFamily: "var(--body)", fontSize: "var(--fs-secondary)", color: "var(--slate)", marginTop: 1 }}>
                      {visibleQuestions.length} questions
                      {visibleQuestions.length > 0 && ` · ${visibleQuestions.filter((q) => selected.some((s) => s.id === q.id)).length} selected`}
                    </div>
                  </div>
                  {visibleQuestions.length > 0 && (
                    <button onClick={selectAllVisible} className="btn-ghost" style={{ flexShrink: 0 }}>
                      {visibleQuestions.every((q) => selected.some((s) => s.id === q.id)) ? "Deselect All" : "Select All"}
                    </button>
                  )}
                </div>

                {/* Question list */}
                <div style={{ overflowY: "auto", flex: 1, padding: "12px 14px" }}>
                  {visibleQuestions.length === 0 ? (
                    <div style={{ padding: "40px 0", textAlign: "center", color: "var(--slate)", fontFamily: "var(--body)", fontSize: "var(--fs-secondary)" }}>
                      No questions in this test
                    </div>
                  ) : visibleQuestions.map((q, i) => {
                    const sel   = selected.some((s) => s.id === q.id);
                    const type  = (q.type || "").toLowerCase().replace(/[\s_-]/g, "");
                    const ca    = q.correct_answer ?? q.correctAnswer;
                    const opts  = Array.isArray(q.options) ? q.options : [];
                    const caArr = Array.isArray(q.correct_answer ?? q.correctAnswers) ? (q.correct_answer ?? q.correctAnswers) : [];
                    const ans   = answerLine(q);

                    return (
                      <div
                        key={q.id ?? i}
                        onClick={() => toggle(q)}
                        style={{
                          display: "flex", alignItems: "flex-start", gap: 10,
                          padding: "12px 14px", marginBottom: 8, borderRadius: 6, cursor: "pointer",
                          background: sel ? "rgba(196,161,94,.07)" : "rgba(255,255,255,.02)",
                          border: `1px solid ${sel ? "rgba(196,161,94,.25)" : "var(--border2)"}`,
                          transition: "background .15s, border-color .15s",
                        }}
                      >
                        {/* Checkbox */}
                        <div style={{
                          width: 15, height: 15, borderRadius: 3, flexShrink: 0, marginTop: 2,
                          border: `1px solid ${sel ? "var(--gold)" : "rgba(196,161,94,.2)"}`,
                          background: sel ? "var(--gold)" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {sel && <span style={{ color: "var(--ink)", fontSize: 9, fontWeight: 900 }}>✓</span>}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          {/* Question text */}
                          <div style={{
                            fontFamily: "var(--body)", fontSize: "var(--fs-body)",
                            color: sel ? "var(--ivory)" : "var(--slate2)",
                            lineHeight: 1.55, marginBottom: 7,
                          }}>
                            <span style={{
                              fontFamily: "var(--display)", fontWeight: 700,
                              fontSize: "var(--fs-small)", color: "var(--slate)",
                              marginRight: 8, letterSpacing: ".06em",
                            }}>Q{i + 1}</span>
                            {q.text || q.question || <span style={{ fontStyle: "italic", opacity: .5 }}>No question text</span>}
                          </div>

                          {/* Type badge + answer */}
                          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: opts.length ? 7 : 0 }}>
                            <span style={{
                              fontFamily: "var(--display)", fontWeight: 700,
                              fontSize: "var(--fs-small)",
                              padding: "2px 8px", borderRadius: 2,
                              background: "rgba(196,161,94,.07)", border: "1px solid rgba(196,161,94,.18)",
                              color: "var(--gold)",
                            }}>
                              {typeLabel(q.type)}
                            </span>
                            {ans && (
                              <span style={{ fontFamily: "var(--body)", fontSize: "var(--fs-small)", color: "var(--slate)", fontStyle: "italic" }}>
                                {ans}
                              </span>
                            )}
                          </div>

                          {/* Option chips */}
                          {opts.length > 0 && (
                            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                              {opts.slice(0, 4).map((opt, oi) => {
                                const isMR    = type === "multipleresponse";
                                const correct = isMR
                                  ? caArr.some((c) => c.toLowerCase() === opt.toLowerCase())
                                  : typeof ca === "number" ? ca === oi : typeof ca === "string" && ca.toLowerCase() === opt.toLowerCase();
                                return (
                                  <span key={oi} style={{
                                    fontFamily: "var(--body)", fontSize: "var(--fs-small)",
                                    padding: "2px 8px", borderRadius: 2,
                                    border: `1px solid ${correct ? (isMR ? "rgba(167,139,250,.35)" : "rgba(196,161,94,.3)") : "var(--border2)"}`,
                                    color: correct ? (isMR ? "#a78bfa" : "var(--gold)") : "var(--slate)",
                                    background: correct ? (isMR ? "rgba(167,139,250,.08)" : "rgba(196,161,94,.07)") : "transparent",
                                  }}>
                                    {correct ? "✓ " : ""}{opt}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 24px", borderTop: "1px solid var(--border2)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexShrink: 0, background: "var(--ink3)",
        }}>
          <span style={{
            fontFamily: "var(--body)", fontSize: "var(--fs-secondary)",
            color: selected.length > 0 ? "#6BE092" : "var(--slate)",
            fontWeight: selected.length > 0 ? 500 : 400,
          }}>
            {selected.length > 0
              ? `${selected.length} question${selected.length !== 1 ? "s" : ""} ready to import`
              : "No questions selected"}
          </span>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} className="btn-ghost">Cancel</button>
            <button
              onClick={handleImport}
              disabled={selected.length === 0}
              className="btn-p"
              style={{ opacity: selected.length === 0 ? 0.4 : 1, cursor: selected.length === 0 ? "not-allowed" : "pointer" }}
            >
              Import {selected.length > 0 ? `${selected.length} Question${selected.length !== 1 ? "s" : ""}` : ""}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// QUESTION BANK MODAL
// ─────────────────────────────────────────────────────────────────────────────
function QuestionBankModal({ open, onClose, onImport }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState("");
  const [selected, setSelected]   = useState([]);

  useEffect(() => {
    if (!open) { setSelected([]); setSearch(""); return; }
    setLoading(true);
    getAllQuestions()
      .then((d) => setQuestions(Array.isArray(d) ? d : []))
      .catch(() => setQuestions([]))
      .finally(() => setLoading(false));
  }, [open]);

  const filtered = questions.filter((q) =>
    !search || (q.text || q.question || "").toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (q) =>
    setSelected((p) => p.some((x) => x.id === q.id) ? p.filter((x) => x.id !== q.id) : [...p, q]);

  const normaliseQ = (q) => {
    const type = (q.type || "multiplechoice").toLowerCase().replace(/[\s_-]/g, "");
    if (type === "multipleresponse") return { type: "multipleresponse", text: q.text || q.question || "", options: Array.isArray(q.options) ? q.options : [], correctAnswers: Array.isArray(q.correct_answer) ? q.correct_answer : Array.isArray(q.correctAnswers) ? q.correctAnswers : [] };
    if (type === "truefalse") { const ca = q.correct_answer ?? q.correctAnswer ?? null; return { type: "truefalse", text: q.text || q.question || "", correctAnswer: ca === true || ca === "true" ? true : ca === false || ca === "false" ? false : null }; }
    if (type === "fillintheblank") return { type: "fillintheblank", text: q.text || q.question || "", correctAnswer: q.correct_answer ?? q.correctAnswer ?? "" };
    return { type: "multiplechoice", text: q.text || q.question || "", options: Array.isArray(q.options) ? q.options : [], correctAnswer: q.correct_answer ?? q.correctAnswer ?? null };
  };

  const handleImport = () => { onImport(selected.map(normaliseQ)); onClose(); };

  const answerLine = (q) => {
    const type = (q.type || "").toLowerCase().replace(/[\s_-]/g, "");
    const ca = q.correct_answer ?? q.correctAnswer;
    if (type === "truefalse") return `Answer: ${ca === true || ca === "true" ? "True" : "False"}`;
    if (type === "fillintheblank") return ca ? `Answer: "${ca}"` : null;
    if (type === "multipleresponse") { const arr = Array.isArray(q.correct_answer ?? q.correctAnswers) ? (q.correct_answer ?? q.correctAnswers) : []; return arr.length ? `Correct: ${arr.join(", ")}` : null; }
    if (Array.isArray(q.options)) { const idx = q.correct_answer ?? q.correctAnswer; if (typeof idx === "number" && q.options[idx]) return `Correct: ${q.options[idx]}`; if (typeof idx === "string" && idx !== "N/A") return `Correct: ${idx}`; }
    return null;
  };

  const typeLabel = (t) => ({ multiplechoice: "Multiple Choice", multipleresponse: "Multiple Response", truefalse: "True / False", fillintheblank: "Fill in Blank" })[(t || "").toLowerCase().replace(/[\s_-]/g, "")] || t;

  if (!open) return null;
  return createPortal(
    <div style={{
      position: "fixed", inset: 0, zIndex: 999999,
      background: "rgba(0,0,0,.85)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        width: "min(700px, 96vw)", height: "min(580px, 92vh)",
        background: "var(--ink2)", border: "1px solid var(--border)",
        borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "0 25px 60px rgba(0,0,0,.6)",
      }}>

        {/* Header */}
        <div style={{
          padding: "20px 24px", borderBottom: "1px solid var(--border2)",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          flexShrink: 0, background: "var(--ink3)",
        }}>
          <div>
            <div style={{
              fontFamily: "var(--display)", fontWeight: 700,
              fontSize: "var(--fs-card)", color: "var(--ivory)",
              letterSpacing: ".01em", marginBottom: 4,
            }}>
              Question Bank
            </div>
            <div style={{ fontFamily: "var(--body)", fontSize: "var(--fs-secondary)", color: "var(--slate)" }}>
              {questions.length} question{questions.length !== 1 ? "s" : ""} available
              {selected.length > 0 ? ` · ${selected.length} selected` : ""}
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ flexShrink: 0 }}>
            x
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border2)", flexShrink: 0 }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions…"
            className="search-input"
            style={{ width: "100%", padding: "8px 12px", fontSize: "var(--fs-secondary)" }}
          />
        </div>

        {/* Question list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>
          {loading ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "var(--slate)", fontFamily: "var(--body)", fontSize: "var(--fs-secondary)" }}>
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center" }}>
              <div style={{ fontFamily: "var(--display)", fontWeight: 700, fontSize: "var(--fs-body)", color: "var(--slate2)", marginBottom: 4 }}>
                No questions found
              </div>
              <div style={{ fontFamily: "var(--body)", fontSize: "var(--fs-secondary)", color: "var(--slate)" }}>
                {questions.length === 0 ? "Your question bank is empty" : "Try a different search term"}
              </div>
            </div>
          ) : filtered.map((q, i) => {
            const sel   = selected.some((s) => s.id === q.id);
            const type  = (q.type || "").toLowerCase().replace(/[\s_-]/g, "");
            const ca    = q.correct_answer ?? q.correctAnswer;
            const opts  = Array.isArray(q.options) ? q.options : [];
            const caArr = Array.isArray(q.correct_answer ?? q.correctAnswers) ? (q.correct_answer ?? q.correctAnswers) : [];
            const ans   = answerLine(q);

            return (
              <div
                key={q.id ?? i}
                onClick={() => toggle(q)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "12px 14px", marginBottom: 8, borderRadius: 6, cursor: "pointer",
                  background: sel ? "rgba(196,161,94,.07)" : "rgba(255,255,255,.02)",
                  border: `1px solid ${sel ? "rgba(196,161,94,.25)" : "var(--border2)"}`,
                  transition: "background .15s, border-color .15s",
                }}
              >
                {/* Checkbox */}
                <div style={{
                  width: 15, height: 15, borderRadius: 3, flexShrink: 0, marginTop: 2,
                  border: `1px solid ${sel ? "var(--gold)" : "rgba(196,161,94,.2)"}`,
                  background: sel ? "var(--gold)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {sel && <span style={{ color: "var(--ink)", fontSize: 9, fontWeight: 900 }}>✓</span>}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* Question text */}
                  <div style={{
                    fontFamily: "var(--body)", fontSize: "var(--fs-body)",
                    color: sel ? "var(--ivory)" : "var(--slate2)",
                    lineHeight: 1.55, marginBottom: 7,
                  }}>
                    <span style={{
                      fontFamily: "var(--display)", fontWeight: 700,
                      fontSize: "var(--fs-small)", color: "var(--slate)",
                      marginRight: 8, letterSpacing: ".06em",
                    }}>Q{i + 1}</span>
                    {q.text || q.question || <span style={{ fontStyle: "italic", opacity: .5 }}>No question text</span>}
                  </div>

                  {/* Type badge + answer */}
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", marginBottom: opts.length ? 7 : 0 }}>
                    <span style={{
                      fontFamily: "var(--display)", fontWeight: 700,
                      fontSize: "var(--fs-small)",
                      padding: "2px 8px", borderRadius: 2,
                      background: "rgba(196,161,94,.07)", border: "1px solid rgba(196,161,94,.18)",
                      color: "var(--gold)",
                    }}>
                      {typeLabel(q.type)}
                    </span>
                    {ans && (
                      <span style={{ fontFamily: "var(--body)", fontSize: "var(--fs-small)", color: "var(--slate)", fontStyle: "italic" }}>
                        {ans}
                      </span>
                    )}
                  </div>

                  {/* Option chips */}
                  {opts.length > 0 && (
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      {opts.slice(0, 4).map((opt, oi) => {
                        const isMR    = type === "multipleresponse";
                        const correct = isMR
                          ? caArr.some((c) => c.toLowerCase() === opt.toLowerCase())
                          : typeof ca === "number" ? ca === oi : typeof ca === "string" && ca.toLowerCase() === opt.toLowerCase();
                        return (
                          <span key={oi} style={{
                            fontFamily: "var(--body)", fontSize: "var(--fs-small)",
                            padding: "2px 8px", borderRadius: 2,
                            border: `1px solid ${correct ? (isMR ? "rgba(167,139,250,.35)" : "rgba(196,161,94,.3)") : "var(--border2)"}`,
                            color: correct ? (isMR ? "#a78bfa" : "var(--gold)") : "var(--slate)",
                            background: correct ? (isMR ? "rgba(167,139,250,.08)" : "rgba(196,161,94,.07)") : "transparent",
                          }}>
                            {correct ? "✓ " : ""}{opt}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: "14px 24px", borderTop: "1px solid var(--border2)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          flexShrink: 0, background: "var(--ink3)",
        }}>
          <span style={{
            fontFamily: "var(--body)", fontSize: "var(--fs-secondary)",
            color: selected.length > 0 ? "#6BE092" : "var(--slate)",
            fontWeight: selected.length > 0 ? 500 : 400,
          }}>
            {selected.length > 0
              ? `${selected.length} question${selected.length !== 1 ? "s" : ""} ready to import`
              : "No questions selected"}
          </span>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onClose} className="btn-ghost">Cancel</button>
            <button
              onClick={handleImport}
              disabled={selected.length === 0}
              className="btn-p"
              style={{ opacity: selected.length === 0 ? 0.4 : 1, cursor: selected.length === 0 ? "not-allowed" : "pointer" }}
            >
              Import {selected.length > 0 ? `${selected.length} Question${selected.length !== 1 ? "s" : ""}` : ""}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
// ─────────────────────────────────────────────────────────────────────────────
// QUESTION BLOCK
// ─────────────────────────────────────────────────────────────────────────────
function QuestionBlock({ q, qi, questions, setQuestions, newOption, setNewOption }) {
  const upd         = (fn) => { const a = [...questions]; fn(a[qi]); setQuestions(a); };
  const setCorrect  = (val) => upd((q) => { q.correctAnswer = val; });
  const toggleMulti = (oi)  => upd((q) => {
    const val = q.options[oi];
    const arr = q.correctAnswers || [];
    q.correctAnswers = arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  });
  const updateOption = (oi, val) => upd((q) => {
    if (val === "") q.options = q.options.filter((_, i) => i !== oi);
    else q.options[oi] = val;
  });
  const addOpt = () => {
    if (!newOption.trim()) return;
    upd((q) => q.options.push(newOption.trim())); setNewOption("");
  };
  const remove = () => setQuestions(questions.filter((_, i) => i !== qi));

  const typeMap = {
    multiplechoice: "Multiple Choice",
    multipleresponse: "Multiple Response",
    truefalse: "True / False",
    fillintheblank: "Fill in the Blank",
  };

  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, marginBottom: 12, overflow: "hidden" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "11px 18px", borderBottom: `1px solid ${T.border}`, background: T.surface2,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ background: T.gold, color: "#0e0e12", fontFamily: T.display, fontWeight: 900, fontSize: "var(--fs-micro)", padding: "2px 9px", borderRadius: 3, letterSpacing: ".08em" }}>Q{qi + 1}</span>
          <span style={{ color: T.slate, fontSize: "var(--fs-micro)", fontFamily: T.display, fontWeight: 700, letterSpacing: ".08em" }}>{typeMap[q.type]}</span>
        </div>
        <button onClick={remove}
          style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 4, color: T.slate2, padding: "3px 10px", fontSize: "var(--fs-micro)", fontFamily: T.display, fontWeight: 700, cursor: "pointer", letterSpacing: ".06em", transition: "all .15s" }}
          onMouseOver={(e) => { e.currentTarget.style.borderColor = T.red; e.currentTarget.style.color = T.red; }}
          onMouseOut={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.slate2; }}
        >REMOVE</button>
      </div>

      <div style={{ padding: "16px 18px" }}>
        <Field label="Question Text" required>
          <Textarea value={q.text} onChange={(v) => upd((q) => { q.text = v; })} placeholder="Enter your question here…" rows={2} />
        </Field>

        {q.type === "multiplechoice" && (
          <div>
            <label style={{ ...css.label, marginBottom: 8 }}>
              Answer Options —{" "}
              <span style={{ color: T.slate2, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>click the radio to mark the correct answer</span>
            </label>
            {q.options.map((opt, oi) => (
              <div key={oi} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div onClick={() => setCorrect(oi)} title="Mark as correct" style={{
                  width: 16, height: 16, borderRadius: "50%", flexShrink: 0, cursor: "pointer",
                  border: `2px solid ${q.correctAnswer === oi ? T.gold : T.border2}`,
                  background: q.correctAnswer === oi ? T.gold : "transparent", transition: "all .15s",
                }} />
                <Input value={opt} onChange={(v) => updateOption(oi, v)} placeholder={`Option ${oi + 1}`} style={{ borderColor: q.correctAnswer === oi ? T.gold3 : T.border2 }} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <Input value={newOption} onChange={setNewOption} placeholder="New option…" />
              <button onClick={addOpt} style={{ ...css.btn("primary"), flexShrink: 0, padding: "9px 16px" }}>Add</button>
            </div>
          </div>
        )}

        {q.type === "multipleresponse" && (
          <div>
            <label style={{ ...css.label, marginBottom: 8 }}>
              Answer Options —{" "}
              <span style={{ color: T.slate2, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>check all correct answers</span>
            </label>
            {q.options.map((opt, oi) => (
              <div key={oi} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div onClick={() => toggleMulti(oi)} style={{
                  width: 14, height: 14, borderRadius: 3, flexShrink: 0, cursor: "pointer",
                  border: `1.5px solid ${(q.correctAnswers || []).includes(opt) ? T.gold : T.border2}`,
                  background: (q.correctAnswers || []).includes(opt) ? T.gold : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s",
                }}>
                  {(q.correctAnswers || []).includes(opt) && <span style={{ color: "#0e0e12", fontSize: 9, fontWeight: 900 }}>✓</span>}
                </div>
                <Input value={opt} onChange={(v) => updateOption(oi, v)} placeholder={`Option ${oi + 1}`} />
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <Input value={newOption} onChange={setNewOption} placeholder="New option…" />
              <button onClick={addOpt} style={{ ...css.btn("primary"), flexShrink: 0, padding: "9px 16px" }}>Add</button>
            </div>
          </div>
        )}

        {q.type === "truefalse" && (
          <div>
            <label style={{ ...css.label, marginBottom: 10 }}>Correct Answer</label>
            <div style={{ display: "flex", gap: 10 }}>
              {[{ val: true, label: "True", icon: "✓" }, { val: false, label: "False", icon: "✕" }].map(({ val, label, icon }) => (
                <button key={String(val)} onClick={() => setCorrect(val)} style={{
                  flex: 1, padding: "14px 0", borderRadius: 6, cursor: "pointer",
                  border: `1px solid ${q.correctAnswer === val ? T.gold : T.border2}`,
                  background: q.correctAnswer === val ? T.goldBg2 : T.surface2,
                  color: q.correctAnswer === val ? T.gold : T.slate,
                  fontFamily: T.display, fontWeight: 700, fontSize: "var(--fs-small)", letterSpacing: ".08em",
                  transition: "all .15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900,
                    background: q.correctAnswer === val ? T.gold : T.border2,
                    color: q.correctAnswer === val ? "#0e0e12" : T.slate2,
                  }}>{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {q.type === "fillintheblank" && (
          <Field label="Correct Answer" hint="Students must type this exactly to be marked correct">
            <Input value={q.correctAnswer} onChange={(v) => upd((q) => { q.correctAnswer = v; })} placeholder="Enter the expected answer…" />
          </Field>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function CreateNewTest() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [newOption, setNewOption]   = useState("");
  const [importMode, setImportMode] = useState(null);
  const [importSubMode, setImportSubMode] = useState(null); 
  const [uploadType, setUploadType] = useState("");

  // Import modal (inline — no external file)
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [questionBankModalOpen, setQuestionBankModalOpen] = useState(false);
  // CSV state
  const [csvParseResult, setCsvParseResult] = useState(null); // { questions, errors }
  const [csvFileName, setCsvFileName]       = useState("");

  const [questions, setQuestions]               = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [testId, setTestId]                     = useState(null);
  const [testLink, setTestLink]                 = useState("");
  const [loading, setLoading]                   = useState(false);
  const [showSuccess, setShowSuccess]           = useState(false);
  const [showInvite, setShowInvite]             = useState(false);
  const [emailList, setEmailList]               = useState([]);
  const [copied, setCopied]                     = useState(false);

  // Step 0
  const [testName, setTestName]               = useState("");
  const [testDescription, setTestDescription] = useState("");
  const [category, setCategory]               = useState("");
  const [subject, setSubject]                 = useState("");
  const [difficulty, setDifficulty]           = useState("");

  // Step 3
  const [timeLimitPerQ, setTimeLimitPerQ] = useState(1);
  const [marksPerQ, setMarksPerQ]         = useState(1);

  // Step 4
  const [passCriteria, setPassCriteria] = useState("");

  // Step 5
  const [instructions, setInstructions]     = useState("");
  const [conclusion, setConclusion]         = useState("");
  const [startDate, setStartDate]           = useState("");
  const [endDate, setEndDate]               = useState("");
  const [dueTime, setDueTime]               = useState("");
  const [allowJump, setAllowJump]           = useState(false);
  const [onlyForward, setOnlyForward]       = useState(false);
  const [noRightClick, setNoRightClick]     = useState(false);
  const [noCopyPaste, setNoCopyPaste]       = useState(false);
  const [noTranslate, setNoTranslate]       = useState(false);
  const [noAutoComplete, setNoAutoComplete] = useState(false);
  const [noSpellcheck, setNoSpellcheck]     = useState(false);
  const [noPrint, setNoPrint]               = useState(false);
  const [allowRetakes, setAllowRetakes]     = useState(false);
  const [retakeCount, setRetakeCount]       = useState(1);
  const [randomize, setRandomize]           = useState(false);
  const [allowBlanks, setAllowBlanks]       = useState(false);
  const [penalize, setPenalize]             = useState(false);
  const [isPublic, setIsPublic]             = useState(false);
  const [emailNotif, setEmailNotif]         = useState(false);
  const [notifEmails, setNotifEmails]       = useState("");

  useEffect(() => {
    if (showSuccess && testId) {
      getSecureUUID(testId)
        .then((r) => setTestLink(`${BASE_URL}/${r.encoded_uuid}`))
        .catch(console.error);
    }
  }, [showSuccess, testId]);

  // ── All questions combined (manual + imported from bank + CSV) ──
  const allQuestions = questions;

  const addQuestion = (type) => {
    const base = { type, text: "" };
    if (type === "multiplechoice")   { base.options = ["", "", "", ""]; base.correctAnswer = null; }
    if (type === "multipleresponse") { base.options = ["", "", "", ""]; base.correctAnswers = []; }
    if (type === "truefalse")        { base.correctAnswer = null; }
    if (type === "fillintheblank")   { base.correctAnswer = ""; }
    setQuestions((p) => [...p, base]);
  };

  // ── CSV upload handler ──
  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = parseQuestionsFromCSV(ev.target.result);
      setCsvParseResult(result);
      if (result.questions.length > 0) {
        setQuestions((prev) => [...prev, ...result.questions]);
      }
    };
    reader.readAsText(file);
    // Reset so same file can be re-imported if needed
    e.target.value = "";
  };

  // ── Import from question bank ──
  const handleBankImport = (importedQs) => {
    setQuestions((prev) => [...prev, ...importedQs]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    const totalQ = allQuestions.length + selectedQuestions.length;
    const totalTime = totalQ * timeLimitPerQ;
    try {
      const res = await createTest({
        title: testName,
        description: testDescription,
        category,
        max_score: totalQ * marksPerQ,
        total_marks: totalQ * marksPerQ,
        subject,
        difficulty,
        time_limit_per_question: timeLimitPerQ,
        total_time_limit: totalTime,
        marks_per_question: marksPerQ,
        pass_criteria: passCriteria,
        instructions,
        conclusion,
        scheduled_date: null,
        is_public: isPublic,
        allow_retakes: allowRetakes,
        number_of_retakes: retakeCount,
        randomize_order: randomize,
        allow_blank_answers: allowBlanks,
        penalize_incorrect_answers: penalize,
        allow_jump_around: allowJump,
        only_move_forward: onlyForward,
        disable_right_click: noRightClick,
        disable_copy_paste: noCopyPaste,
        disable_translate: noTranslate,
        disable_autocomplete: noAutoComplete,
        disable_spellcheck: noSpellcheck,
        disable_printing: noPrint,
        receive_email_notifications: emailNotif,
        notification_emails: notifEmails,
        start_date: startDate || null,
        end_date: endDate || null,
        due_time: dueTime || null,
        status: "published",
        rank: 1,
        // ALL questions (manual + CSV-parsed + bank-imported) go here
        questions: [...allQuestions, ...selectedQuestions].map((q) => ({
          text: q.text,
          type: q.type,
          options: q.options ?? [],
          correct_answer:
            q.type === "multipleresponse"
              ? (q.correctAnswers ?? [])
              : q.type === "truefalse"
              ? q.correctAnswer          // boolean true/false
              : q.correctAnswer ?? "N/A",
        })),
      });

      setTestId(res.id);
      setShowSuccess(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(testLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInviteCSV = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = Papa.parse(ev.target.result, { skipEmptyLines: true });
      setEmailList(result.data.map((row) => row[0]?.trim()).filter((em) => em && /\S+@\S+\.\S+/.test(em)));
    };
    reader.readAsText(f);
  };

  const sendEmails = async () => {
    if (!testId || !emailList.length) return;
    setLoading(true);
    try {
      await uploadAllowedEmails(testId, emailList);
      navigate("/TestManagement");
      setShowInvite(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // STEP RENDERERS
  // ─────────────────────────────────────────────────────────────────────────
  const step0 = () => (
    <div>
      <Field label="Test Title" required hint="Keep it clear and descriptive — students will see this.">
        <Input value={testName} onChange={setTestName} placeholder="e.g. Final Mathematics Assessment — Grade 10" />
      </Field>
      <Field label="Description" hint="Optional context shown to students before they start.">
        <Textarea value={testDescription} onChange={setTestDescription} placeholder="Briefly describe the scope, topics covered, and any special instructions…" rows={3} />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Category" required>
          <Sel value={category} onChange={setCategory} placeholder="Select a category"
            options={[
              { value: "math",       label: "Mathematics" },
              { value: "science",    label: "Science" },
              { value: "history",    label: "History" },
              { value: "literature", label: "Literature" },
              { value: "technology", label: "Technology" },
              { value: "language",   label: "Language" },
              { value: "other",      label: "Other" },
            ]} />
        </Field>
        <Field label="Subject" required hint="e.g. Algebra, Biology, World History">
          <Input value={subject} onChange={setSubject} placeholder="Enter subject name" />
        </Field>
        <Field label="Difficulty Level" required>
          <Sel value={difficulty} onChange={setDifficulty} placeholder="Choose difficulty"
            options={[
              { value: "easy",   label: "Easy — Introductory" },
              { value: "medium", label: "Medium — Standard" },
              { value: "hard",   label: "Hard — Advanced" },
            ]} />
        </Field>
      </div>
    </div>
  );

  const step1 = () => (
    <div>
      <label style={css.label}>Select Question Type to Add</label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 22 }}>
        {Q_TYPES.map(({ type, label, desc, icon }) => (
          <button key={type} onClick={() => addQuestion(type)}
            style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 7, padding: "14px 10px", cursor: "pointer", textAlign: "left", transition: "all .15s" }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = T.gold3; e.currentTarget.style.background = T.goldBg; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.surface2; }}
          >
            <div style={{ color: T.gold, fontSize: 18, marginBottom: 8 }}>{icon}</div>
            <div style={{ color: T.ivory, fontSize: "var(--fs-micro)", fontFamily: T.display, fontWeight: 700, marginBottom: 3, letterSpacing: ".04em" }}>{label}</div>
            <div style={{ color: T.slate2, fontSize: "var(--fs-micro)", fontFamily: T.display, lineHeight: 1.4 }}>{desc}</div>
          </button>
        ))}
      </div>
      {questions.length === 0 ? (
        <div style={{ border: `1px dashed ${T.border2}`, borderRadius: 8, padding: "48px 20px", textAlign: "center" }}>
          <div style={{ color: T.slate2, fontSize: 28, marginBottom: 10 }}>◈</div>
          <div style={{ color: T.slate, fontSize: "var(--fs-secondary)", fontFamily: T.display, fontWeight: 600 }}>No questions added yet</div>
          <div style={{ color: T.slate2, fontSize: "var(--fs-micro)", fontFamily: T.display, marginTop: 5 }}>Select a question type above to get started</div>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <label style={css.label}>{questions.length} Question{questions.length !== 1 ? "s" : ""}</label>
          </div>
          {questions.map((q, qi) => (
            <QuestionBlock key={qi} q={q} qi={qi} questions={questions} setQuestions={setQuestions} newOption={newOption} setNewOption={setNewOption} />
          ))}
        </div>
      )}
    </div>
  );

  const step2 = () => (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        {[
          { key: "import", label: "Import from Previous Test", icon: "◈" },
          { key: "file",   label: "Upload CSV File",           icon: "◆" },
        ].map(({ key, label, icon }) => (
          <button key={key} onClick={() => { setImportMode(key); setImportSubMode(null); }} style={{ ...css.pill(importMode === key), flex: 1, justifyContent: "center", padding: "12px 0" }}>
            {icon} {label}
          </button>
        ))}
      </div>

{importMode === "import" && (
  <div style={css.card}>
    <div style={{ marginBottom: 14 }}>
      <div style={{ color: T.ivory, fontFamily: T.display, fontWeight: 700, fontSize: "var(--fs-small)", marginBottom: 4 }}>
        Choose your import source
      </div>
    </div>

    {/* Sub-option pills */}
    <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
      {[
        { key: "previousTest",  label: "From Previous Tests",  icon: "◈" },
        { key: "questionBank",  label: "From Question Bank",   icon: "◆" },
      ].map(({ key, label, icon }) => (
        <button key={key} onClick={() => setImportSubMode(key)}
          style={{ ...css.pill(importSubMode === key), flex: 1, justifyContent: "center", padding: "12px 0" }}>
          {icon} {label}
        </button>
      ))}
    </div>

    {/* Sub-mode: Previous Tests */}
    {importSubMode === "previousTest" && (
      <div>
        <div style={{ color: T.slate2, fontFamily: T.display, fontSize: "var(--fs-micro)", lineHeight: 1.6, marginBottom: 12 }}>
          Questions from previous tests are grouped by test name.
        </div>
        <button onClick={() => setImportModalOpen(true)} style={{ ...css.btn("primary"), padding: "10px 22px" }}>
          Browse Previous Tests →
        </button>
      </div>
    )}

    {/* Sub-mode: Question Bank */}
    {importSubMode === "questionBank" && (
      <div>
        <div style={{ color: T.slate2, fontFamily: T.display, fontSize: "var(--fs-micro)", lineHeight: 1.6, marginBottom: 12 }}>
          Browse your standalone question bank and pick questions to reuse.
        </div>
        <button onClick={() => setQuestionBankModalOpen(true)} style={{ ...css.btn("primary"), padding: "10px 22px" }}>
          Open Question Bank →
        </button>
      </div>
    )}

    {!importSubMode && (
      <div style={{ color: T.slate2, fontSize: "var(--fs-micro)", fontFamily: T.display }}>
        Select a source above to continue.
      </div>
    )}

    {/* Selected count badge — shared for both sub-modes */}
    {selectedQuestions.length > 0 && (
      <div style={{
        marginTop: 16, padding: "10px 14px",
        background: T.goldBg, border: `1px solid ${T.gold3}`, borderRadius: 6,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ color: T.gold, fontFamily: T.display, fontWeight: 700, fontSize: "var(--fs-micro)" }}>
          ✓ {selectedQuestions.length} question{selectedQuestions.length !== 1 ? "s" : ""} imported
        </span>
        <button onClick={() => setSelectedQuestions([])} style={{
          background: "none", border: "none", color: T.slate2, cursor: "pointer",
          fontFamily: T.display, fontSize: "var(--fs-micro)", fontWeight: 700,
        }}>CLEAR</button>
      </div>
    )}
  </div>
)}

      {/* ── MODE: Upload CSV ── */}
      {importMode === "file" && (
        <div style={css.card}>
          {/* CSV format guide */}
          <div style={{
            marginBottom: 18, padding: "12px 14px",
            background: T.surface2, border: `1px solid ${T.border2}`, borderRadius: 6,
          }}>
            <div style={{ color: T.gold, fontFamily: T.display, fontWeight: 700, fontSize: "var(--fs-micro)", letterSpacing: ".08em", marginBottom: 8 }}>
              CSV FORMAT GUIDE
            </div>
            <div style={{ color: T.slate2, fontFamily: T.display, fontSize: "var(--fs-micro)", lineHeight: 1.8 }}>
              Required columns: <span style={{ color: T.ivory }}>type, question, correct_answer</span><br />
              Optional columns: <span style={{ color: T.ivory }}>option1, option2, option3, option4</span>
              <br /><br />
              <span style={{ color: T.slate, fontWeight: 700 }}>type</span> values accepted:
            </div>
            <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 20px" }}>
              {[
                { type: "multiplechoice",   alias: "mc, multiple, single",   hint: 'correct_answer = option text e.g. "Paris"' },
                { type: "multipleresponse", alias: "mr, multiselect",        hint: 'correct_answer = pipe-separated e.g. "Paris|Rome"' },
                { type: "truefalse",        alias: "tf, bool, boolean",      hint: 'correct_answer = "true" or "false"' },
                { type: "fillintheblank",   alias: "fitb, fill, blank, short", hint: "correct_answer = expected text" },
              ].map(({ type, alias, hint }) => (
                <div key={type} style={{ padding: "6px 0", borderTop: `1px solid ${T.border}` }}>
                  <div style={{ color: T.ivory, fontFamily: T.display, fontWeight: 700, fontSize: "var(--fs-micro)" }}>
                    {type}
                  </div>
                  <div style={{ color: T.slate2, fontFamily: T.display, fontSize: "var(--fs-micro)" }}>also: {alias}</div>
                  <div style={{ color: T.slate2, fontFamily: T.display, fontSize: "var(--fs-micro)", fontStyle: "italic" }}>{hint}</div>
                </div>
              ))}
            </div>
          </div>

          <Field label="Upload CSV File" hint="Questions will be parsed immediately and added to your question list.">
            <input type="file" accept=".csv" onChange={handleCSVUpload}
              style={{ color: T.slate, fontSize: "var(--fs-small)", fontFamily: T.display }} />
          </Field>

          {/* Parse result feedback */}
          {csvParseResult && (
            <div style={{ marginTop: 12 }}>
              {csvParseResult.questions.length > 0 && (
                <div style={{
                  padding: "10px 14px", background: T.goldBg,
                  border: `1px solid ${T.gold3}`, borderRadius: 6, marginBottom: 8,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{ color: T.gold, fontSize: 14 }}>✓</span>
                  <span style={{ color: T.gold, fontFamily: T.display, fontWeight: 700, fontSize: "var(--fs-micro)" }}>
                    {csvParseResult.questions.length} question{csvParseResult.questions.length !== 1 ? "s" : ""} imported from {csvFileName}
                  </span>
                </div>
              )}

              {/* Type breakdown */}
              {csvParseResult.questions.length > 0 && (
                <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  {["multiplechoice","multipleresponse","truefalse","fillintheblank"].map((tp) => {
                    const cnt = csvParseResult.questions.filter((q) => q.type === tp).length;
                    if (!cnt) return null;
                    const icons = { multiplechoice: "◉", multipleresponse: "◈", truefalse: "◎", fillintheblank: "◆" };
                    const labels = { multiplechoice: "Multiple Choice", multipleresponse: "Multiple Response", truefalse: "True/False", fillintheblank: "Fill in Blank" };
                    return (
                      <span key={tp} style={{
                        color: T.gold2, fontFamily: T.display, fontWeight: 700, fontSize: "var(--fs-micro)",
                        background: T.goldBg, border: `1px solid ${T.gold3}`,
                        padding: "2px 10px", borderRadius: 3,
                      }}>{icons[tp]} {cnt} {labels[tp]}</span>
                    );
                  })}
                </div>
              )}

              {/* Parse errors/warnings */}
              {csvParseResult.errors.length > 0 && (
                <div style={{
                  padding: "10px 14px",
                  background: "rgba(192,112,112,.08)", border: "1px solid rgba(192,112,112,.25)",
                  borderRadius: 6,
                }}>
                  <div style={{ color: T.red, fontFamily: T.display, fontWeight: 700, fontSize: "var(--fs-micro)", marginBottom: 6 }}>
                    ⚠ {csvParseResult.errors.length} warning{csvParseResult.errors.length !== 1 ? "s" : ""}
                  </div>
                  {csvParseResult.errors.map((err, i) => (
                    <div key={i} style={{ color: T.red, fontFamily: T.display, fontSize: "var(--fs-micro)", opacity: 0.85, marginBottom: 3 }}>
                      · {err}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!importMode && (
        <div style={{ border: `1px dashed ${T.border2}`, borderRadius: 8, padding: "40px 20px", textAlign: "center" }}>
          <div style={{ color: T.slate2, fontSize: "var(--fs-micro)", fontFamily: T.display, fontWeight: 600, letterSpacing: ".06em" }}>
            Select a method above to import or reuse questions
          </div>
        </div>
      )}

      {/* Inline ImportQuestionsModal — no external file */}
      <ImportQuestionsModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={(importedQs) => {
          setSelectedQuestions((prev) => {
            // Deduplicate by id
            const existingIds = new Set(prev.map((q) => q.id));
            const fresh = importedQs.filter((q) => !existingIds.has(q.id));
            return [...prev, ...fresh];
          });
        }}
      />
      <QuestionBankModal
  open={questionBankModalOpen}
  onClose={() => setQuestionBankModalOpen(false)}
  onImport={(importedQs) => {
    setSelectedQuestions((prev) => {
      const existingIds = new Set(prev.map((q) => q.id));
      return [...prev, ...importedQs.filter((q) => !existingIds.has(q.id))];
    });
  }}
/>
    </div>
  );

  const step3 = () => {
    const totalQ = questions.length + selectedQuestions.length;
    return (
      <div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
          <Field label="Time Limit Per Question (minutes)" hint="Set 0 for no per-question time limit.">
            <Input type="number" value={timeLimitPerQ} onChange={(v) => setTimeLimitPerQ(Number(v))} min={0} />
          </Field>
          <Field label="Marks Per Question" hint="All questions carry equal marks by default.">
            <Input type="number" value={marksPerQ} onChange={(v) => setMarksPerQ(Number(v))} min={1} />
          </Field>
        </div>
        <label style={css.label}>Summary</label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          <StatMini icon="◈" label="Total Questions" value={totalQ} />
          <StatMini icon="◆" label="Total Marks"     value={totalQ * marksPerQ} />
          <StatMini icon="◎" label="Total Time"      value={`${totalQ * timeLimitPerQ}m`} />
        </div>
        {totalQ === 0 && (
          <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(192,112,112,.08)", border: "1px solid rgba(192,112,112,.2)", borderRadius: 6, color: T.red, fontSize: "var(--fs-small)", fontFamily: T.display, fontWeight: 600 }}>
            ⚠ No questions added yet. Return to Steps 2 or 3 to add questions.
          </div>
        )}
      </div>
    );
  };

  const step4 = () => {
    const totalQ = questions.length + selectedQuestions.length;
    return (
      <div>
        <Field label="Passing Threshold" hint="Minimum score percentage required to pass." required>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginTop: 4 }}>
            {[
              { val: 25,  label: "25%",  sub: "Lenient"  },
              { val: 50,  label: "50%",  sub: "Standard" },
              { val: 75,  label: "75%",  sub: "Strict"   },
              { val: 100, label: "100%", sub: "Perfect"  },
            ].map(({ val, label, sub }) => (
              <button key={val} onClick={() => setPassCriteria(val)} style={{
                padding: "20px 10px", borderRadius: 7, cursor: "pointer", textAlign: "center",
                border: `1px solid ${passCriteria === val ? T.gold : T.border}`,
                background: passCriteria === val ? T.goldBg2 : T.surface2, transition: "all .15s",
              }}>
                <div style={{ fontFamily: T.serif, fontSize: "1.8rem", lineHeight: 1, fontWeight: 400, color: passCriteria === val ? T.gold : T.slate }}>{label}</div>
                <div style={{ color: passCriteria === val ? T.gold2 : T.slate2, fontSize: "var(--fs-micro)", fontFamily: T.display, fontWeight: 700, marginTop: 6, letterSpacing: ".06em", textTransform: "uppercase" }}>{sub}</div>
              </button>
            ))}
          </div>
        </Field>
        {passCriteria && (
          <div style={{ marginTop: 16, padding: "12px 16px", background: T.goldBg, border: `1px solid ${T.gold3}`, borderRadius: 6 }}>
            <div style={{ color: T.gold, fontSize: "var(--fs-micro)", fontFamily: T.display, fontWeight: 700, letterSpacing: ".04em" }}>
              Students must score {passCriteria}% or above to pass.
            </div>
            <div style={{ color: T.slate, fontSize: "var(--fs-micro)", fontFamily: T.display, marginTop: 4 }}>
              For a {totalQ * marksPerQ}-mark test, that means at least {Math.ceil(totalQ * marksPerQ * passCriteria / 100)} marks.
            </div>
          </div>
        )}
      </div>
    );
  };

  const step5 = () => (
    <div>
      <Field label="Introduction / Instructions" hint="Displayed to students at the top of the test before they start.">
        <Textarea value={instructions} onChange={setInstructions} placeholder="e.g. Read all questions carefully. You may not use a calculator." rows={3} />
      </Field>

      <SH icon="◎">Availability Window</SH>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <Field label="Start Date" hint="Leave blank for immediate access"><Input type="date" value={startDate} onChange={setStartDate} /></Field>
        <Field label="End Date" hint="Leave blank for no expiry"><Input type="date" value={endDate} onChange={setEndDate} /></Field>
        <Field label="Due Time" hint="Time of day the test closes"><Input type="time" value={dueTime} onChange={setDueTime} /></Field>
      </div>

      <SH icon="◈">Navigation & Behaviour</SH>
      <Toggle checked={allowJump}   onChange={setAllowJump}   label="Allow jumping between questions"  description="Students can revisit previous questions freely" />
      <Toggle checked={onlyForward} onChange={setOnlyForward} label="Only move forward"                description="Students cannot return to questions they've already answered" />
      <Toggle checked={randomize}   onChange={setRandomize}   label="Randomize question order"         description="Questions appear in a different order for each student" />
      <Toggle checked={allowBlanks} onChange={setAllowBlanks} label="Allow blank submissions"          description="Students can submit without answering all questions" />
      <Toggle checked={penalize}    onChange={setPenalize}    label="Negative marking"                 description="Incorrect answers deduct marks from the total score" />

      <SH icon="◆">Browser Security</SH>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        <Chk checked={noRightClick}   onChange={setNoRightClick}   label="Disable right-click menu" />
        <Chk checked={noCopyPaste}    onChange={setNoCopyPaste}    label="Disable copy / paste" />
        <Chk checked={noTranslate}    onChange={setNoTranslate}    label="Disable browser translate" />
        <Chk checked={noAutoComplete} onChange={setNoAutoComplete} label="Disable autocomplete" />
        <Chk checked={noSpellcheck}   onChange={setNoSpellcheck}   label="Disable spellcheck" />
        <Chk checked={noPrint}        onChange={setNoPrint}        label="Disable printing" />
      </div>

      <SH icon="◉">Retakes & Access</SH>
      <Toggle checked={allowRetakes} onChange={setAllowRetakes} label="Allow test retakes" description="Students can attempt this test more than once" />
      {allowRetakes && (
        <Field label="Maximum Retakes Allowed" hint="Set to 0 for unlimited retakes">
          <Input type="number" value={retakeCount} onChange={(v) => setRetakeCount(Number(v))} min={1} />
        </Field>
      )}
      <Toggle checked={isPublic} onChange={setIsPublic} label="Make test publicly accessible" description="Anyone with the link can attempt this test — no login required" />

      <SH icon="◎">Notifications</SH>
      <Toggle checked={emailNotif} onChange={setEmailNotif} label="Email notifications on completion" description="Receive an email each time a student submits this test" />
      {emailNotif && (
        <Field label="Notification Email Addresses" hint="Separate multiple addresses with commas">
          <Input value={notifEmails} onChange={setNotifEmails} placeholder="admin@school.edu, teacher@school.edu" />
        </Field>
      )}

      <SH icon="◆">Conclusion</SH>
      <Field label="Conclusion Text" hint="Displayed to students after they submit the test.">
        <Textarea value={conclusion} onChange={setConclusion} placeholder="e.g. Thank you for completing this assessment. Results will be shared within 3 working days." rows={3} />
      </Field>
    </div>
  );

  const step6 = () => {
    const totalQ = questions.length + selectedQuestions.length;
    const rows = [
      { label: "Test Title",       value: testName       || "—" },
      { label: "Category",         value: category       || "—" },
      { label: "Subject",          value: subject        || "—" },
      { label: "Difficulty",       value: difficulty     || "—" },
      { label: "Total Questions",  value: totalQ },
      { label: "Total Time",       value: `${totalQ * timeLimitPerQ} minutes` },
      { label: "Total Marks",      value: totalQ * marksPerQ },
      { label: "Passing Score",    value: passCriteria ? `${passCriteria}%` : "—" },
      { label: "Visibility",       value: isPublic ? "Public" : "Restricted" },
      { label: "Retakes",          value: allowRetakes ? `Yes (max ${retakeCount})` : "No" },
      { label: "Start Date",       value: startDate || "Immediate" },
      { label: "End Date",         value: endDate   || "No expiry" },
    ];
    return (
      <div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          {rows.map((r, i) => (
            <div key={i} style={{ ...css.card, padding: "12px 16px" }}>
              <div style={{ ...css.label, marginBottom: 3 }}>{r.label}</div>
              <div style={{ color: T.ivory, fontSize: "var(--fs-secondary)", fontFamily: T.display, fontWeight: 500 }}>{String(r.value)}</div>
            </div>
          ))}
        </div>
        {(instructions || conclusion) && (
          <div style={{ display: "grid", gridTemplateColumns: instructions && conclusion ? "1fr 1fr" : "1fr", gap: 8 }}>
            {instructions && (
              <div style={css.card}>
                <div style={{ ...css.label, marginBottom: 6 }}>Introduction</div>
                <p style={{ color: T.slate, fontSize: "var(--fs-small)", fontFamily: T.display, lineHeight: 1.6, margin: 0 }}>{instructions}</p>
              </div>
            )}
            {conclusion && (
              <div style={css.card}>
                <div style={{ ...css.label, marginBottom: 6 }}>Conclusion</div>
                <p style={{ color: T.slate, fontSize: "var(--fs-small)", fontFamily: T.display, lineHeight: 1.6, margin: 0 }}>{conclusion}</p>
              </div>
            )}
          </div>
        )}
        <div style={{ marginTop: 16, padding: "14px 18px", background: T.goldBg, border: `1px solid ${T.gold3}`, borderRadius: 6, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: T.gold, fontSize: 16 }}>◎</span>
          <div>
            <div style={{ color: T.gold, fontSize: "var(--fs-small)", fontFamily: T.display, fontWeight: 700, letterSpacing: ".04em" }}>Ready to publish</div>
            <div style={{ color: T.slate, fontSize: "var(--fs-micro)", fontFamily: T.display, marginTop: 2 }}>Click "Publish Test" to make it live. You can edit it later from Test Management.</div>
          </div>
        </div>
      </div>
    );
  };

  const stepRenderers = [step0, step1, step2, step3, step4, step5, step6];

  const nextDisabled =
    (activeStep === 0 && (!testName || !testDescription || !subject || !difficulty || !category)) ||
    (activeStep === 1 && questions.length === 0) ||
    (activeStep === 3 && (!timeLimitPerQ || !marksPerQ)) ||
    (activeStep === 4 && !passCriteria) ||
    (activeStep === 5 && (!instructions || !conclusion));

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <AdminLayout pageKey="createTest">
      <div className="fade-up d1" style={{ margin: "0 auto", marginBottom: 10 }}>

        {/* Page header */}
        <div style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <SectionLabel>◈ Test Creation</SectionLabel>
            <p style={{ color: "var(--slate)", fontSize: "var(--fs-body)", marginTop: 2 }}>
              Step {activeStep + 1} of {STEPS.length} — {STEPS[activeStep].sub}
            </p>
          </div>
          <button onClick={() => navigate("/TestManagement")} style={css.btn("ghost")}>← Back to Tests</button>
        </div>

        {/* Two-column layout */}
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20, alignItems: "start" }}>

          {/* Sidebar */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden", position: "sticky", top: 24 }}>
            <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ color: T.slate2, fontSize: "var(--fs-micro)", fontFamily: T.display, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase" }}>PROGRESS</div>
            </div>
            {STEPS.map((s, i) => {
              const done = i < activeStep; const active = i === activeStep;
              return (
                <button key={i} onClick={() => i < activeStep && setActiveStep(i)} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  width: "100%", padding: "12px 16px",
                  background: active ? T.goldBg : "transparent",
                  border: "none", borderBottom: `1px solid ${T.border}`,
                  borderLeft: `2px solid ${active ? T.gold : done ? T.gold3 : "transparent"}`,
                  cursor: i < activeStep ? "pointer" : "default", transition: "all .15s", textAlign: "left",
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: done ? T.gold3 : active ? T.goldBg2 : T.surface2,
                    border: `1px solid ${done ? T.gold2 : active ? T.gold : T.border2}`,
                    color: done ? T.ivory : active ? T.gold : T.slate2,
                    fontSize: done ? 10 : 9, fontFamily: T.display, fontWeight: 900,
                  }}>
                    {done ? "✓" : s.icon}
                  </div>
                  <div style={{ color: active ? T.ivory : done ? T.slate : T.slate2, fontSize: "var(--fs-micro)", fontFamily: T.display, fontWeight: 700, letterSpacing: ".04em" }}>
                    {s.label}
                  </div>
                </button>
              );
            })}
            <div style={{ padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: T.slate2, fontSize: "var(--fs-micro)", fontFamily: T.display, fontWeight: 600 }}>Completion</span>
                <span style={{ color: T.gold, fontSize: "var(--fs-micro)", fontFamily: T.display, fontWeight: 700 }}>{Math.round((activeStep / (STEPS.length - 1)) * 100)}%</span>
              </div>
              <div style={{ height: 3, background: T.border2, borderRadius: 2 }}>
                <div style={{ height: 3, borderRadius: 2, background: T.gold, width: `${Math.round((activeStep / (STEPS.length - 1)) * 100)}%`, transition: "width .4s ease" }} />
              </div>
            </div>
          </div>

          {/* Main area */}
          <div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden", marginBottom: 16 }}>
              {/* Card header */}
              <div style={{
                padding: "16px 22px", borderBottom: `1px solid ${T.border}`,
                background: T.surface2, display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ background: T.goldBg2, border: `1px solid ${T.gold3}`, color: T.gold, fontFamily: T.display, fontWeight: 900, fontSize: "var(--fs-micro)", padding: "2px 10px", borderRadius: 3, letterSpacing: ".1em" }}>
                    {STEPS[activeStep].icon}
                  </span>
                  <div>
                    <div style={{ color: T.ivory, fontFamily: T.display, fontWeight: 700, fontSize: "var(--fs-secondary)", letterSpacing: ".04em" }}>{STEPS[activeStep].label}</div>
                    <div style={{ color: T.slate2, fontSize: "var(--fs-micro)", fontFamily: T.display, marginTop: 1 }}>{STEPS[activeStep].sub}</div>
                  </div>
                </div>
                {activeStep === 1 && questions.length > 0 && (
                  <span style={{ background: T.goldBg, border: `1px solid ${T.gold3}`, color: T.gold, fontSize: "var(--fs-micro)", fontFamily: T.display, fontWeight: 700, padding: "3px 10px", borderRadius: 3, letterSpacing: ".06em" }}>
                    {questions.length} Question{questions.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {/* Step body */}
              <div style={{ padding: "22px 22px 26px" }}>
                {stepRenderers[activeStep]?.()}
              </div>
            </div>

            {/* Navigation */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                onClick={() => setActiveStep((s) => s - 1)}
                disabled={activeStep === 0}
                style={{ ...css.btn("ghost"), opacity: activeStep === 0 ? 0.35 : 1, cursor: activeStep === 0 ? "not-allowed" : "pointer" }}
              >← Previous</button>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {loading && <span style={{ color: T.slate2, fontSize: "var(--fs-micro)", fontFamily: T.display, fontWeight: 600 }}>Publishing…</span>}
                <button
                  onClick={async () => {
                    if (activeStep === STEPS.length - 1) { setLoading(true); await handleSubmit(); }
                    else setActiveStep((s) => s + 1);
                  }}
                  disabled={nextDisabled || loading}
                  style={{ ...css.btn("primary"), opacity: nextDisabled || loading ? 0.4 : 1, cursor: nextDisabled || loading ? "not-allowed" : "pointer", padding: "10px 24px" }}
                >
                  {activeStep === STEPS.length - 1 ? "Publish Test" : "Continue →"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Success Modal */}
        <Modal open={showSuccess} onClose={() => setShowSuccess(false)}
          title="Test Published Successfully"
          subtitle="Your assessment is now live and accessible to students."
          footer={
            <>
              <button onClick={() => setShowInvite(true)} style={css.btn("ghost")}>Send Invitations</button>
              <button onClick={() => { setShowSuccess(false); navigate("/TestManagement"); }} style={css.btn("primary")}>View All Tests →</button>
            </>
          }
        >
          <Field label="Test Link" hint="Share this URL with students to give them access.">
            <div style={{ display: "flex", gap: 8 }}>
              <Input value={testLink} onChange={() => {}} style={{ flex: 1, opacity: 0.7 }} />
              <button onClick={copyLink} style={{ ...css.btn("primary"), flexShrink: 0, padding: "9px 16px" }}>{copied ? "✓ Copied" : "Copy"}</button>
            </div>
          </Field>
          <div style={{ padding: "12px 14px", background: T.goldBg, border: `1px solid ${T.gold3}`, borderRadius: 6, color: T.slate, fontSize: "var(--fs-micro)", fontFamily: T.display, lineHeight: 1.6 }}>
            You can manage, edit, or close this test at any time from the{" "}
            <strong style={{ color: T.gold }}>Test Management</strong> page.
          </div>
        </Modal>

        {/* Invite Modal */}
        <Modal open={showInvite} onClose={() => setShowInvite(false)}
          title="Send Email Invitations"
          subtitle="Upload a CSV to grant test access to specific participants."
          footer={
            <>
              <button onClick={() => setShowInvite(false)} style={css.btn("ghost")}>Cancel</button>
              <button onClick={sendEmails} disabled={!emailList.length || loading}
                style={{ ...css.btn("primary"), opacity: !emailList.length || loading ? 0.4 : 1, cursor: !emailList.length || loading ? "not-allowed" : "pointer" }}>
                Send Invitations
              </button>
            </>
          }
        >
          <Field label="Upload Email CSV" hint="One email address per row in the first column.">
            <input type="file" accept=".csv" onChange={handleInviteCSV} style={{ color: T.slate, fontFamily: T.display, fontSize: "var(--fs-small)" }} />
          </Field>
          {emailList.length > 0 && (
            <div style={{ background: T.surface2, border: `1px solid ${T.border2}`, borderRadius: 6, padding: "12px 14px", maxHeight: 160, overflowY: "auto" }}>
              <div style={{ color: T.gold, fontSize: "var(--fs-micro)", fontFamily: T.display, fontWeight: 700, letterSpacing: ".06em", marginBottom: 8 }}>
                ✓ {emailList.length} valid email{emailList.length !== 1 ? "s" : ""} loaded
              </div>
              {emailList.slice(0, 10).map((em, i) => (
                <div key={i} style={{ color: T.slate, fontSize: "var(--fs-micro)", fontFamily: T.display, padding: "2px 0" }}>{em}</div>
              ))}
              {emailList.length > 10 && (
                <div style={{ color: T.slate2, fontSize: "var(--fs-micro)", fontFamily: T.display, marginTop: 4 }}>…and {emailList.length - 10} more</div>
              )}
            </div>
          )}
        </Modal>

        <style>{`
          input[type=date]::-webkit-calendar-picker-indicator,
          input[type=time]::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }
          input::placeholder, textarea::placeholder { color: #3a3a52 !important; }
          select option { background: #1a1a22; color: #f0ead6; }
        `}</style>
      </div>
    </AdminLayout>
  );
}