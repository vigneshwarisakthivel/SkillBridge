import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
} from "@mui/material";

const styles = {
  container: {
    position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    minHeight: '70vh', textAlign: 'center', background: 'white', padding: '40px',
    borderRadius: '16px', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    animation: 'fadeIn 1s ease-in-out', zIndex: 1000
  },
};

const CoverPage = () => {
  const { uuid } = useParams();
  const [testId, setTestId] = useState(null);
  const navigate = useNavigate();
  const [testData, setTestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const userToken = localStorage.getItem("user_token");

    if (uuid) {
        axios.get(`https://onlineplatform.onrender.com/api/decode-test-uuid/${uuid}/`)
        .then(res => {
          const decodedId = res.data.test_id;
          setTestId(decodedId);

          return fetch(`/api/tests/${decodedId}/`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Token ${userToken}`,
            }
          });
        })
        .then(response => {
          if (!response.ok) {
            throw new Error("Failed to fetch test details");
          }
          return response.json();
        })
        .then(data => {
          setTestData(data);
          setLoading(false);
        })
        .catch(error => {
          console.error("Error fetching test:", error);
          setError("Failed to load test details.");
          setLoading(false);
        });
    }
  }, [uuid]);

  // ✅ Updated navigation to instructions page
  const handleStartTest = () => {
    navigate(`/smartbridge/online-test-assessment/${uuid}/instructions/`);
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Container sx={styles.container}>
      <Typography
        variant="h2"
        sx={{
          fontSize: '3rem', fontWeight: 'bold', color: '#003366', marginBottom: '16px',
          background: 'linear-gradient(135deg, #003366, #00509e)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          animation: 'slideIn 1s ease-in-out'
        }}
      >
        {testData?.title}
      </Typography>

      <Typography variant="h4" sx={{ fontSize: '1.5rem', color: '#1976d2', marginBottom: '16px', fontWeight: '600' }}>
        Created By:
      </Typography>
      <Typography variant="h5" sx={{ fontSize: '1.25rem', color: '#004d40', marginBottom: '16px', fontWeight: '500' }}>
        {testData?.owner_name || "Unknown"}
      </Typography>

      <Typography variant="body1" sx={{ fontSize: '1.1rem', color: '#555', marginBottom: '24px' }}>
        Date: {new Date(testData?.created_at).toLocaleDateString()}
      </Typography>

      <Box sx={{ maxWidth: '800px', textAlign: 'left', marginBottom: '40px' }}>
        <Typography variant="h5" sx={{ fontSize: '1.5rem', color: '#003366', marginBottom: '16px', fontWeight: 'bold' }}>
          About This Assessment
        </Typography>
        <Typography variant="body1" sx={{ fontSize: '1rem', color: '#333', marginBottom: '16px', lineHeight: '1.6' }}>
          {testData?.description}
        </Typography>
      </Box>

      <Typography variant="body1" sx={{ fontSize: '1.2rem', color: '#004d40', marginBottom: '40px', fontWeight: '500' }}>
        Good luck on your test!
      </Typography>

      <Button
        variant="contained"
        color="primary"
        onClick={handleStartTest}
        sx={{
          padding: '12px 24px', fontSize: '1rem', fontWeight: 'bold', borderRadius: '8px',
          background: 'linear-gradient(135deg, #003366, #00509e)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 12px rgba(0, 0, 0, 0.2)'
          }
        }}
      >
        Start Test
      </Button>
    </Container>
  );
};

export default CoverPage;