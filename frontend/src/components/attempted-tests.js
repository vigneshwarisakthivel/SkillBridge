import React, { useState, useEffect } from "react";
import logo from "../assets/Image20210206041010-1024x518.png";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Drawer,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Alert,
  Paper,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import TwitterIcon from "@mui/icons-material/Twitter";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000/api";

const AttemptedTest = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notification, setNotification] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [reviewData, setReviewData] = useState(null);
  const [attemptedTests, setAttemptedTests] = useState([]);
  const [highestScore, setHighestScore] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [certificatesEarned, setCertificatesEarned] = useState(0);
  const [attemptId, setAttemptId] = useState(null); 
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const token = localStorage.getItem("user_token");
        const response = await axios.get(`${API_BASE_URL}/test-attempts/statistics/`, {
          headers: { Authorization: `Token ${token}` }
        });

        const data = response.data;
        setHighestScore(data.highest_score);
        setAccuracy(data.accuracy);
        setCertificatesEarned(data.certificates_earned);
      } catch (error) {
        console.error("Error fetching user stats:", error);
        setNotification("Failed to load user stats.");
      }
    };

    fetchUserStats();
  }, []);

  useEffect(() => {
    const fetchAttemptedTests = async () => {
      try {
        const token = localStorage.getItem("user_token");
        const response = await axios.get(`${API_BASE_URL}/attempted-tests/`, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });
        setAttemptedTests(response.data);
      } catch (error) {
        console.error("Error fetching attempted tests:", error.response ? error.response.data : error.message);
        setNotification("Failed to load attempted tests.");
      }
    };

    fetchAttemptedTests();
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredTests = (Array.isArray(attemptedTests) ? attemptedTests : []).filter((test) =>
    (test.title?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (test.subject?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleExportPDF = async (testId) => { 
    console.log("Attempting to export certificate for Test ID:", testId);  // Debugging

    try {
      const token = localStorage.getItem("user_token");
      const response = await axios.get(`${API_BASE_URL}/test-attempts/${testId}/export_certificate/`, {
        responseType: 'blob',
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'certificate.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error exporting certificate:", error);
      setNotification("Failed to export certificate.");
    }
};


  const handleReview = async (testId) => {
    try {
        const token = localStorage.getItem("user_token");
        const response = await axios.get(`${API_BASE_URL}/test-attempts/27/review/`, {
            headers: {
                Authorization: `Token ${token}`,
            },
        });
        setReviewData(response.data);
        setOpenModal(true);
    } catch (error) {
        console.error("Error fetching review data:", error);
        setNotification("Failed to load review data.");
    }
};

  const handleCloseReview = () => {
    setOpenModal(false);
    setReviewData(null);
  };
  const fetchUserDetails = async () => {
    try {
        const token = localStorage.getItem("user_token");
        const response = await axios.get(`${API_BASE_URL}/user-profile/`, {
            headers: { Authorization: `Token ${token}` },
        });
        return {
            username: response.data.username, // Adjust based on actual API response
            userId: response.data.id, // Ensure this matches the field returned by your API
        };
    } catch (error) {
        console.error("Error fetching user details:", error);
        return null; // Return null or handle the error as needed
    }
};
  // Function to send data to Attempted Tests API
const sendDataToAttemptedTestsAPI = async (testId, testTitle, testSubject, percentage, passCriteria) => {
    try {
      const token = localStorage.getItem("user_token");
      const userDetails = await fetchUserDetails(); // Fetch user details

      // Retrieve User Statistics
      const statisticsResponse = await axios.get(
        `${API_BASE_URL}/test-attempts/statistics/`,
        { headers: { Authorization: `Token ${token}` } }
      );

      const { highest_score, accuracy, certificates_earned } = statisticsResponse.data;

      // Retrieve Ranking after submission
      const rankingResponse = await axios.get(
        `${API_BASE_URL}/test-attempts/rank/${testId}/`,
        { headers: { Authorization: `Token ${token}` } }
      );

      const userRank = rankingResponse.data.rank || null;

      // Send data to Attempted Tests API
      await axios.post(
        `${API_BASE_URL}/attempted-tests/`,
        {
          user: userDetails?.userId,
          attempted_tests: [{
            test: testId,
            title: testTitle,
            subject: testSubject,
            date: new Date().toISOString(), // Use current date
            max_score: highest_score,
            status: percentage >= passCriteria ? "passed" : "failed",
            rank: userRank,
            accuracy: accuracy,
            certificates_earned: certificates_earned
          }]
        },
        { headers: { Authorization: `Token ${token}` } }
      );
    } catch (error) {
      console.error("Error sending data to attempted tests API:", error);
      setNotification("Failed to send data to attempted tests.");
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="fixed" sx={{ backgroundColor: "#003366" }}>
        <Toolbar>
          <IconButton color="inherit" onClick={toggleSidebar} edge="start" sx={{ marginRight: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Skill Bridge Dashboard
          </Typography>
          <Button color="inherit" onClick={() => navigate("/")}>Home</Button>
          <Button color="inherit" onClick={() => navigate("/userprofile")}>User Profile</Button>
          <Button color="inherit" onClick={() => navigate("/available-tests")}>Test List</Button>
          <Button color="inherit" onClick={() => navigate("/usersetting")}>Settings</Button>
          <Button color="inherit" onClick={() => navigate("/logout")}>Logout</Button>
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={isSidebarOpen} onClose={toggleSidebar}>
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

      <Box
        sx={{
          position: "fixed",
          top: "64px",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "20px",
          fontFamily: "Arial, sans-serif",
          overflowY: "auto",
        }}
      >
        <Typography variant="h4" sx={{ textAlign: "center", mb: 3, color: "primary.main" }}>
          Attempted Tests
        </Typography>
        <input
          type="text"
          placeholder="🔎Search by test name or subject..."
          value={searchTerm}
          onChange={handleSearch}
          style={styles.searchBox}
        />

        <div style={styles.widgetContainer}>
          <div style={styles.widget}>✅ Total Tests Attempted: {attemptedTests.length}</div>
          <div style={styles.widget}>🏆 Highest Score: {highestScore}</div>
          <div style={styles.widget}>🎯 Accuracy: {accuracy}%</div>
          <div style={styles.widget}>📜 Certificates Earned: {certificatesEarned}</div>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Test Name</th>
              <th style={styles.th}>Subject</th>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Score</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Rank</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTests.map((test, index) => (
              <tr key={index}>
                <td style={styles.td}>{test.title}</td>
                <td style={styles.td}>{test.subject}</td>
                <td style={styles.td}>{new Date(test.date).toLocaleDateString()}</td>
                <td style={styles.td}>{test.max_score}</td>
                <td style={styles.td}>{test.status}</td>
                <td style={styles.td}>{test.rank}</td>
                <td style={styles.td}>
                  <button onClick={() => handleReview(test.id)} style={styles.button}>Review</button>
                  <button onClick={() => handleExportPDF(test.id)} style={styles.button}>Download Certificate</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Box>

      <Snackbar open={notification !== ""} autoHideDuration={3000} onClose={() => setNotification("")}>
        <Alert onClose={() => setNotification("")} severity="info">{notification}</Alert>
      </Snackbar>

      <Dialog open={openModal} onClose={handleCloseReview} maxWidth="md" fullWidth>
        <DialogTitle sx={{ backgroundColor: "#003366", color: "#fff" }}>Review Questions</DialogTitle>
        <DialogContent>
          <Paper elevation={3} sx={{ padding: 2 }}>
            {reviewData ? (
              <div>
                <Typography variant="h6" sx={{ marginBottom: 2 }}>All Questions:</Typography>
                <ul>
                  {reviewData.map((q, index) => (
                    <li key={index}>
                      <Typography variant="body1">{q.question} - <strong>{q.correct ? "Correct" : "Incorrect"}</strong> (Your answer: {q.answer})</Typography>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <Typography>No review data available.</Typography>
            )}
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReview} color="primary">Close</Button>
        </DialogActions>
      </Dialog>

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
      <footer
        style={{
          backgroundColor: "#003366",
          color: "white",
          padding: "16px 0",
          textAlign: "center",
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100%",
          zIndex: 1000,
        }}
      >
        <Typography>© 2025 Skill Bridge. All rights reserved.</Typography>
        <div>
          <IconButton href="https://twitter.com" color="inherit">
            <TwitterIcon />
          </IconButton>
          <IconButton href="https://facebook.com" color="inherit">
            <FacebookIcon />
          </IconButton>
          <IconButton href="https://instagram.com" color="inherit">
            <InstagramIcon />
          </IconButton>
        </div>
      </footer>
      </Box>
    </Box>
  );
};

const styles = {
  container: { padding: "20px", fontFamily: "Arial, sans-serif", minHeight: "100vh" },
  heading: { textAlign: "center", marginBottom: "20px", color: "#003366" },
  table: { width: "100%", borderCollapse: "collapse", marginBottom: "20px", backgroundColor: "#ffffff", color: "#003366", borderRadius: "8px", overflow: "hidden", boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)" },
  th: { background: "#003366", padding: "12px", border: "1px solid #ddd", color: "white", textAlign: "center" },
  td: { padding: "12px", border: "1px solid #ddd", textAlign: "center", backgroundColor: "#ffffff", color: "#333", boxShadow: "2px 2px 5px rgba(0, 0, 0, 0.1)" },
  widgetContainer: { display: "flex", justifyContent: "space-around", marginBottom: "20px" },
  widget: { padding: "10px", background: "#003366", borderRadius: "5px", textAlign: "center", width: "30%", color: "#fff", fontWeight: "bold", border: "1px solid #ddd" },
  searchBox: { width: "30%", padding: "10px", marginBottom: "20px", borderRadius: "5px", border: "1px solid #ccc" },
  button: { padding: "5px 10px", background: "#007bff", color: "#fff", border: "none", cursor: "pointer", fontWeight: "bold", borderRadius: "5px", margin: "5px" },
};

export default AttemptedTest;