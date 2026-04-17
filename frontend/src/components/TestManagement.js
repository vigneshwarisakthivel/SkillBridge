import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout, { SectionLabel } from "./AdminLayout";
import { createPortal } from "react-dom";
import { Link2, Pencil, Trash2 } from "lucide-react";
import { getTests, deleteTest, setTestStatus ,getTestLink} from "../services/apiServices";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Map backend status values to display labels and pill classes. */
const STATUS_MAP = {
  published: { label: "Active",   pill: "pill-active"   },
  draft:     { label: "Draft",    pill: "pill-draft"     },
  closed:    { label: "Archived", pill: "pill-archived"  },
};
const DIFFICULTY_MAP = {
  easy:   { label: "Easy",   pill: "pill-easy" },
  medium: { label: "Medium", pill: "pill-medium" },
  hard:   { label: "Hard",   pill: "pill-hard" },
};

const difficultyClass = (d) => DIFFICULTY_MAP[d]?.pill ?? "pill-easy";
const difficultyLabel = (d) => DIFFICULTY_MAP[d]?.label ?? d;
/** Cycle: published → closed → draft → published */
const NEXT_STATUS = {
  published: "closed",
  closed:    "draft",
  draft:     "published",
};

const pillClass = (status) => STATUS_MAP[status]?.pill ?? "pill-draft";
const pillLabel = (status) => STATUS_MAP[status]?.label ?? status;

