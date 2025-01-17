import React, { useState } from 'react';
import './ChangePassword.css';

const ChangePassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleNewPasswordChange = (e) => setNewPassword(e.target.value);
  const handleConfirmPasswordChange = (e) => setConfirmPassword(e.target.value);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate if the new password and confirm password match
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      setMessage('');
      return;
    }

    // If validation passes, simulate success and show message
    setError('');
    setMessage('Password changed successfully!'); // Display success message
  };

  return (
    <div className="change-password-container">
      <h2>Change Password</h2>

      {/* Error message if validation fails */}
      {error && <div className="error-message">{error}</div>}

      {/* Success message */}
      {message && <div className="success-message">{message}</div>}

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label htmlFor="newPassword">New Password</label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            value={newPassword}
            onChange={handleNewPasswordChange}
            placeholder="Enter new password"
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            placeholder="Confirm new password"
            required
          />
        </div>
        <button type="submit" className="reset-password-btn">
          Reset Password
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;
