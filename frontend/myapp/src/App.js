import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./Login";
import Password from "./Password"; // OTP verification page
import ChangePassword from "./ChangePassword"; // Change password page
import Register from "./Register"; // Register page

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Register />} /> {/* Default to Register */}
        <Route path="/login" element={<Login />} /> {/* Login page */}
        <Route path="/forgot-password" element={<Password />} /> {/* OTP verification */}
        <Route path="/change-password" element={<ChangePassword />} /> {/* Change password */}
      </Routes>
    </Router>
  );
}

export default App;