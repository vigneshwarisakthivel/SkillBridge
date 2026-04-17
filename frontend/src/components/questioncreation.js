import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout, { SectionLabel, G } from "./AdminLayout";
import { saveBankQuestions } from "../services/apiServices";

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const API_BASE_URL = "https://online-test-creation-1.onrender.com/api";

const Q_TYPES = [
  { type: "multiplechoice",   label: "Multiple Choice",   desc: "One correct answer from options" },
  { type: "multipleresponse", label: "Multiple Response", desc: "Several correct answers possible" },
  { type: "truefalse",        label: "True / False",      desc: "Binary true or false question" },
  { type: "fillintheblank",   label: "Fill in the Blank", desc: "Student types the exact answer"},
];

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS  —  identical to CreateNewTest (document 3)
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
  serif:    "var(--serif,    'Georgia', serif)",
  mono:     "var(--display,  'DM Mono', 'Courier New', monospace)",
};

// ─────────────────────────────────────────────────────────────────────────────
// BASE STYLES
// ─────────────────────────────────────────────────────────────────────────────
const css = {
  input: {
    display: "block", width: "100%",
    background: T.surface2, border: `1px solid ${T.border2}`,
    borderRadius: 6, color: T.ivory,
    padding: "5px 8px", fontSize: "12px", fontFamily: T.mono,
    outline: "none", transition: "border-color .18s, box-shadow .18s",
    boxSizing: "border-box",
  },
  label: {
    display: "block", color: T.slate2, fontSize: "var(--fs-small)", fontFamily: T.mono,
    fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", marginBottom: 6,
  },
  btn: (variant = "primary") => ({
    display: "inline-flex", alignItems: "center", gap: 6,
    padding: "9px 20px", borderRadius: 6,
    border: variant === "primary" ? "none" : `1px solid ${T.border2}`,
    background: variant === "primary" ? T.gold : "transparent",
    color: variant === "primary" ? "#0e0e12" : T.slate,
    fontFamily: T.mono, fontWeight: 700, fontSize: "var(--fs-small)", letterSpacing: ".08em",
    cursor: "pointer", transition: "all .15s", userSelect: "none",
  }),
  card: {
    background: T.surface, border: `1px solid ${T.border}`,
    borderRadius: 8, padding: "18px 20px", marginBottom: 10,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVES  —  exact copies from CreateNewTest
// ─────────────────────────────────────────────────────────────────────────────
function Field({ label, hint, children, required }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={css.label}>
        {label}{required && <span style={{ color: T.gold, marginLeft: 3 }}>*</span>}
      </label>
      {children}
      {hint && <div style={{ color: T.slate2, fontSize: "var(--fs-small)", fontFamily: T.mono, marginTop: 5 }}>{hint}</div>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", min, style: sx = {} }) {
  const [f, setF] = useState(false);
  return (
    <input
      type={type} value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} min={min}
      style={{
        ...css.input,
        borderColor: f ? T.gold2 : T.border2,
        boxShadow: f ? `0 0 0 3px ${T.goldBg}` : "none",
        ...sx,
      }}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  const [f, setF] = useState(false);
  return (
    <textarea
      value={value} onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder} rows={rows}
      style={{
        ...css.input, resize: "vertical", lineHeight: 1.6,
        borderColor: f ? T.gold2 : T.border2,
        boxShadow: f ? `0 0 0 3px ${T.goldBg}` : "none",
      }}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QUESTION BLOCK  —  exact copy from CreateNewTest
// ─────────────────────────────────────────────────────────────────────────────
function QuestionBlock({ q, qi, questions, setQuestions, newOption, setNewOption }) {
  const upd = (fn) => { const a = [...questions]; fn(a[qi]); setQuestions(a); };
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

  const typeMap = {
    multiplechoice:   "Multiple Choice",
    multipleresponse: "Multiple Response",
    truefalse:        "True / False",
    fillintheblank:   "Fill in the Blank",
  };

  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`,
      borderRadius: 8, marginBottom: 12, overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px", borderBottom: `1px solid ${T.border}`,
        background: T.surface2,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            background: T.gold, color: "#0e0e12",
            fontFamily: T.mono, fontWeight: 900, fontSize: "var(--fs-small)",
            padding: "2px 9px", borderRadius: 3, letterSpacing: ".08em",
          }}>Q{qi + 1}</span>
          <span style={{
            color: T.slate, fontSize: "var(--fs-small)", fontFamily: T.mono,
            fontWeight: 700, letterSpacing: ".08em",
          }}>{typeMap[q.type]}</span>
        </div>
        <button
          onClick={remove}
          style={{
            background: "none", border: `1px solid ${T.border}`, borderRadius: 4,
            color: T.slate2, padding: "3px 10px", fontSize: "var(--fs-small)",
            fontFamily: T.mono, fontWeight: 700, cursor: "pointer",
            letterSpacing: ".06em", transition: "all .15s",
          }}
          onMouseOver={(e) => { e.currentTarget.style.borderColor = T.red; e.currentTarget.style.color = T.red; }}
          onMouseOut={(e)  => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.slate2; }}
        >REMOVE</button>
      </div>

      {/* Body */}
      <div style={{ padding: "16px 18px" }}>
        <Field label="Question Text" required>
          <Textarea
            value={q.text}
            onChange={(v) => upd((q) => { q.text = v; })}
            placeholder="Enter your question here…"
            rows={2}
          />
        </Field>

        {/* Multiple Choice */}
        {q.type === "multiplechoice" && (
          <div>
            <label style={{ ...css.label, marginBottom: 8 }}>
              Answer Options —{" "}
              <span style={{ color: T.slate2, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
                click the radio to mark the correct answer
              </span>
            </label>
            {q.options.map((opt, oi) => (
              <div key={oi} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div
                  onClick={() => setCorrect(oi)}
                  title="Mark as correct"
                  style={{
                    width: 16, height: 16, borderRadius: "50%", flexShrink: 0, cursor: "pointer",
                    border: `2px solid ${q.correctAnswer === oi ? T.gold : T.border2}`,
                    background: q.correctAnswer === oi ? T.gold : "transparent",
                    transition: "all .15s",
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

        {/* Multiple Response */}
        {q.type === "multipleresponse" && (
          <div>
            <label style={{ ...css.label, marginBottom: 8 }}>
              Answer Options —{" "}
              <span style={{ color: T.slate2, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
                check all correct answers
              </span>
            </label>
            {q.options.map((opt, oi) => (
              <div key={oi} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div
                  onClick={() => toggleMulti(oi)}
                  style={{
                    width: 14, height: 14, borderRadius: 3, flexShrink: 0, cursor: "pointer",
                    border: `1.5px solid ${(q.correctAnswers || []).includes(opt) ? T.gold : T.border2}`,
                    background: (q.correctAnswers || []).includes(opt) ? T.gold : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all .15s",
                  }}
                >
                  {(q.correctAnswers || []).includes(opt) && (
                    <span style={{ color: "#0e0e12", fontSize: 9, fontWeight: 900 }}>✓</span>
                  )}
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

        {/* True / False */}
        {q.type === "truefalse" && (
          <div>
            <label style={{ ...css.label, marginBottom: 10 }}>Correct Answer</label>
            <div style={{ display: "flex", gap: 10 }}>
              {[{ val: true, label: "True", icon: "✓" }, { val: false, label: "False", icon: "✕" }].map(({ val, label, icon }) => (
                <button
                  key={String(val)}
                  onClick={() => setCorrect(val)}
                  style={{
                    flex: 1, padding: "8px 0", borderRadius: 6, cursor: "pointer",
                    border: `1px solid ${q.correctAnswer === val ? T.gold : T.border2}`,
                    background: q.correctAnswer === val ? T.goldBg2 : T.surface2,
                    color: q.correctAnswer === val ? T.gold : T.slate,
                    fontFamily: T.mono, fontWeight: 700, fontSize: "12px", letterSpacing: ".08em",
                    transition: "all .15s",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}
                >
                  <span style={{
                    width: 20, height: 20, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "var(--fs-small)", fontWeight: 900,
                    background: q.correctAnswer === val ? T.gold : T.border2,
                    color: q.correctAnswer === val ? "#0e0e12" : T.slate2,
                  }}>{icon}</span>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Fill in the Blank */}
        {q.type === "fillintheblank" && (
          <Field label="Correct Answer" hint="Students must type this exactly to be marked correct">
            <Input
              value={q.correctAnswer || ""}
              onChange={(v) => upd((q) => { q.correctAnswer = v; })}
              placeholder="Enter the expected answer…"
            />
          </Field>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
export default function QuestionCreator() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [newOption, setNewOption] = useState("");
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState({ open: false, message: "", ok: true });

  const showToast = (message, ok = true) => {
    setToast({ open: true, message, ok });
    setTimeout(() => setToast((t) => ({ ...t, open: false })), 3500);
  };

  const addQuestion = (type) => {
    const base = { type, text: "" };
    if (type === "multiplechoice")   { base.options = ["", "", "", ""]; base.correctAnswer = null; }
    if (type === "multipleresponse") { base.options = ["", "", "", ""]; base.correctAnswers = []; }
    if (type === "truefalse")        { base.correctAnswer = null; }
    if (type === "fillintheblank")   { base.correctAnswer = ""; }
    setQuestions((p) => [...p, base]);
  };

const handleSave = async () => {
  if (!questions.length) {
    showToast("Please add at least one question.", false);
    return;
  }

  for (const q of questions) {
    if (!q.text?.trim()) {
      showToast("Please fill in all question texts.", false);
      return;
    }
    if (
      q.type === "multipleresponse" &&
      (!q.correctAnswers || !q.correctAnswers.length)
    ) {
      showToast(
        "Select at least one correct answer for multiple response questions.",
        false
      );
      return;
    }
  }

  setSaving(true);
  try {
    const result = await saveBankQuestions(
      questions.map((q) => ({
        text: q.text,
        type: q.type,
        options: q.options || [],
        correct_answer:
          q.type === "multipleresponse" ? q.correctAnswers : q.correctAnswer,
      }))
    );
    navigate("/question-management");
    showToast(result.message, true);
    setQuestions([]);
    setNewOption("");
  } catch (e) {
    console.error(e);
    showToast("Error saving questions. Please try again.", false);
  } finally {
    setSaving(false);
  }
};

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <AdminLayout pageKey="createQ">
 <div className="fade-up d1" style={{  margin: "0 auto",  marginBottom: 10  }}>
      {/* Page header */}
      <div style={{
        marginBottom: 10,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <SectionLabel>◈ Question Bank</SectionLabel>

          <p style={{ color: "var(--slate)", fontSize: "var(--fs-secondary)" }}>
            Build reusable questions for your shared question bank
          </p>
        </div>
        <button onClick={() => navigate("/TestManagement")} style={css.btn("ghost")}>
          ← Back to Tests
        </button>
      </div>

      {/* Main card */}
      <div style={{
        background: T.surface, border: `1px solid ${T.border}`,
        borderRadius: 8, overflow: "hidden", marginBottom: 16,
      }}>


        {/* Card body */}
        <div style={{ padding: "10px 12px 14px" }}>

          {/* Type selector */}
          <label style={css.label}>Select Question Type to Add</label>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4,1fr)",
            gap: 10, marginBottom: 22,
          }}>
            {Q_TYPES.map(({ type, label, desc, icon }) => (
              <button
                key={type}
                onClick={() => addQuestion(type)}
                style={{
                  background: T.surface2, border: `1px solid ${T.border}`,
                  borderRadius: 7, padding: "14px 10px",
                  cursor: "pointer", textAlign: "left", transition: "all .15s",
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = T.gold3; e.currentTarget.style.background = T.goldBg; }}
                onMouseOut={(e)  => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.surface2; }}
              >
                <div style={{ color: T.gold, fontSize: "var(--fs-card)", marginBottom: 8 }}>{icon}</div>
                <div style={{ color: T.ivory, fontSize: "var(--fs-small)", fontFamily: T.mono, fontWeight: 700, marginBottom: 3 }}>{label}</div>
                <div style={{ color: T.slate2, fontSize: "var(--fs-small)", lineHeight: 1.4 }}>{desc}</div>
              </button>
            ))}
          </div>

          {/* Empty state */}
          {questions.length === 0 ? (
            <div style={{
              border: `1px dashed ${T.border2}`, borderRadius: 8,
              padding: "48px 20px", textAlign: "center",
            }}>

              <div style={{ color: T.slate, fontSize: "var(--fs-card)", fontFamily: T.mono }}>No questions added yet</div>
              <div style={{ color: T.slate2, fontSize: "var(--fs-small)", marginTop: 5 }}>
                Select a question type above to get started
              </div>
            </div>
          ) : (
            <div>
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", marginBottom: 12,
              }}>
                <label style={css.label}>
                  {questions.length} Question{questions.length !== 1 ? "s" : ""}
                </label>
              </div>
              {questions.map((q, qi) => (
                <QuestionBlock
                  key={qi} q={q} qi={qi}
                  questions={questions} setQuestions={setQuestions}
                  newOption={newOption} setNewOption={setNewOption}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer nav */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button
          onClick={() => { setQuestions([]); setNewOption(""); }}
          disabled={questions.length === 0}
          style={{
            ...css.btn("ghost"),
            opacity: questions.length === 0 ? 0.35 : 1,
            cursor: questions.length === 0 ? "not-allowed" : "pointer",
          }}
        >Clear All</button>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {saving && (
            <span style={{ color: T.slate2, fontSize: "var(--fs-small)", fontFamily: T.mono }}>Saving…</span>
          )}
          <button
            onClick={handleSave}
            disabled={questions.length === 0 || saving}
            style={{
              ...css.btn("primary"),
              opacity: questions.length === 0 || saving ? 0.4 : 1,
              cursor: questions.length === 0 || saving ? "not-allowed" : "pointer",
              padding: "10px 24px",
            }}
          >
            Save to Question Bank
          </button>
        </div>
      </div>

      {/* Toast notification */}
      {toast.open && (
        <div style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 9999,
          padding: "12px 18px", borderRadius: 8,
          background: T.surface2,
          border: `1px solid ${toast.ok ? T.gold3 : "rgba(192,112,112,.3)"}`,
          boxShadow: "0 8px 32px rgba(0,0,0,.5)",
          display: "flex", alignItems: "center", gap: 12, minWidth: 280,
        }}>
          <span style={{
            width: 22, height: 22, borderRadius: 5, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: toast.ok ? T.goldBg : "rgba(192,112,112,.1)",
            border: `1px solid ${toast.ok ? T.gold3 : "rgba(192,112,112,.3)"}`,
            color: toast.ok ? T.gold : T.red,
            fontSize: "var(--fs-small)", fontWeight: 900,
          }}>
            {toast.ok ? "✓" : "✕"}
          </span>
          <span style={{ color: T.ivory, fontSize: "var(--fs-small)", fontFamily: T.mono, flex: 1 }}>
            {toast.message}
          </span>
          <button
            onClick={() => setToast((t) => ({ ...t, open: false }))}
            style={{
              background: "none", border: "none", color: T.slate2,
              cursor: "pointer", fontSize: "var(--fs-card)", fontFamily: T.mono, padding: "0 2px",
            }}
          >✕</button>
        </div>
        
      )}

      <style>{`
        input::placeholder, textarea::placeholder { color: #3a3a52 !important; }
      `}</style>
</div>
    </AdminLayout>
  );
}