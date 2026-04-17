import React, { useState } from "react";
import { ADMIN_CSS } from "./AdminLayout";
import { useNavigate, useParams } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

export default function TestLoginPage() {
  const { uuid } = useParams(); // test UUID from URL
  const navigate = useNavigate();

const [formData, setFormData] = useState({
  name: "",
  email: "",
  passcode: "",
});

  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});
  const [focus, setFocus] = useState(null);
  const [loading, setLoading] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // ✅ VALIDATION
  const validate = () => {
    let e = {};
    if (!formData.name)
  e.name = "Name required";
    if (!/\S+@\S+\.\S+/.test(formData.email))
      e.email = "Enter valid email";

    if (!formData.passcode)
      e.passcode = "Passcode required";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ✅ INPUT CHANGE
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  // ✅ SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);

    try {
const res = await axios.post("http://localhost:8000/api/test-login/", {
  name: formData.name,
  email: formData.email,
  passcode: formData.passcode,
  test_uuid: uuid,
});

// ✅ ADD THESE 2 LINES (VERY IMPORTANT)
localStorage.setItem("candidate_name", res.data.name);
localStorage.setItem("candidate_email", res.data.email);

      setSnackbar({
        open: true,
        message: "Access granted!",
        severity: "success",
      });

      // 👉 Redirect to test page
      setTimeout(() => {
        console.log("UUID:", uuid);
        navigate(`/test/${uuid}/test`, {
          state: { email: formData.email }, // optional
        });
      }, 1000);

    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || "Access denied",
        severity: "error",
      });
    }

    setLoading(false);
  };

  // 🎨 STYLES (same as your admin)
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
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <span
              style={{
                fontFamily: "var(--display)",
                fontWeight: 800,
                fontSize: 15,
                background:
                  "linear-gradient(135deg, #F5ECD7 0%, #C4A15E 40%, #E8D5B0 60%, #8B6830 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Test Access
            </span>

            <p style={{ color: "var(--slate)", fontSize: 13 }}>
              Enter your email and passcode
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit}>
            {/* NAME */}
<div style={{ marginBottom: 12 }}>
  <label style={label("name")}>Full Name</label>
  <input
    type="text"
    name="name"
    onChange={handleChange}
    onFocus={() => setFocus("name")}
    onBlur={() => setFocus(null)}
    style={input("name")}
  />
  {errors.name && <Error msg={errors.name} />}
</div>
            {/* EMAIL */}
            <div style={{ marginBottom: 12 }}>
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

            {/* PASSCODE */}
            <div style={{ marginBottom: 12 }}>
              <label style={label("passcode")}>Passcode</label>

              <div style={{ position: "relative" }}>
                <input
                  type={showPass ? "text" : "password"}
                  name="passcode"
                  onChange={handleChange}
                  onFocus={() => setFocus("passcode")}
                  onBlur={() => setFocus(null)}
                  style={{ ...input("passcode"), paddingRight: 40 }}
                />

                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--slate)",
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {errors.passcode && <Error msg={errors.passcode} />}
            </div>

            <div style={{ textAlign: "center" }}>
              <button type="submit" className="btn-p" style={{ marginTop: 16 }}>
                {loading ? "Checking..." : "Start Test"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* SNACKBAR */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

// ERROR
const Error = ({ msg }) => (
  <div style={{ color: "#E07A7A", fontSize: 11, marginTop: 6 }}>
    ⚠ {msg}
  </div>
);