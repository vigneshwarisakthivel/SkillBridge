import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, TextField, Button, Box, Typography } from "@mui/material";

const PreTestForm = () => {
  const { testId,randomString } = useParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userData = { name, email };

    try {
      const response = await fetch("http://localhost:8000/api/test-users/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        navigate(`/smartbridge/online-test-assessment/${randomString}/${testId}/cover/`);
      } else {
        const data = await response.json();
        alert(data.message || "Failed to register");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Something went wrong!");
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh" bgcolor="#f4f6f8">
      <Card sx={{ width: 350, p: 2, boxShadow: 3, borderRadius: 2 }}>
        <CardHeader 
          title="Enter Your Details" 
          sx={{ textAlign: "center", color: "#1565c0", fontWeight: "bold" }}
        />
        <CardContent>
          <form onSubmit={handleSubmit}>
            <TextField 
              label="Name" 
              variant="outlined" 
              fullWidth 
              margin="normal" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              required
            />
            <TextField 
              label="Email" 
              type="email" 
              variant="outlined" 
              fullWidth 
              margin="normal" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              fullWidth 
              sx={{ mt: 2, py: 1.5 }}
            >
              Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default PreTestForm;
