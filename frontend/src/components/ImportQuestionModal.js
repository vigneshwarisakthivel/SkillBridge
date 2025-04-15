import React, { useEffect, useState } from 'react'; 
import axios from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  MenuItem,
  Select,
  Typography,
  CircularProgress,
} from '@mui/material';

const ImportQuestionsModal = ({ open, onClose, setSelectedImportTest }) => {
  const [publicTests, setPublicTests] = useState([]);
  const [selectedTestId, setSelectedTestId] = useState('');
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);

  const token = localStorage.getItem('user_token');

  // Step 1: Fetch public tests
  useEffect(() => {
    if (open && token) {
      axios
        .get('http://localhost:8000/api/tests/public/', {
          headers: {
            Authorization: `Token ${token}`,
          },
        })
        .then((res) => setPublicTests(res.data))
        .catch((err) => console.error('Error fetching public tests:', err));
    }
  }, [open, token]);

  // Step 2: Fetch questions when a test is selected
  const handleTestChange = (e) => {
    const testId = e.target.value;
    setSelectedTestId(testId);
    setQuestions([]);
    setLoading(true);

    axios
      .get(`http://localhost:8000/api/tests/${testId}/questions/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      })
      .then((res) => {
        setQuestions(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching questions:', err);
        setLoading(false);
      });
  };

  // Step 3: Just store selected import test ID, import will happen after test is created
  const handleSaveImportChoice = () => {
    if (selectedTestId) {
      setSelectedImportTest(Number(selectedTestId));
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Import Questions from Public Tests</DialogTitle>
      <DialogContent>
        <Select
          value={selectedTestId}
          onChange={handleTestChange}
          fullWidth
          displayEmpty
        >
          <MenuItem value="">Select a public test</MenuItem>
          {publicTests.map((test) => (
            <MenuItem key={test.id} value={test.id}>
              {test.title} - {test.subject}
            </MenuItem>
          ))}
        </Select>

        {loading && <CircularProgress size={24} sx={{ mt: 2 }} />}

        {questions.length > 0 && (
          <>
            <Typography variant="subtitle1" sx={{ mt: 2 }}>
              {questions.length} question(s) found:
            </Typography>
            <ul>
              {questions.map((q, i) => (
                <li key={q.id}>
                  {i + 1}. {q.text.slice(0, 100)}...
                </li>
              ))}
            </ul>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSaveImportChoice} variant="contained" disabled={!selectedTestId}>
          Use This Test
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ImportQuestionsModal;
