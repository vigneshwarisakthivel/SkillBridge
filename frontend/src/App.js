
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider, CssBaseline } from '@mui/material';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS

import React, { useEffect, useState } from "react";
// Import Pages
import HomePage from "./components/home";
import RegisterPage from './components/RegisterPage';
import LoginPage from './components/LoginPage';
import RecentActivity from './components/RecentActivity.js';
import TestManagement from './components/TestManagement';
import TestTakingPage from './components/testwrite';
import CreateNewTest from './components/testcreation';
import UserManagement from './components/UserManagement';
import EditTest from './components/edit-test';
import QuestionCreator from './components/questioncreation';
import ForgotPasswordPage from './components/forgotpassword';
import TestLoginPage from "./components/testform";
import UserDashboard from "./components/admin-dashboard.js";
import QuestionManagement from './components/QuestionManagement';



const App = () => {
  return (

      <BrowserRouter>
        <Routes>
        
          <Route path="/" element={<HomePage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/question-management" element={<QuestionManagement />} />
          <Route path="/questioncreation" element={<QuestionCreator />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/RecentActivity" element={<RecentActivity />} />
          <Route path="/TestManagement" element={<TestManagement />} />
          <Route path="/edit-test/:id" element={<EditTest />} />
          <Route path="/testcreation" element={<CreateNewTest />} />
          <Route path="/test/:uuid" element={<TestLoginPage />} />
          <Route path="/admin-dashboard" element={<UserDashboard />} />
          <Route path="/test/:uuid/test" element={<TestTakingPage />} />
          <Route path="/UserManagement" element={<UserManagement />} />
        </Routes>
      </BrowserRouter>

  );
};

export default App;

