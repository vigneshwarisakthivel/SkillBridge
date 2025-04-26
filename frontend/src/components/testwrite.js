import React, { useState,useEffect, useCallback } from "react";
import axios from "axios"; // Inline CSS styles
import { useParams } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import { FormControl, FormControlLabel, Radio, RadioGroup, Checkbox } from "@mui/material";
import WebcamProctoring from './face'; 
// Styles
const styles = `.test-container {
    font-family: Arial, sans-serif;
    background-color: #f8f8f8;
    padding: 20px;
    height: 100vh; /* Set the height to 100% of the viewport height */
    overflow: hidden; /* Prevent overflow */
    display: flex;
    flex-direction: column; /* Use flexbox to manage layout */
}
.header {
    background-color: #e0e0e0;
    padding: 10px 20px;
    font-size: 18px;
    font-weight: bold;
    text-align: center;
}
.content {
    display: flex;
    justify-content: space-between;
    margin-top: 20px;
    flex-grow: 1; /* Allow content to grow and fill available space */
    overflow: hidden; /* Prevent overflow */
}
.question-section {
    background-color: #fff;
    padding: 20px;
    border-radius: 8px;
    width: 70%;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    overflow-y: auto; /* Enable vertical scrolling for the question section */
}
.question-section h2 {font-size: 18px;margin-bottom: 10px;}
.question-divider {margin-top: 10px;margin-bottom: 20px;border: 1px solid #ddd;}
.options {margin-top: 15px;}.option {display: block;margin: 8px 0;font-size: 14px;}
.option input {margin-right: 8px;}.sidebar {width: 25%;}
.timer {
    background-color: #fff;
    padding: 15px;
    border-radius: 8px;
    text-align: center;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}
.timer h3 {margin: 0;font-size: 16px;}
.time-structure {display: flex;justify-content: space-evenly;margin-top: 10px;}
.time-block {text-align: center;}
.time-value {font-size: 32px;font-weight: bold;display: block;color: #333;}
.time-label {font-size: 14px;color: #555;}
.question-map {margin-top: 20px;background-color: #fff;padding: 15px;border-radius: 8px;box-shadow: 0 2px 5px rgba(0,0,0,0.1);}
.question-map h3 {font-size: 16px;margin-bottom: 10px;}
.question-grid {display: grid;grid-template-columns: repeat(5,1fr);gap: 5px;}
.question-btn {width: 30px;height: 30px;font-size: 12px;border: none;border-radius: 4px;background-color: #e0e0e0;cursor: pointer;}
.question-btn.answered {background-color: #4caf50;color: #fff;}.question-btn.current {background-color: #2196f3;color: #fff;}
.question-btn.review {background-color: #801216;color: #fff;}.question-btn:hover {background-color: #ddd;}
.bottom-nav {
    display: flex;
    justify-content: space-between;
    background-color: #f1f1f1;
    padding: 10px 20px;
    margin-top: 20px;
    border-top: 1px solid #ccc;
}
.review-button {padding: 8px 15px;background-color: #801216;border: none;border-radius: 5px;color: white;cursor: pointer;font-weight: bold;}
.review-button:hover {background-color: #5f0f12;}
.nav-buttons button {background-color: #1976d2;color: white;border: none;padding: 10px 15px;margin: 0 5px;border-radius: 5px;cursor: pointer;}
.submit-btn {background-color: #4caf50;color: white;border: none;padding: 10px 20px;border-radius: 5px;cursor: pointer;}
.next-btn {background-color: #4caf50;color: white;border: none;padding: 10px 20px;border-radius: 5px;cursor: pointer;}
.prev-btn {background-color: #4caf50;color: white;border: none;padding: 10px 20px;border-radius: 5px;cursor: pointer;}
.legend {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 10px;
    background-color: #f9f9f9;
    padding: 10px;
    border-top: 1px solid #ccc;
    gap: 20px;
}
.legend-item {width: 15px;height: 15px;margin-right: 5px;display: inline-block;border-radius: 50%;}
.not-attempted {
    background-color: #add8e6; /* Light blue for not attempted */
}

.not-answered {
    background-color: #f6b43a; /* Yellow for not answered */
}

.answered {
    background-color: #4caf50; /* Green for answered */
}

.current {
    background-color: #2196f3; /* Blue for current question */
}
.review {background-color: #801216;}
.success-message {text-align: center;margin-top: 50px;font-size: 24px;font-weight: bold;color: #4caf50;}
.reviewPage {padding: 20px;background-color: #f0f4f8;border-radius: 10px;margin-top: 20px;}
.reviewQuestion {margin-bottom: 20px;padding: 15px;background-color: white;border-radius: 5px;box-shadow: 0 2px 4px rgba(0,0,0,0.1);}
.correctAnswer {color: #48bb78;font-weight: bold;}
.wrongAnswer {color: #e53e3e;font-weight: bold;}
.modalOverlay {position: fixed;top: 0;left: 0;right: 0;bottom: 0;background-color: rgba(0,0,0,0.5);display: flex;justify-content: center;align-items: center;z-index: 1000;}
.modalContent {background-color: white;padding: 40px;border-radius: 10px;box-shadow: 0 8px 16px rgba(0,0,0,0.2);text-align: center;max-width: 500px;width: 100%;}
.modalTitle {font-size: 2rem;font-weight: 700;color: #2d3748;margin-bottom: 20px;}
.modalText {font-size: 1.2rem;color: #4a5568;margin-bottom: 30px;}
.modalButton {background-color: #48bb78;color: white;padding: 12px 24px;border: none;border-radius: 5px;cursor: pointer;font-size: 1rem;font-weight: 600;}
.modalButton:hover {background-color: #38a169;}`;

