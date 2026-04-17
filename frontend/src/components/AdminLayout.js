import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bell,Trash2 } from "lucide-react";
import logo from "../assets/skill.png"; // adjust path if needed
import { getNotifications, deleteNotification, markNotificationRead, markAllNotificationsRead,uploadProfile,logoutUser,getProfile } from "../services/apiServices";
// ─────────────────────────────────────────────────────────────────────────────
// SHARED CSS (injected once — all admin pages import this layout)
// ─────────────────────────────────────────────────────────────────────────────
export const ADMIN_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --ink:#0B0D11; --ink2:#0F1219; --ink3:#141820; --ink4:#1B2030;
  --gold:#C4A15E; --gold2:#E8D5B0; --gold3:#8B6830;
  --ivory:#F0E8D8; --slate:#8594AE; --slate2:#D1D5DB;
  --border:rgba(196,161,94,.14); --border2:rgba(196,161,94,.07);
  --glass:rgba(48, 19, 19, 0.02);

  --serif:'DM Serif Display',serif; 
  --display:'Syne',sans-serif; 
  --body:'DM Sans',sans-serif;

  /* STANDARD TYPOGRAPHY */
  --fs-title:28px;
  --fs-section:20px;
  --fs-card:18px;
  --fs-body:14px;
  --fs-secondary:13px;
  --fs-small:12px;
  --fs-micro:11px;
}
body{
  font-family:var(--body);
  background:var(--ink);
  color:var(--ivory);
  -webkit-font-smoothing:antialiased;
  font-size:var(--fs-body);
  line-height:1.6;
}
  /* Scrollbar */
  #adm-scroll::-webkit-scrollbar{width:4px;}
  #adm-scroll::-webkit-scrollbar-track{background:var(--ink2);}
  #adm-scroll::-webkit-scrollbar-thumb{background:var(--gold3);border-radius:2px;}

  /* Cards */
  .card{background:var(--glass);border:1px solid var(--border2);border-radius:8px;transition:transform .28s cubic-bezier(.22,1,.36,1),box-shadow .28s ease,border-color .28s ease;}
  .card:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(0,0,0,.32),0 0 0 1px rgba(196,161,94,.12);border-color:var(--border);}
  .card-static{background:var(--glass);border:1px solid var(--border2);border-radius:8px;}
.action-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: 1px solid var(--border2);
  background: var(--ink2);
  color: var(--slate2);
  cursor: pointer;
  transition: all 0.15s ease;
}

.action-btn:hover {
  background: rgba(196,161,94,.08);
  color: var(--ivory);
}

.action-btn.danger {
  border: 1px solid rgba(192,112,112,.3);
  color: #c07070;
}

