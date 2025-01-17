import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./Login";
import Password from "./Password"; // OTP verification page
import ChangePassword from "./ChangePassword"; // Change password page
import Register from "./Register"; // Register page

function App() {
  const [selectedEmail, setSelectedEmail] = useState(null);

  const emails = [
    { id: 1, sender: 'Hannah Morgan', subject: 'Meeting scheduled', body: 'Hi James, I just scheduled a meeting...', time: '1:24 PM' },
    { id: 2, sender: 'Megan Clark', subject: 'Update on marketing campaign', body: 'Hey Richard, here’s an update on...', time: '12:32 PM' },
    // Add more emails here...
  ];

  return (
    <Router>
      <Sidebar />
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