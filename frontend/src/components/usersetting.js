import React, { useState, useEffect } from "react";
import {
  Container,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControl,
  Select,
  MenuItem,
  Button,
  FormControlLabel,
  Box,
  Snackbar,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import {
  Brightness4,
  Brightness7,
  Public,
  Settings,
  AccessTime,
  Save,
  Notifications,
  Menu as MenuIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import logo from "../assets/Image20250320122406.png";
import TwitterIcon from '@mui/icons-material/Twitter'; // Import Twitter icon
import FacebookIcon from '@mui/icons-material/Facebook'; // Import Facebook icon
import InstagramIcon from '@mui/icons-material/Instagram'; // Import Instagram icon
import axios from 'axios'; // Import axios for API calls
const API_BASE_URL = 'https://onlinetestcreationbackend.onrender.com/api';
const SettingsCustomizationPage = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [testAccess, setTestAccess] = useState("public");
  const [integration, setIntegration] = useState("none");
  const [autoSave, setAutoSave] = useState(true);
  const [timeReminder, setTimeReminder] = useState(5);
  const [notifications, setNotifications] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State for sidebar
  const navigate = useNavigate(); // Initialize navigate

  useEffect(() => {
    document.body.style.backgroundColor = darkMode ? "#121212" : "#f8f9fa";
  }, [darkMode]);

  useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem('user_token'); // Get the token from local storage
      const headers = { Authorization: `Token ${token}` };

      try {
        const response = await axios.get(`${API_BASE_URL}/user-settings/`, { headers });
        const settings = response.data;
        setDarkMode(settings.dark_mode);
        setTestAccess(settings.test_access);
        setIntegration(settings.integration);
        setAutoSave(settings.auto_save);
        setTimeReminder(settings.time_reminder);
        setNotifications(settings.notifications);
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };

    fetchSettings();
  }, []);

  const handleReset = async () => {
    const token = localStorage.getItem('user_token'); // Get the token from local storage
    const headers = { Authorization: `Token ${token}` };

    try {
      await axios.post(`${API_BASE_URL}/user-settings/reset/`, {}, { headers });
      // Reset local state to default values
      setDarkMode(false);
      setTestAccess("public");
      setIntegration("none");
      setAutoSave(true);
      setTimeReminder(5);
      setNotifications(true);
      setSnackbarMessage("Settings reset to default.");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error resetting settings:", error);
      setSnackbarMessage("Failed to reset settings.");
      setSnackbarOpen(true);
    }
  };

  const handleSave = async () => {
    const token = localStorage.getItem('user_token'); // Get the token from local storage
    const headers = { Authorization: `Token ${token}` };

    try {
      await axios.put(`${API_BASE_URL}/user-settings/`, {
        dark_mode: darkMode,
        test_access: testAccess,
        integration: integration,
        auto_save: autoSave,
        time_reminder: timeReminder,
        notifications: notifications,
      }, { headers });

      setSnackbarMessage("Settings saved successfully!");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error saving settings:", error.response.data); // Log the error response
      setSnackbarMessage("Failed to save settings.");
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Box>
      <AppBar position="fixed" sx={{ backgroundColor: "#003366" }}>
        <Toolbar>
          <IconButton color="inherit" onClick={toggleSidebar} edge="start" sx={{ marginRight: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            SkillBridge Online Test Platform
          </Typography>
          <Button color="inherit" onClick={() => navigate("/")}>Home</Button>
          <Button color="inherit" onClick={() => navigate("/userprofile")}>User Profile</Button>
          <Button color="inherit" onClick={() => navigate("/attempted-tests")}>Test List</Button>
          <Button color="inherit" onClick={() => navigate("/usersetting")}>Settings</Button>
          <Button color="inherit" onClick={() => navigate("/logout")}>Logout</Button>
        </Toolbar>
      </AppBar>
      <Drawer open={isSidebarOpen} onClose={toggleSidebar}>
        <Box sx={{ width: 220, textAlign: "center", padding: "16px" }}>
          <img src={logo} alt="Logo" style={{ maxWidth: "100%", height: "auto", marginBottom: "12px" }} />
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
      <Container
  maxWidth="sm"
  sx={{
    position: "fixed",  // Ensures it stays fixed on screen
    top: "50%",         // Move the container to the middle
    left: "50%",        // Move the container to the middle
    transform: "translate(-50%, -50%)",  // Center it perfectly
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    width: "100vw",     // Ensures full width
    height: "100vh",    // Ensures full height
    backgroundColor: "#f4f6f8", // Optional: Add background color
  }}
>
        <Card
          sx={{
            width: "90%", // Reduced width
            p: 2, // Reduced padding
            borderRadius: 3,
            boxShadow: 4,
            backgroundColor: darkMode ? "#1e1e1e" : "#ffffff",
            color: darkMode ? "#f1f1f1" : "#212529",
          }}
        >
          <CardContent>
            <Typography
              variant="h4"
              align="center"
              gutterBottom
              sx={{ color: darkMode ? "#ffffff" : "#212529", fontWeight: "bold", fontSize: '1.5rem' }} // Reduced font size for title
            >
              <Settings /> User Settings
            </Typography>

            {/* Theme Settings */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                my: 2,
              }}
            >
              <Box sx={{ display: "flex",
                alignItems: "center",
              }}>
                {darkMode ? <Brightness4 /> : <Brightness7 />}
                <Typography variant="h6" sx={{ ml: 1, color: darkMode ? "#e0e0e0" : "#212529", fontSize: '1rem' }}>
                  Theme Mode
                </Typography>
              </Box>
              <FormControlLabel
                control={<Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} />}
                label={darkMode ? "Dark Mode" : "Light Mode"}
                sx={{ color: darkMode ? "#e0e0e0" : "#212529" }}
              />
            </Box>

            {/* Test Access Settings */}
            <Box sx={{ my: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Public />
                <Typography variant="h6" sx={{ ml: 1, color: darkMode ? "#e0e0e0" : "#212529", fontSize: '1rem' }}>
                  Test Access
                </Typography>
              </Box>
              <FormControl fullWidth sx={{ mt: 1 }}>
                <Select
                  value={testAccess}
                  onChange={(e) => setTestAccess(e.target.value)}
                  sx={{
                    color: darkMode ? "#e0e0e0" : "#212529",
                    backgroundColor: darkMode ? "#2e2e2e" : "#ffffff",
                  }}
                >
                  <MenuItem value="public">Public</MenuItem>
                  <MenuItem value="private">Private</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Integration Options */}
            <Box sx={{ my: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Settings />
                <Typography variant="h6" sx={{ ml: 1, color: darkMode ? "#e0e0e0" : "#212529", fontSize: '1rem' }}>
                  Integration
                </Typography>
              </Box>
              <FormControl fullWidth sx={{ mt: 1 }}>
                <Select
                  value={integration}
                  onChange={(e) => setIntegration(e.target.value)}
                  sx={{
                    color: darkMode ? "#e0e0e0" : "#212529",
                    backgroundColor: darkMode ? "#2e2e2e" : "#ffffff",
                  }}
                >
                  <MenuItem value="none">None</MenuItem>
                  <MenuItem value="google">Google Forms</MenuItem>
                  <MenuItem value="lms">LMS Platform</MenuItem>
                  <MenuItem value="custom">Custom API</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Time Limit Reminder */}
            <Box sx={{ my: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <AccessTime />
                <Typography variant="h6" sx={{ ml: 1, color: darkMode ? "#e0e0e0" : "#212529", fontSize: '1rem' }}>
                  Time Reminder
                </Typography>
              </Box>
              <FormControl fullWidth sx={{ mt: 1 }}>
                <Select
                  value={timeReminder}
                  onChange={(e) => setTimeReminder(e.target.value)}
                  sx={{
                    color: darkMode ? "#e0e0e0" : "#212529",
                    backgroundColor: darkMode ? "#2e2e2e" : "#ffffff",
                  }}
                >
                  <MenuItem value={1}>1 Minute</MenuItem>
                  <MenuItem value={5}>5 Minutes</MenuItem>
                  <MenuItem value={10}>10 Minutes</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Auto-Save Progress Toggle */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", my: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Save />
                <Typography variant="h6" sx={{ ml: 1, color: darkMode ? "#e0e0e0" : "#212529", fontSize: '1rem' }}>
                  Auto-Save Progress
                </Typography>
              </Box>
              <FormControlLabel
                control={<Switch checked={autoSave} onChange={() => setAutoSave(!autoSave)} />}
                label={autoSave ? "Enabled" : "Disabled"}
                sx={{ color: darkMode ? "#e0e0e0" : "#212529" }}
              />
            </Box>

            {/* Notifications Toggle */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", my: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Notifications />
                <Typography variant="h6" sx={{ ml: 1, color: darkMode ? "#e0e0e0" : "#212529", fontSize: '1rem' }}>
                  Email Notifications
                </Typography>
              </Box>
              <FormControlLabel
                control={<Switch checked={notifications} onChange={() => setNotifications(!notifications)} />}
                label={notifications ? "Enabled" : "Disabled"}
                sx={{ color: darkMode ? "#e0e0e0" : "#212529" }}
              />
            </Box>

            {/* Save & Reset Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                sx={{ flex: 1, marginRight: 1 }}
              >
                Save
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleReset}
                sx={{ flex: 1, marginLeft: 1 }}
              >
                Reset
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Container>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
      />
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
            
    </Box>
  );
};

export default SettingsCustomizationPage;