.action-btn.danger:hover {
  background: rgba(192,112,112,.12);
  color: #ff8a80;
}
  /* Buttons */
  .btn-p{display:inline-flex;align-items:center;gap:8px;padding:6px 15px;border-radius:4px;border:none;cursor:pointer;background:var(--gold);color:var(--ink);font-family:var(--display);font-size:var(--fs-xs);font-weight:700;letter-spacing:.05em;transition:transform .2s,box-shadow .2s,background .2s;position:relative;overflow:hidden;}
  .btn-p::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.13),transparent);pointer-events:none;}
  .btn-p:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(196,161,94,.28);background:var(--gold2);}
  .btn-o{display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:4px;cursor:pointer;background:transparent;border:1px solid rgba(196,161,94,.22);color:var(--gold2);font-family:var(--display);font-size:var(--fs-xs);font-weight:600;letter-spacing:.04em;transition:border-color .2s,background .2s,color .2s;}
  .btn-o:hover{border-color:var(--gold);background:rgba(196,161,94,.06);color:var(--ivory);}
  .btn-ghost{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:4px;cursor:pointer;background:transparent;border:1px solid var(--border2);color:var(--slate);font-family:var(--display);font-size:var(--fs-xs);font-weight:600;letter-spacing:.04em;transition:border-color .2s,background .2s,color .2s;}
  .btn-ghost:hover{border-color:rgba(196,161,94,.22);color:var(--ivory);}
  .btn-danger{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border-radius:4px;cursor:pointer;background:transparent;border:1px solid rgba(224,122,122,.22);color:#E07A7A;font-family:var(--display);font-size:var(--fs-xs);font-weight:600;transition:border-color .2s,background .2s;}
  .btn-danger:hover{border-color:rgba(224,122,122,.5);background:rgba(224,122,122,.06);}

  /* Sidebar nav */
  .nav-item{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:5px;cursor:pointer;border:none;background:none;width:100%;text-align:left;font-family:var(--display);font-size:var(--fs-xs);font-weight:700;letter-spacing:.07em;color:var(--slate);text-transform:uppercase;transition:background .2s,color .2s;}
  .nav-item:hover{background:rgba(196,161,94,.05);color:var(--ivory);}
  .nav-item.active{background:rgba(196,161,94,.09);color:var(--gold);border:1px solid rgba(196,161,94,.14);}
  .nav-icon{font-size:13px;width:18px;text-align:center;flex-shrink:0;}

/* Table */
.tbl{width:100%;border-collapse:collapse;}
.tbl th{text-align:left;padding:13px 16px;font-size:10px;letter-spacing:1.5px;color:var(--slate2);border-bottom:1px solid var(--border2);text-transform:uppercase;font-family:var(--display);font-weight:700;}
.tbl td{padding:13px 16px;border-bottom:1px solid var(--border2);font-size:var(--fs-sm);vertical-align:middle;}
.tbl tr:last-child td{border-bottom:none;}
.tbl tbody tr{transition:background .18s;}
.tbl tbody tr:hover{background:rgba(196,161,94,.025);}

/* Table cell truncation */
.tbl td {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  position: relative;
}

.tbl td div,
.tbl td span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Custom tooltip animation */
@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translateY(5px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
  
  /* Pills */
  .pill-active{display:inline-flex;align-items:center;gap:4px;padding:2px 10px;border-radius:2px;background:rgba(107,224,146,.08);border:1px solid rgba(107,224,146,.2);color:#6BE092;font-size:10px;font-weight:700;letter-spacing:.08em;font-family:var(--display);}
.pill-draft {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border-radius: 2px;

  /* DULL / MUTED YELLOW */
  background: rgba(196, 161, 94, 0.08);
  border: 1px solid rgba(196, 161, 94, 0.25);
  color: #C4A15E;

  font-size: 10px;
  font-weight: 700;
  letter-spacing: .08em;
  font-family: var(--display);
}.pill-inactive{display:inline-flex;align-items:center;gap:4px;padding:2px 10px;border-radius:2px;background:rgba(133,148,174,.07);border:1px solid rgba(133,148,174,.15);color:var(--slate);font-size:10px;font-weight:700;letter-spacing:.08em;font-family:var(--display);}
  .pill-archived{display:inline-flex;align-items:center;padding:2px 10px;border-radius:2px;background:rgba(133,148,174,.07);border:1px solid rgba(133,148,174,.15);color:var(--slate);font-size:10px;font-weight:700;letter-spacing:.08em;font-family:var(--display);}
.pill-easy {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 2px; /* ✅ sharp edges */

  background: rgba(80,200,120,.07);
  border: 1px solid rgba(80,200,120,.25);

  color: #50C878;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .08em;
  font-family: var(--display);
}

.pill-medium {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 2px;

  background: rgba(255,193,7,.07);
  border: 1px solid rgba(255,193,7,.25);

  color: #cdae50;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .08em;
  font-family: var(--display);
}

.pill-hard {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 2px;

  background: rgba(224,122,122,.07);
  border: 1px solid rgba(224,122,122,.25);

  color: #E07A7A;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .08em;
  font-family: var(--display);
}
  /* Misc */
  .sp{display:inline-block;padding:2px 10px;border-radius:2px;background:rgba(196,161,94,.09);border:1px solid rgba(196,161,94,.2);color:var(--gold);font-size:var(--fs-xs);font-weight:700;letter-spacing:.1em;font-family:var(--display);}
  .bar-track{height:3px;background:rgba(196,161,94,.1);border-radius:2px;overflow:hidden;margin-top:8px;}
  .bar-fill{height:100%;border-radius:2px;background:linear-gradient(90deg,var(--gold3),var(--gold));transition:width 1.2s cubic-bezier(.22,1,.36,1);}
  .noise{position:absolute;inset:0;pointer-events:none;opacity:.022;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");background-size:180px 180px;}

  /* Filters / inputs */
  .filter-btn{display:inline-flex;align-items:center;padding:7px 14px;border-radius:4px;cursor:pointer;background:transparent;border:1px solid var(--border2);color:var(--slate);font-family:var(--display);font-size:var(--fs-xs);font-weight:700;letter-spacing:.07em;text-transform:uppercase;transition:all .2s;}
  .filter-btn:hover,.filter-btn.active{background:rgba(196,161,94,.09);color:var(--gold);border-color:rgba(196,161,94,.22);}
  .search-input{background:rgba(255,255,255,.03);border:1px solid var(--border2);border-radius:4px;padding:8px 14px 8px 36px;color:var(--ivory);font-family:var(--body);font-size:var(--fs-sm);outline:none;width:260px;transition:border-color .2s,background .2s;}
  .search-input::placeholder{color:var(--slate2);}
  .search-input:focus{border-color:rgba(196,161,94,.3);background:rgba(196,161,94,.03);}
  .topbar-search{background:rgba(255,255,255,.03);border:1px solid var(--border2);border-radius:4px;padding:7px 14px 7px 32px;color:var(--ivory);font-family:var(--body);font-size:var(--fs-sm);outline:none;width:220px;transition:border-color .2s,background .2s;}
  .topbar-search::placeholder{color:var(--slate2);}
  .topbar-search:focus{border-color:rgba(196,161,94,.3);background:rgba(196,161,94,.03);}

/* Modal - Enhanced styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  z-index: 999999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}

.modal {
  background: var(--ink2);
  border: 1px solid var(--border);
  border-radius: 12px;
  width: 450px;
  max-width: 90vw;
  position: relative;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  animation: slideUp 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
} .input-field{width:100%;background:rgba(255,255,255,.03);border:1px solid var(--border2);border-radius:4px;padding:10px 14px;color:var(--ivory);font-family:var(--body);font-size:var(--fs-sm);outline:none;transition:border-color .2s;}
  .input-field:focus{border-color:rgba(196,161,94,.4);}
  .input-field::placeholder{color:var(--slate2);}
  select.input-field option{background:var(--ink2);color:var(--ivory);}

  /* Animations */
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
  @keyframes slideIn{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:none}}
  .fade-up{animation:fadeUp .5s cubic-bezier(.22,1,.36,1) both;}
  .d1{animation-delay:.07s}.d2{animation-delay:.14s}.d3{animation-delay:.21s}
  .slide-in{animation:slideIn .4s cubic-bezier(.22,1,.36,1) both;}

  /* Activity */
  .act-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;margin-top:5px;}
  .prog-bar{height:6px;background:rgba(196,161,94,.1);border-radius:3px;overflow:hidden;margin-top:6px;}
  .prog-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,var(--gold3),var(--gold));transition:width 1s cubic-bezier(.22,1,.36,1);}
  .type-badge{display:inline-flex;align-items:center;padding:2px 10px;border-radius:2px;font-size:10px;font-weight:700;letter-spacing:.08em;font-family:var(--display);}
  .live-dot{width:7px;height:7px;border-radius:50%;background:#6BE092;display:inline-block;margin-right:6px;animation:pulse 2s infinite;}
  @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.8)}}
