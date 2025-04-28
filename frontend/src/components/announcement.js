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
} from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import logo from "../assets/Image20250320122406.png";

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

  const API_BASE_URL = 'https://onlinetestcreationbackend.onrender.com/api';
  const token = localStorage.getItem("user_token");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (!token) {
        console.error("No token found in localStorage.");
        return;
      }
      try {
        const response = await axios.get(`${API_BASE_URL}/announcements/`, {
          headers: { Authorization: `Token ${token}` },
        });
        setAnnouncements(response.data);
      } catch (error) {
        console.error("Error fetching announcements:", error);
      }
    };
    fetchAnnouncements();
  }, [token]);

  const handleCreateAnnouncement = async () => {
    if (!newAnnouncement.title || !newAnnouncement.message || !newAnnouncement.date) {
      alert("Please fill in all required fields before posting.");
      return;
    }
    try {
      const response = await axios.post(`${API_BASE_URL}/announcements/`, newAnnouncement, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
      });
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
      await axios.delete(`${API_BASE_URL}/announcements/${id}/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setAnnouncements(announcements.filter((announcement) => announcement.id !== id));
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
          <Button color="inherit" onClick={() => navigate("/manage-tests")}>Test List</Button>
          <Button color="inherit" onClick={() => navigate("/adminsettings")}>Settings</Button>
          <Button color="inherit" onClick={() => navigate("/logout")}>Logout</Button>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer open={isSidebarOpen} onClose={toggleSidebar}>
        <Box sx={{ width: 220, textAlign: "center", padding: "12px" }}>
          {isSidebarOpen && (
            <img src={logo} alt="Logo" style={{ maxWidth: "80%", marginBottom: "12px", borderRadius: "8px" }} />
          )}
          <List>
            {[
              { text: "Dashboard", path: "/admin-dashboard" },
              { text: "Test Creation", path: "/testcreation" },
              { text: "Question Creation", path: "/questioncreation" },
              { text: "Manage Tests", path: "/manage-tests" },
              { text: "Announcements", path: "/announcement" },
              { text: "Settings", path: "/adminsettings" },
              { text: "Logout", path: "/logout" },
            ].map(({ text, path }) => (
              <ListItem key={text}>
                <Button
                  onClick={() => navigate(path)}
                  sx={{ color: "#003366", fontWeight: "bold", width: "100%", justifyContent: "flex-start" }}
                >
                  {text}
                </Button>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          position: "fixed",
          top: "64px",
          bottom: "80px",
          left: 0,
          right: 0,
          flexGrow: 1,
          p: 3,
          overflowY: "auto",
        }}
      >
        <Container maxWidth="lg">
          {/* Create Announcement */}
          <Box sx={{ mb: 4, textAlign: "center" }}>
            <Typography variant="h3" sx={{ fontWeight: "bold", color: "#003366", mb: 2 }}>
              Announcements
            </Typography>
            <Typography variant="subtitle1" sx={{ color: "#555" }}>
              Stay updated with the latest announcements
            </Typography>
          </Box>

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
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
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
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
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
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })}
                  sx={{ background: "white", borderRadius: 1 }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth variant="outlined" sx={{ background: "white", borderRadius: 1 }}>
                  <InputLabel>Audience</InputLabel>
                  <Select
                    value={newAnnouncement.audience}
                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, audience: e.target.value })}
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
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, pinned: e.target.checked })}
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

          {/* Display Announcements */}
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" sx={{ mb: 2, color: "#003366", display: "flex", alignItems: "center", gap: 1 }}>
              <Bell size={24} /> Recent Announcements
            </Typography>
            {announcements.length === 0 ? (
              <Typography variant="body1" sx={{ color: "#888", textAlign: "center" }}>
                No announcements yet.
              </Typography>
            ) : (
              announcements.map((announcement) => (
                <Card key={announcement.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: "bold", color: "#003366" }}>
                      {announcement.title} {announcement.pinned && <Pin size={18} />}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {announcement.message}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "gray", mt: 1 }}>
                      {announcement.date}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button
                      startIcon={<Trash2 />}
                      onClick={() => handleDeleteAnnouncement(announcement.id)}
                      color="error"
                    >
                      Delete
                    </Button>
                  </CardActions>
                </Card>
              ))
            )}
          </Box>
        </Container>

        <Snackbar
          open={openSnackbar}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: "100%" }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
}