// Append styles to the document
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

const questionTypes = {
    MULTIPLE_CHOICE: "multiplechoice",
    MULTIPLE_RESPONSE: "multipleresponse",
    TRUE_FALSE: "truefalse",
    FILL_IN_THE_BLANKS: "fillintheblanks",
};

const API_BASE_URL = "https://onlinetestcreationbackend.onrender.com/api";

export default function OnlineTestPage() {
    const { uuid } = useParams(); // ✅ Now we use uuid from the URL
    const [testId, setTestId] = useState(null);
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [selectedOption, setSelectedOption] = useState("");
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState(Array(questions.length).fill(null));
    const [skippedQuestions, setSkippedQuestions] = useState(new Set());
    const [reviewedQuestions, setReviewedQuestions] = useState(new Set());
    const [timedOutQuestions, setTimedOutQuestions] = useState(new Set());
    const [showScoreModal, setShowScoreModal] = useState(false); // State to control score modal
    const [score, setScore] = useState(0); // State to store the score
    const [showReviewPage, setShowReviewPage] = useState(false); // State to control review page
    const [timeLeft, setTimeLeft] = useState(2559); // Total time left in seconds
    const questionTime = 60; // 1 minute for each question
    const [testAttemptId, setTestAttemptId] = useState(null);
    const [passFailStatus, setPassFailStatus] = useState(false);
    const [totalQuestions, setTotalQuestions] = useState(0); // State for total questions
    const [timeTaken, setTimeTaken] = useState(0);
    const [passCriteria, setPassCriteria] = useState(50.0);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [totalTimeLeft, setTotalTimeLeft] = useState(2559);
    const navigate = useNavigate();
    const [testTitle, setTestTitle] = useState("Unknown Test");
    const [testSubject, setTestSubject] = useState("Unknown Subject");
    const [previousScore, setPreviousScore] = useState(null);
    const [testCategory, setTestCategory] = useState("");
    const [currentQuestionTime, setCurrentQuestionTime] = useState(questionTime);

    const handleRetake = () => {
        setCurrentQuestionIndex(0);
        setSelectedOption("");
        setAnswers(Array(questions.length).fill(null));
        setSkippedQuestions(new Set());
        setReviewedQuestions(new Set());
        setTimedOutQuestions(new Set());
        setShowReviewPage(false);
        setTimeLeft(2559);
        setCurrentQuestionTime(questionTime);
    };
    const userToken = localStorage.getItem("user_token");

    const decodeUUID = useCallback(async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/decode-test-uuid/${uuid}/`, {
            params: { uuid },
            headers: { Authorization: `Token ${userToken}` },
          });
          setTestId(response.data.test_id);
        } catch (error) {
          console.error("Error decoding UUID:", error);
        }
      }, [uuid, userToken]);      
    
    const fetchQuestions = useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/tests/${testId}/`, {
                headers: { Authorization: `Token ${userToken}` },
            });

            if (response.data && response.data.questions) {
                setQuestions(response.data.questions);

                // Extract and set test details
                setTestTitle(response.data.title || "Unknown Test");
                setTestSubject(response.data.subject || "Unknown Subject");
                setPreviousScore(response.data.previous_score || 0);
                setTestCategory(response.data.category || "");

                const initialAnswers = response.data.questions.map((question) => {
                    if (question.type === questionTypes.FILL_IN_THE_BLANKS) {
                        return Array((question.text.match(/____/g) || []).length).fill(null);
                    } else if (question.type === questionTypes.MULTIPLE_RESPONSE) {
                        return [];
                    } else {
                        return null;
                    }
                });

                setAnswers(initialAnswers);
                setTotalQuestions(response.data.questions.length);

                const totalTimeLimit = parseFloat(response.data.total_time_limit);
                setTimeLeft(totalTimeLimit * 60);
                 

                const questionTimeLimit = parseFloat(response.data.time_limit_per_question);
                setCurrentQuestionTime(questionTimeLimit * 60);

                setPassCriteria(response.data.pass_criteria);
            }
        } catch (error) {
            console.error("Error fetching questions:", error);
        }
    }, [userToken, testId]);

    const startTest = useCallback(async () => {
        try {
            const response = await axios.post(
                `${API_BASE_URL}/attempts/`,
                { test_id: testId },
                { headers: { Authorization: `Token ${userToken}` } }
            );

            setTestAttemptId(response.data.id);
            setIsTimerRunning(true);
        } catch (error) {
            console.error("Error starting test attempt:", error);
        }
    }, [userToken, testId]);

    useEffect(() => {
        decodeUUID(); // Decode UUID and set testId
    }, [decodeUUID]);
    
    useEffect(() => { 
        if (testId !== null) {
            fetchQuestions(); // Fetch questions only after testId is available
            startTest();      // Start the test attempt only after testId is available
        }
    }, [fetchQuestions, startTest, testId]);
    
    const fetchUserDetails = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/user-profile/`, {
                headers: { Authorization: `Token ${userToken}` },
            });
            return {
                username: response.data.username, // Adjust based on actual API response
                userId: response.data.id, // Ensure this matches the field returned by your API
            };
        } catch (error) {
            console.error("Error fetching user details:", error);
            return null;
        }
    };

    const handleSubmit = async () => {
        let correctAnswers = 0;
    
        // Prepare answers to submit
        const answersToSubmit = answers.map((answer, index) => ({
            question: questions[index].id,
            selected_option: answer || "", // Use an empty string for unanswered questions
        }));
    
        // Iterate through each answer to check correctness
        answersToSubmit.forEach((answer, index) => {
            const question = questions[index];
            const userAnswer = answer.selected_option;
    
            console.log("Question:", question);
            console.log("User  Answer:", userAnswer);
            console.log("Correct Answer:", question.correct_answer);
    
            if (userAnswer === "") return; // Skip if no answer provided
    
            switch (question.type) {
                case questionTypes.FILL_IN_THE_BLANKS:
                    // Check fill-in-the-blank answers
                    if (typeof question.correct_answer === 'string' && 
                        userAnswer.toLowerCase() === question.correct_answer.toLowerCase()) {
                        correctAnswers++;
                    }
                    break;
    
                case questionTypes.TRUE_FALSE:
                    // Check true/false answers
                    const userAnswerBoolean = (userAnswer === "true");
                    if (userAnswerBoolean === question.correct_answer) {
                        correctAnswers++;
                    }
                    break;
    
                case questionTypes.MULTIPLE_CHOICE:
                    // Check multiple choice answers
                    if (typeof question.correct_answer === 'string' && 
                        userAnswer.toLowerCase() === question.correct_answer.toLowerCase()) {
                        correctAnswers++;
                    }
                    break;
    
                case questionTypes.MULTIPLE_RESPONSE:
                    // Check multiple response answers
                    const userAnswersArray = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
                    const correctAnswersArray = Array.isArray(question.correct_answer) ? question.correct_answer : [];
    
                    // Check if all user answers are in the correct answers
                    const isCorrect = userAnswersArray.every(userAnswer => 
                        correctAnswersArray.includes(userAnswer)
                    );
    
                    if (isCorrect) {
                        correctAnswers++;
                    }
                    break;
    
                default:
                    console.warn("Unknown question type:", question.type);
                    break;
            }
        });
        const percentage = ((correctAnswers / questions.length) * 100).toFixed(2);
        const userDetails = await fetchUserDetails();
        setScore(percentage);
        setPassFailStatus(percentage >= passCriteria);
        setShowScoreModal(true);
        setTimeTaken(timeTaken);
    
        try {
            // Submit test attempt
            await axios.put(
                `${API_BASE_URL}/attempts/${testAttemptId}/`,
                {
                    answers: answersToSubmit,
                    score: percentage,
                    total_questions: totalQuestions,
                    time_taken: timeTaken,
                    passed: passFailStatus,
                },
                { headers: { Authorization: `Token ${userToken}` } }
            );
    
            const attemptDate = new Date().toISOString();
    
// Update performance stats
            await axios.post(
                `${API_BASE_URL}/performance-stats/`,
                {
                    user: userDetails?.userId,
                    name: testCategory || testTitle,
                    score: percentage,
                },
                { headers: { Authorization: `Token ${userToken}` } }
            );
    
            // Log recent activity
            await axios.post(
                `${API_BASE_URL}/recent-activities/`,
                {
                    user: userDetails?.userId,
                    description: `Attempted ${testTitle}`,
                    details: `Scored ${percentage}% in ${testSubject}`,
                },
                { headers: { Authorization: `Token ${userToken}` } }
            );
    
            // Retrieve User Statistics
            const statisticsResponse = await axios.get(
                `${API_BASE_URL}/test-attempts/statistics/`,
                { headers: { Authorization: `Token ${userToken}` } }
            );
    
            const { highest_score, accuracy, certificates_earned } = statisticsResponse.data;
    
            // Retrieve Ranking after submission
            const rankingResponse = await axios.get(
                `${API_BASE_URL}/test-attempts/rank/${testId}/`,
                { headers: { Authorization: `Token ${userToken}` } }
            );
    
            const userRank = rankingResponse.data.rank || null;
    
            // Send data to Attempted Tests API (Including Ranking and Statistics)
            await axios.post(
                `${API_BASE_URL}/attempted-tests/`,
                {
                        user: userDetails?.userId,
                        test: parseInt(testId),
                        title: testTitle,
                        subject: testSubject,
                        date: attemptDate,
                        max_score: highest_score, // Use the highest score from statistics
                        status: percentage >= passCriteria ? "passed" : "failed", // Update status based on pass criteria
                        rank: userRank, // Updated with ranking logic
                        accuracy: accuracy, // Include accuracy from statistics
                        certificates_earned: certificates_earned // Include certificates earned from statistics
                   
                },
                { headers: { Authorization: `Token ${userToken}` } }
            );
    
            console.log("Test submitted successfully. Ranking:", userRank);
        } catch (error) {
            console.error("Error submitting answers:", error.response ? error.response.data : error.message);
        }
    };
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prevTime) => {
                if (prevTime <= 0) {
                    clearInterval(timer);
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
      }, []);
      useEffect(() => {
          let timer;
          if (isTimerRunning) {
              timer = setInterval(() => {
                  setTimeTaken((prevTime) => prevTime + 1); // Increment time taken by 1 second
              }, 1000);
          }
          return () => clearInterval(timer); // Cleanup the timer on component unmount or when timer stops
      }, [isTimerRunning]);
      const formatTimeLeft = (time) => {
        const minutes = Math.floor(time / 60);
        const seconds = time % 60;
        return {
            minutes: String(minutes).padStart(2, "0"),
            seconds: String(seconds).padStart(2, "0"),
        };
      };
      
      const handleNext = () => {
        const updatedAnswers = [...answers];
        if (selectedOption) {
            updatedAnswers[currentQuestionIndex] = selectedOption;
        } else {
            setSkippedQuestions((prev) => new Set(prev).add(currentQuestionIndex));
        }
        setAnswers(updatedAnswers);
        setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
        setSelectedOption("");
    
        // Set the time for the next question to 60 seconds
        setCurrentQuestionTime(60);
    };
    
    const handlePrevious = () => {
        // Check if the previous question has timed out
        if (timedOutQuestions.has(currentQuestionIndex - 1)) {
            return; // Prevent navigation if the previous question has timed out
        }
    
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(currentQuestionIndex - 1);
            setSelectedOption(answers[currentQuestionIndex - 1] || "");
    
            // Set the time for the previous question to 60 seconds
            setCurrentQuestionTime(60);
        }
    };
    useEffect(() => {
        const questionTimer = setInterval(() => {
            setCurrentQuestionTime((prevTime) => {
                if (prevTime <= 0) {
                    clearInterval(questionTimer);
                    setTimedOutQuestions((prev) => new Set(prev).add(currentQuestionIndex));
                    handleNext(); // Move to the next question when time is up
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);
        return () => clearInterval(questionTimer);
    }, [currentQuestionIndex]);
        
            useEffect(() => {
                const timer = setInterval(() => {
                    setTotalTimeLeft((prevTime) => {
                        if (prevTime <= 0) {
                            clearInterval(timer);
                            navigate('/exit');
                            return 0;
                        }
                        return prevTime - 1;
                    });
                }, 1000);
                return () => clearInterval(timer);
            }, [navigate]);
        
            useEffect(() => {
                const questionTimer = setInterval(() => {
                    setCurrentQuestionTime((prevTime) => {
                        if (prevTime <= 0) {
                            clearInterval(questionTimer);
                            setTimedOutQuestions((prev) => new Set(prev).add(currentQuestionIndex));
                            handleNext(); // Move to the next question when time is up
                            return 0;
                        }
                        return prevTime - 1;
                    });
                }, 1000);
                return () => clearInterval(questionTimer);
            }, [currentQuestionIndex]);
    const handleFillInTheBlanksChange = (event, blankIndex) => {
        const value = event.target.value;

        setAnswers((prev) => {
            const newAnswers = [...(prev[currentQuestionIndex] || [])];
            newAnswers[blankIndex] = value; // Store the answer as a string

            const updatedAnswers = [...prev];
            updatedAnswers[currentQuestionIndex] = newAnswers;

            return updatedAnswers;
        });
    };

    const closeScoreModal = () => {
        setShowScoreModal(false);
    };

    const handleReview = () => {
        setShowReviewPage(true);
        setShowScoreModal(false);
    };

    const handleAnswerChange = (event) => {
        const value = event.target.value;
        const updatedAnswers = [...answers];

        if (questions[currentQuestionIndex].type === questionTypes.MULTIPLE_RESPONSE) {
            // For multiple response questions, toggle the answer
            if (updatedAnswers[currentQuestionIndex].includes(value)) {
                updatedAnswers[currentQuestionIndex] = updatedAnswers[currentQuestionIndex].filter(answer => answer !== value);
            } else {
                updatedAnswers[currentQuestionIndex].push(value);
            }
        } else {
            // For other question types, set the answer directly
            updatedAnswers[currentQuestionIndex] = value;
        }
        setAnswers(updatedAnswers);
    };

    const handleQuestionNavigation = (index) => {
        // Check if the current question time has expired
        if (timedOutQuestions.has(index)) {
            alert("You cannot navigate to this question as the time has expired.");
            return;
        }
        setCurrentQuestionIndex(index);
        setSelectedOption(answers[index] || "");
        setCurrentQuestionTime(questionTime);
    };

    const { minutes, seconds } = formatTimeLeft(currentQuestionTime);
    const currentQuestion = questions[currentQuestionIndex] || null;

    return (
        <div className="test-container">
            <WebcamProctoring studentId={1} testId={2} />
            {!showReviewPage ? (
                <>
                    <div className="header">Online Test</div>

                    <div className="content">
                        <div className="question-section">
                            {currentQuestion && (
                                <>
                                    <p className="timeLeft">Time Left: {minutes}:{seconds}</p>
                                    <h2 className="questionTitle">{currentQuestion.text}</h2>
                                    {currentQuestion.type === questionTypes.MULTIPLE_CHOICE && (
                                        <div>
                                            <FormControl component="fieldset">
                                                <RadioGroup value={answers[currentQuestionIndex] || ""} onChange={handleAnswerChange}>
                                                    {currentQuestion.options?.map((option, idx) => (
                                                        <FormControlLabel
                                                            key={idx}
                                                            value={option}
                                                            control={<Radio style={{ color: "#3182ce" }} />}
                                                            label={option}
                                                            style={{ margin: "10px 0" }}
                                                        />
                                                    ))}
                                                </RadioGroup>
                                            </FormControl>
                                        </div>
                                    )}

                                    {currentQuestion.type === questionTypes.MULTIPLE_RESPONSE && (
                                        <div>
                                            {currentQuestion.options?.map((option, idx) => (
                                                <FormControlLabel
                                                    key={idx}
                                                    control={
                                                        <Checkbox
                                                            checked={answers[currentQuestionIndex]?.includes(option)} // Check if the option is selected
                                                            onChange={handleAnswerChange}
                                                            value={option} // Set the value to the option
                                                            style={{ color: "#3182ce" }}
                                                        />
                                                    }
                                                    label={option}
                                                    style={{ margin: "10px 0" }}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {currentQuestion.type === 'truefalse' && (
                                        <div>
                                            <FormControl component="fieldset">
                                                <RadioGroup value={answers[currentQuestionIndex] || ""} onChange={handleAnswerChange}>
                                                    <FormControlLabel
                                                        value="true"
                                                        control={<Radio style={{ color: "#3182ce" }} />}
                                                        label="True"
                                                    />
                                                    <FormControlLabel
                                                        value="false"
                                                        control={<Radio style={{ color: "#3182ce" }} />}
                                                        label="False"
                                                    />
                                                </RadioGroup>
                                            </FormControl>
                                        </div>
                                    )}

                                    {currentQuestion.type === 'fillintheblank' && (
                                        <div>
                                            <p>
                                                {currentQuestion.text.split("____").map((part, index, array) => (
                                                    <span key={index}>
                                                        {part}
                                                        {index < array.length - 1 && (
                                                            <input
                                                                type="text"
                                                                onChange={(e) => handleFillInTheBlanksChange(e, index)}
                                                                value={answers[currentQuestionIndex]?.[index] || ""}
                                                                placeholder="Type Here"
                                                                style={{
                                                                    padding: "16px",
                                                                    borderRadius: "8px",
                                                                    border: "1px solid #ccc",
                                                                    width: "200px",
                                                                    margin: "0 10px",
                                                                    transition: "border-color 0.3s",
                                                                    textAlign: "center",
                                                                }}
                                                                onFocus={(e) => (e.target.style.borderColor = "#3182ce")}
                                                                onBlur={(e) => (e.target.style.borderColor = "#ccc")}
                                                            />
                                                        )}
                                                    </span>
                                                ))}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        <div className="sidebar">
                            <div className="timer">
                                <h3>Time Left</h3>
                                <div className="time-structure">
                                    <div className="time-block">
{`${formatTimeLeft(timeLeft).minutes} mins ${formatTimeLeft(timeLeft).seconds} secs`}
                                    </div>
                                </div>
                            </div>

                            <div className="question-map">
                                <h3>Questions</h3>
                                <div className="question-grid">
    {questions.map((_, index) => {
        const isCurrent = index === currentQuestionIndex;
        const isAnswered = answers[index] !== null && answers[index] !== undefined;
        const isNotAttempted = !isAnswered && !skippedQuestions.has(index);
        const isNotAnswered = skippedQuestions.has(index);

        return (
            <button
                key={index + 1}
                className={`question-btn ${
                    isCurrent
                        ? "current"
                        : isAnswered
                        ? "answered"
                        : isNotAttempted
                        ? "not-attempted"
                        : isNotAnswered
                        ? "not-answered"
                        : ""
                }`}
                onClick={() => handleQuestionNavigation(index)}
            >
                {index + 1}
            </button>
        );
    })}
</div>
                            </div>
                        </div>
                    </div>

                    <div className="bottom-nav">
                    <button 
      className="prev-btn" 
      onClick={handlePrevious} 
      disabled={timedOutQuestions.has(currentQuestionIndex - 1)}
    >
      Previous
    </button>
  
  
  {currentQuestionIndex !== questions.length - 1 && (
    <button 
      className="next-btn" 
      onClick={handleNext}
    >
      Next
    </button>
  )}
  
  <button className="submit-btn" onClick={handleSubmit}>
    Submit Test
  </button>
                    </div>

                    {/* Legend Section */}
                    <div className="legend">
                        <div className="legend-item current"></div> Current
                        <div className="legend-item not-attempted"></div> Not Attempted
                        <div className="legend-item answered"></div> Answered
                        <div className="legend-item not-answered"></div> Not Answered
                        <div className="legend-item review"></div> Review
                    </div>

                    {showScoreModal && (
                        <div className="modalOverlay">
                            <div className="modalContent">
                                <h2 className="modalTitle">Test Submitted!</h2>
                                <p className="modalText">
                                    You scored {score}% ({Math.round((score / 100) * questions.length)} out of {questions.length} questions).
                                </p>
                                <p>Status: {passFailStatus ? "Passed" : "Failed"}</p>
                                <button className="modalButton" onClick={closeScoreModal}>
                                    Close
                                </button>
                                <button
                        className="btn"
                        style={{ marginTop: "20px" }}
                        onClick={handleRetake}
                    >
                        Retake
                    </button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <div className="reviewPage">
                    <h1 style={styles.header}>Review Page</h1>
                    {questions.map((question, index) => (
                        <div key={question.id} className="reviewQuestion">

    </div>
))}

                </div>
            )}
        </div>
    );
}