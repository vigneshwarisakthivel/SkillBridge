import React, { useState, useEffect } from "react";
import { Twitter as TwitterIcon, Facebook as FacebookIcon, Instagram as InstagramIcon } from '@mui/icons-material';
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
  List,
  ListItem,
  ListItemText,
  Drawer,
  Grid,
} from "@mui/material";
import { Menu as MenuIcon, Brightness4, Brightness7, AdminPanelSettings, Save, Undo, Notifications as NotificationsIcon, People, Security, Settings, AssignmentInd as AssignmentIndIcon, Lock as LockIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Image20250320122406.png";

const AdminSettingsPage = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [userManagement, setUserManagement] = useState("Manage Users");
  const [accessControl, setAccessControl] = useState("Set Permissions");
  const [systemSettings, setSystemSettings] = useState("Update Config");
  const [reportLogs, setReportLogs] = useState("Generate Reports");
  const [securitySettings, setSecuritySettings] = useState("Configure Policies");
  const [notificationFrequency, setNotificationFrequency] = useState("Instant");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [settingsId, setSettingsId] = useState(null); // State to hold the settings ID

  const navigate = useNavigate();
  const API_BASE_URL = 'http://127.0.0.1:8000/api/admin-settings/'; // Adjust the URL as needed

  useEffect(() => {
    document.body.style.backgroundColor = darkMode ? "#121212" : "#f8f9fa";
  }, [darkMode]);

  // Fetch admin settings on component mount
  useEffect(() => {
    const fetchAdminSettings = async () => {
      const userToken = localStorage.getItem('user_token'); // Retrieve the user token
      console.log("Using token:", userToken); // Log the token for debugging
      try {
        const response = await fetch(API_BASE_URL, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            "Authorization": `Token ${userToken}`  // Use the user token here
          },
        });
    
        if (response.ok) {
          const data = await response.json();
          // Assuming the response data structure matches your state variables
          setSettingsId(data.id); // Set the ID of the settings
          setDarkMode(data.dark_mode);
          setUserManagement(data.user_management);
          setAccessControl(data.access_control);
          setSystemSettings(data.system_settings);
          setReportLogs(data.report_logs);
          setSecuritySettings(data.security_settings);
          setNotificationFrequency(data.notification_frequency);
          setEmailNotifications(data.email_notifications);
        } else {
          setSnackbarMessage("Failed to fetch settings.");
          setSnackbarOpen(true);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        setSnackbarMessage("Failed to fetch settings.");
        setSnackbarOpen(true);
      }
    };

    fetchAdminSettings();
  }, []);

  const handleSave = async () => {
    const userToken = localStorage.getItem('user_token');
    const userId = localStorage.getItem('userId'); // Retrieve the user ID from local storage
    console.log("Using token:", userToken);
    console.log("Using user ID:", userId); // Log the user ID for debugging
  
    // Check if userId is valid
    if (!userId) {
      console.error("User  ID is null or undefined");
      setSnackbarMessage("User  ID is required.");
      return; // Exit the function if user ID is not valid
    }
  
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "Authorization": `Token ${userToken}`
        },
        body: JSON.stringify({
          user: parseInt(userId, 10),  // Convert userId to an integer if necessary
          dark_mode: darkMode,
          user_management: userManagement,
          access_control: accessControl,
          system_settings: systemSettings,
          report_logs: reportLogs,
          security_settings: securitySettings,
          notification_frequency: notificationFrequency,
          email_notifications: emailNotifications,
        }),
      });
  
      const data = await response.json();
      console.log('Response data:', data);
  
      if (response.ok) {
        setSnackbarMessage("Admin settings saved successfully!");
        setSettingsId(data.id);
      } else {
        setSnackbarMessage("Failed to save settings. Please try again.");
      }
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSnackbarMessage("Failed to save settings. Please try again.");
      setSnackbarOpen(true);
    }
  };
 

  const handleUpdate = async () => {
    const userToken = localStorage.getItem('user_token'); // Retrieve the usertoken
    try {
      const response = await fetch(`${API_BASE_URL}${settingsId}/`, {
        method: 'PATCH', // Use PATCH for partial updates
        headers: {
          'Content-Type': 'application/json',
          "Authorization": `Token ${userToken}`  // Add the usertoken here
        },
        body: JSON.stringify({
          dark_mode: darkMode,
          user_management: userManagement,
          access_control: accessControl,
          system_settings: systemSettings,
          report_logs: reportLogs,
          security_settings: securitySettings,
          notification_frequency: notificationFrequency,
          email_notifications: emailNotifications,
        }),
      });

      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        setSnackbarMessage("Admin settings updated successfully!");
      } else {
        setSnackbarMessage("Failed to update settings. Please try again.");
      }
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error updating settings:', error);
      setSnackbarMessage("Failed to update settings. Please try again.");
      setSnackbarOpen(true);
    }
  };

  const handleSaveOrUpdate = () => {
    if (settingsId) {
      handleUpdate(); // Call update if settingsId exists
    } else {
      handleSave(); // Call save if no settingsId
    }
  };

  const handleReset = () => {
    setDarkMode(false);
    setUserManagement("Manage Users");
    setAccessControl("Set Permissions");
    setSystemSettings("Update Config");
    setReportLogs("Generate Reports");
    setSecuritySettings("Configure Policies");
    setNotificationFrequency("Instant");
    setEmailNotifications(true);
    setSnackbarMessage("Settings reset to default.");
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <Drawer
        open={isSidebarOpen}
        onClose={toggleSidebar}
        sx={{
          width: 220,
          textAlign: "center",
          '& .MuiDrawer-paper': {
            width: 220,
            boxSizing: 'border-box',
            backgroundColor: '#fff',
            color: '#003366',
            padding: "16px",
          },
        }}
      >
        <Box sx={{ textAlign: "center", padding: "16px" }}>
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
        </Box>

        <List>
          <ListItem button onClick={() => navigate('/admin-dashboard')}>
            <ListItemText primary="Dashboard" />
          </ListItem>
          <ListItem button onClick={() => navigate('/testcreation')}>
            <ListItemText primary="Test Creation" />
          </ListItem>
          <ListItem button onClick={() => navigate('/questioncreation')}>
            <ListItemText primary="Question Creation" />
          </ListItem>
          <ListItem button onClick={() => navigate('/manage-tests')}>
            <ListItemText primary="Manage Tests" />
          </ListItem>

          <ListItem button onClick={() => navigate('/announcement')}>
            <ListItemText primary="Announcements" />
          </ListItem>
          <ListItem button onClick={() => navigate('/adminsettings')}>
            <ListItemText primary="Settings" />
          </ListItem>
          <ListItem button onClick={() => {
            localStorage.removeItem('user_token');
            navigate('/login');
          }}>
            <ListItemText primary="Logout" />
          </ListItem>
        </List>
      </Drawer>

      <Box
        sx={{
          flexGrow: 1,
          backgroundColor: darkMode ? "#121212" : "#f8f9fa",
          paddingLeft: "0px",
          marginTop: "64px", // Adjust margin to account for AppBar height
          paddingBottom: "80px", // Ensure space for footer
        }}
      >
        <AppBar position="fixed" sx={{ backgroundColor: "#003366", padding: "6px 16px" }}>
          <Toolbar>
            <IconButton color="inherit" onClick={toggleSidebar} edge="start" sx={{ marginRight: 2 }}>
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1, fontSize: "1rem" }}>
              SmartBridge Online Test Platform
            </Typography>
            <Button color="inherit" onClick={() => navigate("/")}>Home</Button>
            <Button color="inherit" onClick={() => navigate("/admin-profile")}>Admin Profile</Button>
            <Button color="inherit" onClick={() => navigate("/manage-tests")}>Test List</Button>
            <Button color="inherit" onClick={() => navigate("/adminsettings")}>Settings</Button>
            <Button color="inherit" onClick={() => navigate("/logout")}>Logout</Button>
          </Toolbar>
        </AppBar>

        <Container
          maxWidth="sm"
          sx={{
            position: "fixed", // Set position to fixed
            top: "64px", // Set top to the height of the AppBar
            bottom: "80px", // Adjust for footer height
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "flex-start", // Align items to the start
            overflowY: "auto", // Enable vertical scrolling
            padding: "16px", // Add padding as needed
            "&::-webkit-scrollbar": { // Hide scrollbar for Chrome, Safari, and Opera
              display: "none",
            },
            scrollbarWidth: "none", // Hide scrollbar for Firefox
            msOverflowStyle: "none", // Hide scrollbar for IE and Edge
          }}
        >
          <Card
            sx={{
              width: "90%", // Adjusted width to be smaller
              p: 2, // Reduced padding
              borderRadius: 2,
              boxShadow: 3,
              backgroundColor: darkMode ? "#1e1e1e" : "#ffffff",
              color: darkMode ? "#f1f1f1" : "#212529",
            }}
          >
            <CardContent>
              <Typography
                variant="h5" // Reduced font size
                align="center"
                gutterBottom
                sx={{ fontWeight: "bold" }}
              >
                <AdminPanelSettings sx={{ verticalAlign: "middle", marginRight: 1 }} /> Admin Settings
              </Typography>

              {/* Theme Settings */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", my: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  {darkMode ? <Brightness4 /> : <Brightness7 />}
                  <Typography variant="body1" sx={{ ml: 1 }}>
                    Theme Mode
                  </Typography>
                </Box>
                <FormControlLabel
                  control={<Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} />}
                  label={darkMode ? "Dark Mode" : "Light Mode"}
                />
              </Box>

              {/* User Management Settings */}
              <Box sx={{ my: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <People />
                  <Typography variant="body1" sx={{ ml: 1 }}>
                    User Management
                  </Typography>
                </Box>
                <FormControl fullWidth sx={{ mt: 1 }}>
                  <Select
                    value={userManagement}
                    onChange={(e) => setUserManagement(e.target.value)}
                  >
                    <MenuItem value="Manage Users">Manage Users</MenuItem>
                    <MenuItem value="Assign Roles">Assign Roles</MenuItem>
                    <MenuItem value="Review Activity Logs"> Review Activity Logs</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Access Control Settings */}
              <Box sx={{ my: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Security />
                  <Typography variant="body1" sx={{ ml: 1 }}>
                    Access Control
                  </Typography>
                </Box>
                <FormControl fullWidth sx={{ mt: 1 }}>
                  <Select
                    value={accessControl}
                    onChange={(e) => setAccessControl(e.target.value)}
                  >
                    <MenuItem value="Set Permissions">Set Permissions</MenuItem>
                    <MenuItem value="Manage Authentication">Manage Authentication</MenuItem>
                    <MenuItem value="Monitor Access Logs">Monitor Access Logs</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* System Settings */}
              <Box sx={{ my: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Settings />
                  <Typography variant="body1" sx={{ ml: 1 }}>
                    System Settings
                  </Typography>
                </Box>
                <FormControl fullWidth sx={{ mt: 1 }}>
                  <Select
                    value={systemSettings}
                    onChange={(e) => setSystemSettings(e.target.value)}
                  >
                    <MenuItem value="Update Config">Update Config</MenuItem>
                    <MenuItem value="Manage Integrations">Manage Integrations</MenuItem>
                    <MenuItem value="Handle Updates">Handle Updates</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Reports & Logs Settings */}
              <Box sx={{ my: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <AssignmentIndIcon />
                  <Typography variant="body1" sx={{ ml: 1 }}>
                    Reports & Logs
                  </Typography>
                </Box>
                <FormControl fullWidth sx={{ mt: 1 }}>
                  <Select
                    value={reportLogs}
                    onChange={(e) => setReportLogs(e.target.value)}
                  >
                    <MenuItem value="Generate Reports">Generate Reports</MenuItem>
                    <MenuItem value="Track User Activities">Track User Activities</MenuItem>
                    <MenuItem value="Export Logs">Export Logs</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Security Settings */}
              <Box sx={{ my: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <LockIcon />
                  <Typography variant="body1" sx={{ ml: 1 }}>
                    Security Settings
                  </Typography>
                </Box>
                <FormControl fullWidth sx={{ mt: 1 }}>
                  <Select
                    value={securitySettings}
                    onChange={(e) => setSecuritySettings(e.target.value)}
                  >
                    <MenuItem value="Configure Policies">Configure Policies</MenuItem>
                    <MenuItem value="Manage Data Encryption">Manage Data Encryption</MenuItem>
                    <MenuItem value="Security Monitoring">Security Monitoring</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Notifications Settings */}
              <Box sx={{ my: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <NotificationsIcon />
                  <Typography variant="body1" sx={{ ml: 1 }}>
                    Notification Settings
                  </Typography>
                </Box>
                <FormControl fullWidth sx={{ mt: 1 }}>
                  <Select
                    value={notificationFrequency}
                    onChange={(e) => setNotificationFrequency(e.target.value)}
                  >
                    <MenuItem value="Instant">Instant</MenuItem>
                    <MenuItem value="Daily">Daily</MenuItem>
                    <MenuItem value="Weekly">Weekly</MenuItem>
                  </Select>
                </FormControl>
                <FormControlLabel
                  control={<Switch checked={emailNotifications} onChange={() => setEmailNotifications(!emailNotifications)} />}
                  label="Email Notifications"
                />
              </Box>

              {/* Save & Reset Buttons */}
              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSaveOrUpdate} // Call the combined function
                >
                  <Save sx={{ mr: 1 }} /> Save Changes
                </Button>

                <Button
                  variant="outlined"
                  onClick={handleReset}
                >
                  <Undo sx={{ mr: 1 }} /> Reset to Default
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Snackbar for feedback */}
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={3000}
            onClose={handleCloseSnackbar}
            message={snackbarMessage}
          />
        </Container>
      </Box>

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
            © {new Date().getFullYear()} SmartBridge Online Test Platform. All rights reserved.
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", gap: "2px", marginTop: "2px" }}>
            <IconButton color="inherit" onClick={() => window.open("https://twitter.com", "_blank")}><TwitterIcon /></IconButton>
            <IconButton color="inherit" onClick={() => window.open("https://facebook.com", "_blank")}><FacebookIcon /></IconButton>
            <IconButton color="inherit" onClick={() => window.open("https://instagram.com", "_blank")}><InstagramIcon /></IconButton>
          </Box>
      
      </Box>
    </Box>
  );
};

export default AdminSettingsPage;