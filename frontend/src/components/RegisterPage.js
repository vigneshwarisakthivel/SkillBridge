import React, { useState } from "react";
import { ADMIN_CSS,SectionLabel } from "./AdminLayout"; // adjust path
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { registerUser } from "../services/apiServices";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

export default function RegisterPage({ onRegister, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [focus, setFocus] = useState(null);
  const [loading, setLoading] = useState(false);
// ADD THIS STATE AT TOP
const [showPassword, setShowPassword] = useState(false);
const [showConfirm, setShowConfirm] = useState(false);
const [snackbar, setSnackbar] = useState({
  open: false,
  message: "",
  severity: "success",
});

  // ───────────────────────── VALIDATION
  const validate = () => {
    let e = {};

    if (!formData.fullName) e.fullName = "Required";
    if (!/\S+@\S+\.\S+/.test(formData.email)) e.email = "Invalid email";
if (!formData.password) {
  e.password = "Password required";
} else {
  if (formData.password.length < 8)
    e.password = "Min 8 characters";
  else if (!/[A-Z]/.test(formData.password))
    e.password = "Include uppercase letter";
  else if (!/[0-9]/.test(formData.password))
    e.password = "Include a number";
  else if (!/[^A-Za-z0-9]/.test(formData.password))
    e.password = "Include a special character";
}
    if (formData.password !== formData.confirmPassword)
      e.confirmPassword = "Mismatch";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

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
    await registerUser(formData);

    // ✅ SUCCESS SNACKBAR
    setSnackbar({
      open: true,
      message: "Account created successfully!",
      severity: "success",
    });

    setTimeout(() => {
      navigate("/login");
    }, 1200);

  } catch (err) {
    console.log(err);

    // ✅ BACKEND ERROR HANDLING (important 🔥)
    let msg = "Something went wrong";

    if (err.response?.data) {
      const data = err.response.data;

      // show first backend error
      msg = Object.values(data)[0];
    }

    // ❌ ERROR SNACKBAR
    setSnackbar({
      open: true,
      message: msg,
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
  
const getStrength = (password) => {
  let score = 0;

  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++; // ✅ special char

  if (score <= 1) return "Weak";
  if (score === 2 || score === 3) return "Medium";
  if (score === 4) return "Strong";
};
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
            maxWidth: 440,
            padding: 32,
            backdropFilter: "blur(18px)",
          }}
        >
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
    Create Account
  </span>
            </div>


           <p style={{ color: "var(--slate)", fontSize: "var(--fs-secondary)", marginTop: -4 }}>
              Join the admin system
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit}>
            {/* FULL NAME */}
            <div style={{ marginBottom: 10 }}>
            <label style={label("fullName")}>Full Name</label>
            <input
              name="fullName"
              onChange={handleChange}
              onFocus={() => setFocus("fullName")}
              onBlur={() => setFocus(null)}
              style={input("fullName")}
            />
            {errors.fullName && <Error msg={errors.fullName} />}</div>

            {/* EMAIL */}
             <div style={{ marginBottom: 10 }}>
            <label style={label("email")}>Email</label>
            <input
              name="email"
              onChange={handleChange}
              onFocus={() => setFocus("email")}
              onBlur={() => setFocus(null)}
              style={input("email")}
            />
            {errors.email && <Error msg={errors.email} />}</div>

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
  <div
    style={{
      fontSize: 10,
      color: "var(--slate)",
      marginTop: 6,
      fontFamily: "var(--display)",
      letterSpacing: ".05em"
    }}
  >
    Must contain 8+ chars, uppercase, number & special character
  </div>
  {errors.password && <Error msg={errors.password} />}
</div>
<div style={{ marginTop: 6 }}>
  {formData.password && (
    <>
      {/* BAR */}
      <div
        style={{
          height: 4,
          borderRadius: 4,
          background: "rgba(255,255,255,.05)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width:
              getStrength(formData.password) === "Weak"
                ? "33%"
                : getStrength(formData.password) === "Medium"
                ? "66%"
                : "100%",
            transition: ".3s",
            background:
              getStrength(formData.password) === "Weak"
                ? "rgba(224,122,122,.7)"
                : getStrength(formData.password) === "Medium"
                ? "rgba(196,161,94,.6)"
                : "#6BE092",
          }}
        />
      </div>

      {/* LABEL */}
      <div
        style={{
          marginTop: 4,
          fontSize: 10,
          fontFamily: "var(--display)",
          letterSpacing: ".08em",
          color:
            getStrength(formData.password) === "Weak"
              ? "#E07A7A"
              : getStrength(formData.password) === "Medium"
              ? "#E0A96B"
              : "#6BE092",
        }}
      >
        Password strength: {getStrength(formData.password)}
      </div>
    </>
  )}
</div>
            {/* CONFIRM */}
<div style={{ marginBottom: 10 }}>
  <label style={label("confirmPassword")}>
    Confirm Password
  </label>

  <div style={{ position: "relative" }}>
    <input
      type={showConfirm ? "text" : "password"}
      name="confirmPassword"
      onChange={handleChange}
      onFocus={() => setFocus("confirmPassword")}
      onBlur={() => setFocus(null)}
      style={{
        ...input("confirmPassword"),
        paddingRight: "40px", // same spacing
      }}
    />

    <button
      type="button"
      onClick={() => setShowConfirm((v) => !v)}
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
      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  </div>

  {errors.confirmPassword && (
    <Error msg={errors.confirmPassword} />
  )}
</div>

            {/* BUTTON */}
<div style={{ display: "flex", justifyContent: "center" }}>
  <button
    type="submit"
    className="btn-p"
    style={{ marginTop: 20 }}
  >
    {loading ? "Creating..." : "Create Account"}
  </button>
</div>
          </form>

          {/* FOOTER */}
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <span style={{ color: "var(--slate)" }}>
              Already have an account?
            </span>
            <button
               onClick={() => navigate("/login")}
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
              Sign In
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
      fontWeight: 600,
      background:
        snackbar.severity === "success"
          ? "#509065"
          : snackbar.severity === "error"
          ? "#935252"
          : "#a58750",
      color: "#0f172a",
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