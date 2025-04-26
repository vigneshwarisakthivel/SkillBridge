import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { Typography, Box, Button, Paper, Grid, Avatar, Divider, Tooltip, CircularProgress, Snackbar, Alert } from "@mui/material";
import { FaMicrophone, FaMapMarkerAlt, FaWifi, FaMobileAlt } from 'react-icons/fa';
import TimerIcon from "@mui/icons-material/Timer";
import AssignmentIcon from "@mui/icons-material/Assignment";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Webcam from "react-webcam";
import * as faceapi from 'face-api.js';
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

     const webcamRef = useRef(null);
     const canvasRef = useRef(null);
     const [modelsLoaded, setModelsLoaded] = useState(false);
     const [isCapturing, setIsCapturing] = useState(false);
     const [captureStatus, setCaptureStatus] = useState('');
     const [captureError, setCaptureError] = useState('');
     const [hasCameraAccess, setHasCameraAccess] = useState(false);
     const [captureDone, setCaptureDone] = useState(false);
     const [detectionRunning, setDetectionRunning] = useState(false);
     const [showWebcam, setShowWebcam] = useState(false);
     const [faceDescriptor, setFaceDescriptor] = useState(null);

    useEffect(() => {
        const userToken = localStorage.getItem("user_token");
      
        if (uuid) {
          axios.get(`https://onlinetestcreationbackend.onrender.com/api/decode-test-uuid/${uuid}/`)
            .then(res => {
              const decodedId = res.data.test_id;
              setTestId(decodedId);
      
              // ✅ Fetch test data only after testId is available
              return fetch(`https://onlinetestcreationbackend.onrender.com/api/tests/${decodedId}/`, {
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
      useEffect(() => {
        if (!modelsLoaded || !webcamRef.current || detectionRunning || !hasCameraAccess || captureDone || !showWebcam) return;

        const detectFaces = async () => {
            setDetectionRunning(true);

            const detectionInterval = setInterval(async () => {
                if (!webcamRef.current || !canvasRef.current) return;

                try {
                    const video = webcamRef.current.video;
                    const canvas = canvasRef.current;
                    const ctx = canvas.getContext('2d');

                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    const detections = await faceapi.detectAllFaces(
                        video,
                        new faceapi.TinyFaceDetectorOptions()
                    ).withFaceLandmarks().withFaceDescriptors();

                    faceapi.matchDimensions(canvas, {
                        width: video.videoWidth,
                        height: video.videoHeight
                    });

                    if (detections.length > 0) {
                        const resizedDetections = faceapi.resizeResults(detections, {
                            width: video.videoWidth,
                            height: video.videoHeight
                        });

                        faceapi.draw.drawDetections(canvas, resizedDetections);
                        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

                        const isValid = validateFaceOrientation(detections[0].landmarks);
                        setCaptureStatus(isValid ? 'Looking straight ✅' : 'Please look straight at the camera');
                    } else {
                        setCaptureStatus('No face detected');
                    }
                } catch (error) {
                    console.error('Detection error:', error);
                    setCaptureError('Error detecting faces');
                }
            }, 500);

            return () => clearInterval(detectionInterval);
        };

        detectFaces();
    }, [modelsLoaded, detectionRunning, hasCameraAccess, captureDone, showWebcam]);

    const calculateCenter = (points) => {
        return {
            x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
            y: points.reduce((sum, point) => sum + point.y, 0) / points.length
        };
    };

    const validateFaceOrientation = (landmarks) => {
        const jawline = landmarks.getJawOutline();
        const nose = landmarks.getNose();
        const leftEye = landmarks.getLeftEye();
        const rightEye = landmarks.getRightEye();

        const leftEyeCenter = calculateCenter(leftEye);
        const rightEyeCenter = calculateCenter(rightEye);

        const leftJaw = jawline[0].x;
        const rightJaw = jawline[jawline.length - 1].x;
        const faceWidth = rightJaw - leftJaw;
        const faceCenter = leftJaw + faceWidth / 2;

        const noseTip = nose[3].x;
        const noseCenterDiff = Math.abs(noseTip - faceCenter);

        const eyeLevelDiff = Math.abs(leftEyeCenter.y - rightEyeCenter.y);
        const eyeHorizontalDiff = Math.abs(leftEyeCenter.x - rightEyeCenter.x);

        const centerThreshold = faceWidth * 0.1;
        const eyeLevelThreshold = 10;
        const eyeHorizontalThreshold = faceWidth * 0.3;

        return (
            noseCenterDiff < centerThreshold &&
            eyeLevelDiff < eyeLevelThreshold &&
            eyeHorizontalDiff > eyeHorizontalThreshold
        );
    };

    const handleConsentToggle = (key) => {
        setConsent(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleEnableWebcam = () => {
        setShowWebcam(true);
        setCaptureError('');
    };

    const captureImage = async () => {
        if (!webcamRef.current) return;

        setIsCapturing(true);
        setCaptureError('');

        try {
            const video = webcamRef.current.video;
            const detections = await faceapi.detectAllFaces(
                video,
                new faceapi.TinyFaceDetectorOptions()
            ).withFaceLandmarks().withFaceDescriptors();

            if (detections.length === 0) throw new Error('No face detected');
            if (detections.length > 1) throw new Error('Multiple faces detected');

            const isValid = validateFaceOrientation(detections[0].landmarks);
            if (!isValid) throw new Error('Please look straight at the camera');

            // Store the face descriptor for proctoring verification
            setFaceDescriptor(detections[0].descriptor);

            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 480;
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, canvas.width, canvas.height);

            const imageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.7));

            setCaptureStatus('Image captured successfully!');
            await sendToBackend(imageBlob, detections[0].descriptor);

        } catch (error) {
            setCaptureError(error.message);
        } finally {
            setIsCapturing(false);
        }
    };

    const sendToBackend = async (imageBlob, descriptor) => {
        const formData = new FormData();
        formData.append('image', imageBlob, 'capture.jpg');
        formData.append('descriptor', JSON.stringify(Array.from(descriptor)));

        try {
            const response = await fetch('https://onlinetestcreationbackend.onrender.com/api/capture/', {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Token ${localStorage.getItem('user_token')}`,
                },
            });

            const data = await response.json();
            if (data.success) {
                setCaptureStatus('Verification successful!');
                setCaptureDone(true);
                setHasCameraAccess(false);
                localStorage.setItem('faceDescriptor', JSON.stringify(Array.from(descriptor))); // Store descriptor for proctoring
            } else {
                throw new Error(data.message || 'Verification failed');
            }
        } catch (error) {
            console.error('Upload error:', error);
            setCaptureError(error.message);
        }
    };
     // Load face-api.js models
     const loadModels = async () => {
        try {
            const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
                faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
                faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
            ]);
            setModelsLoaded(true);
        } catch {
            const localModelsPath = process.env.PUBLIC_URL + '/models';
            try {
                await Promise.all([
                    faceapi.nets.tinyFaceDetector.loadFromUri(localModelsPath),
                    faceapi.nets.faceLandmark68Net.loadFromUri(localModelsPath),
                    faceapi.nets.faceRecognitionNet.loadFromUri(localModelsPath),
                    faceapi.nets.faceExpressionNet.loadFromUri(localModelsPath),
                ]);
                setModelsLoaded(true);
            } catch (error) {
                console.error('Model loading failed:', error);
                setCaptureError('Failed to load face detection models.');
            }
        }
    };

    loadModels();

    const handleStartTest = () => {
        if (!captureDone) {
            setCaptureError('Please complete face verification before starting the test');
            return;
        }

        const userToken = localStorage.getItem("user_token");

        fetch(`https://onlinetestcreationbackend.onrender.com/api/tests/${testId}/save_consent/`, {
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
            setCaptureError("Failed to start test");
        });
    };

    if (loading) return <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 5 }} />;
    if (error) return <Typography color="error">{error}</Typography>;

    return (
        <Paper elevation={4} sx={{ padding: 4, borderRadius: 2, margin: 'auto', maxWidth: '800px' }}>
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
        
        {/* Face Verification Section */}
        <Box sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h6" sx={{ fontWeight: "bold", color: "#003366", mb: 2 }}>
                Face Verification
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {!showWebcam ? (
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleEnableWebcam}
                    sx={{ mb: 3 }}
                >
                    Enable Webcam for Verification
                </Button>
            ) : (
                <>
                    <Box sx={{ position: 'relative', mb: 3 }}>
                        {!captureDone && (
                            <Webcam
                                ref={webcamRef}
                                audio={false}
                                screenshotFormat="image/jpeg"
                                videoConstraints={{
                                    width: 640,
                                    height: 480,
                                    facingMode: 'user'
                                }}
                                style={{
                                    width: '100%',
                                    maxWidth: '640px',
                                    borderRadius: '8px',
                                    border: '2px solid #1976d2'
                                }}
                                onUserMediaError={(error) => {
                                    console.error('Camera error:', error);
                                    setCaptureError('Could not access camera. Please check permissions.');
                                    setHasCameraAccess(false);
                                }}
                                onUserMedia={() => {
                                    setHasCameraAccess(true);
                                    setCaptureError('');
                                }}
                            />
                        )}
                        <canvas
                            ref={canvasRef}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                maxWidth: '640px',
                                height: '100%',
                                pointerEvents: 'none'
                            }}
                        />
                    </Box>

                    <Typography variant="body1" sx={{ mb: 2 }}>
                        Status: {captureStatus}
                    </Typography>

                    {captureError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {captureError}
                        </Alert>
                    )}

                    {!captureDone && (
                        <Button
                            variant="contained"
                            color="primary"
                            size="large"
                            onClick={captureImage}
                            disabled={isCapturing || !modelsLoaded || !hasCameraAccess}
                        >
                            {isCapturing ? (
                                <>
                                    <CircularProgress size={24} sx={{ mr: 1 }} />
                                    Capturing...
                                </>
                            ) : (
                                'Verify Face'
                            )}
                        </Button>
                    )}

                    {captureDone && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            Face verification completed successfully!
                        </Alert>
                    )}
                </>
            )}
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button 
                variant="contained" 
                color="primary" 
                onClick={handleStartTest} 
                sx={{ mt: 2, fontWeight: "bold", width: '200px' }}
                disabled={!captureDone}
            >
                Start Test
            </Button>
        </Box>
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