import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types"; // Import PropTypes
import styled from "styled-components";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { AppBar, Toolbar, Typography, Button, IconButton, Box, Drawer, List, ListItem, ListItemText } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import TwitterIcon from "@mui/icons-material/Twitter";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Image20250320122406.png";
import axios from "axios"; // Import Axios

const TestHistory = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState(null);
  const [tests, setTests] = useState([]); // State to hold test data, initialized as an empty array
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state

  const fetchPerformanceHistory = useCallback(async () => {
    const token = localStorage.getItem("user_token"); // Get token from localStorage
    if (!token) {
        console.error("No token found in localStorage.");
        setLoading(false);
        return;
    }

    try {
        // Fetch performance history
        const response = await fetch("https://onlinetestcreationbackend.onrender.com/api/performance-history/", {
            headers: { Authorization: `Token ${token}` },
        });
        if (!response.ok) {
            throw new Error("Network response was not ok for performance history");
        }
        const performanceData = await response.json();

        console.log("Performance Data:", performanceData); // Log the response to check its structure

        // Ensure performanceData is an array
        if (Array.isArray(performanceData)) {
            setTests(performanceData); // Set the performance data into state
        } else {
            console.error("Expected performance data to be an array, but got:", performanceData);
            setTests([]); // Set to an empty array if the data is not in the expected format
        }
    } catch (error) {
        setError(error.message); // Set error message
    } finally {
        setLoading(false); // Set loading to false after fetching
    }
}, []); // Empty dependency array means this runs once on mount

  useEffect(() => {
    fetchPerformanceHistory(); // Call the fetch function
  }, [fetchPerformanceHistory]); // Include fetchPerformanceHistory in the dependency array

  // Prepare graph data from tests
  const graphData = tests.map((test) => ({
    name: test.test_title, // Assuming test_title is the correct field
    score: test.total_score, // Assuming total_score is the correct field
  }));

  const submitPerformanceData = async (performanceData) => {
    const token = localStorage.getItem("user_token"); // Get token from localStorage
    if (!token) {
      console.error("No token found in localStorage.");
      return;
    }

    try {
      const response = await axios.get("https://onlinetestcreationbackend.onrender.com/api/performance-history/", performanceData, {
        headers: { Authorization: `Token ${token}` },
      });

      if (response.status === 201) {
        console.log("Performance data submitted successfully:", response.data);
        // Optionally, you can fetch the updated performance history here
        fetchPerformanceHistory();
      } else {
        console.error("Failed to submit performance data:", response.data);
      }
    } catch (error) {
      console.error("Error submitting performance data:", error.message);
    }
  };

  const handleTestCompletion = () => {
    const performanceData = {
      username: "userDetails.username", // Replace with actual username
      test_title: "questions[0].test_title", // Replace with actual test title
      attempted_test_id: "testId", // Replace with actual test ID
      attempt_date: new Date().toISOString(),
      total_score: "percentage", // Replace with actual score
      total_questions: "totalQuestions", // Replace with actual total questions
      time_taken: "timeTaken", // Replace with actual time taken
      passed: "passFailStatus", // Replace with actual pass/fail status
      can_reattempt: false, // Set based on your logic
      answers: "answersToSubmit", // Replace with actual answers array
    };

    submitPerformanceData(performanceData);
  };

  if (loading) {
    return <div>Loading...</div>; // Loading state
  }

  if (error) {
    return <div>Error: {error}</div>; // Error state
  }

  return (
    <div>
      {/* Header */}
      <AppBar position="fixed" sx={{ backgroundColor: "#003366", padding: "6px 16px" }}>
        <Toolbar sx={{ padding: "0" }}>
          <IconButton color="inherit" edge="start" sx={{ marginRight: 2 }} onClick={() => setIsSidebarOpen(true)}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontSize: "1rem" }}>
            SkillBridge Online Test Platform
          </Typography>
          <Button color="inherit" onClick={() => navigate("/")}>Home</Button>
          <Button color="inherit" onClick={() => navigate("/userprofile")}>User Profile</Button>
          <Button color="inherit" onClick={() => navigate("/attempted-tests")}>Test List</Button>
          <Button color="inherit" onClick={() => navigate("/usersetting")}>Setting</Button>
          <Button color="inherit" onClick={() => navigate("/Logout")}>Logout</Button>
        </Toolbar>
      </AppBar>
  
      {/* Sidebar */}
      <Drawer open={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}>
        <Box sx={{ width: 250, textAlign: "center", padding: "16px" }}>
          {isSidebarOpen && (
            <img
              src={logo}
              alt="Logo"
              style={{
                maxWidth: "100%",
                height: "auto",
                marginBottom: "16px",
                borderRadius: "8px",
              }}
            />
          )}
          <List>
            <ListItem button onClick={() => navigate('/user-dashboard')}>
              <ListItemText primary="Dashboard" />
            </ListItem>

            <ListItem button onClick={() => navigate('/attempted-tests')}>
              <ListItemText primary="Attempted Tests" />
            </ListItem>
                        <ListItem button onClick={() => navigate('/performancehistory')}>
                          <ListItemText primary="Performance History" />
                        </ListItem>
            <ListItem button onClick={() => navigate('/usersetting')}>
              <ListItemText primary="Settings" />
            </ListItem>
            <ListItem button onClick={() => navigate('/logout')}>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
  
      {/* Main Content */}
      <MainContent>
        <CenteredHeading>Performance History</CenteredHeading>
        <ChartContainer>
          <ResponsiveContainer width="30%" height={250}>
            <BarChart data={graphData}>
              <CartesianGrid strokeDasharray="1  1" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="score" fill="#003366" barSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
        
        <TestHistoryTable tests={tests} onReview={setSelectedTest} />
        
        {selectedTest && <TestReview test={selectedTest} closeReview={() => setSelectedTest(null)} />}
        
        {/* Footer */}
        <Box
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "#003366",
            color: "white",
            padding: "16px",
            textAlign: "center",
          }}
        >
          <Typography variant="body2" sx={{ color: "white", marginBottom: "2px" }}>
            © {new Date().getFullYear()} SkillBridge Online Test Platform. All rights reserved.
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "2px" }}>
            <IconButton color="inherit" onClick={() => window.open("https://twitter.com", "_blank")}><TwitterIcon /></IconButton>
            <IconButton color="inherit" onClick={() => window.open("https://facebook.com", "_blank")}><FacebookIcon /></IconButton>
            <IconButton color="inherit" onClick={() => window.open("https://instagram.com", "_blank")}><InstagramIcon /></IconButton>
          </Box>
        </Box>
      </MainContent>
    </div>
  );
};

