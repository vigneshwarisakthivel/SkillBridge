import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import * as faceapi from "face-api.js";
const API_BASE_URL = 'https://onlinetestcreationbackend.onrender.com/api';
const Proctoring = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [warning, setWarning] = useState("");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [detectionRunning, setDetectionRunning] = useState(false);

  // Load models and start webcam
  useEffect(() => {
    const initialize = async () => {
      try {
        // Load face detection models
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
          faceapi.nets.ssdMobilenetv1.loadFromUri("/models")
        ]);
        setModelsLoaded(true);
        
        // Start webcam with higher resolution
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: { exact: "user" } // Strictly require front camera
          } 
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setLoading(false);
          startFaceDetection();
        }
      } catch (err) {
        console.error("Initialization error:", err);
        setWarning(err.message.includes("permission") 
          ? "⚠️ Camera access is required for proctoring. Please enable camera permissions." 
          : "Failed to initialize. Please refresh the page.");
      }
    };

    initialize();

    // Tab switch detection
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setWarning("⚠️ Tab switching detected! This may be reported as suspicious activity.");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      stopFaceDetection();
    };
  }, []);

  const startFaceDetection = () => {
    if (!modelsLoaded || detectionRunning) return;
    
    setDetectionRunning(true);
    const detectInterval = setInterval(async () => {
      if (!videoRef.current || !modelsLoaded) return;
      
      try {
        // Detect all faces with landmarks
        const detections = await faceapi.detectAllFaces(
          videoRef.current, 
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 512,
            scoreThreshold: 0.7 // Higher threshold for more accuracy
          })
        ).withFaceLandmarks();
        
        // Draw detections on canvas
        if (canvasRef.current && detections.length > 0) {
          const displaySize = {
            width: videoRef.current.videoWidth,
            height: videoRef.current.videoHeight
          };
          faceapi.matchDimensions(canvasRef.current, displaySize);
          
          const resizedDetections = faceapi.resizeResults(detections, displaySize);
          const ctx = canvasRef.current.getContext("2d");
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          
          // Draw face detection box
          faceapi.draw.drawDetections(canvasRef.current, resizedDetections);
          
          // Draw face landmarks
          faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections);
        }
      } catch (err) {
        console.error("Detection error:", err);
      }
    }, 500); // Run detection every 500ms
    
    return () => clearInterval(detectInterval);
  };

  const stopFaceDetection = () => {
    setDetectionRunning(false);
  };

  const validateFace = (landmarks, box) => {
    // 1. Check all facial features are visible and not covered
    const features = {
      jaw: landmarks.getJawOutline(),
      nose: landmarks.getNose(),
      mouth: landmarks.getMouth(),
      leftEye: landmarks.getLeftEye(),
      rightEye: landmarks.getRightEye(),
      leftBrow: landmarks.getLeftEyeBrow(),
      rightBrow: landmarks.getRightEyeBrow()
    };

    // Check if eyes are open and visible
    const checkEyeVisibility = (eyePoints) => {
      if (eyePoints.length < 6) return false;
      
      // Calculate eye openness (vertical distance between points)
      const top = (eyePoints[1].y + eyePoints[2].y) / 2;
      const bottom = (eyePoints[4].y + eyePoints[5].y) / 2;
      const eyeOpenness = bottom - top;
      
      return eyeOpenness > 8; // Higher threshold for eye openness
    };

    // Check for mask by analyzing mouth and nose coverage
    const checkForMask = () => {
      const nosePoints = features.nose;
      const mouthPoints = features.mouth;
      
      // If we can't detect enough nose or mouth points, suspect a mask
      if (nosePoints.length < 5 || mouthPoints.length < 12) {
        return true;
      }
      
      // Check if mouth is obscured by comparing vertical positions
      const upperLip = mouthPoints[3].y;
      const lowerLip = mouthPoints[9].y;
      const mouthHeight = lowerLip - upperLip;
      
      if (mouthHeight < 5) { // Very small mouth opening might indicate mask
        return true;
      }
      
      return false;
    };

    if (checkForMask()) {
      throw new Error("Face mask detected. Please remove any face coverings.");
    }

    if (!checkEyeVisibility(features.leftEye) || !checkEyeVisibility(features.rightEye)) {
      throw new Error("Both eyes must be clearly visible and open");
    }

    for (const [feature, points] of Object.entries(features)) {
      if (points.length === 0) {
        throw new Error(`Your ${feature.replace("Brow", " eyebrow")} is not visible`);
      }
    }

    // 2. Check face size (minimum 50% of frame)
    const frameArea = videoRef.current.videoWidth * videoRef.current.videoHeight;
    const faceArea = box.width * box.height;
    if ((faceArea / frameArea) < 0.5) {
      throw new Error("Move closer - your face should fill at least 50% of the frame");
    }

    // 3. Check face is centered
    const centerThreshold = videoRef.current.videoWidth * 0.15; // Stricter center threshold
    const faceCenterX = box.x + box.width / 2;
    const faceCenterY = box.y + box.height / 2;
    const frameCenterX = videoRef.current.videoWidth / 2;
    const frameCenterY = videoRef.current.videoHeight / 2;

    if (
      Math.abs(faceCenterX - frameCenterX) > centerThreshold ||
      Math.abs(faceCenterY - frameCenterY) > centerThreshold
    ) {
      throw new Error("Center your face in the frame");
    }

    // 4. Check face is looking straight
    const jawline = landmarks.getJawOutline();
    const noseTip = landmarks.getNose()[3].x;
    const midPoint = (jawline[0].x + jawline[jawline.length - 1].x) / 2;
    if (Math.abs(noseTip - midPoint) > 20) { // Stricter threshold
      throw new Error("Look straight at the camera without tilting your head");
    }

    // 5. Additional validation for face straightness
    const eyeLevelDifference = Math.abs(features.leftEye[0].y - features.rightEye[0].y);
    if (eyeLevelDifference > 8) {
      throw new Error("Keep your head straight - no tilting");
    }
  };

  const captureFrame = async () => {
    setWarning("");
    setMessage("");
    
    if (!videoRef.current || !modelsLoaded) {
      setWarning("System not ready. Please wait...");
      return;
    }

    try {
      // Detect all faces with high accuracy settings
      const detections = await faceapi.detectAllFaces(
        videoRef.current, 
        new faceapi.TinyFaceDetectorOptions({
          inputSize: 512,
          scoreThreshold: 0.75 // Higher threshold for more accuracy
        })
      ).withFaceLandmarks();

      // Validate face detection
      if (detections.length === 0) {
        throw new Error("No face detected. Ensure your full face is clearly visible.");
      }
      if (detections.length > 1) {
        throw new Error(`Multiple faces detected (${detections.length}). Only one person is allowed.`);
      }

      const landmarks = detections[0].landmarks;
      const box = detections[0].detection.box;

      // Validate face meets all requirements
      validateFace(landmarks, box);

      // Capture the frame
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      // Draw detection box on the captured image for verification
      faceapi.draw.drawDetections(canvas, [detections[0].detection]);
      faceapi.draw.drawFaceLandmarks(canvas, [landmarks]);

      // Convert to blob and send to server
      canvas.toBlob(async (blob) => {
        if (!blob) {
          throw new Error("Failed to capture image");
        }

        const formData = new FormData();
        formData.append("image", blob, "verified_frame.jpg");

        try {
          const response = await axios.post(
            `${API_BASE_URL}/analyze-frame/`,
            formData,
            {
              headers: {
                Authorization: `Token ${localStorage.getItem("user_token")}`,
                "Content-Type": "multipart/form-data",
              },
            }
          );

          if (response.data.face_count === 1 && !response.data.suspicious) {
            setMessage("✅ Identity verified successfully!");
            setImageUrl(response.data.image_url);
          } else {
            setWarning(response.data.error || "Verification failed. Please try again.");
          }
        } catch (err) {
          setWarning(err.response?.data?.error || "Server error. Please try again.");
        }
      }, "image/jpeg", 0.95); // Higher quality

    } catch (err) {
      setWarning(`⚠️ ${err.message}`);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Secure Proctoring System</h2>
      
      {/* Webcam Feed with Overlay Canvas */}
      <div style={styles.videoContainer}>
        {loading ? (
          <div style={styles.loadingPlaceholder}>
            <p>{warning || "Initializing camera and face detection..."}</p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={styles.video}
            />
            <canvas
              ref={canvasRef}
              style={styles.overlayCanvas}
            />
          </>
        )}
      </div>

      {/* Capture Button */}
      <button
        onClick={captureFrame}
        style={styles.captureButton}
        disabled={loading || warning.includes("detected")}
      >
        {loading ? "Initializing..." : "Verify Identity"}
      </button>

      {/* Status Messages */}
      <div style={styles.messageContainer}>
        {warning && (
          <div style={styles.warningContainer}>
            <p style={styles.warning}>⚠️ {warning}</p>
            <p style={styles.instructions}>Please adjust your position and try again.</p>
          </div>
        )}
        {message && <p style={styles.success}>{message}</p>}
      </div>

      {/* Captured Image */}
      {imageUrl && (
        <div style={styles.capturedImageContainer}>
          <h3 style={styles.capturedTitle}>Verified Identity Photo:</h3>
          <img
            src={imageUrl}
            alt="Verified identity"
            style={styles.capturedImage}
          />
          <p style={styles.verificationNote}>
            This image has been saved for verification purposes.
          </p>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: "800px",
    margin: "0 auto",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: "#f8f9fa",
    borderRadius: "10px",
    boxShadow: "0 2px 15px rgba(0,0,0,0.1)"
  },
  title: {
    color: "#2c3e50",
    marginBottom: "30px",
    textAlign: "center",
    fontSize: "28px",
    fontWeight: "600"
  },
  videoContainer: {
    position: "relative",
    width: "100%",
    maxWidth: "640px",
    marginBottom: "20px"
  },
  loadingPlaceholder: {
    width: "640px",
    height: "480px",
    backgroundColor: "#e9ecef",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: "8px",
    color: "#495057",
    fontSize: "18px",
    textAlign: "center",
    padding: "20px"
  },
  video: {
    width: "100%",
    maxWidth: "640px",
    border: "3px solid #3498db",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    backgroundColor: "#000"
  },
  overlayCanvas: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none"
  },
  captureButton: {
    padding: "14px 30px",
    fontSize: "18px",
    backgroundColor: "#3498db",
    color: "white",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    margin: "20px 0",
    transition: "all 0.3s ease",
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
    ":hover": {
      backgroundColor: "#2980b9",
      transform: "translateY(-2px)",
      boxShadow: "0 4px 8px rgba(0,0,0,0.3)"
    },
    ":disabled": {
      backgroundColor: "#95a5a6",
      cursor: "not-allowed",
      transform: "none",
      boxShadow: "none"
    }
  },
  messageContainer: {
    width: "100%",
    maxWidth: "640px",
    minHeight: "80px",
    margin: "10px 0"
  },
  warningContainer: {
    backgroundColor: "#fdecea",
    padding: "15px",
    borderRadius: "6px",
    borderLeft: "5px solid #e74c3c",
    margin: "10px 0"
  },
  warning: {
    color: "#c0392b",
    margin: "0 0 8px 0",
    fontSize: "16px",
    fontWeight: "500"
  },
  instructions: {
    color: "#7f8c8d",
    margin: "0",
    fontSize: "14px"
  },
  success: {
    color: "#27ae60",
    backgroundColor: "#e8f8f0",
    padding: "15px",
    borderRadius: "6px",
    borderLeft: "5px solid #2ecc71",
    margin: "10px 0",
    fontSize: "16px",
    fontWeight: "500"
  },
  capturedImageContainer: {
    width: "100%",
    maxWidth: "640px",
    marginTop: "30px",
    textAlign: "center",
    backgroundColor: "#fff",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
  },
  capturedTitle: {
    color: "#2c3e50",
    marginBottom: "15px",
    fontSize: "20px",
    fontWeight: "600"
  },
  capturedImage: {
    width: "100%",
    border: "3px solid #27ae60",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
  },
  verificationNote: {
    color: "#7f8c8d",
    fontSize: "14px",
    marginTop: "10px",
    fontStyle: "italic"
  }
};

export default Proctoring;