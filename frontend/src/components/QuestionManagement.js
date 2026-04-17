import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout, { SectionLabel } from "./AdminLayout";
import { createPortal } from "react-dom";
import { Pencil, Trash2 } from "lucide-react";
import { getAllQuestions, deleteBankQuestion, updateBankQuestion } from "../services/apiServices";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const TYPE_MAP = {
  multiplechoice:   { label: "Multiple Choice",   pill: "pill-mc"   },
  multipleresponse: { label: "Multiple Response", pill: "pill-mr"   },
  truefalse:        { label: "True / False",      pill: "pill-tf"   },
  fillintheblank:   { label: "Fill in Blank",     pill: "pill-fitb" },
};

const typeNorm  = (t) => (t || "").toLowerCase().replace(/[\s_-]/g, "");
const typeLabel = (t) => TYPE_MAP[typeNorm(t)]?.label ?? t;
const typePill  = (t) => TYPE_MAP[typeNorm(t)]?.pill  ?? "pill-mc";

const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const truncate = (str, n = 72) =>
  !str ? "—" : str.length > n ? str.slice(0, n) + "…" : str;

// ─────────────────────────────────────────────────────────────────────────────
// ANSWER PREVIEW
// ─────────────────────────────────────────────────────────────────────────────
function answerPreview(q) {
  const t = typeNorm(q.type);
  if (t === "truefalse") {
    const ca = q.correct_answer ?? q.correctAnswer;
    return ca === true || ca === "true" || ca === "True" ? "True" : "False";
  }
  if (t === "fillintheblank") {
    const ca = q.correct_answer ?? q.correctAnswer ?? "";
    return ca ? truncate(ca, 30) : "—";
  }
  if (t === "multipleresponse") {
    const ca = q.correct_answer ?? q.correctAnswers ?? [];
    const arr = Array.isArray(ca) ? ca : [];
    return arr.length ? arr.map((a) => truncate(a, 18)).join(", ") : "—";
  }
  if (Array.isArray(q.options)) {
    const idx = q.correct_answer ?? q.correctAnswer;
    if (typeof idx === "number" && q.options[idx]) return truncate(q.options[idx], 30);
    if (typeof idx === "string" && idx !== "N/A")  return truncate(idx, 30);
  }
  return "—";
}