// PropTypes for TestHistory
TestHistory.propTypes = {
  tests: PropTypes.array,
};

const MainContent = styled.div`
  position: fixed;
  top: 64px; /* Adjust this value based on your AppBar height */
  left: 0;
  right: 0;
  bottom: 60px; /* Adjust this value based on your footer height */
  overflow-y: auto; /* Allow scrolling if content overflows */
  padding: 20px; /* Add some padding */
  background-color: #f9f9f9; /* Optional: background color for the content area */
`;

const TestHistoryTable = ({ tests, onReview }) => {
  return (
      <Table>
          <thead>
              <tr>
                  <th>Test Name</th>
                  <th>Score Obtained</th>
                  <th>Time Taken</th>
                  <th>Pass /Fail Status</th>
                  <th>Review</th>
              </tr>
          </thead>
          <tbody>
              {tests.map((test, index) => (
                  <tr key={index}>
                      <td>{test.test_title}</td> {/* Display Test Title */}
                      <td>{test.total_score}</td> {/* Display Score Obtained */}
                      <td>{test.time_taken} seconds</td> {/* Display Time Taken */}
                      <td>{test.passed ? "Pass" : "Fail"}</td> {/* Display Pass/Fail Status */}
                      <td>
                          <ReviewButton onClick={() => onReview(test)}>Review</ReviewButton> {/* Review Button */}
                      </td>
                  </tr>
              ))}
          </tbody>
      </Table>
  );
};

const TestReview = ({ test, closeReview }) => {
  return (
    <ModalOverlay>
      <ModalContainer>
        <h3>Test Review: {test.test_title}</h3>
        <p><strong>Score:</strong> {test.total_score}</p>
        <p><strong>Status:</strong> {test.passed ? "✅ Pass" : "❌ Fail"}</p>
        <h4>Correct vs Incorrect Answers:</h4>
        <ul style={{ textAlign: "left" }}>
          {test.answers.map((answer, index) => (
            <li key={index}>
              <strong>Q{answer.questionId}:</strong> {answer.correct ? "✅" : "❌"}
              {!answer.correct && <p>📌 Explanation: {answer.explanation}</p>}
            </li>
          ))}
        </ul>
        {test.canReattempt && <StyledButton className="reattempt">🔄 Reattempt Test</StyledButton>}
        <StyledButton className="close" onClick={closeReview}>❌ Close</StyledButton>
      </ModalContainer>
    </ModalOverlay>
  );
};

const ReviewButton = styled.button`
  padding: 8px 15px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  transition: 0.3s;
  display: flex;
  align-items: center;
  gap: 5px;

  &:hover {
    background-color: #0056b3;
  }
`;

export default TestHistory;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
  font-family: "Arial", sans-serif;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: hidden;

  thead {
    background-color: rgb(16, 73, 86); /* Header background color */
    color: white; /* Header text color */
  }

  th, td {
    padding: 12px;
    text-align: left;
    border: 1px solid #ddd;
  }

  th {
    font-weight: bold;
    text-transform: uppercase; /* Uppercase header text */
  }

  tr:nth-child (even) {
    background-color: #f2f2f2; /* Zebra striping for even rows */
  }

  tr:hover {
    background-color: #f1f1f1; /* Hover effect for rows */
  }

  tfoot {
    background-color: #f9f9f9; /* Footer background color */
    font-weight: bold; /* Footer text bold */
  }
`;

const CenteredHeading = styled.h1`
  text-align: center;
  font-size: 2rem;
`;

const ChartContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  padding: 20px;
  background: #ffffff; /* White background */
  border-radius: 16px;
  box-shadow: 0 6px 20px rgba(0, 115, 255, 0.3); /* Vibrant blue glow */
  max-width: 80%;
  margin: 20px auto;
  border: 3px solid #007bff; /* Bold Blue Border */
  position: relative;
  overflow: hidden;
  transition: all 0.4s ease-in-out;

  &:hover {
    transform: scale(1.03);
    box-shadow: 0 8px 24px rgba(0, 115, 255, 0.5);
  }

  /* Dazzling animated gradient border */
  &::before {
    content: "";
    position: absolute;
    inset: -5px;
    z-index: -1;
    
    filter: blur(10px);
    opacity: 0.6;
    transition: opacity 0.4s ease-in-out;
  }

  &:hover::before {
    opacity: 1;
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
`;

const ModalContainer = styled.div`
  background: white;
  padding: 20px;
  border-radius: 12px;
  width: 400px;
  max-width: 90%;
  text-align: center;
`;

const StyledButton = styled.button`
  padding: 10px 15px;
  border-radius: 8px;
`;