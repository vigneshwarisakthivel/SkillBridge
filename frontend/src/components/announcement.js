import React, { useEffect, useState } from "react";
import axios from "axios";
import { Bell, Pin, Trash2, Calendar, Users, Megaphone } from "lucide-react";
import {
  Box,
  Button,
  Typography,
  TextField,
  FormControlLabel,
  Checkbox,
  Grid,
  Container,
  Snackbar,
  Alert,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Card,
  CardContent,
  CardActions,
  Chip,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Image20210206041010-1024x518.png";
import TwitterIcon from '@mui/icons-material/Twitter';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    message: "",
    audience: "all",
    date: "",
    pinned: false,
  });
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const API_BASE_URL = "http://127.0.0.1:8000/api/"; // Ensure your Django URL config is correct
  const token = localStorage.getItem("user_token");
  const navigate = useNavigate();

  // Function to fetch announcements from the backend
  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (!token) {
        console.error("No token found in localStorage.");
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}announcements/`, {
          headers: { Authorization: `Token ${token}` },
        });
        setAnnouncements(response.data);
      } catch (error) {
        console.error("Error fetching announcements:", error);
        if (error.response && error.response.status === 403) {
          console.error("Forbidden: Check your token and permissions.");
        }
      }
    };
    fetchAnnouncements();
  }, [token]);

  // Function to create a new announcement
  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.message || !newAnnouncement.date) {
      alert("Please fill in all required fields before posting.");
      return;
    }

    if (!token) {
      console.error("No token found in localStorage.");
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}announcements/`,
        newAnnouncement,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
        }
      );
      setAnnouncements([...announcements, response.data]);
      setNewAnnouncement({
        title: "",
        message: "",
        audience: "all",
        date: "",
        pinned: false,
      });
      setSnackbarMessage("Announcement created successfully!");
      setOpenSnackbar(true);
    } catch (error) {
      console.error("Error creating announcement:", error.message);
    }
  };
  const handleDeleteAnnouncement = async (id) => {
    if (!id) {
        console.error("Error: Announcement ID is undefined!");
        return;
    }

    try {
        await axios.delete(`${API_BASE_URL}announcements/${id}/`, {
            headers: { Authorization: `Token ${token}` },
        });
        console.log("Announcement deleted successfully!");

        // Remove from state after deletion
        setAnnouncements(announcements.filter(announcement => announcement.id !== id));

        setSnackbarMessage("Announcement deleted successfully!");
        setOpenSnackbar(true);
    } catch (error) {
        console.error("Error deleting announcement:", error.response?.data || error);
    }
};

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      {/* Header */}
      <AppBar position="fixed" sx={{ backgroundColor: "#003366", padding: "6px 16px" }}>
        <Toolbar>
          <IconButton color="inherit" onClick={toggleSidebar} edge="start" sx={{ marginRight: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontSize: "1rem" }}>
            Skill Bridge Online Test Platform
          </Typography>
          <Button color="inherit" onClick={() => navigate("/")}>Home</Button>
          <Button color="inherit" onClick={() => navigate("/admin-profile")}>Admin Profile</Button>
          <Button color="inherit" onClick={() => navigate("/test-list")}>Test List</Button>
          <Button color="inherit" onClick={() => navigate("/settings")}>Settings</Button>
          <Button color="inherit" onClick={() => navigate("/logout")}>Logout</Button>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer open={isSidebarOpen} onClose={toggleSidebar}>
        <Box sx={{ width: 220, textAlign: "center", padding: "12px" }}>
          {isSidebarOpen && (
            <img
              src={logo} // Replace with the actual logo path
              alt="Logo"
              style={{
                maxWidth: "80%",
                height: "auto",
                marginBottom: "12px",
                borderRadius: "8px",
              }}
            />
          )}
          <List>
                      <ListItem button onClick={() => navigate('/admin-dashboard')}>
                        <ListItemText primary="Dashboard" />
                      </ListItem>
                      <ListItem button onClick={() => navigate('/testcreation')}>
                        <ListItemText primary="Test Creation" />
                      </ListItem>
                      <ListItem button onClick={() => navigate('/manage-tests')}>
                        <ListItemText primary="Manage Tests" />
                      </ListItem>
                      <ListItem button onClick={() => navigate('/userresponse')}>
                        <ListItemText primary="Test Analytics" />
                      </ListItem>
                      <ListItem button onClick={() => navigate('/announcement')}>
                        <ListItemText primary="Announcements" />
                      </ListItem>
                      <ListItem button onClick={() => navigate('/adminsettings')}>
                        <ListItemText primary="Settings" />
                      </ListItem>
                      <ListItem button onClick={() => navigate('/logout')}>
                        <ListItemText primary="Logout" />
                      </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
  component="main"
  sx={{
    position: "fixed", // Set position to fixed
    top: "64px", // Set top to the height of the AppBar
    bottom: "80px", // Adjust for footer height
    left: 0,
    right: 0,
    flexGrow: 1,
    p: 3,
    overflowY: 'auto', // Make the content scrollable
  }}
