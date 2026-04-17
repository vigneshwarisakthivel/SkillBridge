import React, { useState, useEffect, useCallback } from "react";
import AdminLayout, { SectionLabel } from "./AdminLayout";
import { createPortal } from "react-dom";
import { getAssignments, sendReminder,sendSelectionMail } from "../services/apiServices";

// ── helpers ──────────────────────────────────────────────────────────────────
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000000, backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--ink2)", borderRadius: 12, width: "90%", maxWidth: 500,
          boxShadow: "0 20px 40px rgba(0,0,0,.5)", border: "1px solid var(--border2)",
        }}
      >
        <div style={{
          padding: "20px 24px", borderBottom: "1px solid var(--border2)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <h3 style={{ color: "var(--ivory)", margin: 0, fontSize: "var(--fs-h3)" }}>{title}</h3>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--slate2)", fontSize: 24, cursor: "pointer", padding: "0 8px" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ivory)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--slate2)")}
          >×</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>,
    document.body
  );
}

function ViewResultModal({ candidate, onClose }) {
  const scoreColor = candidate.score >= 90 ? "#4caf50" : candidate.score >= 70 ? "#ff9800" : "#f44336";
  return (
    <Modal isOpen onClose={onClose} title={`Test Results: ${candidate.candidate_name}`}>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
          <div style={{
            width: 100, height: 100, borderRadius: "50%",
            background: `linear-gradient(135deg, ${scoreColor}, var(--gold))`,
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 15px rgba(0,0,0,.3)",
          }}>
            <span style={{ fontSize: 28, fontWeight: "bold", color: "white" }}>{candidate.score}%</span>
          </div>
        </div>
        <div style={{ background: "var(--ink3)", borderRadius: 8, padding: 16 }}>
          {[
            ["Candidate Name", candidate.candidate_name],
            ["Email",          candidate.candidate_email],
            ["Test Name",      candidate.assigned_test],
            ["Assigned Date",  candidate.assigned_date],
            ["Score",          `${candidate.score}%`],
          ].map(([label, val], i, arr) => (
            <div key={label} style={{
              display: "flex", justifyContent: "space-between",
              borderBottom: i < arr.length - 1 ? "1px solid var(--border2)" : "none",
              paddingBottom: i < arr.length - 1 ? 8 : 0, marginBottom: i < arr.length - 1 ? 8 : 0,
            }}>
              <span style={{ color: "var(--slate2)", fontWeight: 500 }}>{label}:</span>
              <span style={{
                color: label === "Score" ? scoreColor : "var(--ivory)",
                fontWeight: label === "Score" ? "bold" : 600,
                fontSize: label === "Score" ? 18 : "inherit",
              }}>{val}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

function SendReminderModal({ candidate, onClose, onSend }) {
  const [message, setMessage] = useState(
    `Dear ${candidate.candidate_name},\n\nThis is a reminder to complete your assigned test: ${candidate.assigned_test}. The test was assigned on ${candidate.assigned_date}.\n\nPlease complete it at your earliest convenience.\n\nBest regards,\nAdmin Team`
  );
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    await onSend(candidate.id, message);
    setSending(false);
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} title={`Send Reminder to ${candidate.candidate_name}`}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={{ color: "var(--slate2)", fontSize: "var(--fs-small)", display: "block", marginBottom: 8 }}>To:</label>
          <div style={{ background: "var(--ink3)", padding: "10px 12px", borderRadius: 6, color: "var(--ivory)" }}>
            {candidate.candidate_name} &lt;{candidate.candidate_email}&gt;
          </div>
        </div>
        <div>
          <label style={{ color: "var(--slate2)", fontSize: "var(--fs-small)", display: "block", marginBottom: 8 }}>Subject:</label>
          <div style={{ background: "var(--ink3)", padding: "10px 12px", borderRadius: 6, color: "var(--ivory)" }}>
            Reminder: Complete Your Test — {candidate.assigned_test}
          </div>
        </div>
        <div>
          <label style={{ color: "var(--slate2)", fontSize: "var(--fs-small)", display: "block", marginBottom: 8 }}>Message:</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={8}
            style={{
              width: "100%", padding: "10px 12px", fontSize: "var(--fs-body)",
              borderRadius: 6, border: "1px solid var(--border2)",
              background: "var(--ink3)", color: "var(--ivory)",
              outline: "none", resize: "vertical", fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 10 }}>
          <button className="btn-o" onClick={onClose} disabled={sending}>Cancel</button>
          <button className="btn-p" onClick={handleSend} disabled={sending} style={{ padding: "8px 20px" }}>
            {sending ? "Sending…" : "Send Reminder"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function CustomDropdown({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef();
  
  useEffect(() => {
    const h = (e) => { 
      if (ref.current && !ref.current.contains(e.target)) setOpen(false); 
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  
  return (
    <div 
      ref={ref} 
      style={{ position: "relative", minWidth: 160, width: "auto" }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
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

function SendSelectionModal({ candidate, onClose, onSend }) {
  const [message, setMessage] = useState(
    `Our team will be in touch with you shortly regarding the next round. Please keep an eye on your inbox for further instructions.`
  );
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    await onSend(candidate.id, message);
    setSending(false);
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} title={`Send Selection Email — ${candidate.candidate_name}`}>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Score badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "14px 16px", borderRadius: 8,
          background: "rgba(107,224,146,.06)",
          border: "1px solid rgba(107,224,146,.2)",
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg,#4caf50,#81c784)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 15, color: "#fff",
          }}>{candidate.score}%</div>
          <div>
            <div style={{ color: "#6BE092", fontFamily: "var(--display)", fontWeight: 700, fontSize: 12, letterSpacing: ".06em" }}>
              SELECTED FOR NEXT ROUND
            </div>
            <div style={{ color: "var(--slate2)", fontSize: "var(--fs-small)", marginTop: 3 }}>
              {candidate.candidate_name} · {candidate.candidate_email}
            </div>
          </div>
        </div>

        {/* To */}
        <div>
          <label style={{ color: "var(--slate2)", fontSize: "var(--fs-small)", display: "block", marginBottom: 6 }}>To:</label>
          <div style={{ background: "var(--ink3)", padding: "10px 12px", borderRadius: 6, color: "var(--ivory)", fontSize: "var(--fs-small)" }}>
            {candidate.candidate_name} &lt;{candidate.candidate_email}&gt;
          </div>
        </div>

        {/* Subject */}
        <div>
          <label style={{ color: "var(--slate2)", fontSize: "var(--fs-small)", display: "block", marginBottom: 6 }}>Subject:</label>
          <div style={{ background: "var(--ink3)", padding: "10px 12px", borderRadius: 6, color: "var(--ivory)", fontSize: "var(--fs-small)" }}>
            Congratulations! You've Been Selected — {candidate.assigned_test}
          </div>
        </div>

        {/* Custom message */}
        <div>
          <label style={{ color: "var(--slate2)", fontSize: "var(--fs-small)", display: "block", marginBottom: 6 }}>
            Next Steps Message:
            <span style={{ color: "var(--slate2)", fontWeight: 400, marginLeft: 6 }}>(what should the candidate do next?)</span>
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            style={{
              width: "100%", padding: "10px 12px", fontSize: "var(--fs-body)",
              borderRadius: 6, border: "1px solid var(--border2)",
              background: "var(--ink3)", color: "var(--ivory)",
              outline: "none", resize: "vertical", fontFamily: "inherit",
              boxSizing: "border-box",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 4 }}>
          <button className="btn-o" onClick={onClose} disabled={sending}>Cancel</button>
          <button
            onClick={handleSend}
            disabled={sending}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "8px 20px", borderRadius: 4, cursor: sending ? "not-allowed" : "pointer",
              background: sending ? "rgba(107,224,146,.3)" : "rgba(107,224,146,.15)",
              border: "1px solid rgba(107,224,146,.35)",
              color: "#6BE092", fontFamily: "var(--display)",
              fontWeight: 700, fontSize: 11, letterSpacing: ".08em",
              transition: "all .15s",
            }}
            onMouseEnter={(e) => { if (!sending) e.currentTarget.style.background = "rgba(107,224,146,.25)"; }}
            onMouseLeave={(e) => { if (!sending) e.currentTarget.style.background = "rgba(107,224,146,.15)"; }}
          >
            {sending ? "Sending…" : "✉ SEND SELECTION EMAIL"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function SkeletonRow() {
  const bar = (w) => (
    <div style={{ height: 12, borderRadius: 4, width: w, background: "rgba(255,255,255,.06)", animation: "pulse 1.4s ease infinite" }} />
  );
  return (
    <tr>{[140, 160, 140, 90, 80, 50, 100].map((w, i) => <td key={i}>{bar(w)}</td>)}</tr>
  );
}

// ── main ─────────────────────────────────────────────────────────────────────
export default function UserManagement() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [search, setSearch]           = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [modalType, setModalType]     = useState(null);
  const [selected, setSelected]       = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast]             = useState(null);
  const itemsPerPage = 5;

  const showToast = (message, ok = true) => {
    setToast({ message, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAssignments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
const data = await getAssignments();
setAssignments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAssignments(); }, [fetchAssignments]);
const filtered = Array.isArray(assignments)
  ? assignments.filter((a) => {
      const q = search.toLowerCase();

      const matchSearch =
        !q ||
        a.candidate_name?.toLowerCase().includes(q) ||
        a.candidate_email?.toLowerCase().includes(q);

      const matchStatus =
        filterStatus === "All" ||
        (filterStatus === "Completed" && a.test_status === "Completed") ||
        (filterStatus === "Not Completed" && a.test_status === "Not Completed");

      return matchSearch && matchStatus;
    })
  : [];

  useEffect(() => { setCurrentPage(1); }, [search, filterStatus]);
  useEffect(() => {
    const total = Math.ceil(filtered.length / itemsPerPage);
    if (currentPage > total) setCurrentPage(total || 1);
  }, [filtered, currentPage]);

  const totalPages   = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSendReminderAction = async (assignmentId, message) => {
    try {
      await sendReminder(assignmentId, message);
      showToast("Reminder sent successfully.", true);
    } catch (e) {
      console.error(e);
      showToast("Failed to send reminder.", false);
    }
  };
const handleSendSelectionAction = async (assignmentId, message) => {
  try {
    await sendSelectionMail(assignmentId, message);
    // Update local state so SELECT button disappears instantly
    setAssignments(prev =>
      prev.map(a => a.id === assignmentId ? { ...a, selection_sent: true } : a)
    );
    showToast("Selection email sent successfully.", true);
  } catch (e) {
    console.error(e);
    showToast("Failed to send selection email.", false);
  }
};
  const closeModal = () => { setModalType(null); setSelected(null); };

  return (
    <AdminLayout pageKey="users">

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 1000000,
          background: "var(--ink2)",
          border: `1px solid ${toast.ok ? "var(--gold)" : "rgba(192,112,112,.5)"}`,
          borderRadius: 8, padding: "12px 20px", boxShadow: "0 4px 12px rgba(0,0,0,.3)",
        }}>
          <span style={{ color: toast.ok ? "var(--gold)" : "#c07070", fontWeight: 600 }}>
            {toast.message}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="fade-up" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10 }}>
        <div>
          <SectionLabel>◉ Candidate Management</SectionLabel>
          <p style={{ color: "var(--slate)", fontSize: "var(--fs-secondary)", marginTop: 6 }}>
            View candidate test progress and results.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="fade-up d2" style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", minWidth: 260 }}>
          <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--slate2)", pointerEvents: "none" }}>⌕</span>
          <input
            className="search-input"
            placeholder="Search candidates…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "8px 34px",
              fontSize: "var(--fs-body)", borderRadius: 6,
              border: "1px solid var(--border2)",
              background: "var(--ink2)", color: "var(--ivory)", outline: "none",
            }}
          />
        </div>
        <CustomDropdown value={filterStatus} options={["All", "Completed", "Not Completed"]} onChange={setFilterStatus} />
        <div style={{ marginLeft: "auto", color: "var(--slate2)", fontSize: "var(--fs-small)", fontWeight: 600, padding: "0 12px" }}>
          {filtered.length} of {assignments.length}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: "12px 16px", marginBottom: 16, borderRadius: 6,
          background: "rgba(192,112,112,.08)", border: "1px solid rgba(192,112,112,.25)",
          color: "#c07070", fontSize: "var(--fs-small)",
          display: "flex", justifyContent: "space-between",
        }}>
          {error}
          <button onClick={fetchAssignments} style={{ background: "none", border: "none", color: "#c07070", cursor: "pointer", fontWeight: 700 }}>Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="fade-up d3">
        <table className="tbl" style={{ tableLayout: "fixed", width: "100%" }}>
          <thead>
            <tr>
              <th>Candidate Name</th>
              <th>Email</th>
              <th>Assigned Test</th>
              <th>Assigned Date</th>
              <th>Test Status</th>
              <th>Score</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : currentItems.length === 0 ? (
              <tr>
                <td colSpan={7} style={{
                  textAlign: "center", color: "var(--slate2)", padding: "48px 0",
                  fontFamily: "var(--display)", fontSize: "var(--fs-small)", letterSpacing: ".1em",
                }}>
                  {assignments.length === 0 ? "NO CANDIDATES ASSIGNED YET" : "NO CANDIDATES MATCH YOUR FILTERS"}
                </td>
              </tr>
            ) : currentItems.map((a) => (
              <tr key={a.id}>
                <td style={{ width: "18%" }}>
                  <div style={{ color: "var(--slate2)", fontWeight: 500, fontSize: "var(--fs-body)" }}>
                    {a.candidate_name}
                  </div>
                </td>
                <td style={{ width: "20%" }}>
                  <div style={{ color: "var(--slate)", fontSize: "var(--fs-small)" }}>{a.candidate_email}</div>
                </td>
                <td style={{ width: "18%" }}>
                  <span style={{ color: "var(--slate)", fontSize: "var(--fs-small)" }}>{a.assigned_test}</span>
                </td>
                <td style={{ width: "12%" }}>
                  <span style={{ color: "var(--slate)", fontSize: "var(--fs-small)" }}>{a.assigned_date}</span>
                </td>
                <td style={{ width: "12%" }}>
                  <span className={a.test_status === "Completed" ? "pill-active" : "pill-draft"}>
                    {a.test_status}
                  </span>
                </td>
                <td style={{ width: "8%" }}>
                  {a.score != null
                    ? <span className="sp">{a.score}%</span>
                    : <span style={{ color: "var(--slate)", fontSize: "var(--fs-micro)" }}>—</span>
                  }
                </td>
<td style={{ width: "12%" }}>
  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>

    {/* NOT COMPLETED */}
    {a.test_status === "Not Completed" && (
      <button
        className="btn-o"
        style={{ padding: "5px 12px", fontSize: "var(--fs-small)" }}
        onClick={() => { setSelected(a); setModalType("reminder"); }}
      >
        Send Reminder
      </button>
    )}

    {/* COMPLETED + FAILED */}
    {a.test_status === "Completed" && a.score < 75 && (
      <button
        className="btn-p"
        style={{ padding: "5px 12px", fontSize: "var(--fs-small)" }}
        onClick={() => { setSelected(a); setModalType("result"); }}
      >
        View Result
      </button>
    )}

    {/* COMPLETED + PASSED + NOT SENT */}
    {a.test_status === "Completed" && a.score >= 75 && !a.selection_sent && (
      <button
        onClick={() => { setSelected(a); setModalType("selection"); }}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          padding: "5px 12px",
          borderRadius: 4,
          cursor: "pointer",
          background: "rgba(107,224,146,.08)",
          border: "1px solid rgba(107,224,146,.2)",
          color: "#6BE092",
          fontFamily: "var(--display)",
          fontWeight: 700,
          fontSize: 10,
          letterSpacing: ".06em",
        }}
      >
        SEND SELECT MAIL
      </button>
    )}

    {/* COMPLETED + PASSED + SENT */}
    {a.test_status === "Completed" && a.score >= 75 && a.selection_sent && (
      <button
        className="btn-p"
        style={{ padding: "5px 12px", fontSize: "var(--fs-small)" }}
        onClick={() => { setSelected(a); setModalType("result"); }}
      >
        View Result
      </button>
    )}

  </div>
</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && filtered.length > itemsPerPage && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button className="btn-ghost" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ padding: "6px 12px", opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? "not-allowed" : "pointer" }}>←</button>
            <span style={{ fontSize: "var(--fs-small)", fontFamily: "var(--display)", color: "var(--slate2)", padding: "0 8px" }}>
              Page {currentPage} of {totalPages}
            </span>
            <button className="btn-ghost" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{ padding: "6px 12px", opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}>→</button>
          </div>
        </div>
      )}

      {/* Modals */}
{modalType === "result"     && selected && <ViewResultModal     candidate={selected} onClose={closeModal} />}
{modalType === "reminder"   && selected && <SendReminderModal   candidate={selected} onClose={closeModal} onSend={handleSendReminderAction} />}
{modalType === "selection"  && selected && <SendSelectionModal  candidate={selected} onClose={closeModal} onSend={handleSendSelectionAction} />}

      <style>{`@keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:.8} }`}</style>
    </AdminLayout>
  );
}