/** Format ISO date string → "Jan 12" */
const fmtDate = (iso) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM DROPDOWN
// ─────────────────────────────────────────────────────────────────────────────
function CustomDropdown({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  // Close on outside click
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
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen((o) => !o);
        }}
        className="filter-btn"
        style={{ width: "100%", justifyContent: "space-between" , fontSize: "12px",}}
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
// DELETE MODAL
// ─────────────────────────────────────────────────────────────────────────────
function DeleteConfirmModal({ test, onClose, onConfirm }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    await onConfirm(test.id);   // parent handles API call + error
    setIsDeleting(false);
    onClose();
  };

  if (!test) return null;
  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 400, background: "var(--ink2)", borderRadius: 10,
          border: "1px solid var(--border2)", padding: 20,
        }}
      >
        <h5 style={{ margin: 0, marginBottom: 10, color: "var(--ivory)" }}>Delete Test</h5>
        <p style={{ color: "var(--slate2)", fontSize: "var(--fs-small)", marginBottom: 16 }}>
          Are you sure you want to delete{" "}
          <span style={{ color: "var(--ivory)", fontWeight: 500 }}>"{test.title}"</span>?
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
// SKELETON ROW (loading state)
// ─────────────────────────────────────────────────────────────────────────────
function SkeletonRow() {
  const bar = (w) => (
    <div style={{
      height: 12, borderRadius: 4, width: w,
      background: "rgba(255,255,255,.06)", animation: "pulse 1.4s ease infinite",
    }} />
  );
  return (
    <tr>
      {[140, 70, 40, 50, 40, 50, 50, 60, 70].map((w, i) => (
        <td key={i}>{bar(w)}</td>
      ))}
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
export default function TestManagement() {
  const navigate = useNavigate();

  // ── Data state ──────────────────────────────────────────────────────────────
  const [tests, setTests]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [copyingId, setCopyingId] = useState(null);
  // ── UI state ────────────────────────────────────────────────────────────────
  const [search, setSearch]               = useState("");
  const [filterStatus, setFilterStatus]   = useState("All");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [currentPage, setCurrentPage]     = useState(1);
  const [toast, setToast]                 = useState(null);   // { title, message, ok }
  const itemsPerPage = 5;

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchTests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
const data = await getTests();
setTests(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);

    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTests(); }, [fetchTests]);
const handleCopyLink = async (testId) => {
  setCopyingId(testId);
  try {
    const link = await getTestLink(testId);
    await navigator.clipboard.writeText(link);
    // Show toast
    showToast("Link Copied", "Test link copied to clipboard.", true);
  } catch (e) {
    showToast("Error", "Could not copy link.", false);
  } finally {
    setCopyingId(null);
  }
};
  // ── Toast helper ────────────────────────────────────────────────────────────
  const showToast = (title, message, ok = true) => {
    setToast({ title, message, ok });
    setTimeout(() => setToast(null), 3500);
  };

// ── Filter + paginate (client-side on fetched data) ─────────────────────────
const filtered = Array.isArray(tests)
  ? tests.filter((t) => {
      const q = search.toLowerCase();

      const matchSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.subject?.toLowerCase().includes(q);

      const statusMap = {
        Active: "published",
        Draft: "draft",
        Archived: "closed",
      };

      const matchStatus =
        filterStatus === "All" ||
        t.status === statusMap[filterStatus];

      return matchSearch && matchStatus;
    })
  : [];

  useEffect(() => { setCurrentPage(1); }, [search, filterStatus]);

  const totalPages  = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // ── Actions ─────────────────────────────────────────────────────────────────
const handleEdit = (test) => {
  navigate(`/edit-test/${test.id}`);
};

  const handleDelete = async (testId) => {
    const target = tests.find((t) => t.id === testId);
    try {
      await deleteTest(testId);
      setTests((prev) => prev.filter((t) => t.id !== testId));
      showToast("Test Deleted", `"${target?.title}" has been successfully deleted.`, true);
    } catch (e) {
      console.error(e);
      showToast("Delete Failed", "Could not delete the test. Please try again.", false);
    }
  };

  const toggleStatus = async (test) => {
    const next = NEXT_STATUS[test.status] ?? "draft";
    // Optimistic update
    setTests((prev) => prev.map((t) => t.id === test.id ? { ...t, status: next } : t));
    try {
      await setTestStatus(test.id, next);
    } catch (e) {
      console.error(e);
      // Revert on failure
      setTests((prev) => prev.map((t) => t.id === test.id ? { ...t, status: test.status } : t));
      showToast("Update Failed", "Could not change test status.", false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <AdminLayout pageKey="tests">

      {/* Toast */}
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

      {/* Delete modal */}
      {deleteConfirm && (
        <DeleteConfirmModal
          test={deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={handleDelete}
        />
      )}

      {/* Header */}
      <div className="fade-up" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <SectionLabel>◈ Test Management</SectionLabel>
          <p style={{ color: "var(--slate)", fontSize: "var(--fs-secondary)" }}>
            Create, configure, and publish skill-based assessments.
          </p>
        </div>
        <button className="btn-p" onClick={() => navigate("/testcreation")}>+ Create Test</button>
      </div>

      {/* Search + filter */}
      <div  className="fade-up d2" style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 18, flexWrap: "wrap" }}>
        <div style={{ position: "relative", minWidth: 260 }}>
          <span style={{
            position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
            color: "var(--slate2)", pointerEvents: "none",
          }}>⌕</span>
          <input
            className="search-input"
            placeholder="Search tests…"
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
          value={filterStatus}
          options={["All", "Active", "Draft", "Archived"]}
          onChange={setFilterStatus}
        />

      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          padding: "12px 16px", marginBottom: 16, borderRadius: 6,
          background: "rgba(192,112,112,.08)", border: "1px solid rgba(192,112,112,.25)",
          color: "#c07070", fontSize: "var(--fs-small)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          {error}
          <button
            onClick={fetchTests}
            style={{ background: "none", border: "none", color: "#c07070", cursor: "pointer", fontWeight: 700 }}
          >Retry</button>
        </div>
      )}

      {/* Table */}
      <div className="card fade-up d3" style={{ padding: 0, overflow: "hidden", marginBottom: 24 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Test Name</th>
              <th>Subject</th>
              <th>Questions</th>
              <th>Duration</th>
              <th>Pass Mark</th>
<th>Difficulty</th>
              <th>Created</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : currentItems.length === 0 ? (
              <tr>
                <td colSpan={9} style={{
                  textAlign: "center", color: "var(--slate2)",
                  padding: "48px 0", fontFamily: "var(--display)",
                  fontSize: "var(--fs-small)", letterSpacing: ".1em",
                }}>
                  {tests.length === 0 ? "NO TESTS YET — CREATE YOUR FIRST TEST" : "NO TESTS MATCH YOUR FILTERS"}
                </td>
              </tr>
            ) : currentItems.map((t) => (
              <tr key={t.id}>
                <td style={{ color: "var(--ivory)", fontWeight: 500 }}>{t.title}</td>
                <td><span style={{ color: "var(--slate)", fontSize: "var(--fs-small)" }}>{t.subject}</span></td>
                <td><span style={{ color: "var(--slate)", fontSize: "var(--fs-small)" }}>{t.question_count ?? "—"}</span></td>
                <td><span style={{ color: "var(--slate)", fontSize: "var(--fs-small)" }}>
                  {t.duration ??  "—"}
                </span></td>
                <td><span style={{ color: "var(--slate)", fontSize: "var(--fs-small)" }}>
                  {t.pass_criteria ? `${t.pass_criteria}%` : "—"}
                </span></td>
<td>
  <span className={difficultyClass(t.difficulty)}>
    {difficultyLabel(t.difficulty)}
  </span>
</td>
                <td><span style={{ color: "var(--slate)", fontSize: "var(--fs-small)" }}>{fmtDate(t.created_at)}</span></td>
                <td>
                  <span
                    className={pillClass(t.status)}
                    style={{ cursor: "pointer" }}
                    onClick={() => toggleStatus(t)}
                    title="Click to cycle status"
                  >
                    {pillLabel(t.status)}
                  </span>
                </td>


<td>
  <div style={{ display: "flex", gap: 8 }}>
    <button
      className="action-btn"
      onClick={() => handleCopyLink(t.id)}
      title="Copy Test Link"
    >
      {copyingId === t.id ? "✓" : <Link2 size={16} />}
    </button>

    <button
      className="action-btn"
      onClick={() => handleEdit(t)}
      title="Edit"
    >
      <Pencil size={16} />
    </button>
<button
  className="action-btn danger"
  onClick={() => setDeleteConfirm(t)}
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

      {/* Pagination */}
      {!loading && filtered.length > itemsPerPage && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button
              className="btn-ghost"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ padding: "6px 12px", opacity: currentPage === 1 ? 0.4 : 1, cursor: currentPage === 1 ? "not-allowed" : "pointer" }}
            >←</button>
            <span style={{ fontSize: "var(--fs-small)", fontFamily: "var(--display)", color: "var(--slate2)", padding: "0 8px" }}>
              Page {currentPage} of {totalPages}
            </span>
            <button
              className="btn-ghost"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{ padding: "6px 12px", opacity: currentPage === totalPages ? 0.4 : 1, cursor: currentPage === totalPages ? "not-allowed" : "pointer" }}
            >→</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes pulse { 0%,100% { opacity: .4; } 50% { opacity: .8; } }
      `}</style>
    </AdminLayout>
  );
}