>
        <Container maxWidth="lg">
          <Box sx={{ mb: 4, textAlign: "center" }}>
            <Typography variant="h3" sx={{ fontWeight: "bold", color: "#003366", mb: 2 }}>
              Announcements
            </Typography>
            <Typography variant="subtitle1" sx={{ color: "#555" }}>
              Stay updated with the latest announcements
            </Typography>
          </Box>

          {/* Create Announcement Section */}
          <Box sx={{ mb: 4, p: 3, borderRadius: 2, background: "linear-gradient(135deg, #f4f4f4, #e0e0e0)" }}>
            <Typography variant="h5" sx={{ mb: 2, color: "#003366", display: "flex", alignItems: "center", gap: 1 }}>
              <Megaphone size={24} /> Create New Announcement
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Title"
                  variant="outlined"
                  value={newAnnouncement.title}
                  onChange={(e) =>
                    setNewAnnouncement({ ...newAnnouncement, title: e.target.value })
                  }
                  sx={{ background: "white", borderRadius: 1 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Date"
                  type="date"
                  variant="outlined"
                  value={newAnnouncement.date}
                  onChange={(e) =>
                    setNewAnnouncement({ ...newAnnouncement, date: e.target.value })
                  }
                  InputLabelProps={{
                    shrink: true,
                  }}
                  sx={{ background: "white", borderRadius: 1 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Message"
                  multiline
                  rows={4}
                  variant="outlined"
                  value={newAnnouncement.message}
                  onChange={(e) =>
                    setNewAnnouncement({ ...newAnnouncement, message: e.target.value })
                  }
                  sx={{ background: "white", borderRadius: 1 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="outlined" sx={{ background: "white", borderRadius: 1 }}>
                  <InputLabel>Audience</InputLabel>
                  <Select
                    value={newAnnouncement.audience}
                    onChange={(e) =>
                      setNewAnnouncement({ ...newAnnouncement, audience: e.target.value })
                    }
                    label="Audience"
                  >
                    <MenuItem value="all">All Users</MenuItem>
                    <MenuItem value="students">Students Only</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6} sx={{ display: "flex", alignItems: "center" }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={newAnnouncement.pinned}
                      onChange={(e) =>
                        setNewAnnouncement({ ...newAnnouncement, pinned: e.target.checked })
                      }
                      color="primary"
                    />
                  }
                  label="Pin Announcement"
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleCreateAnnouncement}
                  sx={{ width: "100%", py: 1.5, fontWeight: "bold", background: "linear-gradient(135deg, #003366, #00509e)" }}
                >
                  Post Announcement
                </Button>
              </Grid>
            </Grid>
          </Box>

          {/* Recent Announcements Section */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" sx={{ mb: 2, color: "#003366", display: "flex", alignItems: "center", gap: 1 }}>
              <Bell size={24} /> Recent Announcements
            </Typography>
            {announcements.length === 0 ? (
              <Typography variant="body1" sx={{ color: "#888", textAlign: "center" }}>
                No announcements yet.
              </Typography>
            ) : (
              <Grid container spacing={3}>
                {announcements.map((announcement) => (
                  <Grid item xs={12} key={announcement.id}>
                    <Card elevation={3} sx={{ borderRadius: 2, transition: "transform 0.3s, box-shadow 0.3s", "&:hover": { transform: "translateY(-5px)", boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)" } }}>
                      <CardContent>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Typography variant="h6" sx={{ color: "#003366", fontWeight: "bold" }}>
                            {announcement.title}
                          </Typography>
                          {announcement.pinned && (
                            <Chip label="Pinned" icon={<Pin size={16} />} color="warning" size="small" />
                          )}
                        </Box>
                        <Typography variant="body1" sx={{ mt: 1, color: "#555" }}>
                          {announcement.message}
                        </Typography>
                        <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 1 }}>
                          <Calendar size={16} color="#555" />
                          <Typography variant="caption" sx={{ color: "#555" }}>
                            {announcement.date}
                          </Typography>
                          <Users size={16} color="#555" />
                          <Typography variant="caption" sx={{ color: "#555" }}>
                            Audience: {announcement.audience}
                          </Typography>
                        </Box>
                      </CardContent>
                      <CardActions sx={{ justifyContent: "flex-end" }}>
                      <Button
  variant="outlined"
  color="error"
  onClick={() => {
    console.log("Deleting announcement ID:", announcement.id);
    handleDeleteAnnouncement(announcement.id);
  }}
  startIcon={<Trash2 size={16} />}
>
  Delete
</Button>

                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>

          {/* Snackbar for Notifications */}
          <Snackbar
            open={openSnackbar}
            autoHideDuration={3000}
            onClose={handleCloseSnackbar}
          >
            <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
              {snackbarMessage}
            </Alert>
          </Snackbar>
        </Container>
      </Box>

      {/* Fixed Footer */}
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
  );
}