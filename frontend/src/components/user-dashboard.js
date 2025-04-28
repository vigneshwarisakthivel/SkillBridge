import React, { useState, useEffect } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, Tooltip,Legend } from "recharts";
import { Container, Box, Modal, CircularProgress,Snackbar, Alert, AppBar, Toolbar, Typography, Button, Drawer, List, ListItem, ListItemText, IconButton, Card, CardContent, Grid, Avatar, Divider } from "@mui/material";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import { useNavigate } from "react-router-dom";
import NotificationsIcon from "@mui/icons-material/Notifications";
import logo from "../assets/Image20250320122406.png";
import Badge from "@mui/material/Badge";
import TwitterIcon from '@mui/icons-material/Twitter';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot } from "@mui/lab";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import DeleteIcon from "@mui/icons-material/Delete"; // Import the Delete icon
import MenuIcon from "@mui/icons-material/Menu";
const API_BASE_URL = 'https://onlinetestcreationbackend.onrender.com/api';
const UserDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userData, setUserData] = useState({});
  const [open, setOpenModal] = useState(false);
  const [error, setError] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [completedTests, setCompletedTests] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [performanceStats, setPerformanceStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const aggregatedData = [
    { name: "Low Scores (0-59)", value: performanceStats.filter(stat => stat.score < 60).length },
    { name: "Average Scores (60-69)", value: performanceStats.filter(stat => stat.score >= 60 && stat.score < 70).length },
    { name: "Above Average Scores (70-79)", value: performanceStats.filter(stat => stat.score >= 70 && stat.score < 80).length },
    { name: "Good Scores (80-89)", value: performanceStats.filter(stat => stat.score >= 80 && stat.score < 90).length },
    { name: "High Scores (90-99)", value: performanceStats.filter(stat => stat.score >= 90 && stat.score < 100).length },
    { name: "Perfect Scores (100)", value: performanceStats.filter(stat => stat.score === 100).length },
  ];

  const COLORS = ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40"];

const onClose = () => {
  setIsOpen(false);
};

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  useEffect(() => {
    const fetchAchievements = async () => {
      const token = localStorage.getItem("user_token");
      const headers = {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      };

      try {
        const response = await axios.get(`${API_BASE_URL}/achievements/`, { headers });
        setAchievements(response.data.achievements || []); // Ensure it's an array
      } catch (err) {
        console.error("Error fetching achievements:", err);
        setError("Failed to load achievements.");
      } finally {
        setLoading(false);
      }
    };

    fetchAchievements();
  }, []);

  const fetchUserData = async () => {
    const token = localStorage.getItem('user_token');
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Token ${token}`,
    };

    try {
      const response = await axios.get(`${API_BASE_URL}/userss/${userData.id}/`, { headers });
      setUserData(response.data);
    } catch (error) {
      console.error("Error fetching user profile data:", error);
    }
  };
  const fetchData = async () => {
    const token = localStorage.getItem("user_token");
    const headers = { Authorization: `Token ${token}`, "Content-Type": "application/json" };
  
    try {
      const [userRes, activitiesRes, testsRes, notificationsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/userss/`, { headers }),
        axios.get(`${API_BASE_URL}/recent-activities/`, { headers }),
        axios.get(`${API_BASE_URL}/completed-tests/`, { headers }),
        axios.get(`${API_BASE_URL}/notifications/`, { headers })
      ]);
  
      setUserData(userRes.data);
      setRecentActivities(activitiesRes.data);
      setCompletedTests(testsRes.data);
      setNotifications(notificationsRes.data);
  
      const userAchievements = calculateAchievements(testsRes.data);
      setAchievements(userAchievements);
  
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Now fetchData is globally visible inside your component
  
  
  useEffect(() => {
      fetchData();
    }, []);
  useEffect(() => {
    const userRole = localStorage.getItem("role"); // Retrieve role from localStorage

    if (userRole !== "user") {
      setOpenModal(true); // Show modal if not admin
    } else {
      fetchData(); // Fetch data if the user is an admin
    }
  }, []);

  const handleClose = () => {
    setOpenModal(false);
    navigate("/"); // Redirect to home or another page
  };
  useEffect(() => {
      if (!userData?.id) return; // ✅ Ensure user ID is available
  
      const userToken = localStorage.getItem("user_token");
  
      axios
        .get(`${API_BASE_URL}/users/${userData.id}/`, {
          headers: { Authorization: `Token ${userToken}` },
        })
        .then((response) => {
          setUserData(response.data);
        })
        .catch((error) => {
          console.error("Error fetching user profile data:", error);
        });
    }, [userData.id]); // ✅ Depend on `userData` to ensure it has been fetched first
  
    // Fetch performance stats
    useEffect(() => {
      const fetchPerformanceStats = async () => {
        const token = localStorage.getItem("user_token");
        const headers = {
          Authorization: `Token ${token}`,
          "Content-Type": "application/json",
        };
  
        try {
          const response = await axios.get(`${API_BASE_URL}/performance-stats/`, { headers });
          setPerformanceStats(response.data || []); // Ensure it's an array
        } catch (error) {
          console.error("Error fetching performance stats:", error);
        }
      };
  
      fetchPerformanceStats();
    }, []);
  const calculateAchievements = (completedTests) => {
    let achievementsList = [];
  
    const highScoreTests = completedTests.filter(test => (test.score / test.total_score) * 100 > 90);
    const consistentTests = completedTests.filter(test => (test.score / test.total_score) * 100 > 80);
    const perfectTests = completedTests.filter(test => test.score === test.total_score);
    const accuracyTests = completedTests.filter(test => test.accuracy >= 95);
    const fastTests = completedTests.filter(test => test.completion_time < 50);
  
    if (completedTests.length >= 1) achievementsList.push("🏆 First Step: Completed your first test!");
    if (completedTests.length >= 10) achievementsList.push("📚 Dedicated Learner: Completed 10 tests!");
    if (completedTests.length >= 50) achievementsList.push("🎖️ Test Marathoner: Completed 50 tests!");
  
    if (highScoreTests.length > 0) achievementsList.push("🔥 High Scorer: Scored above 90% in a test!");
    if (consistentTests.length >= 5) achievementsList.push("💯 Consistent Performer: Scored above 80% in 5+ tests!");
    if (perfectTests.length > 0) achievementsList.push("🌟 Perfect Score: Achieved 100% in a test!");
    if (accuracyTests.length > 0) achievementsList.push("🎯 Sharp Shooter: Achieved 95%+ accuracy in a test!");
    if (fastTests.length > 0) achievementsList.push("⚡ Speedster: Completed a test in record time!");
  
    return achievementsList;
  };
    
  
  useEffect(() => {
    const fetchNotifications = async () => {
      const token = localStorage.getItem("user_token");
      const headers = {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      };
  
      try {
        const response = await axios.get(`${API_BASE_URL}/notifications/`, { headers });
        // Remove duplicate notifications by filtering unique announcement titles
        const allNotifications = response.data;
        const uniqueNotifications = allNotifications.reduce((acc, notif) => {
          if (!acc.some((n) => n.announcement.title === notif.announcement.title)) {
            acc.push(notif);
          }
          return acc;
        }, []);
        setNotifications(uniqueNotifications);

      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };
  
    fetchNotifications();
  }, []);
    // Open Notification Modal
    const handleOpenNotifications = async () => {
      setIsNotificationOpen(true);
      setHasUnreadNotifications(false);
    
      const token = localStorage.getItem("user_token");
      const headers = {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      };
    
      try {
        await axios.post(`${API_BASE_URL}/notifications/mark-as-read/`, {}, { headers });
    
        // Update UI: Mark notifications as read
        setNotifications((prevNotifications) =>
          prevNotifications.map((notif) => ({ ...notif, is_read: true }))
        );
      } catch (error) {
        console.error("Error marking notifications as read:", error);
      }
    };
    
    // Close Notification Modal
    const handleCloseNotifications = () => {
      setIsNotificationOpen(false);
    };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }
  const handleDeleteActivity = async (activityId) => {
    const token = localStorage.getItem("user_token");
    const headers = {
      Authorization: `Token ${token}`,
      "Content-Type": "application/json",
    };
  
    try {
      await axios.delete(`${API_BASE_URL}/recent-activities/${activityId}/`, { headers });
  
      // Remove the deleted activity from state
      setRecentActivities(recentActivities.filter(activity => activity.id !== activityId));
  
      setNotification("Activity deleted successfully!");
    } catch (error) {
      console.error("Error deleting activity:", error);
      setNotification("Failed to delete activity.");
    }
  };
  
  return (
    <>
    <div>
      {/* Other components or elements */}
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <AppBar position="fixed" sx={{ backgroundColor: "#003366", padding: "6px 16px" }}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={toggleSidebar}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>Skill Bridge Dashboard</Typography>
            <Button color="inherit" onClick={() => navigate("/")}>Home</Button>
            <Button color="inherit" onClick={() => navigate("/userprofile")}>User  Profile</Button>
            <Button color="inherit" onClick={() => navigate("/attempted-tests")}>Test List</Button>
            <Button color="inherit" onClick={() => navigate("/usersetting")}>Settings</Button>
            <Button color="inherit" onClick={() => navigate("/logout")}>Logout</Button>
            <IconButton color="inherit" onClick={handleOpenNotifications}>
              <Badge badgeContent={notifications.filter(n => !n.is_read).length} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Toolbar>
        </AppBar>
        {/* Other components like Drawer, main content, etc. */}
      </Box>
    </div>
 
  
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar position="fixed" sx={{ backgroundColor: "#003366", padding: "6px 16px" }}>
        <Toolbar>
        <IconButton edge="start" color="inherit" onClick={toggleSidebar}>
      <MenuIcon />
    </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Skill Bridge Dashboard</Typography>
          <Button color="inherit" onClick={() => navigate("/")}>Home</Button>
          <Button color="inherit" onClick={() => navigate("/userprofile")}>User Profile</Button>
          <Button color="inherit" onClick={() => navigate("/attempted-tests")}>Test List</Button>
          <Button color="inherit" onClick={() => navigate("/usersetting")}>Settings</Button>
          <Button color="inherit" onClick={() => navigate("/logout")}>Logout</Button>
          <IconButton color="inherit" onClick={handleOpenNotifications}>
          <Badge badgeContent={notifications.filter(n => !n.is_read).length} color="error">

    <NotificationsIcon />
  </Badge>
</IconButton>
        </Toolbar>
      </AppBar>
      <Drawer open={isSidebarOpen} onClose={toggleSidebar}>
        <Box sx={{ width: 250, textAlign: "center", padding: "16px" }}>
          <img src={logo} alt="Logo" style={{ maxWidth: "100%", height: "auto", marginBottom: "16px" }} />

 <List>
<ListItem sx={{ display: 'flex', justifyContent: 'flex-start' }}>
  <Button
    onClick={() => navigate('/user-dashboard')}
    sx={{
      color: "#003366", // Dark blue color
      fontWeight: "bold",
      textAlign: "left",
      fontSize: "16px", // Align the text to the left
      width: "100%", // Take up full width of the ListItem
      justifyContent: "flex-start", // Align the button content to the left
    }}
  >
    Dashboard
  </Button>
</ListItem>
<ListItem sx={{ display: 'flex', justifyContent: 'flex-start' }}>
  <Button
    onClick={() => navigate('/test-creation')}
    sx={{
      color: "#003366", // Dark blue color
      fontWeight: "bold",
      fontSize: "16px",
      textAlign: "left", // Align the text to the left
      width: "100%", // Take up full width of the ListItem
      justifyContent: "flex-start", // Align the button content to the left
    }}
  >
    Test Creation
  </Button>
</ListItem>

<ListItem sx={{ display: 'flex', justifyContent: 'flex-start' }}>
  <Button
    onClick={() => navigate('/attempted-tests')}
    sx={{
      color: "#003366", // Dark blue color
      fontWeight: "bold",
      fontSize: "16px",
      textAlign: "left", // Align the text to the left
      width: "100%", // Take up full width of the ListItem
      justifyContent: "flex-start", // Align the button content to the left
    }}
  >
    Attempted Tests
  </Button>
</ListItem>

<ListItem sx={{ display: 'flex', justifyContent: 'flex-start' }}>
  <Button
    onClick={() => navigate('/performancehistory')}
    sx={{
      color: "#003366", // Dark blue color
      fontWeight: "bold",
      fontSize: "16px",
      textAlign: "left", // Align the text to the left
      width: "100%", // Take up full width of the ListItem
      justifyContent: "flex-start", // Align the button content to the left
    }}
  >
    Performance History
  </Button>
</ListItem>

<ListItem sx={{ display: 'flex', justifyContent: 'flex-start' }}>
  <Button
    onClick={() => navigate('/usersetting')}
    sx={{
      color: "#003366", // Dark blue color
      fontWeight: "bold",
      fontSize: "16px",
      textAlign: "left", // Align the text to the left
      width: "100%", // Take up full width of the ListItem
      justifyContent: "flex-start", // Align the button content to the left
    }}
  >
    Settings
  </Button>
</ListItem>

<ListItem sx={{ display: 'flex', justifyContent: 'flex-start' }}>
  <Button
    onClick={() => navigate('/logout')}
    sx={{
      color: "#003366", // Dark blue color
      fontWeight: "bold",
      fontSize: "16px",
      textAlign: "left", // Align the text to the left
      width: "100%", // Take up full width of the ListItem
      justifyContent: "flex-start", // Align the button content to the left
    }}
  >
    Logout
  </Button>
</ListItem>
        </List>
        </Box>
      </Drawer>
      <Modal open={isNotificationOpen} onClose={handleCloseNotifications}>

      <Box
        sx={{
          width: 400,
          bgcolor: "white",
          p: 2,
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          borderRadius: 2,
          boxShadow: 24
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          Notifications
        </Typography>
        <List>
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <ListItem key={notif.id} sx={{ borderBottom: "1px solid #ddd" }}>
                <ListItemText
                  primary={notif.announcement?.title || "No Title"}
                  secondary={notif.announcement?.message || "No Message"}
                />
              </ListItem>
            ))
          ) : (
            <Typography variant="body2" sx={{ textAlign: "center" }}>
              No new notifications
            </Typography>
          )}
        </List>
        <Button onClick={onClose} fullWidth variant="contained" sx={{ mt: 2 }}>
          Close
        </Button>
      </Box>
    </Modal>
      <Box
        component="main"
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflowY: 'auto',
          paddingTop: "64px",
          paddingBottom: "80px",
          paddingX: 3,
          boxSizing: 'border-box',
        }}
      >
        <Box sx={{ paddingTop: 2, paddingBottom: 4, width: '100%' }}> {/* Set width to 100% */}
          <Grid container spacing={2}>
          <Grid item xs={12}>
          <Card sx={{ minWidth: 275, mb: 2, boxShadow: 3, borderRadius: 2, backgroundColor: "#fff" }}>
            <CardContent sx={{ padding: "12px" }}>
              <Typography
                variant="h6"
                color="primary"
                sx={{
                  fontWeight: "bold",
                  paddingBottom: "8px",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <PeopleAltIcon sx={{ fontSize: 20, color: "#003366", marginRight: "8px" }} />
                User Overview
              </Typography>

              <Grid container spacing={1} alignItems="center">
          <Grid item xs={4} sx={{ textAlign: "center" }}>
            {userData?.profile_picture ? (
              <Avatar
                src={userData.profile_picture}
                alt="Profile"
                sx={{
                  width: 90,
                  height: 90,
                  boxShadow: 2,
                  border: "3px solid #003366",
                }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/150"; // ✅ Fallback if image fails to load
                }}
              />
            ) : (
              <Avatar
                src="https://via.placeholder.com/150"
                sx={{ width: 90, height: 90 }}
              />
            )}
          </Grid>
                <Grid item xs={8}>
                  <Box sx={{ paddingLeft: "8px" }}>
                    <Typography variant="body2" sx={{ color: "#003366", fontSize: "19px", marginBottom: "6px" }}>
                      Welcome! To the User Dashboard
                    </Typography>
                    <Divider sx={{ borderColor: "#003366" }} />
                    <Typography variant="body1" sx={{ fontWeight: "bold", color: "#003366", marginTop: "4px", fontSize: "26px" }}>
                      {userData?.username || "User  Name"}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "gray", fontSize: "14px" }}>
                      {userData?.email || "Email Address"}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Grid container spacing={2}>
  {/* Performance Stats */}
  <Grid item xs={12} md={6}>
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: "bold", color: "#007bff", borderBottom: "2px solid #003366", paddingBottom: "6px" }}>
       Performance Stats
                </Typography>

                {aggregatedData.length > 0 ? (
                  <PieChart width={300} height={250}>
                    <Pie
                      data={aggregatedData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {aggregatedData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    
                  </PieChart>
                ) : (
                  <Typography sx={{ color: "gray", fontSize: "14px", textAlign: "center" }}>
                    No test data available
                  </Typography>
                )}
      </CardContent>
    </Card>
  </Grid>
  <Grid item xs={12} md={6}>
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: "bold", color: "#007bff", borderBottom: "2px solid #003366", pb: 1 }}>
          📜 Recent Activities
        </Typography>
        {recentActivities.length === 0 ? (
          <Typography sx={{ textAlign: "center", mt: 2 }}>No recent activities</Typography>
        ) : (
          <Timeline>
            {recentActivities.map((activity, index) => (
              <TimelineItem key={index}>
                <TimelineSeparator>
                  <TimelineDot color="primary" />
                  {index !== recentActivities.length - 1 && <TimelineConnector />}
                </TimelineSeparator>
                <TimelineContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="body1">{activity.description}</Typography>
                    <IconButton onClick={() => handleDeleteActivity(activity.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  <Typography variant="caption" sx={{ color: "gray" }}>
                    {new Date(activity.timestamp).toLocaleString()}
                  </Typography>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        )}
      </CardContent>
    </Card>
    </Grid>
            <Grid item xs={12}>
            <Card sx={{ height: "100%", display: "flex", flexDirection: "column", boxShadow: 3, borderRadius: 2 }}>
      <CardContent>
        <Typography
          variant="h6"
          sx={{
            fontWeight: "bold",
            color: "#007bff",
            borderBottom: "2px solid #003366",
            paddingBottom: "6px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <EmojiEventsIcon sx={{ marginRight: "8px", color: "#FFD700" }} /> Achievements
        </Typography>
        <Box sx={{ maxHeight: 200, overflowY: "auto", mt: 1 }}>
          {achievements.length > 0 ? (
            <List>
              {achievements.map((achievement, index) => (
                <ListItem key={index} divider>
                  <ListItemText primary={achievement} sx={{ color: "#333", fontWeight: "bold" }} />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" sx={{ color: "gray", textAlign: "center", mt: 2 }}>
              No achievements yet. Keep going!
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
    </Grid>
            {/* Completed Tests */}
            <Grid item xs={12}>
              <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: "bold", color: "#007bff", borderBottom: "2px solid #003366", paddingBottom: "8px", display: "flex", alignItems: "center" }}>
                    ✅ Completed Tests & Current Score
                  </Typography>
                  <List>
                    {completedTests.map((test, index) => (
                      <Box key={index}>
                        <ListItem sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <ListItemText
                            primary={`✏️ ${test.test_name}`}
                            secondary={
                              <>
                                Date: <strong>{test.date}</strong> | Subject: <strong>{test.subject}</strong> <br />
                                Score: <strong>{test.score}%</strong> | Improvement: <strong>{test.improvement}%</strong> | Status: <strong>{test.status}</strong>
                              </>
                            }
                          />
                          <Button
  variant="contained"
  sx={{ backgroundColor: "#007bff", color: "#fff" }}
  onClick={() => navigate(`/test-report/${test.id}`)}
>
  View Report
</Button>

                        </ListItem>
                        {index !== completedTests.length - 1 && <Divider />}  
                      </Box>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          </Grid>
          </Grid>
        </Box>
      </Box>

      <Snackbar open={notification !== ""} autoHideDuration={3000} onClose={() => setNotification("")}>
        <Alert onClose={() => setNotification("")} severity="info">{notification}</Alert>
      </Snackbar>
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
            © {new Date().getFullYear()} Skill Bridge Online Test Platform. All rights reserved.
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", gap: "2px", marginTop: "2px" }}>
            <IconButton color="inherit" onClick={() => window.open("https://twitter.com", "_blank")}><TwitterIcon /></IconButton>
            <IconButton color="inherit" onClick={() => window.open("https://facebook.com", "_blank")}><FacebookIcon /></IconButton>
            <IconButton color="inherit" onClick={() => window.open("https://instagram.com", "_blank")}><InstagramIcon /></IconButton>
          </Box>
        </Box>
      </Box>
 </>
  );
};
export default UserDashboard;