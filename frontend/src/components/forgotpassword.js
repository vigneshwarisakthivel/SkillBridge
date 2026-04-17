import React, { useState } from "react";
import { ADMIN_CSS } from "./AdminLayout";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { sendOTP, verifyOTP, resetPassword } from "../services/apiServices";

function Error({ text }) {
  return <div style={{ color: "#E07A7A", fontSize: 11, marginTop: 6 }}>⚠ {text}</div>;
}

const getStrength = (password) => {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return "Weak";
  if (score <= 3) return "Medium";
  return "Strong";
};

export default function ForgotPasswordFlow({ onBackToLogin }) {
  const navigate = useNavigate();
  const [step, setStep]   = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp]     = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  // ── Step 1: Send OTP ───────────────────────────────────────────────────────
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Enter a valid email address."); return; }
    setError("");
    setLoading(true);
    try {
      await sendOTP(email);
      setStep(2);
    } catch (err) {
      // err.email is the serializer field error, err.error is our custom message
      setError(
        err?.email?.[0] ||
        err?.error ||
        err?.detail ||
        "Failed to send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP ─────────────────────────────────────────────────────
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (otp.length < 4) { setError("Enter the OTP sent to your email."); return; }
    setError("");
    setLoading(true);
    try {
      await verifyOTP(email, otp);
      setStep(3);
    } catch (err) {
      setError(err?.error || err?.detail || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: Reset Password ─────────────────────────────────────────────────
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!password)          { setError("Password required."); return; }
    if (password.length < 8) { setError("Minimum 8 characters required."); return; }
    if (!/[A-Z]/.test(password)) { setError("Must include an uppercase letter."); return; }
    if (!/[0-9]/.test(password)) { setError("Must include a number."); return; }
    if (!/[^A-Za-z0-9]/.test(password)) { setError("Must include a special character."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }

    setError("");
    setLoading(true);
    try {
      await resetPassword(email, otp, password, confirm);
      alert("Password reset successfully! Please log in.");
      navigate("/login");
    } catch (err) {
      const d = err?.password?.[0] || err?.confirm?.[0] || err?.error || err?.detail;
      setError(d || "Reset failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{ADMIN_CSS}</style>
      <div style={{ minHeight: "100vh", background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="card" style={{ width: "100%", maxWidth: 420, padding: 32, backdropFilter: "blur(18px)" }}>

          {/* Title */}
          <div style={{ marginBottom: 10, textAlign: "center" }}>
            <span style={{
              fontFamily: "var(--display)", fontWeight: 800, letterSpacing: ".07em", fontSize: 15,
              background: "linear-gradient(135deg,#F5ECD7 0%,#C4A15E 40%,#E8D5B0 60%,#8B6830 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              {step === 1 && "Forgot Password"}
              {step === 2 && "Verify OTP"}
              {step === 3 && "Reset Password"}
            </span>
          </div>

          {/* Step indicator */}
          <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
            {[1, 2, 3].map((s) => (
              <div key={s} style={{
                flex: 1, height: 3, borderRadius: 2,
                background: step >= s
                  ? "linear-gradient(90deg,var(--gold3),var(--gold))"
                  : "rgba(255,255,255,.05)",
              }} />
            ))}
          </div>

          {/* ── Step 1: Email ── */}
          {step === 1 && (
            <form onSubmit={handleEmailSubmit}>
              <p style={{ color: "var(--slate)", fontSize: 12, marginBottom: 14 }}>
                Enter your registered email to receive an OTP.
              </p>
              <input
                type="email" placeholder="Email address"
                value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }}
                className="input-field"
              />
              {error && <Error text={error} />}
              <div style={{ display: "flex", justifyContent: "center" }}>
                <button type="submit" className="btn-p" style={{ marginTop: 20 }} disabled={loading}>
                  {loading ? "Sending…" : "Send OTP"}
                </button>
              </div>
            </form>
          )}

          {/* ── Step 2: OTP ── */}
          {step === 2 && (
            <form onSubmit={handleOtpSubmit}>
              <p style={{ color: "var(--slate)", fontSize: 12, marginBottom: 14 }}>
                Enter the 6-digit OTP sent to <strong style={{ color: "var(--ivory)" }}>{email}</strong>.
              </p>
              <input
                type="text" placeholder="Enter OTP" maxLength={6}
                value={otp} onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setError(""); }}
                className="input-field"
              />
              {error && <Error text={error} />}

              {/* Resend OTP */}
              <div style={{ textAlign: "right", marginTop: 6 }}>
                <button
                  type="button"
                  onClick={async () => {
                    setError(""); setOtp("");
                    try { await sendOTP(email); }
                    catch (err) { setError(err?.error || "Could not resend OTP."); }
                  }}
                  style={{ background: "none", border: "none", color: "var(--gold)", fontSize: 11, cursor: "pointer", fontFamily: "var(--display)" }}
                >
                  Resend OTP
                </button>
              </div>

              <div style={{ display: "flex", justifyContent: "center" }}>
                <button type="submit" className="btn-p" style={{ marginTop: 14 }} disabled={loading}>
                  {loading ? "Verifying…" : "Verify OTP"}
                </button>
              </div>
            </form>
          )}

          {/* ── Step 3: Reset Password ── */}
          {step === 3 && (
            <form onSubmit={handleResetSubmit}>
              <p style={{ color: "var(--slate)", fontSize: 12, marginBottom: 14 }}>
                Create a new password.
              </p>

              {/* New password */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="New Password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    className="input-field"
                    style={{ paddingRight: 40 }}
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)}
                    style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--slate)" }}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div style={{ fontSize: 10, color: "var(--slate2)", marginTop: 6, fontFamily: "var(--display)", letterSpacing: ".05em" }}>
                  Must contain 8+ chars, uppercase, number &amp; special character
                </div>

                {/* Strength meter */}
                {password && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ height: 4, borderRadius: 4, background: "rgba(255,255,255,.05)", overflow: "hidden" }}>
                      <div style={{
                        height: "100%", transition: "width .35s cubic-bezier(.22,1,.36,1)",
                        width: getStrength(password) === "Weak" ? "33%" : getStrength(password) === "Medium" ? "66%" : "100%",
                        background: getStrength(password) === "Weak" ? "rgba(224,122,122,.7)" : getStrength(password) === "Medium" ? "rgba(196,161,94,.6)" : "#6BE092",
                      }} />
                    </div>
                    <div style={{
                      marginTop: 4, fontSize: 10, fontFamily: "var(--display)", letterSpacing: ".08em",
                      color: getStrength(password) === "Weak" ? "rgba(224,122,122,.8)" : getStrength(password) === "Medium" ? "rgba(196,161,94,.8)" : "#6BE092",
                    }}>
                      Password strength: {getStrength(password)}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setError(""); }}
                  className="input-field"
                  style={{ paddingRight: 40 }}
                />
                <button type="button" onClick={() => setShowConfirm((v) => !v)}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--slate)" }}>
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {error && <Error text={error} />}
              <div style={{ display: "flex", justifyContent: "center" }}>
                <button type="submit" className="btn-p" style={{ marginTop: 20 }} disabled={loading}>
                  {loading ? "Resetting…" : "Reset Password"}
                </button>
              </div>
            </form>
          )}

          {/* Back to login */}
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <button onClick={() => navigate("/login")}
              style={{ background: "none", border: "none", color: "var(--gold)", fontFamily: "var(--display)", cursor: "pointer", fontWeight: 700 }}>
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    </>
  );
}