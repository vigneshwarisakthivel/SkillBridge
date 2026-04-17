import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout, { SectionLabel } from "./AdminLayout";
import { getTestForEdit, updateTest } from "../services/apiServices";
import { createPortal } from "react-dom";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const STEPS = [
  { id: 0, label: "Test Details",    sub: "Name, subject & difficulty",      icon: "01" },
  { id: 1, label: "Questions",       sub: "Add, edit & remove questions",     icon: "02" },
  { id: 2, label: "Scoring & Time",  sub: "Marks, duration, limits",          icon: "03" },
  { id: 3, label: "Pass Criteria",   sub: "Set the passing threshold",        icon: "04" },
  { id: 4, label: "Configuration",   sub: "Security, access & notifications", icon: "05" },
];

const Q_TYPES = [
  { type: "multiplechoice",   label: "Multiple Choice",   desc: "One correct answer",        icon: "◉" },
  { type: "multipleresponse", label: "Multiple Response", desc: "Several correct answers",   icon: "◈" },
  { type: "truefalse",        label: "True / False",      desc: "Binary true or false",      icon: "◎" },
  { type: "fillintheblank",   label: "Fill in the Blank", desc: "Student types the answer",  icon: "◆" },
];

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS  (identical to CreateNewTest)
// ─────────────────────────────────────────────────────────────────────────────
const T = {
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
// PRIMITIVE COMPONENTS
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
    <input
      type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} min={min}
      style={{ ...css.input, borderColor: f ? T.gold2 : T.border2, boxShadow: f ? `0 0 0 3px ${T.goldBg}` : "none", ...sx }}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  const [f, setF] = useState(false);
  return (
    <textarea
      value={value ?? ""} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} rows={rows}
      style={{ ...css.input, resize: "vertical", lineHeight: 1.6, borderColor: f ? T.gold2 : T.border2, boxShadow: f ? `0 0 0 3px ${T.goldBg}` : "none" }}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
    />
  );
}

