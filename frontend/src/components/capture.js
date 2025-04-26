import React, { useRef, useState, useEffect } from 'react';
import * as faceapi from 'face-api.js';
import { Button, Container, Box, Typography, CircularProgress, Alert } from '@mui/material';
import Webcam from 'react-webcam';

const CapturePage = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureStatus, setCaptureStatus] = useState('');
  const [captureError, setCaptureError] = useState('');
  const [detectionRunning, setDetectionRunning] = useState(false);
  const [hasCameraAccess, setHasCameraAccess] = useState(false);
  const [captureDone, setCaptureDone] = useState(false); // 🔥 New state

  const userToken = localStorage.getItem('usertoken');

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch {
        const localModelsPath = process.env.PUBLIC_URL + '/models';
        try {
          await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(localModelsPath),
            faceapi.nets.faceLandmark68Net.loadFromUri(localModelsPath),
            faceapi.nets.faceRecognitionNet.loadFromUri(localModelsPath),
          ]);
          setModelsLoaded(true);
        } catch (error) {
          console.error('Model loading failed:', error);
          setCaptureError('Failed to load models.');
        }
      }
    };

    loadModels();
  }, []);

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

  useEffect(() => {
    if (!modelsLoaded || !webcamRef.current || detectionRunning || !hasCameraAccess || captureDone) return;

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
          ).withFaceLandmarks();

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
  }, [modelsLoaded, detectionRunning, hasCameraAccess, captureDone]);

  const captureImage = async () => {
    if (!webcamRef.current) return;

    setIsCapturing(true);
    setCaptureError('');

    try {
      const video = webcamRef.current.video;
      const detections = await faceapi.detectAllFaces(
        video,
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks();

      if (detections.length === 0) throw new Error('No face detected');
      if (detections.length > 1) throw new Error('Multiple faces detected');

      const isValid = validateFaceOrientation(detections[0].landmarks);
      if (!isValid) throw new Error('Please look straight at the camera');

      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const context = canvas.getContext('2d');
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.7));

      setCaptureStatus('Image captured successfully!');
      await sendToBackend(imageBlob);

    } catch (error) {
      setCaptureError(error.message);
    } finally {
      setIsCapturing(false);
    }
  };

  const sendToBackend = async (imageBlob) => {
    const formData = new FormData();
    formData.append('image', imageBlob, 'capture.jpg');

    try {
      const response = await fetch('https://onlinetestcreationbackend.onrender.com/api/capture/', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Token ${userToken}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setCaptureStatus('Verification successful!');
        setCaptureDone(true); // 💥 Disable capture and webcam
        setHasCameraAccess(false);
      } else {
        throw new Error(data.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setCaptureError(error.message);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box sx={{ p: 3, boxShadow: 3, borderRadius: 2 }}>
        
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
              height: '100%',
              pointerEvents: 'none'
            }}
          />
        </Box>

        <Typography variant="h6" sx={{ mb: 2 }}>
          Status: {captureStatus}
        </Typography>

        {captureError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {captureError}
          </Alert>
        )}

        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={captureImage}
          disabled={isCapturing || !modelsLoaded || !hasCameraAccess || captureDone}
        >
          {isCapturing ? (
            <>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              Capturing...
            </>
          ) : (
            'Capture Image'
          )}
        </Button>
      </Box>
    </Container>
  );
};

export default CapturePage;