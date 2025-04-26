import React, { useState } from 'react';
import {
  Box, Button, Typography, IconButton, TextField, FormControlLabel,
  Radio, RadioGroup, Checkbox, Grid, Paper, Stack, Container, AppBar, Toolbar, Drawer, List, ListItem, ListItemText, Snackbar, Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import MenuIcon from '@mui/icons-material/Menu';
import TwitterIcon from '@mui/icons-material/Twitter';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; 
import logo from "../assets/Image20250320122406.png";
const QuestionCreator = () => {
  const [questions, setQuestions] = useState([]);
  const [newOption, setNewOption] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [setSnackbarSeverity] = useState('success');
  const navigate = useNavigate();
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  const fetchQuestions = async () => {
    const token = localStorage.getItem('user_token');
    if (!token) return;
  
    try {
      const response = await axios.get('https://onlinetestcreationbackend.onrender.com/api/questions/', {
        headers: { 'Authorization': `Token ${token}` },
      });
  
      if (response.status === 201) {
        setSnackbarMessage('Questions saved successfully!');
        setSnackbarSeverity('success');
        setQuestions([]); // Reset safely
    } 
    
    } catch (error) {
      
      
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('user_token');
  
    // Loop through each question and send it individually
    for (const question of questions) {
      // Check if required fields are present
      if (!question.text || !question.type || question.correctAnswer === null) {
        setSnackbarMessage('Please fill in all required fields for each question.');
        setOpenSnackbar(true);
        return; // Stop the submission if required fields are missing
      }
     
        if (!question.text.trim() || !question.type || (question.type !== "multipleresponse" && question.correctAnswer === null)) {
          setSnackbarMessage('Please fill in all required fields for each question.');
          setSnackbarSeverity('error');
          setOpenSnackbar(true);
          return;
        }
        
        if (question.type === "multipleresponse" && (!question.correctAnswers || question.correctAnswers.length === 0)) {
          setSnackbarMessage('Please select at least one correct answer for multiple response questions.');
          setSnackbarSeverity('error');
          setOpenSnackbar(true);
          return;
        }
      const questionData = {
        text: question.text,
        type: question.type,
        correct_answer: question.type === "multipleresponse" ? question.correctAnswers : question.correctAnswer,
        options: question.options || []
      };
  
      try {
        const response = await axios.post('https://onlinetestcreationbackend.onrender.com/api/questions/', questionData, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`,
          },
        });
        if (response.status === 201) {
          setSnackbarMessage('Question saved successfully!');
        } else {
          setSnackbarMessage('Failed to save question.');
        }
      } catch (error) {
        console.error('Error:', error);
        setSnackbarMessage('An error occurred while saving question.');
      }
    }
  
    setOpenSnackbar(true);
    fetchQuestions(); // Refresh the questions list after saving
  };
  const handleQuestionTextChange = (index, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index].text = value;
    setQuestions(updatedQuestions);
  };

  const handleCorrectAnswerChange = (qIndex, answer) => {
    const updatedQuestions = [...questions];
    updatedQuestions[qIndex].correctAnswer = answer;
    setQuestions(updatedQuestions);
  };

  const handleOptionChange = (qIndex, optionIndex, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[qIndex].options[optionIndex] = value;
    setQuestions(updatedQuestions);
  };

  const handleAddOption = (qIndex) => {
    const updatedQuestions = [...questions];
    if (newOption.trim() !== '') {
      updatedQuestions[qIndex].options.push(newOption);
      setQuestions(updatedQuestions);
      setNewOption('');
    }
  };

  const handleRemoveQuestion = (qIndex) => {
    setQuestions(questions.filter((_, index) => index !== qIndex));
  };

  const addQuestion = (type) => {
    setQuestions([...questions, {
      type,
      text: '',
      correctAnswer: type === "multipleresponse" ? [] : null,
      options: ["", "", ""],
      correctAnswers: type === "multipleresponse" ? [] : undefined,
    }]);
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" sx={{ backgroundColor: "#003366", padding: "6px 16px" }}>
        <Toolbar>
          <IconButton color="inherit" onClick={toggleSidebar} edge="start" sx={{ marginRight: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontSize: "1rem" }}>
          SkillBridge Online Test Platform
          </Typography>
          <Button color="inherit" onClick={() => navigate("/")}>Home</Button>
          <Button color="inherit" onClick={() => navigate("/admin-profile")}>Admin Profile</Button>
          <Button color="inherit" onClick={() => navigate("/manage-tests")}>Test List</Button>
          <Button color="inherit" onClick={() => navigate("/adminsettings")}>Settings</Button>
          <Button color="inherit" onClick={() => navigate("/logout")}>Logout</Button>
        </Toolbar>
      </AppBar>

      <Drawer open={isSidebarOpen} onClose={toggleSidebar}>
              <Box sx={{ width: 220, textAlign: "center", padding: "12px" }}>
                {isSidebarOpen && (
                  <img
                    src={logo}
                    alt="Logo"
                    style={{
                      maxWidth: "80%",
                      height: "auto",
                      marginBottom: "12px",
                      borderRadius: "8px",
                    }}
                  />
                )}
          <List>
                      <ListItem button onClick={() => navigate('/admin-dashboard')}>
                        <ListItemText primary="Dashboard" />
                      </ListItem>
                      <ListItem button onClick={() => navigate('/testcreation')}>
                        <ListItemText primary="Test Creation" />
                      </ListItem>
                                  <ListItem button onClick={() => navigate('/questioncreation')}>
                                    <ListItemText primary="Question Creation" />
                                  </ListItem>
                      <ListItem button onClick={() => navigate('/manage-tests')}>
                        <ListItemText primary="Manage Tests" />
                      </ListItem>

                      <ListItem button onClick={() => navigate('/announcement')}>
                        <ListItemText primary="Announcements" />
                      </ListItem>
                      <ListItem button onClick={() => navigate('/adminsettings')}>
                        <ListItemText primary="Settings" />
                      </ListItem>
                      <ListItem button onClick={() => navigate('/logout')}>
                        <ListItemText primary="Logout" />
                      </ListItem>
            </List>
          </Box>
        </Drawer>

        <Container
  maxWidth="md"
  sx={{
    position: "fixed", // Set position to fixed
    top: "64px", // Set top to the height of the AppBar
    bottom: "80px", // Adjust for footer height
    left: 0,
    right: 0,
    display: "flex",
    flexDirection: "column", // Ensure the content stacks vertically
    padding: "16px", // Add padding as needed
    overflowY: "auto", // Enable vertical scrolling
    height: "calc(100vh - 144px)", // Adjust height to fit between AppBar and footer
    "&::-webkit-scrollbar": { // Hide scrollbar for Chrome, Safari, and Opera
      display: "none",
    },
    scrollbarWidth: "none", // Hide scrollbar for Firefox
    msOverflowStyle: "none", // Hide scrollbar for IE and Edge
  }}
>
  <Typography variant="h4" sx={{
    mb: 3, textAlign: "center", fontWeight: "bold",
    color: "#222",
    background: "linear-gradient(45deg, #00796b, #004d40)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent"
  }}>
    Create Your Questions
  </Typography>

  <form onSubmit={handleSubmit}>
    <Stack spacing={3}>
      {questions.map((question, qIndex) => (
        <Paper key={qIndex} elevation={4} sx={{ p: 3, borderRadius: 3, background: "#f4f6f8" }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={11}>
              <Typography variant="h6" sx={{ fontWeight: "bold", color: "#00796b" }}>
                Question {qIndex + 1}
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={2}
                value={question.text}
                onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                placeholder="Enter your question"
                variant="outlined"
                sx={{ backgroundColor: "#fff" }}
              />
            </Grid>
            <Grid item xs={1}>
              <IconButton onClick={() => handleRemoveQuestion(qIndex)} color="error">
                <DeleteIcon />
              </IconButton>
            </Grid>

            {/* Multiple Choice */}
            {question.type === "multiplechoice" && (
              <Grid item xs={12}>
                {question.options.map((option, optionIndex) => (
                  <FormControlLabel
                    key={optionIndex}
                    control={
                      <Radio
                        checked={question.correctAnswer === optionIndex}
                        onChange={() => handleCorrectAnswerChange(qIndex, optionIndex)}
                      />
                    }
                    label={
                      <TextField
                        fullWidth
                        variant="outlined"
                        value={option}
                        onChange={(e) => handleOptionChange(qIndex, optionIndex, e.target.value)}
                        placeholder={`Option ${optionIndex + 1}`}
                        sx={{ backgroundColor: "#fff" }}
                      />
                    }
                  />
                ))}
                <Stack direction="row" spacing={2} mt={2}>
                  <TextField
                    fullWidth
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Add another option"
                    variant="outlined"
                    sx={{ backgroundColor: "#fff" }}
                  />
                  <IconButton onClick={() => handleAddOption(qIndex)} color="primary">
                    <AddCircleOutlineIcon />
                  </IconButton>
                </Stack>
              </Grid>
            )}

            {/* Multiple Response */}
            {question.type === "multipleresponse" && (
              <Grid item xs={12}>
                {question.options.map((option, optionIndex) => (
                  <FormControlLabel
                    key={optionIndex}
                    control={
                      <Checkbox
                        checked={question.correctAnswers.includes(optionIndex)}
                        onChange={() => {
                          const updatedQuestions = [...questions];
                          if (updatedQuestions[qIndex].correctAnswers.includes(optionIndex)) {
                            updatedQuestions[qIndex].correctAnswers = updatedQuestions[qIndex].correctAnswers.filter(i => i !== optionIndex);
                          } else {
                            updatedQuestions[qIndex].correctAnswers.push(optionIndex);
                          }
                          setQuestions(updatedQuestions);
                        }}
                      />
                    }
                    label={
                      <TextField
                        fullWidth
                        variant="outlined"
                        value={option}
                        onChange={(e) => handleOptionChange(qIndex, optionIndex, e.target.value)}
                        placeholder={`Option ${optionIndex + 1}`}
                        sx={{ backgroundColor: "#fff" }}
                      />
                    }
                  />
                ))}
                <Stack direction="row" spacing={2} mt={2}>
                  <TextField
                    fullWidth
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Add another option"
                    variant="outlined"
                    sx={{ backgroundColor: "#fff" }}
                  />
                  <IconButton onClick={() => handleAddOption(qIndex)} color="primary">
                    <AddCircleOutlineIcon />
                  </IconButton>
                </Stack>
              </Grid>
            )}

            {/* True/False */}
            {question.type === "truefalse" && (
              <Grid item xs={12}>
                <RadioGroup row>
                  <FormControlLabel
                    control={<Radio checked={question.correctAnswer === true} onChange={() => handleCorrectAnswerChange(qIndex, true)} />}
                    label="True"
                  />
                  <FormControlLabel
                    control={<Radio checked={question.correctAnswer === false} onChange={() => handleCorrectAnswerChange(qIndex, false)} />}
                    label="False"
                  />
                </RadioGroup>
              </Grid>
            )}

            {/* Fill in the Blank */}
            {question.type === "fillintheblank" && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  variant="outlined"
                  value={question.correctAnswer || ''}
                  onChange={(e) => {
                    const updatedQuestions = [...questions];
                    updatedQuestions[qIndex].correctAnswer = e.target.value;
                    setQuestions(updatedQuestions);
                  }}
                  placeholder="Enter the correct answer"
                  sx={{ backgroundColor: "#fff" }}
                />
              </Grid>
            )}
          </Grid>
        </Paper>
      ))}
    </Stack>

    <Stack direction="row" spacing={2} justifyContent="center" mt={4}>
      <Button variant="contained" color="primary" onClick={() => addQuestion("multiplechoice")}>Multiple Choice</Button>
      <Button variant="contained" color="primary" onClick={() => addQuestion("truefalse")}>True/False</Button>
      <Button variant="contained" color="primary" onClick={() => addQuestion("multipleresponse")}>Multiple Response</Button>
      <Button variant="contained" color="primary" onClick={() => addQuestion("fillintheblank")}>Fill in the Blank</Button>
    </Stack>

    <Box sx={{ mt: 4, textAlign: "center" }}>
      <Button variant="contained" color="success" type="submit">
        Save Questions
      </Button>
    </Box>
  </form>

  {/* Snackbar for Success Message */}
  <Snackbar
    open={openSnackbar}
    autoHideDuration={3000}
    onClose={handleCloseSnackbar}
  >
    <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
      {snackbarMessage}
    </Alert>
  </Snackbar>
</Container>

        {/* Footer */}
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
            © {new Date().getFullYear()} SkillBridge Online Test Platform. All rights reserved.
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "2px" }}>
            <IconButton color="inherit" onClick={() => window.open("https://twitter.com", "_blank")}><TwitterIcon /></IconButton>
            <IconButton color="inherit" onClick={() => window.open("https://facebook.com", "_blank")}><FacebookIcon /></IconButton>
            <IconButton color="inherit" onClick={() => window.open("https://instagram.com", "_blank")}><InstagramIcon /></IconButton>
          </Box>
        </Box>
      </Box>
    );
  };

export default QuestionCreator;