/* Ensure proper stacking context */
.tbl td {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  position: relative;
}

/* Make sure modals appear above everything */
.modal-overlay {
  z-index: 999999 !important;
}

.modal {
  z-index: 9999999 !important;
}
  @media(max-width:900px){
    .adm-sidebar{display:none!important;}
    .adm-main{padding:20px 16px!important;}
  }
`;

// Section label shared component
export function SectionLabel({ children }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 7,
      padding: "4px 12px", borderRadius: 2, marginBottom: 16,
      background: "rgba(196,161,94,.07)", border: "1px solid rgba(196,161,94,.2)",
      color: "#C4A15E", fontSize: 10, fontWeight: 700, letterSpacing: "2px",
      textTransform: "uppercase", fontFamily: "'Syne',sans-serif",
    }}>{children}</div>
  );
}

// Gold gradient text style
export const G = {
  background: "linear-gradient(135deg,#F5ECD7 0%,#C4A15E 50%,#E8D5B0 100%)",
  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
};

// Avatar palette + component
export const AV_PALETTE = [
  ["#C9974A","#8B6225"],["#5C8A72","#2E5C47"],["#6B7FA3","#3A4F73"],
  ["#A05C7A","#6B2E4E"],["#7A8F5C","#4E6329"],["#5C7A8F","#2E4E6B"],
  ["#8F6B5C","#6B3A2E"],["#7A5C8F","#4E2E6B"],
];

export function Av({ init, idx = 0, size = 36 }) {
  const [bg, dark] = AV_PALETTE[idx % AV_PALETTE.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `linear-gradient(135deg,${bg},${dark})`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'DM Serif Display',serif", color: "#fff",
      fontSize: Math.floor(size * 0.32), letterSpacing: "0.03em",
      border: `1px solid ${bg}44`,
    }}>{init}</div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NAV CONFIG — add Test & Question creation
// ─────────────────────────────────────────────────────────────────────────────
const NAV = [
  { key: "overview",  icon: "◎", label: "Overview",         path: "/admin-dashboard" },
  { key: "users",     icon: "◉", label: "Users",            path: "/UserManagement" },
  { key: "tests",     icon: "◈", label: "Tests",            path: "/TestManagement" },

  { key: "createQ",   icon: "✎", label: "Questions",     path: "/question-management" },
    { key: "createTest",icon: "✚", label: "Create Test",      path: "/testcreation" },
  { key: "activity",  icon: "◆", label: "Activity",         path: "/RecentActivity" },
];

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN LAYOUT — wraps every admin page
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminLayout({ children, pageKey }) {
  const navigate = useNavigate();
  const [sideOpen, setSideOpen] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
const [notifications, setNotifications] = useState([]);
const [showAllNotif, setShowAllNotif]   = useState(false);
const [showNotif, setShowNotif]   = useState(false);
const NOTIF_LIMIT = 5;
const [user, setUser] = useState({
  name: "",
  role: ""
});
  const profileRef = useRef(null);
  const fileInputRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfileMenu(false);
      if (notifRef.current  && !notifRef.current.contains(e.target))   setShowNotif(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
// Add this inside your AdminLayout component, after the existing useEffect
// Replace the entire useEffect with this cleaner version
useEffect(() => {
  // Create a tooltip element once
  let tooltipElement = null;
  
  const createTooltip = () => {
    if (!tooltipElement) {
      tooltipElement = document.createElement('div');
      tooltipElement.className = 'custom-table-tooltip-global';
      tooltipElement.style.cssText = `
        position: fixed;
        background: var(--ink2);
        border: 1px solid var(--gold);
        border-radius: 6px;
        padding: 8px 14px;
        font-size: var(--fs-small);
        color: var(--ivory);
        max-width: 350px;
        word-break: break-word;
        z-index: 10000;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(8px);
        font-family: var(--body);
        line-height: 1.4;
        pointer-events: none;
        white-space: normal;
        opacity: 0;
        transition: opacity 0.15s ease-out;
        visibility: hidden;
      `;
      document.body.appendChild(tooltipElement);
    }
    return tooltipElement;
  };
  
  // Function to add tooltips to truncated cells
  const addTooltipsToTruncatedCells = () => {
    const tableCells = document.querySelectorAll('.tbl td');
    tableCells.forEach(cell => {
      // Skip if already processed or contains buttons
      if (cell.hasAttribute('data-has-tooltip') || cell.querySelector('button')) return;
      
      // Mark as processed
      cell.setAttribute('data-has-tooltip', 'true');
      
      const fullText = cell.textContent?.trim();
      if (!fullText) return;
      
      // Check if text is actually truncated
      const isTruncated = cell.scrollWidth > cell.clientWidth;
      
      if (isTruncated) {
        cell.style.cursor = 'help';
        
        // Mouse enter event
        cell.addEventListener('mouseenter', (e) => {
          const tooltip = createTooltip();
          tooltip.textContent = fullText;
          tooltip.style.visibility = 'visible';
          tooltip.style.opacity = '1';
          
          // Position tooltip
          const rect = cell.getBoundingClientRect();
          const tooltipRect = tooltip.getBoundingClientRect();
          
          let top = rect.top - tooltipRect.height - 8;
          let left = rect.left;
          
          // Check if tooltip goes above viewport
          if (top < 10) {
            top = rect.bottom + 8;
          }
          
          // Check if tooltip goes off right edge
          if (left + tooltipRect.width > window.innerWidth - 10) {
            left = window.innerWidth - tooltipRect.width - 10;
          }
          
          // Check if tooltip goes off left edge
          if (left < 10) {
            left = 10;
          }
          
          tooltip.style.top = `${top}px`;
          tooltip.style.left = `${left}px`;
        });
        
        // Mouse leave event
        cell.addEventListener('mouseleave', () => {
          if (tooltipElement) {
            tooltipElement.style.visibility = 'hidden';
            tooltipElement.style.opacity = '0';
          }
        });
      }
    });
  };

  // Run after initial render with a small delay
  setTimeout(() => {
    addTooltipsToTruncatedCells();
  }, 100);
  
  // Watch for dynamic content changes
  const observer = new MutationObserver(() => {
    // Clear processed flags for new cells
    const processedCells = document.querySelectorAll('.tbl td[data-has-tooltip]');
    // Don't clear all, just add tooltips to new cells
    addTooltipsToTruncatedCells();
  });
  
  const container = document.getElementById('adm-scroll');
  if (container) {
    observer.observe(container, { childList: true, subtree: true });
  }
  
  // Cleanup on unmount
  return () => {
    observer.disconnect();
    if (tooltipElement && tooltipElement.parentNode) {
      tooltipElement.parentNode.removeChild(tooltipElement);
    }
  };
}, []);
const handleProfileChange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const res = await uploadProfile(file);

    // ✅ use backend URL (NOT createObjectURL)
    setProfileImage( res.image_url);
    
  } catch (err) {
    console.error(err);
  }
};
useEffect(() => {
  loadProfile();
}, []);

const loadProfile = async () => {
  try {
    const res = await getProfile();

    // image
    if (res.image) {
      setProfileImage(res.image);
    }

    // 👇 IMPORTANT: set name + role
    setUser({
      name: res.name ,
      role: res.role 
    });

  } catch (err) {
    console.error(err);
  }
};
useEffect(() => {
  fetchNotifications();
}, []);

const fetchNotifications = async () => {
  try {
    const data = await getNotifications();

    const list =
      data?.notifications ||
      data?.data ||
      data;

    setNotifications(Array.isArray(list) ? list : []);

  } catch (err) {
    console.error(err);
  }
};
const unreadCount = Array.isArray(notifications)
  ? notifications.filter(n => !n.is_read).length
  : 0;
  const handleNotificationClick = (n) => {
    if (n.type === "user")     navigate("/UserManagement");
    if (n.type === "test")     navigate("/TestManagement");
    if (n.type === "question") navigate("/TestManagement");
    if (n.type === "attempt")  navigate("/RecentActivity");
  };

const dismissNotif = async (id) => {
  try {
    await deleteNotification(id);
    setNotifications((prev) => prev.filter(n => n.id !== id));
  } catch (err) {
    console.error(err);
  }
};

  return (
    <>
      <style>{ADMIN_CSS}</style>
      <div style={{ position: "fixed", inset: 0, display: "flex", flexDirection: "column", background: "var(--ink)" }}>

        {/* ══════════════ TOPBAR ══════════════ */}
<header
  style={{
    height: 68,
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 28px",
    background: "rgba(11,13,17,.95)",
    backdropFilter: "blur(18px)",
    borderBottom: "1px solid rgba(196,161,94,.12)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  }}
>
  {/* LEFT: Logo */}
  <div
    onClick={() => navigate("/")}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      cursor: "pointer",
    }}
  >
<div
  onClick={() => navigate("/")}
  style={{
    display: "flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
  }}
>
<img
  src={logo}
  alt="Skill Bridge"
  style={{
    height: 36,
    filter: `
      brightness(2.5)
      contrast(1.2)

    `,
  }}
/>

  <span
    style={{
      fontFamily: "var(--display)",
      fontWeight: 800,
      letterSpacing: ".07em",
      fontSize: 15,

    background: "linear-gradient(135deg, #F5ECD7 0%, #C4A15E 40%, #E8D5B0 60%, #8B6830 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",

    }}
  >
    SKILL BRIDGE
  </span>
</div>

  </div>

  {/* CENTER: Navigation Menu */}
  {/* CENTER */}
  <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
    <nav style={{ display: "flex", alignItems: "center", gap: 28 }}>
      {NAV.map((n) => (
        <button
          key={n.key}
          onClick={() => navigate(n.path)}
          style={{
            background: "transparent",
            border: "none",
            color: pageKey === n.key ? "var(--gold)" : "var(--slate)",
            fontFamily: "var(--display)",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: ".08em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          {n.label}
        </button>
      ))}
    </nav>
  </div>

{/* RIGHT SIDE (notification + profile) */}
<div style={{ display: "flex", alignItems: "center", gap: 18 }}>
  
  {/* Notification */}
<div ref={notifRef} style={{ position: "relative" }}>
<button
  onClick={() => {
    setShowNotif(v => !v);
    setShowProfileMenu(false); // 👈 important (close profile)
  }}
  style={{
    position: "relative",
    background: "rgba(255,255,255,.03)",
    border: "1px solid var(--border2)",
    borderRadius: 4,
    width: 34,
    height: 34,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--slate)",
  }}
>
  <Bell size={16} />
  
  {/* Notification dot */}
{unreadCount > 0 && (
  <span
    style={{
      position: "absolute",
      top: 6,
      right: 6,
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: "var(--gold)",
      border: "1.5px solid var(--ink)",
    }}
  />
)}
</button>
  {/* Notification Dropdown */}
{showNotif && (
  <div style={{
    position: "absolute", right: 0, top: 42,
    width: 320,
    background: "var(--ink2)",
    border: "1px solid var(--border2)",
    borderRadius: 8,
    overflow: "hidden",
    zIndex: 200,
    boxShadow: "0 16px 40px rgba(0,0,0,.5)",
  }}>

    {/* Header */}
    <div style={{
      padding: "12px 16px",
      borderBottom: "1px solid var(--border2)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{
          fontFamily: "var(--display)", fontSize: 11, fontWeight: 700,
          color: "var(--slate2)", letterSpacing: ".1em", textTransform: "uppercase",
        }}>Notifications</span>
        {unreadCount > 0 && (
          <span style={{
            background: "rgba(196,161,94,.15)", border: "1px solid rgba(196,161,94,.3)",
            color: "var(--gold)", fontFamily: "var(--display)", fontWeight: 700,
            fontSize: 10, padding: "1px 7px", borderRadius: 10,
          }}>{unreadCount}</span>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {unreadCount > 0 && (
          <button
            onClick={async () => {
              await markAllNotificationsRead();
              setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "var(--gold)", fontFamily: "var(--display)",
              fontSize: 10, fontWeight: 700, letterSpacing: ".06em",
            }}
          >MARK ALL READ</button>
        )}
        <button
          onClick={() => { setShowNotif(false); setShowAllNotif(false); }}
          style={{ background: "transparent", border: "none", color: "var(--slate)", fontSize: 18, cursor: "pointer", lineHeight: 1 }}
        >×</button>
      </div>
    </div>

    {/* List */}
    <div style={{ maxHeight: 380, overflowY: "auto" }}>
      {notifications.length === 0 ? (
        <div style={{
          padding: "32px 20px", textAlign: "center",
          color: "var(--slate)", fontFamily: "var(--display)", fontSize: 12,
        }}>
          <div style={{ fontSize: 22, marginBottom: 8, opacity: .4 }}>◎</div>
          No notifications
        </div>
      ) : (showAllNotif ? notifications : notifications.slice(0, NOTIF_LIMIT)).map((n) => (
        <div
          key={n.id}
          style={{
            padding: "11px 14px",
            borderBottom: "1px solid var(--border2)",
            display: "flex", alignItems: "flex-start", gap: 10,
            background: n.is_read ? "transparent" : "rgba(196,161,94,.04)",
            transition: "background .15s",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "rgba(196,161,94,.07)"}
          onMouseLeave={(e) => e.currentTarget.style.background = n.is_read ? "transparent" : "rgba(196,161,94,.04)"}
        >
          {/* Unread dot */}
          <div style={{
            width: 7, height: 7, borderRadius: "50%", flexShrink: 0, marginTop: 5,
            background: n.is_read ? "transparent" : "var(--gold)",
            border: n.is_read ? "1px solid var(--border2)" : "none",
          }} />

          {/* Text — click to mark read + navigate */}
          <div
            style={{ flex: 1, minWidth: 0 }}
            onClick={async () => {
              if (!n.is_read) {
                await markNotificationRead(n.id);
                setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
              }
              handleNotificationClick(n);
            }}
          >
            <div style={{
              color: n.is_read ? "var(--slate)" : "var(--ivory)",
              fontSize: 13, fontFamily: "var(--body)", lineHeight: 1.5,
              wordBreak: "break-word", whiteSpace: "normal",
            }}>{n.text}</div>
            {n.created_at && (
              <div style={{
                color: "var(--slate2)", fontSize: 10,
                fontFamily: "var(--display)", marginTop: 3, letterSpacing: ".04em",
              }}>
                {new Date(n.created_at).toLocaleDateString("en-US", {
                  month: "short", day: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </div>
            )}
          </div>

<button
  onClick={async (e) => {
    e.stopPropagation();
    await dismissNotif(n.id);
  }}
  title="Delete notification"
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
      ))}
    </div>

    {/* View more / less footer */}
    {notifications.length > NOTIF_LIMIT && (
      <div style={{
        borderTop: "1px solid var(--border2)",
        padding: "10px 16px",
        textAlign: "center",
      }}>
        <button
          onClick={() => setShowAllNotif(v => !v)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--gold)", fontFamily: "var(--display)",
            fontSize: 11, fontWeight: 700, letterSpacing: ".08em",
          }}
        >
          {showAllNotif
            ? "▲ SHOW LESS"
            : `▼ VIEW ${notifications.length - NOTIF_LIMIT} MORE`}
        </button>
      </div>
    )}
  </div>
)}
  </div>

  {/* Profile */}
  <div 
  ref={profileRef}
  style={{ 
    display: "flex", 
    alignItems: "center", 
    gap: 9, 
    cursor: "pointer",
    position: "relative" // 👈 KEY FIX
  }}
>
<div
  onClick={() => setShowProfileMenu((v) => !v)}
  style={{ position: "relative", width: 34, height: 34, cursor: "pointer", flexShrink: 0 }}
>
  <div style={{
    width: 38, height: 38, borderRadius: "50%",
    background: "linear-gradient(135deg,#C4A15E,#E7D3A3)",
    overflow: "hidden",
    border: "2px solid rgba(196,161,94,0.2)",
  }}>
    {profileImage
      ? <img src={profileImage} alt="profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#1B2030", fontFamily: "var(--serif)", fontSize: 13, fontWeight: 600 }}>{user.name?.charAt(0) || "A"}</div>
    }
  </div>
  {/* Active dot */}
  <span style={{
    position: "absolute", bottom: -2, right: -3,
    width: 10, height: 10, borderRadius: "50%",
    background: "#22C55E",
    border: "2px solid var(--ink)",
    display: "block",
    animation: "pulse 2s ease-in-out infinite",
  }} />
</div>
{showProfileMenu && (
  <div style={{
    position: "absolute", 
    right: 0, 
    top: 42,
    width: 280,
    background: "var(--ink2)",
    border: "1px solid var(--border2)",
    borderRadius: 8,
    overflow: "hidden",
    zIndex: 200,
    boxShadow: "0 16px 40px rgba(0,0,0,.5)",
  }}>
    {/* Header - matches notification dropdown exactly */}
    <div style={{
      padding: "12px 16px",
      borderBottom: "1px solid var(--border2)",
      display: "flex", 
      alignItems: "center", 
      justifyContent: "space-between",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{
          fontFamily: "var(--display)", 
          fontSize: 11, 
          fontWeight: 700,
          color: "var(--slate2)", 
          letterSpacing: ".1em", 
          textTransform: "uppercase",
        }}>My Profile</span>
      </div>
      <button
        onClick={() => setShowProfileMenu(false)}
        style={{ 
          background: "transparent", 
          border: "none", 
          color: "var(--slate)", 
          fontSize: 18, 
          cursor: "pointer", 
          lineHeight: 1,
          padding: "0 4px",
        }}
      >×</button>
    </div>

    {/* Profile Content */}
    <div style={{ padding: "16px" }}>
      {/* Avatar Section - centered */}
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        marginBottom: 12 
      }}>
        <div style={{ position: "relative" }}>
          <div style={{
            width: 80,
            height: 78,
            borderRadius: "50%",
            background: "linear-gradient(135deg,#C4A15E,#E7D3A3)",
            overflow: "hidden",
            cursor: "pointer",
            border: "2px solid rgba(196,161,94,0.2)",
          }}>
            {profileImage ? (
              <img
                src={profileImage}
                alt="profile"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 24,
                fontWeight: 500,
              }}>
                {user.name?.charAt(0) || "A"}
              </div>
            )}
          </div>
          {/* Edit icon */}
          <button
            onClick={() => fileInputRef.current.click()}
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: "var(--gold)",
              border: "2px solid var(--ink2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: 11,
              color: "var(--ink)",
              fontWeight: 700,
              padding: 0,
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--gold2)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "var(--gold)"}
          >
            ✎
          </button>
        </div>
      </div>

      {/* User Info */}
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <div style={{
          fontFamily: "var(--display)", fontWeight: 700, color: "var(--ivory)", fontSize: "var(--fs-card)",
          marginBottom: 4,
        }}>
          {user.name || "Admin User"}
        </div>
        <div style={{
          display: "inline-block",
          padding: "2px 8px",
          background: "rgba(196,161,94,.08)",
          border: "1px solid rgba(196,161,94,.2)",
          borderRadius: 2,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: ".08em",
          fontFamily: "var(--display)",
          color: "var(--gold)",
        }}>
          {user.role || "Administrator"}
        </div>
      </div>



    </div>

    {/* Logout - matches notification footer style */}
    <div style={{
      borderTop: "1px solid var(--border2)",
      padding: "10px 16px",
      textAlign: "center",
    }}>
      <button
        onClick={async () => {
          await logoutUser();
          navigate("/login");
        }}
        style={{
          background: "none", 
          border: "none", 
          cursor: "pointer",
          color: "#E07A7A",
          fontFamily: "var(--display)",
          fontSize: 11, 
          fontWeight: 700, 
          letterSpacing: ".08em",
          width: "100%",
          padding: "6px",
          borderRadius: 4,
          transition: "background .15s",
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(224,122,122,.08)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
      >
        SIGN OUT
      </button>
    </div>
  </div>
)}
  {/* Hidden file input */}
  <input
    type="file"
    accept="image/*"
    ref={fileInputRef}
    onChange={handleProfileChange}
    style={{ display: "none" }}
  />
</div>
              <div>
                              <div>
<div style={{ fontFamily: "var(--display)", fontWeight: 700 }}>
  {user.name}
</div>

<div style={{ fontSize: 10 }}>
  {user.role}
</div>
              </div>
  </div>

</div>
</header>
        {/* ══════════════ BODY ══════════════ */}
    <div style={{ flex: 1, overflow: "hidden" }}>

          {/* ── PAGE CONTENT ── */}
<div
  id="adm-scroll"
  style={{
    height: "calc(100vh - 68px)",
    overflowY: "auto",
    padding: "20px",
    background: "var(--ink)",
  }}
>
            {children}
          </div>
        </div>
      </div>
    </>
  );
  
}
