import React, { useState } from "react";
import { Box, Typography, TextField, Button, Grid } from "@mui/material";
import axios from "axios";

const ContactPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

// Function to fetch admin notifications
const fetchAdminNotifications = async () => {
  try {
    const apiUrl = process.env.REACT_APP_API_URL || "https://onlinetestcreationbackend.onrender.com";
    
    // Retrieve user_token from localStorage (or wherever you store it after login)
    const userToken = localStorage.getItem("user_token");

    if (!userToken) {
      console.error("User token not found");
      return;
    }

    const response = await axios.get(`${apiUrl}/api/admin-notifications/`, {
      headers: {
        Authorization: `Token ${userToken}`, // Add user token in headers
      },
    });

    console.log("Admin Notifications:", response.data);
  } catch (error) {
    console.error("Error fetching admin notifications:", error);
  }
};

// Function to handle form submission
const handleSubmit = async (event) => {
  event.preventDefault();
  setLoading(true);
  setError(null);
  setSuccess(false);

  if (!name || !email || !message) {
    setError("Please fill out all fields.");
    setLoading(false);
    return;
  }

  try {
    const apiUrl = process.env.REACT_APP_API_URL || "https://onlinetestcreationbackend.onrender.com";

    await axios.post(`${apiUrl}/api/contact-submissions/`, {
      name,
      email,
      message,
    });

    setSuccess(true);
    setName("");
    setEmail("");
    setMessage("");

    // Fetch admin notifications after successful submission
    fetchAdminNotifications();
  } catch (err) {
    setError("There was an error submitting your message. Please try again.");
  } finally {
    setLoading(false);
  }
};

  return (
    <Box sx={{ padding: "16px", maxWidth: "600px", margin: "0 auto" }}>
      <Typography variant="h4" sx={{ marginBottom: "16px", textAlign: "center" }}>
        Contact Us
      </Typography>
      <Typography variant="body1" sx={{ marginBottom: "24px", textAlign: "center" }}>
        Have questions? Fill out the form below or reach us directly.
      </Typography>

      {success && (
        <Typography
          variant="body2"
          sx={{ color: "green", textAlign: "center", marginBottom: "16px" }}
        >
          Your message has been submitted successfully!
        </Typography>
      )}

      {error && (
        <Typography
          variant="body2"
          sx={{ color: "red", textAlign: "center", marginBottom: "16px" }}
        >
          {error}
        </Typography>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Your Name"
              variant="outlined"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Your Email"
              type="email"
              variant="outlined"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Your Message"
              variant="outlined"
              fullWidth
              multiline
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" variant="contained" color="primary" fullWidth disabled={loading}>
              {loading ? "Submitting..." : "Submit"}
            </Button>
          </Grid>
        </Grid>
      </form>

      <Box sx={{ marginTop: "24px", textAlign: "center" }}>
        <Typography variant="h6">Contact Information</Typography>
        <Typography variant="body2">Email: support@vdart.com</Typography>
        <Typography variant="body2">Phone: +1 (123) 456-7890</Typography>
        <Typography variant="body2">Address: 123 Vdart Lane, Tech City</Typography>
      </Box>
    </Box>
  );
};

export default ContactPage;