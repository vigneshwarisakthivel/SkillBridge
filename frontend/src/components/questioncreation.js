import React, { useState } from 'react';
import {
  Box, Button, Typography, IconButton, TextField, FormControlLabel,
  Radio, RadioGroup, Checkbox, Grid, Paper, Stack, Container,ListItem,Drawer,List,
  AppBar, Toolbar, Snackbar, Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import MenuIcon from '@mui/icons-material/Menu';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import logo from "../assets/Image20250320122406.png";

const API_BASE_URL = 'https://onlinetestcreationbackend.onrender.com/api';

const QuestionCreator = () => {
  const [questions, setQuestions] = useState([]);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const fetchQuestions = async () => {
    const token = localStorage.getItem('user_token');
    if (!token) return;

    try {
      const response = await axios.get(`${API_BASE_URL}/questions/`, {
        headers: { 'Authorization': `Token ${token}` },
      });

      if (response.status === 200) {
        setQuestions(response.data);
      }
    } catch (error) {
      console.error('Fetch questions error:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('user_token');
    if (!token) {
      setSnackbarMessage('User token not found.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    for (const question of questions) {
      if (!question.text || !question.type) {
        setSnackbarMessage('Please fill all required fields.');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
        return;
      }

      if (question.type === 'multipleresponse' && (!question.correctAnswers || question.correctAnswers.length === 0)) {
        setSnackbarMessage('Please select at least one correct answer for multiple response questions.');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
        return;
      }

      const questionData = {
        text: question.text,
        type: question.type,
        correct_answer: question.type === "multipleresponse" ? question.correctAnswers : question.correctAnswer,
        options: question.options || [],
      };

      try {
        const response = await axios.post(`${API_BASE_URL}/questions/`, questionData, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`,
          },
        });

        if (response.status !== 201) {
          throw new Error('Failed to save question.');
        }
      } catch (error) {
        console.error('Save error:', error);
        setSnackbarMessage('Error saving question.');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
        return;
      }
    }

    setSnackbarMessage('Questions saved successfully!');
    setSnackbarSeverity('success');
    setOpenSnackbar(true);
    setQuestions([]); // Clear form after saving
  };

  const handleQuestionTextChange = (index, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index].text = value;
    setQuestions(updatedQuestions);
  };

  const handleCorrectAnswerChange = (index, answer) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index].correctAnswer = answer;
    setQuestions(updatedQuestions);
  };

  const handleOptionChange = (qIndex, optionIndex, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[qIndex].options[optionIndex] = value;
    setQuestions(updatedQuestions);
  };

  const handleAddOption = (qIndex, value) => {
    if (!value.trim()) return;
    const updatedQuestions = [...questions];
    updatedQuestions[qIndex].options.push(value);
    updatedQuestions[qIndex].newOption = ''; // clear the input after adding
    setQuestions(updatedQuestions);
  };

  const handleRemoveQuestion = (qIndex) => {
    setQuestions(questions.filter((_, index) => index !== qIndex));
  };

  const addQuestion = (type) => {
    setQuestions([...questions, {
      text: '',
      type,
      options: ["", "", ""],
      correctAnswer: type === "multipleresponse" ? [] : null,
      correctAnswers: type === "multipleresponse" ? [] : undefined,
      newOption: '',
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
    <ListItem sx={{ display: 'flex', justifyContent: 'flex-start' }}>
  <Button
    onClick={() => navigate('/admin-dashboard')}
    sx={{
      color: "#003366", // Dark blue color
      fontWeight: "bold",
      textAlign: "left",
      fontSize: "16px", // Align the text to the left
      width: "100%", // Take up full width of the ListItem
      justifyContent: "flex-start", // Align the button content to the left
    }}
  >
    Dashboard
  </Button>
</ListItem>

<ListItem sx={{ display: 'flex', justifyContent: 'flex-start' }}>
  <Button
    onClick={() => navigate('/testcreation')}
    sx={{
      color: "#003366", // Dark blue color
      fontWeight: "bold",
      textAlign: "left", // Align the text to the left
      width: "100%",
      fontSize: "16px", // Take up full width of the ListItem
      justifyContent: "flex-start", // Align the button content to the left
    }}
  >
    Test Creation
  </Button>
</ListItem>

<ListItem sx={{ display: 'flex', justifyContent: 'flex-start' }}>
  <Button
    onClick={() => navigate('/questioncreation')}
    sx={{
      color: "#003366", // Dark blue color
      fontWeight: "bold",
      fontSize: "16px",
      textAlign: "left", // Align the text to the left
      width: "100%", // Take up full width of the ListItem
      justifyContent: "flex-start", // Align the button content to the left
    }}
  >
    Question Creation
  </Button>
</ListItem>

<ListItem sx={{ display: 'flex', justifyContent: 'flex-start' }}>
  <Button
    onClick={() => navigate('/manage-tests')}
    sx={{
      color: "#003366", // Dark blue color
      fontWeight: "bold",
      fontSize: "16px",
      textAlign: "left", // Align the text to the left
      width: "100%", // Take up full width of the ListItem
      justifyContent: "flex-start", // Align the button content to the left
    }}
  >
    Manage Tests
  </Button>
</ListItem>

<ListItem sx={{ display: 'flex', justifyContent: 'flex-start' }}>
  <Button
    onClick={() => navigate('/announcement')}
    sx={{
      color: "#003366", // Dark blue color
      fontWeight: "bold",
      fontSize: "16px",
      textAlign: "left", // Align the text to the left
      width: "100%", // Take up full width of the ListItem
      justifyContent: "flex-start", // Align the button content to the left
    }}
  >
    Announcements
  </Button>
</ListItem>

<ListItem sx={{ display: 'flex', justifyContent: 'flex-start' }}>
  <Button
    onClick={() => navigate('/adminsettings')}
    sx={{
      color: "#003366", // Dark blue color
      fontWeight: "bold",
      fontSize: "16px",
      textAlign: "left", // Align the text to the left
      width: "100%", // Take up full width of the ListItem
      justifyContent: "flex-start", // Align the button content to the left
    }}
  >
    Settings
  </Button>
</ListItem>

<ListItem sx={{ display: 'flex', justifyContent: 'flex-start' }}>
  <Button
    onClick={() => navigate('/logout')}
    sx={{
      color: "#003366", // Dark blue color
      fontWeight: "bold",
      fontSize: "16px",
      textAlign: "left", // Align the text to the left
      width: "100%", // Take up full width of the ListItem
      justifyContent: "flex-start", // Align the button content to the left
    }}
  >
    Logout
  </Button>
</ListItem>
        </List>
        </Box>
      </Drawer>

      <Container maxWidth="md" sx={{
        position: "fixed", top: "64px", bottom: "80px",
        left: 0, right: 0, display: "flex", flexDirection: "column",
        padding: "16px", overflowY: "auto",
        height: "calc(100vh - 144px)",
        "&::-webkit-scrollbar": { display: "none" },
        scrollbarWidth: "none", msOverflowStyle: "none",
      }}>
        <Typography variant="h4" sx={{
          mb: 3, textAlign: "center", fontWeight: "bold",
          color: "#222", background: "linear-gradient(45deg, #00796b, #004d40)",
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
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

                  {["multiplechoice", "multipleresponse"].includes(question.type) && (
                    <Grid item xs={12}>
                      {question.options.map((option, optionIndex) => (
                        <FormControlLabel
                          key={optionIndex}
                          control={question.type === "multipleresponse" ? (
                            <Checkbox
                              checked={question.correctAnswer?.includes(optionIndex)}
                              onChange={() => {
                                const updatedQuestions = [...questions];
                                if (updatedQuestions[qIndex].correctAnswer.includes(optionIndex)) {
                                  updatedQuestions[qIndex].correctAnswer = updatedQuestions[qIndex].correctAnswer.filter(i => i !== optionIndex);
                                } else {
                                  updatedQuestions[qIndex].correctAnswer.push(optionIndex);
                                }
                                setQuestions(updatedQuestions);
                              }}
                            />
                          ) : (
                            <Radio
                              checked={question.correctAnswer === optionIndex}
                              onChange={() => handleCorrectAnswerChange(qIndex, optionIndex)}
                            />
                          )}
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
                          value={question.newOption}
                          onChange={(e) => {
                            const updatedQuestions = [...questions];
                            updatedQuestions[qIndex].newOption = e.target.value;
                            setQuestions(updatedQuestions);
                          }}
                          placeholder="Add another option"
                          variant="outlined"
                          sx={{ backgroundColor: "#fff" }}
                        />
                        <IconButton onClick={() => handleAddOption(qIndex, question.newOption)} color="primary">
                          <AddCircleOutlineIcon />
                        </IconButton>
                      </Stack>
                    </Grid>
                  )}

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

                  {question.type === "fillintheblank" && (
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        variant="outlined"
                        value={question.correctAnswer || ''}
                        onChange={(e) => handleCorrectAnswerChange(qIndex, e.target.value)}
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
            <Button variant="contained" color="success" type="submit">Save Questions</Button>
          </Box>
        </form>

        <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Container>

      <Box sx={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        backgroundColor: "#003366", color: "white",
        padding: "16px", textAlign: "center"
      }}>
        <Typography variant="body2" sx={{ color: "white", marginBottom: "2px" }}>
          © {new Date().getFullYear()} SkillBridge Online Test Platform. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default QuestionCreator;
