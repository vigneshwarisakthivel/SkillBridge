import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { Typography, Box, Button, Paper, Grid, Avatar, Divider, Tooltip, CircularProgress, Snackbar, Alert } from "@mui/material";
import { FaMicrophone, FaMapMarkerAlt, FaWifi, FaMobileAlt } from 'react-icons/fa';
import TimerIcon from "@mui/icons-material/Timer";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Webcam from "react-webcam";
import axios from "axios";

const InstructionPage = () => {
    const { uuid,randomString } = useParams();
    const navigate = useNavigate();
    const [testId, setTestId] = useState(null);
    const [testData, setTestData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [consent, setConsent] = useState({
        microphone: false,
        location: false,
        network: false,
        phone: false
    });

    // Webcam States
    const [isWebcamEnabled, setIsWebcamEnabled] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [warning, setWarning] = useState("");
    const [isPhotoCaptured, setIsPhotoCaptured] = useState(false);
    const [message, setMessage] = useState("");
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [isFaceValid, setIsFaceValid] = useState(false);
    const webcamRef = useRef(null);

    useEffect(() => {
        const userToken = localStorage.getItem("user_token");
      
        if (uuid) {
          axios.get(`http://localhost:8000/api/decode-test-uuid/${uuid}/`)
            .then(res => {
              const decodedId = res.data.test_id;
              setTestId(decodedId);
      
              // ✅ Fetch test data only after testId is available
              return fetch(`http://localhost:8000/api/tests/${decodedId}/`, {
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
      

    const handleConsentToggle = (key) => {
        setConsent(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleEnableWebcam = () => {
        setIsWebcamEnabled(true);
    };

    const handleCapturePhoto = async () => {
        if (!webcamRef.current) return;
    
        const imageSrc = webcamRef.current.getScreenshot();
        setCapturedImage(imageSrc);
    
        if (!imageSrc) {
            setWarning("Failed to capture image.");
            setIsFaceValid(false);
            return;
        }
        
        // Convert Base64 to Blob
        const byteString = atob(imageSrc.split(',')[1]);
        const mimeString = imageSrc.split(',')[0].split(':')[1].split(';')[0];
    
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const uint8Array = new Uint8Array(arrayBuffer);
    
        for (let i = 0; i < byteString.length; i++) {
            uint8Array[i] = byteString.charCodeAt(i);
        }
    
        const imageBlob = new Blob([uint8Array], { type: mimeString });
    
        // Append Blob to FormData
        const formData = new FormData();
        formData.append("image", imageBlob, "photo.jpg");
    
        const userToken = localStorage.getItem("user_token");
    
        try {
            const response = await axios.post(
                "http://127.0.0.1:8000/api/analyze-frame/",
                formData,
                {
                    headers: {
                        Authorization: `Token ${userToken}`,
                        "Content-Type": "multipart/form-data",
                    },
                }
            );
    
            console.log("Response from backend:", response.data);
    
            if (response.data.error) {
                setWarning(response.data.error);
                setIsFaceValid(false);
            } else if (response.data.face_count > 1) {
                setWarning("Multiple faces detected! Only one face is allowed.");
                setIsFaceValid(false);
            } else if (response.data.face_count === 1) {
                setWarning("");
                setMessage("Face verified successfully!");
                setIsFaceValid(true);
                setIsPhotoCaptured(true);
            } else {
                setWarning("No face detected. Please try again.");
                setIsFaceValid(false);
            }
        } catch (error) {
            console.error("Error sending frame:", error);
            setWarning(error.response?.data?.error || "Failed to analyze frame.");
            setIsFaceValid(false);
        }
    };

    const handleStartTest = () => {
        if (!isFaceValid) {
            setSnackbarMessage("Please verify your face first!");
            setOpenSnackbar(true);
            return;
        }

        const userToken = localStorage.getItem("user_token");

        fetch(`http://localhost:8000/api/tests/${testId}/save_consent/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Token ${userToken}`
            },
            body: JSON.stringify(consent)
        })
        .then(() => {
            navigate(`/smartbridge/online-test-assessment/${randomString}/${testId}/write`);
        })
        .catch(err => {
            console.error("Error saving consent:", err);
            setSnackbarMessage("Failed to start test");
            setOpenSnackbar(true);
        });
    };

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    };

    if (loading) return <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 5 }} />;
    if (error) return <Typography color="error">{error}</Typography>;

    return (
        <Paper elevation={4} sx={{ padding: 4, borderRadius: 2, margin: 'auto' }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold", color: "#003366", textAlign: "center" }}>
                Welcome to {testData?.title}
            </Typography>

            <Grid container spacing={2} justifyContent="center">
                <Grid item xs={12} sm={4} md={3}><InfoBox icon={<TimerIcon />} text={`${testData?.time_limit} mins`} label="Time Limit" /></Grid>
                <Grid item xs={12} sm={4} md={3}><InfoBox icon={<AssignmentIcon />} text={testData?.total_questions} label="Total Questions" /></Grid>
                <Grid item xs={12} sm={4} md={3}><InfoBox icon={<CheckCircleIcon />} text="Multiple Formats" label="MCQ, True/False, Fill-in-the-Blank" /></Grid>
            </Grid>
            
            {/* Instructions */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: "bold", color: "#003366", mb: 2 }}>
                    General Instructions
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                    {(testData?.instructions || "").split('.').map((instruction, index) => (
                        instruction.trim() && (
                            <Grid item xs={12} sm={6} md={4} key={index}>
                                <Paper sx={{ padding: 2, display: "flex", alignItems: "center", borderRadius: 1 }}>
                                    <CheckCircleIcon sx={{ color: "#003366", mr: 2 }} />
                                    <Typography variant="body2">{instruction.trim() + '.'}</Typography>
                                </Paper>
                            </Grid>
                        )
                    ))}
                </Grid>
            </Box>
            
            {/* Consent Toggle */}
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "#003366", mt: 3 }}>Enable Monitoring</Typography>
            <Grid container spacing={2} justifyContent="center">
                {[{ key: "microphone", icon: <FaMicrophone />, label: "Microphone" },
                { key: "location", icon: <FaMapMarkerAlt />, label: "Location" },
                { key: "network", icon: <FaWifi />, label: "Network" },
                { key: "phone", icon: <FaMobileAlt />, label: "Phone" }].map(({ key, icon, label }) => (
                    <Grid item xs={6} sm={3} key={key}>
                        <ConsentToggle icon={icon} label={label} enabled={consent[key]} onClick={() => handleConsentToggle(key)} />
                    </Grid>
                ))}
            </Grid>
            
            <Grid container spacing={4} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: "bold", color: "#003366", mb: 2 }}>
                            Webcam Proctoring
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        {isWebcamEnabled && !isPhotoCaptured && (
                            <Box sx={{ textAlign: "center" }}>
                                <Webcam
                                    audio={false}
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    width={200}
                                    height={200}
                                    videoConstraints={{ facingMode: "user" }}
                                    style={{ borderRadius: "8px", width: "200px", height: "200px", objectFit: "cover" }}
                                />
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    onClick={handleCapturePhoto}
                                    sx={{ marginTop: '10px' }}
                                    disabled={isPhotoCaptured}
                                >
                                    Capture Photo
                                </Button>
                            </Box>
                        )}
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleEnableWebcam}
                            sx={{ mt: 2, fontWeight: "bold" }}
                            disabled={isPhotoCaptured}
                        >
                            Enable Webcam
                        </Button>
                    </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                    {capturedImage && (
                        <Box sx={{ textAlign: "center" }}>
                            <Typography variant="body2" sx={{ color: "#666", marginTop: '10px' }}>
                                Photo Captured!
                            </Typography>
                            <img src={capturedImage} alt="Captured" style={{ width: '200px', height: '200px', borderRadius: '8px', marginTop: '10px' }} />
                        </Box>
                    )}
                    {warning && <Typography variant="body2" sx={{ color: "red", marginTop: '10px' }}>{warning}</Typography>}
                    {message && <Typography variant="body2" sx={{ color: "green", marginTop: '10px' }}>{message}</Typography>}
                </Grid>
            </Grid>
            
            <Button 
                variant="contained" 
                color="primary" 
                onClick={handleStartTest} 
                sx={{ mt: 4, fontWeight: "bold" }}
                disabled={!isFaceValid}
            >
                Start Test
            </Button>
            
            <Snackbar
                open={openSnackbar}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity="info" sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Paper>
    );
};

const InfoBox = ({ icon, text, label }) => (
    <Box sx={{ textAlign: "center", padding: 2 }}>
        <Avatar sx={{ bgcolor: "#1976d2", width: 48, height: 48, margin: "0 auto" }}>{icon}</Avatar>
        <Typography variant="body1" sx={{ mt: 1, fontWeight: "bold" }}>{text}</Typography>
        <Typography variant="body2" sx={{ color: "#666" }}>{label}</Typography>
    </Box>
);

const ConsentToggle = ({ icon, label, enabled, onClick }) => (
    <Tooltip title={enabled ? "Click to disable" : "Click to enable"} arrow>
        <Box onClick={onClick} sx={{ textAlign: "center", cursor: "pointer", padding: 2, border: `2px solid ${enabled ? '#007bff' : '#e0e0e0'}`, borderRadius: "8px" }}>
            {React.cloneElement(icon, { color: enabled ? "#007bff" : "#555" })}
            <Typography variant="body2" sx={{ fontWeight: "600" }}>{label}</Typography>
        </Box>
    </Tooltip>
);

export default InstructionPage;