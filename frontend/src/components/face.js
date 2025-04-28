import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";
import axios from "axios";
const API_BASE_URL = 'https://onlinetestcreationbackend.onrender.com/api';
const WebcamProctoring = ({ studentId, testId }) => {
    const videoRef = useRef(null);
    const [alertMessage, setAlertMessage] = useState(""); // Alert message for user feedback
    const [warningMessage, setWarningMessage] = useState(""); // Warning message for approaching alert limit
    const [baselineEyes, setBaselineEyes] = useState(null); // Baseline eye positions
    const [alertCount, setAlertCount] = useState(0); // Counter for alerts
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const microphoneRef = useRef(null);
    const [lastAlertTime, setLastAlertTime] = useState(0);
    const alertCooldown = 5000; // 5 seconds cooldown for alerts
    const [isDragging, setIsDragging] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [circlePosition, setCirclePosition] = useState({ x: 0, y: 0 }); // Track circle position
    const [previousLipLandmarks, setPreviousLipLandmarks] = useState(null); // Store previous lip landmarks

    useEffect(() => {
        const loadModels = async () => {
            try {
                await faceapi.nets.tinyFaceDetector.loadFromUri("https://justadudewhohacks.github.io/face-api.js/models");
                await faceapi.nets.faceRecognitionNet.loadFromUri("https://justadudewhohacks.github.io/face-api.js/models");
                await faceapi.nets.faceLandmark68Net.loadFromUri("https://justadudewhohacks.github.io/face-api.js/models");
                await faceapi.nets.faceExpressionNet.loadFromUri("https://justadudewhohacks.github.io/face-api.js/models");

                console.log("✅ Face API models loaded successfully");
                startVideo();
            } catch (error) {
                console.error("❌ Error loading Face API models:", error);
            }
        };

        const startVideo = () => {
            navigator.mediaDevices
                .getUserMedia({ video: true, audio: true }) // Request both video and audio
                .then((stream) => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        console.log("✅ Webcam started successfully");
                        setTimeout(calibrateEyes, 5000); // Start calibration after 5 seconds
                        setupAudio(stream); // Set up audio processing
                    }
                })
                .catch((err) => {
                    console.error("❌ Error accessing webcam:", err);
                    setAlertMessage("⚠️ Please allow camera access.");
                });
        };

        loadModels();
    }, []);

    const setupAudio = (stream) => {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
        analyserRef.current = audioContextRef.current.createAnalyser();
        microphoneRef.current.connect(analyserRef.current);
        analyserRef.current.fftSize = 2048;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const detectTalking = () => {
            analyserRef.current.getByteFrequencyData(dataArray);
            const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;

            if (average > 50) { // Adjust threshold as needed
                handleAlert("⚠️ Talking detected! Please focus on the test.", "Talking detected", false); // Do not increment alert count
            }

            requestAnimationFrame(detectTalking);
        };

        detectTalking();
    };

    const handleAlert = (message, eventType, incrementCount = true) => {
        const currentTime = Date.now();
        if (currentTime - lastAlertTime > alertCooldown) {
            setAlertMessage(message);
            logMalpractice(eventType);
            setLastAlertTime(currentTime);

            if (incrementCount) {
                handleAlertCount(); // Increment alert count only if specified
            }

            // Clear the alert message after 4 seconds
            setTimeout(() => {
                setAlertMessage("");
            }, 4000); // 4 seconds
        }
    };

    const handleAlertCount = () => {
        setAlertCount((prevCount) => {
            const newCount = prevCount + 1;
            if (newCount >= 10) { // Set alert count limit to 10
                exitTest(); // Exit the test if alert count reaches 10
            }

            // Check if the alert count is approaching the limit (e.g., 8 out of 10)
            if (newCount >= 8 && newCount < 10) {
                setWarningMessage("⚠️ You have only 2 alerts left before the limit!");
            } else {
                setWarningMessage(""); // Clear warning message if not approaching limit
            }

            return newCount;
        });
    };

    const logMalpractice = async (eventType) => {
        const token = localStorage.getItem("user_token"); // Retrieve user token
        if (!token) {
            console.error("❌ No token found in localStorage");
            return; // Prevent sending the request if token is missing
        }

        const data = {
            student_id: studentId,
            test_id: testId,
            event_type: eventType,
        };

        console.log("📤 Sending Malpractice Data:", data); // Debugging

        try {
            const response = await axios.post(
                `${API_BASE_URL}/log-malpractice/`,
                data,
                {
                    headers: {
                        Authorization: `Token ${token}`, // Include token in headers
                        "Content-Type": "application/json",
                    },
                }
            );
            console.log("✅ Malpractice Logged:", response.data);
        } catch (error) {
            console.error("❌ Error logging malpractice:", error.response ? error.response.data : error.message);
            if (error.response) {
                console.error("Response data:", error.response.data);
                console.error("Response status:", error.response.status);
            }
        }
    };

    const calibrateEyes = async () => {
        if (videoRef.current) {
            const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks();

            if (detections.length === 1) {
                const landmarks = detections[0].landmarks;
                const leftEye = landmarks.getLeftEye();
                const rightEye = landmarks.getRightEye();

                const leftEyeCenter = getEyeCenter(leftEye);
                const rightEyeCenter = getEyeCenter(rightEye);

                const rotation = getHeadRotation(landmarks);
                if (rotation === "center") {
                    setBaselineEyes({ leftEyeCenter, rightEyeCenter });
                    console.log("✅ Calibration complete:", { leftEyeCenter, rightEyeCenter });
                } else {
                    console.log("❌ Calibration failed: Student not looking straight");
                    setAlertMessage("⚠️ Please look straight at the screen for calibration.");
                }
            } else {
                console.log("❌ Calibration failed: No face detected");
                setAlertMessage("⚠️ Please ensure your face is visible for calibration.");
            }
        }
    };

    const detectFace = async () => {
        if (videoRef.current) {
            const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions());

            console.log("🔍 Face Detections:", detections.length);

            if (detections.length === 0) {
                handleAlert("⚠️ No face detected! Stay in front of the camera.", "No face detected");
            } else if (detections.length > 1) {
                handleAlert("⚠️ Multiple faces detected! You are not alone.", "Multiple faces detected");
            } else {
                setAlertMessage(""); // Clear alert if only one face is detected
            }
        }
    };

    const detectFaceAndEyes = async () => {
        await detectFace(); // Call detectFace first
        if (videoRef.current && baselineEyes) {
            const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks();

            if (detections.length === 1) {
                const landmarks = detections[0].landmarks;
                const leftEye = landmarks.getLeftEye();
                const rightEye = landmarks.getRightEye();

                const leftEyeCenter = getEyeCenter(leftEye);
                const rightEyeCenter = getEyeCenter(rightEye);

                console.log("👀 Eye Positions:", { leftEyeCenter, rightEyeCenter });
                const leftEyeDeviation = Math.abs(leftEyeCenter.x - baselineEyes.leftEyeCenter.x) + Math.abs(leftEyeCenter.y - baselineEyes.leftEyeCenter.y);
                const rightEyeDeviation = Math.abs(rightEyeCenter.x - baselineEyes.rightEyeCenter.x) + Math.abs(rightEyeCenter.y - baselineEyes.rightEyeCenter.y);
                console.log("📏 Deviations:", { leftEyeDeviation, rightEyeDeviation });

                // Check if eyes are looking away
                if (isLookingAway(leftEyeCenter, rightEyeCenter)) {
                    handleAlert("⚠️ Look at the screen!", "Eye movement detected");
                } else {
                    setAlertMessage(""); // Clear alert if eyes are within bounds
                }

                // Check head rotation
                const rotation = getHeadRotation(landmarks);
                if (rotation === "left") {
                    handleAlert("⚠️ Look at the screen! (Head turned left)", "Head turned left");
                } else if (rotation === "right") {
                    handleAlert("⚠️ Look at the screen! (Head turned right)", "Head turned right");
                }

                // Detect lip movement
                const lipLandmarks = landmarks.getMouth();
                if (previousLipLandmarks) {
                    const lipMovement = calculateLipMovement(lipLandmarks, previousLipLandmarks);
                    if (lipMovement > 10) { // Adjust threshold as needed
                        handleAlert("⚠️ Talking detected! Please focus on the test.", "Talking detected", false); // Do not increment alert count
                    }
                }
                setPreviousLipLandmarks(lipLandmarks); // Update previous lip landmarks
            }
        }
    };

    // Helper function to calculate the center of an eye
    const getEyeCenter = (eyeLandmarks) => {
        const x = eyeLandmarks.reduce((sum, point) => sum + point.x, 0) / eyeLandmarks.length;
        const y = eyeLandmarks.reduce((sum, point) => sum + point.y, 0) / eyeLandmarks.length;
        return { x, y };
    };

    // Helper function to determine if eyes are looking away
    const isLookingAway = (leftEyeCenter, rightEyeCenter) => {
        if (!baselineEyes) return false; // Skip if baselineEyes is not set

        const horizontalThreshold = 70; // Increased horizontal threshold to reduce sensitivity
        const verticalThreshold = 50; // Increased vertical threshold for looking down

        // Calculate deviation from baseline
        const leftEyeDeviation = Math.abs(leftEyeCenter.x - baselineEyes.leftEyeCenter.x) + Math.abs(leftEyeCenter.y - baselineEyes.leftEyeCenter.y);
        const rightEyeDeviation = Math.abs(rightEyeCenter.x - baselineEyes.rightEyeCenter.x) + Math.abs(rightEyeCenter.y - baselineEyes.rightEyeCenter.y);

        console.log("Left Eye Deviation:", leftEyeDeviation);
        console.log("Right Eye Deviation:", rightEyeDeviation);

        return (
            leftEyeDeviation > horizontalThreshold ||
            rightEyeDeviation > horizontalThreshold ||
            Math.abs(leftEyeCenter.y - baselineEyes.leftEyeCenter.y) > verticalThreshold ||
            Math.abs(rightEyeCenter.y - baselineEyes.rightEyeCenter.y) > verticalThreshold
        );
    };

    // Helper function to detect head rotation
    const getHeadRotation = (landmarks) => {
        const jawline = landmarks.getJawOutline();
        const leftJaw = jawline[0].x; // Leftmost point of the jaw
        const rightJaw = jawline[jawline.length - 1].x; // Rightmost point of
        const midPoint = (leftJaw + rightJaw) / 2;
        const noseTip = landmarks.getNose()[3].x; // Tip of the nose

        if (noseTip < midPoint - 30) { // Adjust threshold as needed
            return "left";
        } else if (noseTip > midPoint + 30) { // Adjust threshold as needed
            return "right";
        } else {
            return "center";
        }
    };

    // Helper function to calculate lip movement
    const calculateLipMovement = (currentLipLandmarks, previousLipLandmarks) => {
        let totalMovement = 0;
        for (let i = 0; i < currentLipLandmarks.length; i++) {
            const dx = currentLipLandmarks[i].x - previousLipLandmarks[i].x;
            const dy = currentLipLandmarks[i].y - previousLipLandmarks[i].y;
            totalMovement += Math.sqrt(dx * dx + dy * dy);
        }
        return totalMovement / currentLipLandmarks.length; // Average movement
    };

    const exitTest = () => {
        // Automatically exit the test without alerting the user
        console.log("🚪 Exiting test due to multiple alerts.");
        // Redirect to an exit page or perform any other action
        window.location.href = "/smartbridge/online-test-assessment/:uuid/exit"; // Example redirect
    };

    useEffect(() => {
        const interval = setInterval(detectFaceAndEyes, 3000); // Check every 3 seconds
        return () => clearInterval(interval);
    }, [baselineEyes]); // Re-run effect when baselineEyes changes

    // Dragging functionality
    const handleMouseDown = (e) => {
        setIsDragging(true);
        setOffset({
            x: e.clientX - videoRef.current.getBoundingClientRect().left,
            y: e.clientY - videoRef.current.getBoundingClientRect().top,
        });
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            const videoElement = videoRef.current;
            videoElement.style.position = "absolute";
            videoElement.style.left = `${e.clientX - offset.x}px`;
            videoElement.style.top = `${e.clientY - offset.y}px`;
            setCirclePosition({ x: e.clientX - offset.x, y: e.clientY - offset.y }); // Update circle position
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging]);

    // Function to capture frame for object detection
    const captureFrameForObjectDetection = async () => {
        if (videoRef.current) {
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            canvas.width = videoRef.current.videoWidth / 2; // Reduce width by half
            canvas.height = videoRef.current.videoHeight / 2; // Reduce height by half
            context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

            // Convert canvas to blob
            canvas.toBlob(async (blob) => {
                if (blob) {
                    const formData = new FormData();
                    formData.append("frame", blob, "frame.jpg");

                    try {
                        const token = localStorage.getItem("user_token"); // Retrieve user token
                        const response = await axios.post(
                            `${API_BASE_URL}/log-malpractice/`,
                            formData,
                            {
                                headers: {
                                    "Authorization": `Token ${token}`, // Include token in headers
                                    "Content-Type": "multipart/form-data",
                                },
                            }
                        );

                        console.log("✅ Backend response:", response.data);
                        if (response.data.malpractice_detected) {
                            setAlertMessage(response.data.message);
                            handleAlert(); // Increment alert count
                        } else {
                            setAlertMessage(""); // Clear alert if no malpractice detected
                        }
                    } catch (error) {
                        console.error("❌ Error sending frame:", error);
                    }
                }
            }, "image/jpeg");
        }
    };

    // Periodically capture frames for object detection
    useEffect(() => {
        const frameCaptureInterval = setInterval(captureFrameForObjectDetection, 10000); // Capture every 10 seconds
        return () => clearInterval(frameCaptureInterval);
    }, []);

    return (
        <div style={{ textAlign: "center", padding: "20px" }}>
            {/* Removed the "Webcam Proctoring" title */}
            <video
                ref={videoRef}
                autoPlay
                width="300" // Increased size for the video
                height="300" // Increased size for the video
                style={{
                    border: "2px solid black",
                    borderRadius: "50%", // Make the video circular
                    overflow: "hidden", // Ensure overflow is hidden
                    cursor: "move", // Indicate that the video can be moved
                    position: "absolute", // Allow positioning
                    objectFit: "cover", // Ensure the video covers the entire circle
                    left: `${circlePosition.x}px`, // Use circle position for dynamic placement
                    top: `${circlePosition.y}px`, // Use circle position for dynamic placement
                }}
                onMouseDown={handleMouseDown} // Start dragging
            ></video>
            {/* Display alerts relative to the circle's position */}
            <p
                style={{
                    color: "red",
                    fontWeight: "bold",
                    position: "absolute",
                    left: `${circlePosition.x}px`, // Align with circle's x position
                    top: `${circlePosition.y + 320}px`, // Adjusted position below the enlarged circle
                }}
            >
                {alertMessage}
            </p>
            <p
                style={{
                    color: "orange",
                    fontWeight: "bold",
                    position: "absolute",
                    left: `${circlePosition.x}px`, // Align with circle's x position
                    top: `${circlePosition.y + 340}px`, // Adjusted position below the alert message
                }}
            >
                {warningMessage}
            </p>
        </div>
    );
};

export default WebcamProctoring;