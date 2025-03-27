import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  Box,
  List,
  ListItem,
  ListItemText,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Checkbox,
  Radio,
  RadioGroup,
  TextField,
  IconButton,
  Snackbar,
} from "@mui/material";
import { Menu as MenuIcon, Delete as DeleteIcon } from "@mui/icons-material";
import TwitterIcon from "@mui/icons-material/Twitter";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import MuiAlert from '@mui/material/Alert';
import logo from "../assets/Image20210206041010-1024x518.png";
import { useParams } from "react-router-dom"; 
const API_BASE_URL = "http://localhost:8000/api/questions/";

const EditTestPage = () => {
  const { testId } = useParams(); // Get test ID from the URL
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedButton, setSelectedButton] = useState("All");
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [focusedQuestionIndex, setFocusedQuestionIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleButtonClick = (type) => {
    setSelectedButton(type);
  
    // Map button labels to actual question types
    const typeMap = {
      "Multiple Choice Questions": "multiplechoice",
      "Fill-ups": "fillintheblank",
      "Multiple Response": "multipleresponse",
      "True or False": "truefalse",
    };
  
    const mappedType = typeMap[type] || type; // Default to original type if "All" is selected
  
    filterQuestions(mappedType);
  };
  

  const filterQuestions = (type) => {
    if (type === "All") {
      setFilteredQuestions(questions);
    } else {
      const filtered = questions.filter(q => q.type.toLowerCase() === type.toLowerCase());
      console.log("Filtering for type:", type);
      console.log("Filtered Questions:", filtered);
      setFilteredQuestions(filtered);
    }
  };
  

  const handleQuestionChange = (index, newQuestion) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index].text = newQuestion; // Change 'question_text' to 'text'
    setQuestions(updatedQuestions);
    setFilteredQuestions(updatedQuestions);
  };

  const handleOptionChange = (questionIndex, optionIndex, newOption) => {
    const updatedQuestions = [...questions];

    // Check if the question and option exist
    if (updatedQuestions[questionIndex] && updatedQuestions[questionIndex].options[optionIndex]) {
      updatedQuestions[questionIndex].options[optionIndex].text = newOption; // Update the option text
      setQuestions(updatedQuestions);
      setFilteredQuestions(updatedQuestions);
    } else {
      console.error("Question or option does not exist for the given index:", questionIndex, optionIndex);
    }
  };

  const handleDeleteQuestion = async (index) => {
    const questionId = questions[index].id;

    try {
      await axios.delete(`${API_BASE_URL}${testId}/`, {
        headers: { Authorization: `Token ${token()}` },
      });
      const updatedQuestions = questions.filter((_, idx) => idx !== index);
      setQuestions(updatedQuestions);
      setFilteredQuestions(updatedQuestions);
      showSnackbar("Question deleted successfully!");
    } catch (error) {
      console.error("Error deleting question:", error.response ? error.response.data : error.message);
      showSnackbar("Failed to delete question. Please try again.", "error");
    }
  };

  const handleAnswerSelect = (questionIndex, optionIndex) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: optionIndex,
    });
  };

  const handleFocusQuestion = (index) => {
    setFocusedQuestionIndex(index);
  };

  const handleBlurQuestion = () => {
    setFocusedQuestionIndex(null);
  };

  const token = () => {
    return localStorage.getItem("user_token");
  };

  const saveQuestion = async (question) => {
    const updatedQuestion = {
      ...question,
      options: question.options.map(option => ({ text: option.text })), // Ensure options are formatted correctly
    };

    try {
      await axios.put(`${API_BASE_URL}${question.id}/`, updatedQuestion, {
        headers: { Authorization: `Token ${token()}` },
      });
      showSnackbar("Question saved successfully!");
    } catch (error) {
      console.error("Error saving question:", error.response ? error.response.data : error.message);
      showSnackbar("Failed to save question. Please try again.", "error");
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };
  console.log("Test ID from URL:", testId);
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:8000/api/tests/${testId}/`, {
        headers: { Authorization: `Token ${token()}` },
      });
      

      console.log("API Response:", response.data); // Debugging log
  
      if (response.data && response.data.questions) {
        setQuestions(response.data.questions);  
        setFilteredQuestions(response.data.questions);
      } else {
        console.error("No questions found in API response");
      }
    } catch (error) {
      console.error("Error fetching questions:", error.response ? error.response.data : error.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchQuestions();
  }, [testId]); // Fetch questions when testId changes
    
  return (
    <>
      <AppBar position="fixed" sx={{ backgroundColor: "#003366", padding: "6px 16px" }}>
      <Toolbar sx={{ padding: "0" }}>
                <IconButton color="inherit" edge="start" sx={{ marginRight: 2 }} onClick={toggleSidebar}>
                    <MenuIcon />
                </IconButton>
                <Typography variant="h6" sx={{ flexGrow: 1, fontSize: "1rem" }}>
                    Skill Bridge Online Test Platform
                </Typography>
                <Button color="inherit" onClick={() => navigate("/")}>Home</Button>
                <Button color="inherit" onClick={() => navigate("/admin-profile")}>Admin profile</Button>
                <Button color="inherit" onClick={() => navigate("/manage-tests")}>Test List</Button>
                <Button color="inherit" onClick={() => navigate("/settings")}>Settings</Button>
                <Button color="inherit" onClick={() => navigate("/logout")}>Logout</Button>
            </Toolbar>
      </AppBar>

      <Drawer open={isSidebarOpen} onClose={toggleSidebar}>
        <Box sx={{ width: 220, textAlign: "center", padding: "12px" }}>
          {isSidebarOpen && (
            <img
              src={logo}
              alt="Logo"
              style={{ maxWidth: "80%", height: "auto", marginBottom: "12px", borderRadius: "8px" }}
            />
          )}
          <List>
            {['Dashboard', 'Create a Test', 'Manage Tests', 'Test Analytics', 'Announcements', 'Settings', 'Logout'].map(item => (
              <ListItem button key={item}>
                <ListItemText primary={item} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      <Box
        sx={{
          position: "fixed",
          left: "50px",
          top: "170px",
          width: "250px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {["All", "Multiple Choice Questions", "Fill-ups", "Multiple Response", "True or False"].map((type) => (
          <Button
            key={type}
            variant={selectedButton === type ? "contained" : "outlined"}
            color="primary"
            onClick={() => handleButtonClick(type)}
            sx={{ textTransform: "none", width: "100%" }}
          >
            {type}
          </Button>
        ))}
      </Box>

      <Box sx={{ position: "fixed", left: "400px", top: "100px", padding: "20px", width: "700px", maxHeight: "70vh", overflowY: "auto" }}>
        {loading ? (
          <Typography>Loading questions...</Typography>
        ) : (
          filteredQuestions.length > 0 ? (
            filteredQuestions.map((item, index) => (
              <Card key={item.id} sx={{ marginBottom: "12px" }}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", position: "relative" }}>
                    <TextField
                      fullWidth
                      variant={focusedQuestionIndex === index ? "outlined" : "standard"}
                      value={item.text} // Change 'question_text' to 'text'
                      onChange={(e) => handleQuestionChange(index, e.target.value)}
                      onFocus={() => handleFocusQuestion(index)}
                      onBlur={handleBlurQuestion}
                      InputProps={{ disableUnderline: focusedQuestionIndex !== index }}
                      sx={{ marginBottom: "8px" }}
                    />
                    {focusedQuestionIndex === index && (
                      <IconButton
                        onMouseDown={() => handleDeleteQuestion(index)}
                        color="secondary"
                        sx={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)" }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>

                  {item.type === "fillintheblank" && (
                    <Box sx={{ marginTop: "8px" }}>
                      <TextField
                        fullWidth
                        variant="standard"
                        placeholder="Type your answer here"
                        onChange={(e) => handleOptionChange(index, 0, e.target.value)} // Update the correct answer
                      />
                      <Typography variant="caption" color="textSecondary">
                        Correct Answer: {item.correct_answer}
                      </Typography>
                    </Box>
                  )}

                  {item.type === "truefalse" && (
                    <RadioGroup value={selectedAnswers[index]} onChange={(e) => handleAnswerSelect(index, e.target.value)}>
                      {/* Static options for True/False */}
                      {["True", "False"].map((option, idx) => (
                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                          <FormControlLabel value={option} control={<Radio />} label={option} />
                        </Box>
                      ))}
                    </RadioGroup>
                  )}

                  {item.type === "multiplechoice" && (
                    <RadioGroup value={selectedAnswers[index]} onChange={(e) => handleAnswerSelect(index, e.target.value)}>
                      {item.options && item.options.length > 0 ? (
                        item.options.map((option, idx) => (
                          <Box key={option.id} sx={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                            <FormControlLabel value={idx} control={<Radio />} label={option.text} />
                          </Box>
                        ))
                      ) : (
                        <Typography>No options available for this question.</Typography>
                      )}
                    </RadioGroup>
                  )}

                  {item.type === "multipleresponse" && (
                    <Box>
                      {item.options && item.options.length > 0 ? (
                        item.options.map((option, idx) => (
                          <Box key={option.id} sx={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                            <FormControlLabel
                              control={<Checkbox checked={selectedAnswers[index]?.includes(idx)} onChange={() => handleAnswerSelect(index, idx)} />}
                              label={option.text}
                            />
                          </Box>
                        ))
                      ) : (
                        <Typography>No options available for this question.</Typography>
                      )}
                    </Box>
                  )}

                  <Button onClick={() => saveQuestion(item)} variant="outlined" color="primary" sx={{ marginTop: "8px" }}>
                    Save Question
                  </Button>
                </CardContent>
              </Card>
            ))
          ) : (
            <Typography>No questions available.</Typography>
          )
        )}
      </Box>

      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#003366",
          color: "white",
          padding: "16px",
          textAlign: "center",
        }}
      >
        <Typography variant="body2" sx={{ color: "white", marginBottom: "2px" }}>
          © {new Date().getFullYear()} Skill Bridge Online Test Platform. All rights reserved.
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "2px" }}>
          <IconButton color="inherit" onClick={() => window.open("https://twitter.com", "_blank")}>
            <TwitterIcon />
          </IconButton>
          <IconButton color="inherit" onClick={() => window.open("https://facebook.com", "_blank")}>
            <FacebookIcon />
          </IconButton>
          <IconButton color="inherit" onClick={() => window.open("https://instagram.com", "_blank")}>
            <InstagramIcon />
          </IconButton>
        </Box>
      </Box>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <MuiAlert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>
    </>
  );
};

export default EditTestPage;