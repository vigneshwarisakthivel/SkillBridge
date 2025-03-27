import React, { useState } from 'react';
import {
    TextField,
    Button,
    Typography,
    Container,
    Alert,
    Box,
    Card,
    CardContent,
    InputAdornment,
} from '@mui/material';
import { Lock, Email } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api'; // Ensure this matches your backend URL

const ChangePasswordPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        newPassword: '',
        confirmNewPassword: '',
    });
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const { enqueueSnackbar } = useSnackbar();

    const passwordValidation = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    const emailValidation = /^[A-Za-z][A-Za-z0-9._%+-]*@gmail\.com$/; // Email starts with a letter and ends with @gmail.com

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [name]: value,
        }));
        setErrorMessage(''); // Clear error message on input change
    };

    const handleResetPassword = async () => {
        if (!emailValidation.test(formData.email)) {
            setErrorMessage('Please enter a valid email that starts with a letter and ends with @gmail.com.');
            return;
        }

        if (formData.newPassword !== formData.confirmNewPassword) {
            setErrorMessage("Passwords don't match.");
            return;
        }

        if (!passwordValidation.test(formData.newPassword)) {
            setErrorMessage(
                'Password must contain at least 8 characters, one number, one special character, and both uppercase and lowercase letters.'
            );
            return;
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/reset-password/`, {
                email: formData.email,
                new_password: formData.newPassword,
            });

            if (response.status === 200) {
                setSuccessMessage('Password has been reset successfully. Redirecting to login...');
                setTimeout(() => navigate('/login'), 2000);
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            setErrorMessage('Error resetting password. Please try again.');
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 2,
            }}
        >
            <Container maxWidth="xs">
                <Card elevation={3} sx={{ p: 2 }}>
                    <CardContent>
                        <Typography variant="h5" align="center" gutterBottom>
                            Reset Password
                        </Typography>
                        {errorMessage && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {errorMessage}
                            </Alert>
                        )}
                        {successMessage && (
                            <Alert severity="success" sx={{ mb: 2 }}>
                                {successMessage}
                            </Alert>
                        )}
                        <Box component="form" noValidate>
                            <TextField
                                label="Email"
                                type="email"
                                name="email"
                                fullWidth
                                variant="outlined"
                                value={formData.email}
                                onChange={handleInputChange}
                                required
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Email />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <TextField
                                label="New Password"
                                type="password"
                                name="newPassword"
                                fullWidth
                                variant="outlined"
                                value={formData.newPassword}
                                onChange={handleInputChange}
                                required
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Lock />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ mt: 2 }} // Add margin top for spacing
                            />
                            <TextField
                                label="Confirm New Password"
                                type="password"
                                name="confirmNewPassword"
                                fullWidth
                                variant="outlined"
                                value={formData.confirmNewPassword}
                                onChange={handleInputChange}
                                required
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Lock />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ mt: 2 }} // Add margin top for spacing
                            />
                            <Box mt={2}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    fullWidth
                                    onClick={handleResetPassword}
                                >
                                    Reset Password
                                </Button>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
};

export default ChangePasswordPage;