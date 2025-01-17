import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Password = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState(""); // New state for the info message
  const navigate = useNavigate();

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    // Show message when email is entered
    if (e.target.value) {
      setInfoMessage("An OTP will be sent to your email address.");
    } else {
      setInfoMessage(""); // Clear message if email is empty
    }
  };

  const handleOtpChange = (e) => {
    setOtp(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate email
    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    // Simulate OTP generation and validation process (replace with actual backend logic)
    if (!otp) {
      setError("Please enter the OTP.");
      return;
    }

    // Simulate OTP check
    if (otp === "1234") {
      setError("");
      setMessage("OTP verified successfully!");
      setTimeout(() => {
        navigate("/change-password"); // Navigate to Change Password page
      }, 2000); // Delay to show success message
    } else {
      setError("Invalid OTP. Please try again.");
    }
  };

  return (
    <div className="login-container">
      <h2>Verify OTP</h2>
      {error && <div className="error-message">{error}</div>}
      {message && <div className="success-message">{message}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={handleEmailChange}
            placeholder="Enter your email"
            required
          />
        </div>

        {/* Information message about OTP */}
        {infoMessage && <div className="info-message">{infoMessage}</div>}

        <div className="input-group">
          <label htmlFor="otp">Enter OTP</label>
          <input
            type="text"
            id="otp"
            name="otp"
            value={otp}
            onChange={handleOtpChange}
            placeholder="Enter OTP"
            required
          />
        </div>
        <button type="submit" className="login-btn">
          Verify OTP
        </button>
      </form>
    </div>
  );
};

export default Password;