function Sel({ value, onChange, options, placeholder }) {
  const [f, setF] = useState(false);
  return (
    <select
      value={value ?? ""} onChange={(e) => onChange(e.target.value)}
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

// ─────────────────────────────────────────────────────────────────────────────
// SUCCESS MODAL
// ─────────────────────────────────────────────────────────────────────────────
function SuccessModal({ open, onClose, onGoToTests }) {
  if (!open) return null;
  return createPortal(
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(14,14,18,.88)",
      display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(4px)",
    }}>
      <div style={{
        width: "100%", maxWidth: 480,
        background: T.surface, border: `1px solid ${T.border2}`,
        borderRadius: 10, overflow: "hidden",
        boxShadow: "0 24px 60px rgba(0,0,0,.5)",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ color: T.gold, fontSize: "var(--fs-micro)", fontFamily: T.display, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 6 }}>
            SKILL BRIDGE
          </div>
          <div style={{ color: T.ivory, fontFamily: T.serif, fontSize: "var(--fs-card)", fontWeight: 400 }}>
            Test Updated Successfully
          </div>
          <div style={{ color: T.slate, fontSize: "var(--fs-small)", fontFamily: T.display, marginTop: 4 }}>
            All changes have been saved and applied.
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px" }}>
          {/* Animated checkmark */}
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: T.goldBg2, border: `2px solid ${T.gold3}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            <span style={{ color: T.gold, fontSize: 24, fontWeight: 900 }}>✓</span>
          </div>
          <div style={{
            padding: "12px 16px", background: T.goldBg,
            border: `1px solid ${T.gold3}`, borderRadius: 6,
            color: T.slate, fontSize: "var(--fs-micro)", fontFamily: T.display, lineHeight: 1.6,
          }}>
            Your test has been updated. candidates who access the test link will see the latest version immediately.
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px 20px", borderTop: `1px solid ${T.border}`, display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={css.btn("ghost")}>Stay on Page</button>
          <button onClick={onGoToTests} style={css.btn("primary")}>View All Tests →</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QUESTION BLOCK  (identical behaviour to CreateNewTest)
// ─────────────────────────────────────────────────────────────────────────────
function QuestionBlock({ q, qi, questions, setQuestions }) {
  const [newOption, setNewOption] = useState("");

  const upd = (fn) => {
    const arr = [...questions];
    fn(arr[qi]);
    setQuestions(arr);
  };

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
    upd((q) => q.options.push(newOption.trim()));
    setNewOption("");
  };
  const remove = () => setQuestions(questions.filter((_, i) => i !== qi));

  const TYPE_LABEL = {
    multiplechoice: "Multiple Choice",
    multipleresponse: "Multiple Response",
    truefalse: "True / False",
    fillintheblank: "Fill in the Blank",
  };

  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, marginBottom: 12, overflow: "hidden" }}>
      {/* Block header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "11px 18px", borderBottom: `1px solid ${T.border}`, background: T.surface2,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            background: T.gold, color: "#0e0e12", fontFamily: T.display,
            fontWeight: 900, fontSize: "var(--fs-micro)", padding: "2px 9px",
            borderRadius: 3, letterSpacing: ".08em",
          }}>Q{qi + 1}</span>
          <span style={{ color: T.slate, fontSize: "var(--fs-micro)", fontFamily: T.display, fontWeight: 700, letterSpacing: ".08em" }}>
            {TYPE_LABEL[q.type] || q.type}
          </span>
          {/* Unsaved indicator dot */}
          {q._dirty && (
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: T.gold, display: "inline-block",
              boxShadow: `0 0 6px ${T.gold}`,
            }} title="Unsaved changes" />
          )}
        </div>
        <button
          onClick={remove}
          style={{
            background: "none", border: `1px solid ${T.border}`, borderRadius: 4,
            color: T.slate2, padding: "3px 10px", fontSize: "var(--fs-micro)",
            fontFamily: T.display, fontWeight: 700, cursor: "pointer",
            letterSpacing: ".06em", transition: "all .15s",
          }}
          onMouseOver={(e) => { e.currentTarget.style.borderColor = T.red; e.currentTarget.style.color = T.red; }}
          onMouseOut={(e) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.slate2; }}
        >REMOVE</button>
      </div>

      <div style={{ padding: "16px 18px" }}>
        <Field label="Question Text" required>
          <Textarea
            value={q.text}
            onChange={(v) => upd((q) => { q.text = v; q._dirty = true; })}
            placeholder="Enter your question here…"
            rows={2}
          />
        </Field>

        {/* ── Multiple Choice ── */}
        {q.type === "multiplechoice" && (
          <div>
            <label style={{ ...css.label, marginBottom: 8 }}>
              Answer Options —{" "}
              <span style={{ color: T.slate2, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
                click the radio to mark correct
              </span>
            </label>
            {(q.options || []).map((opt, oi) => (
              <div key={oi} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div
                  onClick={() => setCorrect(oi)}
                  style={{
                    width: 16, height: 16, borderRadius: "50%", flexShrink: 0, cursor: "pointer",
                    border: `2px solid ${q.correctAnswer === oi ? T.gold : T.border2}`,
                    background: q.correctAnswer === oi ? T.gold : "transparent", transition: "all .15s",
                  }}
                />
                <Input
                  value={opt}
                  onChange={(v) => updateOption(oi, v)}
                  placeholder={`Option ${oi + 1}`}
                  style={{ borderColor: q.correctAnswer === oi ? T.gold3 : T.border2 }}
                />
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <Input value={newOption} onChange={setNewOption} placeholder="New option…" />
              <button onClick={addOpt} style={{ ...css.btn("primary"), flexShrink: 0, padding: "9px 16px" }}>Add</button>
            </div>
          </div>
        )}

        {/* ── Multiple Response ── */}
        {q.type === "multipleresponse" && (
          <div>
            <label style={{ ...css.label, marginBottom: 8 }}>
              Answer Options —{" "}
              <span style={{ color: T.slate2, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
                check all correct answers
              </span>
            </label>
            {(q.options || []).map((opt, oi) => (
              <div key={oi} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div
                  onClick={() => toggleMulti(oi)}
                  style={{
                    width: 14, height: 14, borderRadius: 3, flexShrink: 0, cursor: "pointer",
                    border: `1.5px solid ${(q.correctAnswers || []).includes(opt) ? T.gold : T.border2}`,
                    background: (q.correctAnswers || []).includes(opt) ? T.gold : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s",
                  }}
                >
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

        {/* ── True / False ── */}
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
                    width: 20, height: 20, borderRadius: "50%", display: "flex",
                    alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900,
                    background: q.correctAnswer === val ? T.gold : T.border2,
                    color: q.correctAnswer === val ? "#0e0e12" : T.slate2,
                  }}>{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Fill in the Blank ── */}
        {q.type === "fillintheblank" && (
          <Field label="Correct Answer" hint="Students must type this exactly to be marked correct">
            <Input
              value={q.correctAnswer}
              onChange={(v) => upd((q) => { q.correctAnswer = v; q._dirty = true; })}
              placeholder="Enter the expected answer…"
            />
          </Field>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NORMALISE question from backend → local state shape
// ─────────────────────────────────────────────────────────────────────────────
function normaliseQuestion(q) {
  const type = (q.type || "multiplechoice").toLowerCase().replace(/[\s_-]/g, "");

  if (type === "multipleresponse") {
    const ca = q.correct_answer ?? q.correctAnswers ?? [];
    return {
      type: "multipleresponse",
      text: q.text || q.question || "",
      options: Array.isArray(q.options) ? q.options : [],
      correctAnswers: Array.isArray(ca) ? ca : [],
    };
  }
  if (type === "truefalse") {
    const ca = q.correct_answer ?? q.correctAnswer ?? null;
    return {
      type: "truefalse",
      text: q.text || q.question || "",
      correctAnswer:
        ca === true  || ca === "true"  || ca === "True"  ? true
      : ca === false || ca === "false" || ca === "False" ? false
      : null,
    };
  }
  if (type === "fillintheblank") {
    return {
      type: "fillintheblank",
      text: q.text || q.question || "",
      correctAnswer: q.correct_answer ?? q.correctAnswer ?? "",
    };
  }
  // default: multiplechoice
  const ca = q.correct_answer ?? q.correctAnswer ?? null;
  const options = Array.isArray(q.options) ? q.options : [];
  // backend may store correctAnswer as the option text — convert to index
  let correctAnswer = ca;
  if (typeof ca === "string" && ca !== "N/A") {
    const idx = options.findIndex((o) => o.toLowerCase() === ca.toLowerCase());
    if (idx !== -1) correctAnswer = idx;
  }
  return {
    type: "multiplechoice",
    text: q.text || q.question || "",
    options,
    correctAnswer,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function EditTest() {
  const navigate  = useNavigate();
  const { id }    = useParams();   // route: /edit-test/:id

  const [activeStep, setActiveStep] = useState(0);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [fetchError,   setFetchError]   = useState(null);
  const [saveLoading,  setSaveLoading]  = useState(false);
  const [showSuccess,  setShowSuccess]  = useState(false);
  const [toast,        setToast]        = useState(null);

  // ── Step 0 — Test Details ──────────────────────────────────────────────────
  const [testName,        setTestName]        = useState("");
  const [testDescription, setTestDescription] = useState("");
  const [category,        setCategory]        = useState("");
  const [subject,         setSubject]         = useState("");
  const [difficulty,      setDifficulty]      = useState("");

  // ── Step 1 — Questions ─────────────────────────────────────────────────────
  const [questions, setQuestions] = useState([]);

  // ── Step 2 — Scoring & Time ────────────────────────────────────────────────
  const [timeLimitPerQ, setTimeLimitPerQ] = useState(1);
  const [marksPerQ,     setMarksPerQ]     = useState(1);

  // ── Step 3 — Pass Criteria ─────────────────────────────────────────────────
  const [passCriteria, setPassCriteria] = useState("");

  // ── Step 4 — Configuration ─────────────────────────────────────────────────
  const [instructions,    setInstructions]    = useState("");
  const [conclusion,      setConclusion]      = useState("");
  const [startDate,       setStartDate]       = useState("");
  const [endDate,         setEndDate]         = useState("");
  const [dueTime,         setDueTime]         = useState("");
  const [allowJump,       setAllowJump]       = useState(false);
  const [onlyForward,     setOnlyForward]     = useState(false);
  const [noRightClick,    setNoRightClick]    = useState(false);
  const [noCopyPaste,     setNoCopyPaste]     = useState(false);
  const [noTranslate,     setNoTranslate]     = useState(false);
  const [noAutoComplete,  setNoAutoComplete]  = useState(false);
  const [noSpellcheck,    setNoSpellcheck]    = useState(false);
  const [noPrint,         setNoPrint]         = useState(false);
  const [allowRetakes,    setAllowRetakes]    = useState(false);
  const [retakeCount,     setRetakeCount]     = useState(1);
  const [randomize,       setRandomize]       = useState(false);
  const [allowBlanks,     setAllowBlanks]     = useState(false);
  const [penalize,        setPenalize]        = useState(false);
  const [isPublic,        setIsPublic]        = useState(false);
  const [emailNotif,      setEmailNotif]      = useState(false);
  const [notifEmails,     setNotifEmails]     = useState("");

  // ── Fetch test on mount ────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    setFetchLoading(true);
    setFetchError(null);

    getTestForEdit(id)
      .then((data) => {
        // Step 0
        setTestName(data.title        || "");
        setTestDescription(data.description || "");
        setCategory(data.category     || "");
        setSubject(data.subject       || "");
        setDifficulty(data.difficulty || "");

        // Step 1 — normalise questions
        const qs = Array.isArray(data.questions) ? data.questions : [];
        setQuestions(qs.map(normaliseQuestion));

        // Step 2
        setTimeLimitPerQ(data.time_limit_per_question ?? 1);
        setMarksPerQ(data.marks_per_question ?? 1);

        // Step 3
        setPassCriteria(data.pass_criteria ?? "");

        // Step 4
        setInstructions(data.instructions   || "");
        setConclusion(data.conclusion       || "");
        setStartDate(data.start_date        || "");
        setEndDate(data.end_date            || "");
        setDueTime(data.due_time            || "");
        setAllowJump(data.allow_jump_around         ?? false);
        setOnlyForward(data.only_move_forward       ?? false);
        setNoRightClick(data.disable_right_click    ?? false);
        setNoCopyPaste(data.disable_copy_paste      ?? false);
        setNoTranslate(data.disable_translate       ?? false);
        setNoAutoComplete(data.disable_autocomplete ?? false);
        setNoSpellcheck(data.disable_spellcheck     ?? false);
        setNoPrint(data.disable_printing            ?? false);
        setAllowRetakes(data.allow_retakes          ?? false);
        setRetakeCount(data.number_of_retakes       ?? 1);
        setRandomize(data.randomize_order           ?? false);
        setAllowBlanks(data.allow_blank_answers     ?? false);
        setPenalize(data.penalize_incorrect_answers ?? false);
        setIsPublic(data.is_public                  ?? false);
        setEmailNotif(data.receive_email_notifications ?? false);
        setNotifEmails(data.notification_emails    || "");
      })
      .catch((err) => {
        console.error(err);
        setFetchError("Failed to load test. Please try again.");
      })
      .finally(() => setFetchLoading(false));
  }, [id]);

  // ── Toast helper ───────────────────────────────────────────────────────────
  const showToast = (title, message, ok = true) => {
    setToast({ title, message, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Add question ───────────────────────────────────────────────────────────
  const addQuestion = (type) => {
    const base = { type, text: "", _dirty: true };
    if (type === "multiplechoice")   { base.options = ["", "", "", ""]; base.correctAnswer = null; }
    if (type === "multipleresponse") { base.options = ["", "", "", ""]; base.correctAnswers = []; }
    if (type === "truefalse")        { base.correctAnswer = null; }
    if (type === "fillintheblank")   { base.correctAnswer = ""; }
    setQuestions((p) => [...p, base]);
  };

  // ── Save / Submit ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaveLoading(true);
    const totalQ = questions.length;

    const payload = {
      title:       testName,
      description: testDescription,
      category,
      subject,
      difficulty,
      time_limit_per_question: timeLimitPerQ,
      total_time_limit:        totalQ * timeLimitPerQ,
      marks_per_question:      marksPerQ,
      max_score:               totalQ * marksPerQ,
      total_marks:             totalQ * marksPerQ,
      pass_criteria:           passCriteria,
      instructions,
      conclusion,
      start_date:              startDate  || null,
      end_date:                endDate    || null,
      due_time:                dueTime    || null,
      is_public:               isPublic,
      allow_retakes:           allowRetakes,
      number_of_retakes:       retakeCount,
      randomize_order:         randomize,
      allow_blank_answers:     allowBlanks,
      penalize_incorrect_answers: penalize,
      allow_jump_around:       allowJump,
      only_move_forward:       onlyForward,
      disable_right_click:     noRightClick,
      disable_copy_paste:      noCopyPaste,
      disable_translate:       noTranslate,
      disable_autocomplete:    noAutoComplete,
      disable_spellcheck:      noSpellcheck,
      disable_printing:        noPrint,
      receive_email_notifications: emailNotif,
      notification_emails:     notifEmails,
      questions: questions.map((q) => ({
        type: q.type,
        text: q.text,
        options: q.options ?? [],
        correct_answer:
          q.type === "multipleresponse" ? (q.correctAnswers ?? [])
        : q.type === "truefalse"        ? q.correctAnswer
        : q.correctAnswer ?? "N/A",
      })),
    };

    try {
      await updateTest(id, payload);
      setShowSuccess(true);
    } catch (err) {
      console.error(err);
      showToast("Save Failed", "Could not update the test. Please try again.", false);
    } finally {
      setSaveLoading(false);
    }
  };

  // ── Step validation ────────────────────────────────────────────────────────
  const nextDisabled =
    (activeStep === 0 && (!testName || !testDescription || !subject || !difficulty || !category)) ||
    (activeStep === 1 && questions.length === 0) ||
    (activeStep === 2 && (!timeLimitPerQ || !marksPerQ)) ||
    (activeStep === 3 && !passCriteria) ||
    (activeStep === 4 && (!instructions || !conclusion));

  // ─────────────────────────────────────────────────────────────────────────
  // STEP RENDERERS
  // ─────────────────────────────────────────────────────────────────────────

  // STEP 0 ─ Test Details
  const step0 = () => (
    <div>
      <Field label="Test Title" required hint="Keep it clear and descriptive — students will see this.">
        <Input value={testName} onChange={setTestName} placeholder="e.g. Final Mathematics Assessment — Grade 10" />
      </Field>
      <Field label="Description" hint="Optional context shown to students before they start.">
        <Textarea value={testDescription} onChange={setTestDescription} placeholder="Briefly describe the scope and topics covered…" rows={3} />
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
            ]}
          />
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
            ]}
          />
        </Field>
      </div>
    </div>
  );

  // STEP 1 ─ Questions
  const step1 = () => (
    <div>
      <label style={css.label}>Add New Question Type</label>
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
          <div style={{ color: T.slate, fontSize: "var(--fs-secondary)", fontFamily: T.display, fontWeight: 600 }}>No questions yet</div>
          <div style={{ color: T.slate2, fontSize: "var(--fs-micro)", fontFamily: T.display, marginTop: 5 }}>
            Add a question type above or they'll load from the backend
          </div>
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <label style={css.label}>{questions.length} Question{questions.length !== 1 ? "s" : ""}</label>
            <span style={{ color: T.slate2, fontSize: "var(--fs-micro)", fontFamily: T.display }}>
              {questions.filter((q) => q._dirty).length > 0 && (
                <span style={{ color: T.gold }}>● {questions.filter((q) => q._dirty).length} unsaved change{questions.filter((q) => q._dirty).length !== 1 ? "s" : ""}</span>
              )}
            </span>
          </div>
          {questions.map((q, qi) => (
            <QuestionBlock key={qi} q={q} qi={qi} questions={questions} setQuestions={setQuestions} />
          ))}
        </div>
      )}
    </div>
  );

  // STEP 2 ─ Scoring & Time
  const step2 = () => {
    const totalQ = questions.length;
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
            ⚠ No questions added. Return to Step 2 to add questions.
          </div>
        )}
      </div>
    );
  };

  // STEP 3 ─ Pass Criteria
  const step3 = () => {
    const totalQ = questions.length;
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
            <div style={{ color: T.gold, fontSize: "var(--fs-micro)", fontFamily: T.display, fontWeight: 700 }}>
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

  // STEP 4 ─ Configuration
  const step4 = () => (
    <div>
      <Field label="Introduction / Instructions" hint="Displayed to students before they start.">
        <Textarea value={instructions} onChange={setInstructions} placeholder="e.g. Read all questions carefully." rows={3} />
      </Field>

      <SH icon="◎">Availability Window</SH>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <Field label="Start Date" hint="Leave blank for immediate access"><Input type="date" value={startDate} onChange={setStartDate} /></Field>
        <Field label="End Date"   hint="Leave blank for no expiry">       <Input type="date" value={endDate}   onChange={setEndDate}   /></Field>
        <Field label="Due Time"   hint="Time of day the test closes">     <Input type="time" value={dueTime}   onChange={setDueTime}   /></Field>
      </div>

      <SH icon="◈">Navigation & Behaviour</SH>
      <Toggle checked={allowJump}   onChange={setAllowJump}   label="Allow jumping between questions"  description="Students can revisit previous questions" />
      <Toggle checked={onlyForward} onChange={setOnlyForward} label="Only move forward"                description="Students cannot go back" />
      <Toggle checked={randomize}   onChange={setRandomize}   label="Randomize question order"         description="Different order for each student" />
      <Toggle checked={allowBlanks} onChange={setAllowBlanks} label="Allow blank submissions"          description="Students can submit unanswered questions" />
      <Toggle checked={penalize}    onChange={setPenalize}    label="Negative marking"                 description="Incorrect answers deduct marks" />

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
      <Toggle checked={isPublic} onChange={setIsPublic} label="Make test publicly accessible" description="Anyone with the link can attempt — no login required" />

      <SH icon="◎">Notifications</SH>
      <Toggle checked={emailNotif} onChange={setEmailNotif} label="Email notifications on completion" description="Receive an email each time a student submits" />
      {emailNotif && (
        <Field label="Notification Email Addresses" hint="Separate multiple addresses with commas">
          <Input value={notifEmails} onChange={setNotifEmails} placeholder="admin@school.edu, teacher@school.edu" />
        </Field>
      )}

      <SH icon="◆">Conclusion</SH>
      <Field label="Conclusion Text" hint="Displayed to students after they submit.">
        <Textarea value={conclusion} onChange={setConclusion} placeholder="e.g. Thank you for completing this assessment." rows={3} />
      </Field>
    </div>
  );

  const stepRenderers = [step0, step1, step2, step3, step4];

  // ─────────────────────────────────────────────────────────────────────────
  // LOADING / ERROR STATES
  // ─────────────────────────────────────────────────────────────────────────
  if (fetchLoading) {
    return (
      <AdminLayout pageKey="tests">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16 }}>
          <div style={{ color: T.gold, fontSize: 36, animation: "spin 1.2s linear infinite" }}>◈</div>
          <div style={{ color: T.slate, fontFamily: T.display, fontSize: "var(--fs-secondary)", fontWeight: 600 }}>Loading test…</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </AdminLayout>
    );
  }

  if (fetchError) {
    return (
      <AdminLayout pageKey="tests">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16 }}>
          <div style={{ color: T.red, fontSize: 32 }}>⚠</div>
          <div style={{ color: T.ivory, fontFamily: T.display, fontSize: "var(--fs-secondary)", fontWeight: 600 }}>{fetchError}</div>
          <button onClick={() => navigate("/TestManagement")} style={css.btn("ghost")}>← Back to Tests</button>
        </div>
      </AdminLayout>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <AdminLayout pageKey="tests">

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 99999,
          background: T.surface, border: `1px solid ${toast.ok ? T.gold : "rgba(192,112,112,.5)"}`,
          borderRadius: 8, padding: "12px 20px",
          boxShadow: "0 4px 16px rgba(0,0,0,.4)",
          animation: "slideIn .3s ease",
        }}>
          <div style={{ color: toast.ok ? T.gold : T.red, fontFamily: T.display, fontWeight: 700, marginBottom: 4 }}>{toast.title}</div>
          <div style={{ color: T.slate, fontSize: "var(--fs-small)", fontFamily: T.display }}>{toast.message}</div>
        </div>
      )}

      <div className="fade-up d1" style={{ margin: "0 auto", marginBottom: 10 }}>

        {/* Page header */}
        <div style={{ marginBottom: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <SectionLabel>✎ Edit Test</SectionLabel>
            <p style={{ color: "var(--slate)", fontSize: "var(--fs-body)", marginTop: 2 }}>
              Step {activeStep + 1} of {STEPS.length} — {STEPS[activeStep].sub}
            </p>
          </div>
          <button onClick={() => navigate("/TestManagement")} style={css.btn("ghost")}>← Back to Tests</button>
        </div>

        {/* Two-column layout */}
        <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: 20, alignItems: "start" }}>

          {/* ── Sidebar ── */}
          <div style={{
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 8, overflow: "hidden", position: "sticky", top: 24,
          }}>
            <div style={{ padding: "14px 16px", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ color: T.slate2, fontSize: "var(--fs-micro)", fontFamily: T.display, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase" }}>SECTIONS</div>
            </div>

            {STEPS.map((s, i) => {
              const done   = i < activeStep;
              const active = i === activeStep;
              return (
                <button key={i} onClick={() => setActiveStep(i)} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  width: "100%", padding: "12px 16px",
                  background: active ? T.goldBg : "transparent",
                  border: "none", borderBottom: `1px solid ${T.border}`,
                  borderLeft: `2px solid ${active ? T.gold : done ? T.gold3 : "transparent"}`,
                  cursor: "pointer", transition: "all .15s", textAlign: "left",
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

            {/* Progress bar */}
            <div style={{ padding: "12px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: T.slate2, fontSize: "var(--fs-micro)", fontFamily: T.display, fontWeight: 600 }}>Progress</span>
                <span style={{ color: T.gold, fontSize: "var(--fs-micro)", fontFamily: T.display, fontWeight: 700 }}>{Math.round((activeStep / (STEPS.length - 1)) * 100)}%</span>
              </div>
              <div style={{ height: 3, background: T.border2, borderRadius: 2 }}>
                <div style={{ height: 3, borderRadius: 2, background: T.gold, width: `${Math.round((activeStep / (STEPS.length - 1)) * 100)}%`, transition: "width .4s ease" }} />
              </div>
            </div>

            {/* Quick save button in sidebar */}
            <div style={{ padding: "0 12px 14px" }}>
              <button
                onClick={handleSave}
                disabled={saveLoading}
                style={{
                  ...css.btn("primary"),
                  width: "100%", justifyContent: "center",
                  opacity: saveLoading ? 0.5 : 1,
                  cursor: saveLoading ? "not-allowed" : "pointer",
                }}
              >
                {saveLoading ? "Saving…" : "💾 Save Changes"}
              </button>
            </div>
          </div>

          {/* ── Main area ── */}
          <div>
            <div style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 8, overflow: "hidden", marginBottom: 16,
            }}>
              {/* Card header */}
              <div style={{
                padding: "16px 22px", borderBottom: `1px solid ${T.border}`,
                background: T.surface2, display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{
                    background: T.goldBg2, border: `1px solid ${T.gold3}`, color: T.gold,
                    fontFamily: T.display, fontWeight: 900, fontSize: "var(--fs-micro)",
                    padding: "2px 10px", borderRadius: 3, letterSpacing: ".1em",
                  }}>
                    {STEPS[activeStep].icon}
                  </span>
                  <div>
                    <div style={{ color: T.ivory, fontFamily: T.display, fontWeight: 700, fontSize: "var(--fs-secondary)", letterSpacing: ".04em" }}>
                      {STEPS[activeStep].label}
                    </div>
                    <div style={{ color: T.slate2, fontSize: "var(--fs-micro)", fontFamily: T.display, marginTop: 1 }}>
                      {STEPS[activeStep].sub}
                    </div>
                  </div>
                </div>

                {/* Edit badge */}
                <span style={{
                  background: "rgba(76,175,125,.08)", border: "1px solid rgba(76,175,125,.25)",
                  color: T.green, fontSize: "var(--fs-micro)", fontFamily: T.display,
                  fontWeight: 700, padding: "3px 10px", borderRadius: 3, letterSpacing: ".06em",
                }}>
                  ✎ EDITING
                </span>
              </div>

              {/* Step body */}
              <div style={{ padding: "22px 22px 26px" }}>
                {stepRenderers[activeStep]?.()}
              </div>
            </div>

            {/* Navigation */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                onClick={() => setActiveStep((s) => Math.max(0, s - 1))}
                disabled={activeStep === 0}
                style={{ ...css.btn("ghost"), opacity: activeStep === 0 ? 0.35 : 1, cursor: activeStep === 0 ? "not-allowed" : "pointer" }}
              >← Previous</button>

              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                {saveLoading && <span style={{ color: T.slate2, fontSize: "var(--fs-micro)", fontFamily: T.display, fontWeight: 600 }}>Saving…</span>}

                {activeStep < STEPS.length - 1 ? (
                  <button
                    onClick={() => setActiveStep((s) => s + 1)}
                    disabled={nextDisabled}
                    style={{
                      ...css.btn("primary"),
                      opacity: nextDisabled ? 0.4 : 1,
                      cursor: nextDisabled ? "not-allowed" : "pointer",
                      padding: "10px 24px",
                    }}
                  >
                    Continue →
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    disabled={nextDisabled || saveLoading}
                    style={{
                      ...css.btn("primary"),
                      opacity: nextDisabled || saveLoading ? 0.4 : 1,
                      cursor: nextDisabled || saveLoading ? "not-allowed" : "pointer",
                      padding: "10px 24px",
                    }}
                  >
                    {saveLoading ? "Saving…" : "Save All Changes ✓"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success modal */}
      <SuccessModal
        open={showSuccess}
        onClose={() => setShowSuccess(false)}
        onGoToTests={() => { setShowSuccess(false); navigate("/TestManagement"); }}
      />

      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        input[type=date]::-webkit-calendar-picker-indicator,
        input[type=time]::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }
        input::placeholder, textarea::placeholder { color: #3a3a52 !important; }
        select option { background: #1a1a22; color: #f0ead6; }
      `}</style>
    </AdminLayout>
  );
}