import React, { useState } from "react";
import { ADMIN_CSS } from "./AdminLayout"; // adjust path if needed
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { loginUser } from "../services/apiServices";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

export default function LoginPage({ onLogin, onSwitchToRegister }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [focus, setFocus] = useState(null);
  const [loading, setLoading] = useState(false);
const [snackbar, setSnackbar] = useState({
  open: false,
  message: "",
  severity: "success", // success | error | warning | info
});
  // ───────────────────────── VALIDATION
  const validate = () => {
    let e = {};

    if (!/\S+@\S+\.\S+/.test(formData.email))
      e.email = "Enter valid email";

    if (!formData.password)
      e.password = "Password required";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ───────────────────────── HANDLERS
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };
const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validate()) return;

  setLoading(true);

  try {
    const data = await loginUser(formData);

    localStorage.setItem("access", data.access);
    localStorage.setItem("refresh", data.refresh);

    // ✅ SUCCESS SNACKBAR
    setSnackbar({
      open: true,
      message: "Login successful!",
      severity: "success",
    });

    setTimeout(() => {
      navigate("/admin-dashboard");
    }, 1200);

  } catch (err) {
    console.log(err);

    // ❌ ERROR SNACKBAR
    setSnackbar({
      open: true,
      message: "Invalid email or password",
      severity: "error",
    });
  }

  setLoading(false);
};
  // ───────────────────────── STYLES
  const input = (name) => ({
    width: "100%",
    padding: "12px 14px",
    background: "rgba(255,255,255,.03)",
    border: `1px solid ${
      errors[name]
        ? "rgba(224,122,122,.4)"
        : focus === name
        ? "var(--gold)"
        : "var(--border2)"
    }`,
    borderRadius: 6,
    color: "var(--ivory)",
    fontFamily: "var(--body)",
    fontSize: "var(--fs-body)",
    outline: "none",
    transition: ".2s",
  });

  const label = (name) => ({
    fontSize: "var(--fs-micro)",
    fontFamily: "var(--display)",
    letterSpacing: ".08em",
    textTransform: "uppercase",
    color: focus === name ? "var(--gold)" : "var(--slate)",
    marginBottom: 6,
    display: "block",
  });

  // ───────────────────────── UI
  return (
    <>
      <style>{ADMIN_CSS}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "var(--ink)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* CARD */}
        <div
          className="card"
          style={{
            width: "100%",
            maxWidth: 420,
            padding: 32,
            backdropFilter: "blur(18px)",
          }}
        >
          {/* HEADER */}
          {/* HEADER */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
           <div style={{ marginBottom: 10 }}>
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
    Welcome Back
  </span>
            </div>


           <p style={{ color: "var(--slate)", fontSize: "var(--fs-secondary)", marginTop: -4 }}>
              Sign in to your admin account
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit}>
            {/* EMAIL */}
            
<div style={{ marginBottom: 10 }}>
  <label style={label("email")}>Email</label>
  <input
    type="email"
    name="email"
    onChange={handleChange}
    onFocus={() => setFocus("email")}
    onBlur={() => setFocus(null)}
    style={input("email")}
  />
  {errors.email && <Error msg={errors.email} />}
</div>

            {/* PASSWORD */}
{/* PASSWORD */}
<div style={{ marginBottom: 10 }}>
  <label style={label("password")}>Password</label>

  <div style={{ position: "relative" }}>
    <input
      type={showPassword ? "text" : "password"}
      name="password"
      onChange={handleChange}
      onFocus={() => setFocus("password")}
      onBlur={() => setFocus(null)}
      style={{
        ...input("password"),
        paddingRight: "40px", // space for icon
      }}
    />

    <button
      type="button"
      onClick={() => setShowPassword((v) => !v)}
      style={{
        position: "absolute",
        right: 10,
        top: "50%",
        transform: "translateY(-50%)",
        background: "none",
        border: "none",
        cursor: "pointer",
        color: "var(--slate)",
        display: "flex",
        alignItems: "center",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.color = "var(--gold)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.color = "var(--slate)")
      }
    >
      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  </div>

  {errors.password && <Error msg={errors.password} />}
</div>
            {/* FORGOT PASSWORD */}
            <div style={{ textAlign: "right", marginTop: 6 }}>
              <button
               onClick={() => navigate("/forgot-password")}
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--gold)",
                  fontSize: 11,
                  cursor: "pointer",
                  fontFamily: "var(--display)",
                }}
              >
                Forgot Password?
              </button>
            </div>

<div style={{ display: "flex", justifyContent: "center" }}>
  <button
    type="submit"
    className="btn-p"
    style={{ marginTop: 20 }}
  >
   {loading ? "Signing in..." : "Sign In"}
  </button>
</div>
          </form>

          {/* FOOTER */}
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <span style={{ color: "var(--slate)" }}>
              Don’t have an account?
            </span>
            <button
              onClick={() => navigate("/register")}
              style={{
                background: "none",
                border: "none",
                color: "var(--gold)",
                marginLeft: 6,
                cursor: "pointer",
                fontFamily: "var(--display)",
                fontWeight: 700,
              }}
            >
              Register
            </button>
          </div>
        </div>
      </div>
      <Snackbar
  open={snackbar.open}
  autoHideDuration={3000}
  onClose={() => setSnackbar({ ...snackbar, open: false })}
  anchorOrigin={{ vertical: "top", horizontal: "right" }}
>
  <Alert
    onClose={() => setSnackbar({ ...snackbar, open: false })}
    severity={snackbar.severity}
    variant="filled"
    sx={{
      fontFamily: "var(--display)",
      background:
        snackbar.severity === "success"
          ? "#509065"
          : snackbar.severity === "error"
          ? "#935252"
          : "#a58750",
      color: "#0f172a",
      fontWeight: 600,
    }}
  >
    {snackbar.message}
  </Alert>
</Snackbar>
    </>
    
  );
}

// ───────────────────────── ERROR COMPONENT
const Error = ({ msg }) => (
  <div
    style={{
      color: "#E07A7A",
      fontSize: "11px",
      marginTop: 6,
    }}
  >
    ⚠ {msg}
  </div>
);