function CustomDropdown({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { 
      if (ref.current && !ref.current.contains(e.target)) setOpen(false); 
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div 
      ref={ref} 
      style={{ position: "relative", minWidth: 160, width: "auto" }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()} // Add this to stop mousedown propagation
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen((o) => !o);
        }}
        className="filter-btn"
        style={{ width: "100%", justifyContent: "space-between", fontSize: "12px", }}
      >
        {value}<span>▾</span>
      </button>
      {open && createPortal(
        <div
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: "fixed",
            top: ref.current.getBoundingClientRect().bottom + 4,
            left: ref.current.getBoundingClientRect().left,
            width: ref.current.offsetWidth,
            background: "var(--ink2)",
            border: "1px solid var(--border2)",
            borderRadius: 6, 
            zIndex: 999999,
            boxShadow: "0 10px 30px rgba(0,0,0,.45)",
            overflow: "hidden",
            pointerEvents: "auto",
          }}
        >
          {options.map((opt) => (
            <div 
              key={opt} 
              onClick={(e) => { 
                e.stopPropagation();
                e.preventDefault();
                onChange(opt);
                setOpen(false); 
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              style={{ 
                padding: "10px 14px", 
                fontSize: "var(--fs-body)", 
                cursor: "pointer", 
                color: "var(--ivory)",
                pointerEvents: "auto"
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(196,161,94,.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {opt}
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DELETE MODAL  — same structure as TestManagement's DeleteConfirmModal
// ─────────────────────────────────────────────────────────────────────────────
function DeleteConfirmModal({ question, onClose, onConfirm }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await onConfirm(question.id);
    setIsDeleting(false);
    onClose();
  };

  if (!question) return null;
  return createPortal(
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000000,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: 400, background: "var(--ink2)", borderRadius: 10,
        border: "1px solid var(--border2)", padding: 20,
      }}>
        <h5 style={{ margin: 0, marginBottom: 10, color: "var(--ivory)" }}>Delete Question</h5>
        <p style={{ color: "var(--slate2)", fontSize: "var(--fs-small)", marginBottom: 16 }}>
          Are you sure you want to delete{" "}
          <span style={{ color: "var(--ivory)", fontWeight: 500 }}>
            "{truncate(question.text || question.question, 55)}"
          </span>?{" "}
          This cannot be undone.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button className="btn-o" onClick={onClose} disabled={isDeleting}>Cancel</button>
          <button className="btn-danger" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EDIT MODAL
// ─────────────────────────────────────────────────────────────────────────────
function EditQuestionModal({ question, onClose, onSave }) {
  const [text, setText]             = useState(question.text || question.question || "");
  const [options, setOptions]       = useState(Array.isArray(question.options) ? [...question.options] : []);
  const [correctAnswer, setCorrectAnswer] = useState(question.correct_answer ?? question.correctAnswer ?? null);
  const [correctAnswers, setCorrectAnswers] = useState(
    Array.isArray(question.correct_answer)   ? [...question.correct_answer]
    : Array.isArray(question.correctAnswers) ? [...question.correctAnswers]
    : []
  );
  const [newOpt, setNewOpt] = useState("");
  const [saving, setSaving] = useState(false);

  const type = typeNorm(question.type);

  const inputStyle = {
    display: "block", width: "100%",
    background: "var(--ink2)", border: "1px solid var(--border2)",
    borderRadius: 6, color: "var(--ivory)",
    padding: "9px 12px", fontSize: "var(--fs-body)",
    fontFamily: "var(--display)", outline: "none", boxSizing: "border-box",
  };
  const labelStyle = {
    display: "block", color: "var(--slate2)",
    fontSize: "var(--fs-small)", fontFamily: "var(--display)",
    fontWeight: 700, letterSpacing: ".1em",
    textTransform: "uppercase", marginBottom: 6,
  };

  const updateOption = (i, val) => {
    const copy = [...options];
    if (val === "") copy.splice(i, 1);
    else copy[i] = val;
    setOptions(copy);
  };
  const addOption = () => {
    if (!newOpt.trim()) return;
    setOptions((p) => [...p, newOpt.trim()]);
    setNewOpt("");
  };
  const toggleMulti = (opt) =>
    setCorrectAnswers((p) => p.includes(opt) ? p.filter((x) => x !== opt) : [...p, opt]);

  const handleSave = async () => {
    setSaving(true);
    await onSave(question.id, {
      text,
      type: question.type,
      options,
      correct_answer:
        type === "multipleresponse" ? correctAnswers
        : type === "truefalse"     ? correctAnswer
        : correctAnswer,
    });
    setSaving(false);
    onClose();
  };

  return createPortal(
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.6)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        width: "min(580px, 94vw)", maxHeight: "90vh", overflowY: "auto",
        background: "var(--ink2)", border: "1px solid var(--border2)",
        borderRadius: 10, boxShadow: "0 24px 60px rgba(0,0,0,.5)",
        display: "flex", flexDirection: "column",
      }}>

        {/* Header */}
        <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid var(--border2)", flexShrink: 0 }}>
          <h5 style={{ margin: 0, marginBottom: 4, color: "var(--ivory)", fontFamily: "var(--display)", fontWeight: 700 }}>
            Edit Question
          </h5>
          <p style={{ margin: 0, color: "var(--slate2)", fontSize: "var(--fs-small)", fontFamily: "var(--display)" }}>
            {typeLabel(question.type)}
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: "18px 20px", flex: 1 }}>

          {/* Question text */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Question Text <span style={{ color: "var(--gold)" }}>*</span></label>
            <textarea value={text} onChange={(e) => setText(e.target.value)}
              rows={3} placeholder="Enter question text…"
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
          </div>

          {/* Multiple Choice */}
          {type === "multiplechoice" && (
            <div>
              <label style={{ ...labelStyle, marginBottom: 10 }}>
                Options —{" "}
                <span style={{ color: "var(--slate2)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
                  click the radio to mark correct
                </span>
              </label>
              {options.map((opt, oi) => (
                <div key={oi} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div onClick={() => setCorrectAnswer(oi)} style={{
                    width: 16, height: 16, borderRadius: "50%", flexShrink: 0, cursor: "pointer",
                    border: `2px solid ${correctAnswer === oi ? "var(--gold)" : "var(--border2)"}`,
                    background: correctAnswer === oi ? "var(--gold)" : "transparent", transition: "all .15s",
                  }} />
                  <input value={opt} onChange={(e) => updateOption(oi, e.target.value)}
                    style={{ ...inputStyle, borderColor: correctAnswer === oi ? "var(--gold2)" : "var(--border2)" }}
                    placeholder={`Option ${oi + 1}`} />
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <input value={newOpt} onChange={(e) => setNewOpt(e.target.value)} style={inputStyle}
                  placeholder="New option…" onKeyDown={(e) => e.key === "Enter" && addOption()} />
                <button onClick={addOption} className="btn-p" style={{ flexShrink: 0, padding: "8px 16px" }}>Add</button>
              </div>
            </div>
          )}

          {/* Multiple Response */}
          {type === "multipleresponse" && (
            <div>
              <label style={{ ...labelStyle, marginBottom: 10 }}>
                Options —{" "}
                <span style={{ color: "var(--slate2)", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
                  check all correct answers
                </span>
              </label>
              {options.map((opt, oi) => (
                <div key={oi} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div onClick={() => toggleMulti(opt)} style={{
                    width: 14, height: 14, borderRadius: 3, flexShrink: 0, cursor: "pointer",
                    border: `1.5px solid ${correctAnswers.includes(opt) ? "var(--gold)" : "var(--border2)"}`,
                    background: correctAnswers.includes(opt) ? "var(--gold)" : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center", transition: "all .15s",
                  }}>
                    {correctAnswers.includes(opt) && <span style={{ color: "#0e0e12", fontSize: 9, fontWeight: 900 }}>✓</span>}
                  </div>
                  <input value={opt} onChange={(e) => updateOption(oi, e.target.value)}
                    style={inputStyle} placeholder={`Option ${oi + 1}`} />
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                <input value={newOpt} onChange={(e) => setNewOpt(e.target.value)} style={inputStyle}
                  placeholder="New option…" onKeyDown={(e) => e.key === "Enter" && addOption()} />
                <button onClick={addOption} className="btn-p" style={{ flexShrink: 0, padding: "8px 16px" }}>Add</button>
              </div>
            </div>
          )}

          {/* True / False */}
          {type === "truefalse" && (
            <div>
              <label style={{ ...labelStyle, marginBottom: 10 }}>Correct Answer</label>
              <div style={{ display: "flex", gap: 10 }}>
                {[{ val: true, label: "True", icon: "✓" }, { val: false, label: "False", icon: "✕" }].map(({ val, label, icon }) => (
                  <button key={String(val)} onClick={() => setCorrectAnswer(val)} style={{
                    flex: 1, padding: "13px 0", borderRadius: 6, cursor: "pointer",
                    border: `1px solid ${correctAnswer === val ? "var(--gold)" : "var(--border2)"}`,
                    background: correctAnswer === val ? "rgba(201,168,76,.15)" : "transparent",
                    color: correctAnswer === val ? "var(--gold)" : "var(--slate)",
                    fontFamily: "var(--display)", fontWeight: 700, fontSize: "var(--fs-body)",
                    transition: "all .15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: "50%",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900,
                      background: correctAnswer === val ? "var(--gold)" : "var(--border2)",
                      color: correctAnswer === val ? "#0e0e12" : "var(--slate2)",
                    }}>{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Fill in Blank */}
          {type === "fillintheblank" && (
            <div>
              <label style={{ ...labelStyle, marginBottom: 8 }}>Correct Answer</label>
              <input value={correctAnswer || ""} onChange={(e) => setCorrectAnswer(e.target.value)}
                style={inputStyle} placeholder="Expected answer text…" />
              <div style={{ color: "var(--slate2)", fontSize: "var(--fs-small)", fontFamily: "var(--display)", marginTop: 5 }}>
                Students must type this exactly to be marked correct
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "13px 20px 18px", borderTop: "1px solid var(--border2)",
          display: "flex", gap: 10, justifyContent: "flex-end", flexShrink: 0,
        }}>
          <button className="btn-o" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn-p" onClick={handleSave}
            disabled={saving || !text.trim()}
            style={{ opacity: saving || !text.trim() ? 0.5 : 1, cursor: saving || !text.trim() ? "not-allowed" : "pointer" }}
          >{saving ? "Saving…" : "Save Changes"}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SKELETON ROW
// ─────────────────────────────────────────────────────────────────────────────
function SkeletonRow() {
  const bar = (w) => (
    <div style={{ height: 12, borderRadius: 4, width: w, background: "rgba(255,255,255,.06)", animation: "pulse 1.4s ease infinite" }} />
  );
  return (
    <tr>
      {[220, 90, 50, 110, 60, 70].map((w, i) => <td key={i}>{bar(w)}</td>)}
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
export default function QuestionManagement() {
  const navigate = useNavigate();

  // ── Data ───────────────────────────────────────────────────────────────────
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  // ── UI ─────────────────────────────────────────────────────────────────────
  const [search, setSearch]               = useState("");
  const [filterType, setFilterType]       = useState("All");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editQuestion, setEditQuestion]   = useState(null);
  const [currentPage, setCurrentPage]     = useState(1);
  const [toast, setToast]                 = useState(null);
  const itemsPerPage = 5;

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllQuestions();
      setQuestions(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  // ── Toast ───────────────────────────────────────────────────────────────────
  const showToast = (title, message, ok = true) => {
    setToast({ title, message, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Filter + paginate ───────────────────────────────────────────────────────
  const TYPE_FILTER_MAP = {
    "Multiple Choice":   "multiplechoice",
    "Multiple Response": "multipleresponse",
    "True / False":      "truefalse",
    "Fill in Blank":     "fillintheblank",
  };

  const filtered = questions.filter((q) => {
    const text       = (q.text || q.question || "").toLowerCase();
    const matchSearch = !search || text.includes(search.toLowerCase());
    const matchType   = filterType === "All" || typeNorm(q.type) === TYPE_FILTER_MAP[filterType];
    return matchSearch && matchType;
  });

  useEffect(() => { setCurrentPage(1); }, [search, filterType]);

  const totalPages   = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handleDelete = async (qId) => {
    try {
      await deleteBankQuestion(qId);
      setQuestions((p) => p.filter((q) => q.id !== qId));
      showToast("Question Deleted", "The question has been removed from the bank.", true);
    } catch (e) {
      console.error(e);
      showToast("Delete Failed", "Could not delete the question. Please try again.", false);
    }
  };

  const handleSaveEdit = async (qId, payload) => {
    try {
      const updated = await updateBankQuestion(qId, payload);
      setQuestions((p) => p.map((q) => q.id === qId ? { ...q, ...updated } : q));
      showToast("Question Updated", "Changes have been saved to the question bank.", true);
    } catch (e) {
      console.error(e);
      showToast("Update Failed", "Could not save changes. Please try again.", false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <AdminLayout pageKey="questionBank">

      {/* Toast — identical to TestManagement */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 1000000,
          background: "var(--ink2)",
          border: `1px solid ${toast.ok ? "var(--gold)" : "rgba(192,112,112,.5)"}`,
          borderRadius: 8, padding: "12px 20px",
          boxShadow: "0 4px 12px rgba(0,0,0,.3)",
          animation: "slideIn .3s ease",
        }}>
          <div style={{ color: toast.ok ? "var(--gold)" : "#c07070", fontWeight: 600, marginBottom: 4 }}>
            {toast.title}
          </div>
          <div style={{ color: "var(--slate)", fontSize: "var(--fs-small)" }}>
            {toast.message}
          </div>
        </div>
      )}

      {/* Modals */}
      {deleteConfirm && (
        <DeleteConfirmModal
          question={deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={handleDelete}
        />
      )}
      {editQuestion && (
        <EditQuestionModal
          question={editQuestion}
          onClose={() => setEditQuestion(null)}
          onSave={handleSaveEdit}
        />
      )}

      {/* Header — identical to TestManagement */}
      <div className="fade-up" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <SectionLabel>◈ Question Bank</SectionLabel>
          <p style={{ color: "var(--slate)", fontSize: "var(--fs-secondary)" }}>
            Create, manage, and reuse questions across all assessments.
          </p>
        </div>
        <button className="btn-p" onClick={() => navigate("/questioncreation")}>+ Add Questions</button>
      </div>

      {/* Search + filter — identical to TestManagement */}
      <div  className="fade-up d2" style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ position: "relative", minWidth: 260 }}>
          <span style={{
            position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
            color: "var(--slate2)", pointerEvents: "none",
          }}>⌕</span>
          <input
            className="search-input"
            placeholder="Search questions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "8px 34px",
              fontSize: "var(--fs-body)", borderRadius: 6,
              border: "1px solid var(--border2)",
              background: "var(--ink2)", color: "var(--ivory)",
              outline: "none", transition: "all .2s ease",
            }}
          />
        </div>
        <CustomDropdown
          value={filterType}
          options={["All", "Multiple Choice", "Multiple Response", "True / False", "Fill in Blank"]}
          onChange={setFilterType}
        />
      </div>

      {/* Error banner — identical to TestManagement */}
      {error && (
        <div style={{
          padding: "12px 16px", marginBottom: 16, borderRadius: 6,
          background: "rgba(192,112,112,.08)", border: "1px solid rgba(192,112,112,.25)",
          color: "#c07070", fontSize: "var(--fs-small)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          {error}
          <button onClick={fetchQuestions}
            style={{ background: "none", border: "none", color: "#c07070", cursor: "pointer", fontWeight: 700 }}>
            Retry
          </button>
        </div>
      )}

      {/* Table — same card + tbl classes, same density */}
      <div className="card fade-up d3" style={{ padding: 0, overflow: "hidden", marginBottom: 24 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Question</th>
              <th>Type</th>
              <th>Details</th>
              <th>Correct Answer</th>
              <th>Used In Test</th>
              <th>Added</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : currentItems.length === 0 ? (
              <tr>
                <td colSpan={6} style={{
                  textAlign: "center", color: "var(--slate2)",
                  padding: "48px 0", fontFamily: "var(--display)",
                  fontSize: "var(--fs-small)", letterSpacing: ".1em",
                }}>
                  {questions.length === 0
                    ? "NO QUESTIONS YET — ADD YOUR FIRST QUESTION"
                    : "NO QUESTIONS MATCH YOUR FILTERS"}
                </td>
              </tr>
            ) : currentItems.map((q, i) => (
              <tr key={q.id ?? i}>

                {/* Question text */}
                <td style={{ color: "var(--ivory)", fontWeight: 500 }}>
                  <div style={{
                    overflow: "hidden", textOverflow: "ellipsis",
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    lineHeight: 1.5, maxWidth: 320,
                  }}>
                    {q.text || q.question || <span style={{ color: "var(--slate2)", fontStyle: "italic" }}>No text</span>}
                  </div>
                </td>

                {/* Type — uses same className pill pattern as difficulty/status */}
                <td>
                  <span className={typePill(q.type)}>
                    {typeLabel(q.type)}
                  </span>
                </td>

                {/* Option count */}
<td>
  <span style={{ color: "var(--slate)", fontSize: "var(--fs-small)" }}>
    {(() => {
      const t = typeNorm(q.type);

      if (t === "multiplechoice" || t === "multipleresponse") {
        return Array.isArray(q.options) ? `${q.options.length} options` : "—";
      }

      if (t === "truefalse") {
        return "True / False";
      }

      if (t === "fillintheblank") {
        return "Text Answer";
      }

      return "—";
    })()}
  </span>
</td>

                {/* Correct answer */}
                <td>
                  <span style={{ color: "var(--slate)", fontSize: "var(--fs-small)" }}>
                    {answerPreview(q)}
                  </span>
                </td>
<td>
  <span
    style={{
      fontSize: "var(--fs-small)",
      fontWeight: 600,
      padding: "3px 10px",
      borderRadius: 4,
      background: q.used_in_tests
        ? "rgba(110,231,183,.1)"
        : "rgba(133,148,174,.07)",
      border: `1px solid ${
        q.used_in_tests
          ? "rgba(110,231,183,.3)"
          : "rgba(133,148,174,.15)"
      }`,
      color: q.used_in_tests ? "#2aa071" : "var(--slate)",
    }}
  >
    {q.used_in_tests
      ? "Used"
      : "Not Used"}
  </span>
</td>
                {/* Date */}
                <td>
                  <span style={{ color: "var(--slate)", fontSize: "var(--fs-small)" }}>
                    {fmtDate(q.created_at)}
                  </span>
                </td>

                {/* Actions — identical to TestManagement */}
                <td>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="action-btn" onClick={() => setEditQuestion(q)} title="Edit">
                      <Pencil size={16} />
                    </button>
                    <button
                      className="action-btn danger"
                      onClick={() => setDeleteConfirm(q)}
                      title="Delete"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#E07A7A";
                        e.currentTarget.style.background = "rgba(224,122,122,.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "";
                        e.currentTarget.style.background = "";
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination — identical to TestManagement */}
      {!loading && filtered.length > itemsPerPage && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button className="btn-ghost"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ padding: "6px 12px", opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
            >←</button>
            <span style={{ fontSize: "var(--fs-small)", fontFamily: "var(--display)", color: "var(--slate2)", padding: "0 8px" }}>
              Page {currentPage} of {totalPages}
            </span>
            <button className="btn-ghost"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{ padding: "6px 12px", opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
            >→</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes pulse   { 0%,100% { opacity: .4; } 50% { opacity: .8; } }

        /* Type pills — add to your global CSS next to pill-active, pill-draft, pill-easy etc. */
        .pill-mc   { display:inline-flex;align-items:center;padding:3px 10px;border-radius:4px;font-size:var(--fs-small);font-family:var(--display);font-weight:700;letter-spacing:.06em;background:rgba(126,184,247,.1);border:1px solid rgba(126,184,247,.25);color:#7eb8f7; }
        .pill-mr   { display:inline-flex;align-items:center;padding:3px 10px;border-radius:4px;font-size:var(--fs-small);font-family:var(--display);font-weight:700;letter-spacing:.06em;background:rgba(167,139,250,.1);border:1px solid rgba(167,139,250,.25);color:#a78bfa; }
        .pill-tf   { display:inline-flex;align-items:center;padding:3px 10px;border-radius:4px;font-size:var(--fs-small);font-family:var(--display);font-weight:700;letter-spacing:.06em;background:rgba(110,231,183,.1);border:1px solid rgba(110,231,183,.25);color:#6ee7b7; }
        .pill-fitb { display:inline-flex;align-items:center;padding:3px 10px;border-radius:4px;font-size:var(--fs-small);font-family:var(--display);font-weight:700;letter-spacing:.06em;background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.25);color:#fbbf24; }
      `}</style>

    </AdminLayout>
  );
}