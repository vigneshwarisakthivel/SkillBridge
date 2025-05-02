import React, { useState, useEffect } from 'react';
import { FaUser , FaUpload, FaEdit } from 'react-icons/fa';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  Box,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Grid,
  TextField,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import TwitterIcon from "@mui/icons-material/Twitter";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import logo from "../assets/Image20250320122406.png";
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const [userData, setUserData] = useState(null);
  const [image, setImage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('user_token');

  const API_BASE_URL = 'https://onlinetestcreationbackend.onrender.com/api';
  const USER_PROFILE_URL = `${API_BASE_URL}/users/`;
  const UPLOAD_PROFILE_PICTURE_URL = `${API_BASE_URL}/users/upload_profile_picture/`;
  const CHANGE_PASSWORD_URL = `${API_BASE_URL}/users/change_password/`;
  const LOGOUT_URL = `${API_BASE_URL}/logout/`;

  useEffect(() => {
    const storedUserData = localStorage.getItem('user_data');
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
      if (JSON.parse(storedUserData).profile_picture) {
        setImage(`${API_BASE_URL}${JSON.parse(storedUserData).profile_picture}`);
      }
    } else {
      fetchUserData();
    }
  }, [token]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const response = await fetch(USER_PROFILE_URL, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setUserData(data);
      if (data.profile_picture) {
        setImage(`${API_BASE_URL}${data.profile_picture}`);
      }
      localStorage.setItem('user_data', JSON.stringify(data));
    } catch (error) {
      console.error('Error fetching user data:', error);
      setErrorMessage('Failed to fetch user data. Please try again.');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('profile_picture', file);

      try {
        const response = await fetch(UPLOAD_PROFILE_PICTURE_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Token ${token}`,
          },
          body: formData,
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setImage(`${API_BASE_URL}${data.profile_picture}`);
        setUserData((prevData) => ({ ...prevData, profile_picture: data.profile_picture }));
        localStorage.setItem('user_data', JSON.stringify({ ...userData, profile_picture: data.profile_picture }));
      } catch (error) {
        console.error('Error uploading profile picture:', error);
        setErrorMessage('Failed to upload profile picture. Please try again.');
        setSnackbarOpen(true);
      }
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("full_name", userData.full_name);
    formData.append("phone", userData.phone);
    formData.append("email", userData.email);
    formData.append("status", userData.status);
    formData.append("linkedin", userData.linkedin);

    try {
      const response = await fetch(`${USER_PROFILE_URL }${userData.id}/`, {
        method: "PUT",
        headers: {
          "Authorization": `Token ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUserData(data);
      localStorage.setItem('user_data', JSON.stringify(data));
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrorMessage("Failed to update profile. Please try again.");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword === confirmPassword) {
      setLoading(true);
      try {
        const response = await fetch(CHANGE_PASSWORD_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ currentPassword, newPassword }),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setIsChangingPassword(false);
      } catch (error) {
        console.error('Error changing password:', error);
        setErrorMessage('Failed to change password. Please try again.');
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    } else {
      setErrorMessage('New password and confirm password do not match.');
      setSnackbarOpen(true);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(LOGOUT_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      localStorage.removeItem('user_token');
      localStorage.removeItem('user_data');
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      setErrorMessage('Failed to logout. Please try again.');
      setSnackbarOpen(true);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const Header = () => {
    return (
      <AppBar position="fixed" sx={{ backgroundColor: "#003366", padding: "4px 8px" }}>
        <Toolbar sx={{ padding: "0" }}>
          <IconButton color="inherit" edge="start" sx={{ marginRight: 2 }} onClick={toggleSidebar}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontSize: "1rem" }}>
            Skill Bridge Online Test Platform
          </Typography>
          <Button color="inherit" onClick={() => navigate("/")}>Home</Button>
          <Button color="inherit" onClick={() => navigate("/admin-profile")}>Profile</Button>
          <Button color="inherit" onClick={() => navigate("/manage-tests")}>Test list</Button>
          <Button color="inherit" onClick={() => navigate("/adminsettings")}>Settings</Button>
          <Button color="inherit" onClick={handleLogout}>Logout</Button>
        </Toolbar>
      </AppBar>
    );
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Header />

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
    <ListItem sx={{ display: 'flex', justifyContent: 'flex-start' }}>
  <Button
    onClick={() => navigate('/admin-dashboard')}
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
    onClick={() => navigate('/testcreation')}
    sx={{
      color: "#003366", // Dark blue color
      fontWeight: "bold",
      textAlign: "left", // Align the text to the left
      width: "100%",
      fontSize: "16px", // Take up full width of the ListItem
      justifyContent: "flex-start", // Align the button content to the left
    }}
  >
    Test Creation
  </Button>
</ListItem>

<ListItem sx={{ display: 'flex', justifyContent: 'flex-start' }}>
  <Button
    onClick={() => navigate('/questioncreation')}
    sx={{
      color: "#003366", // Dark blue color
      fontWeight: "bold",
      fontSize: "16px",
      textAlign: "left", // Align the text to the left
      width: "100%", // Take up full width of the ListItem
      justifyContent: "flex-start", // Align the button content to the left
    }}
  >
    Question Creation
  </Button>
</ListItem>

<ListItem sx={{ display: 'flex', justifyContent: 'flex-start' }}>
  <Button
    onClick={() => navigate('/manage-tests')}
    sx={{
      color: "#003366", // Dark blue color
      fontWeight: "bold",
      fontSize: "16px",
      textAlign: "left", // Align the text to the left
      width: "100%", // Take up full width of the ListItem
      justifyContent: "flex-start", // Align the button content to the left
    }}
  >
    Manage Tests
  </Button>
</ListItem>

<ListItem sx={{ display: 'flex', justifyContent: 'flex-start' }}>
  <Button
    onClick={() => navigate('/announcement')}
    sx={{
      color: "#003366", // Dark blue color
      fontWeight: "bold",
      fontSize: "16px",
      textAlign: "left", // Align the text to the left
      width: "100%", // Take up full width of the ListItem
      justifyContent: "flex-start", // Align the button content to the left
    }}
  >
    Announcements
  </Button>
</ListItem>

<ListItem sx={{ display: 'flex', justifyContent: 'flex-start' }}>
  <Button
    onClick={() => navigate('/adminsettings')}
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

      <Box
        sx={{
          flex: 1,
          p: 3,
          marginTop: "64px",
          display: "flex",
          alignItems: "stretch",
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                borderRadius: 2,
                boxShadow: 3,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
              }}
            >
              <Typography
                variant="h5"
                sx={{ mb: 2, fontWeight: "bold", color: "#003366" }}
              >
                <center>Admin Profile</center>
              </Typography>
              <CardContent sx={{ textAlign: "center" }}>
                <Box sx={{ position: "relative", display: "inline-block" }}>
                  {image ? (
                    <img
                      src={image}
                      alt="Profile"
                      style={{
                        width: "120px",
                        height: "120px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: "4px solid #003366",
                      }}
                    />
                  ) : (
                    <FaUser  size={80} style={{ color: "#003366" }} />
                  )}
                  {isEditing && (
                    <label htmlFor="upload-image" style={{ cursor: "pointer" }}>
                      <FaUpload
                        style={{
                          position: "absolute",
                          bottom: "0",
                          right: "0",
                          backgroundColor: "#003366",
                          color: "#fff",
                          padding: "8px",
                          borderRadius: "50%",
                        }}
                      />
                    </label>
                  )}
                  <input
                    type="file"
                    id="upload-image"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: "none" }}
                  />
                </Box>
                <Typography variant="h6" sx={{ mt: 2, fontWeight: "bold" }}>
                  {userData ? userData.full_name : "N/A"}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {userData ? userData.role : "N/A"}
                </Typography>
                {!isEditing && (
                  <Button
                    variant="contained"
                    startIcon={<FaEdit />}
                    onClick={() => setIsEditing(true)}
                    sx={{
                      mt: 2,
                      backgroundColor: "#003366",
                      "&:hover": { backgroundColor: "#002244" },
                    }}
                  >
                    Edit Profile
                  </Button>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Card sx={{ borderRadius: 2, boxShadow: 3, flexGrow: 1 }}>
                  <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
  Profile Information
</Typography>
<form onSubmit={handleProfileSubmit}>
  <Grid container spacing={2}>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        label="Full Name"
        value={userData ? userData.full_name : ""}
        onChange={(e) => setUserData({ ...userData, full_name: e.target.value })}
        required
      />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        label="Phone"
        value={userData ? userData.phone : ""}
        onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
        required
      />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        label="Email"
        type="email"
        value={userData ? userData.email : ""}
        onChange={(e) => setUserData({ ...userData, email: e.target.value })}
        required
      />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        label="Status"
        value={userData ? userData.status : ""}
        onChange={(e) => setUserData({ ...userData, status: e.target.value })}
        required
      />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField fullWidth
        label="Role"
        value={userData?.role || ""}
        InputProps={{ readOnly: true }}
      />
    </Grid>
    <Grid item xs={12} md={6}>
      <TextField
        fullWidth
        label="LinkedIn"
        value={userData ? userData.linkedin : ""}
        onChange={(e) => setUserData({ ...userData, linkedin: e.target.value })}
        required
      />
    </Grid>
    <Grid item xs={12}>
      <Button
        type="submit"
        variant="contained"
        sx={{
          backgroundColor: "#003366",
          "&:hover": { backgroundColor: "#002244" },
        }}
      >
        Save Profile
      </Button>
    </Grid>
  </Grid>
</form>

                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12}>
              <Card sx={{ borderRadius: 2, boxShadow: 3, flexGrow: 1, mt: 2 }}>

                  <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
  Security Settings
</Typography>
<form onSubmit={handleChangePassword}>
  <TextField
    fullWidth
    label="Current Password"
    type="password"
    required
    onChange={(e) => setCurrentPassword(e.target.value)}
    sx={{ mb: 2 }}
  />
  <TextField
    fullWidth
    label="New Password"
    type="password"
    required
    onChange={(e) => setNewPassword(e.target.value)}
    sx={{ mb: 2 }}
  />
  <TextField
    fullWidth
    label="Confirm New Password"
    type="password"
    required
    onChange={(e) => setConfirmPassword(e.target.value)}
    sx={{ mb: 2 }}
  />
  <Button type="submit" variant="contained">
    Submit
  </Button>
</form>

   
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>
      <Box
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "#003366",
            color: "white",
            padding: "4px",
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
    

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile;