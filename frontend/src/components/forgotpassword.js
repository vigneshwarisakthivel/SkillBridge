import React, { useState } from 'react'; 
import axios from 'axios'; 
import {
    TextField,
    Button,
    Typography,
    Container,
    Alert,
    Box,
    Grid,
    Card,
    CardContent,
    InputAdornment,
} from '@mui/material';
import { Lock, Email, Numbers } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const ForgotPasswordPage = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({ email: '', otp: '', newPassword: '', confirmNewPassword: '' });
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const emailValidation = /^[A-Za-z][A-Za-z0-9._%+-]*@gmail\.com$/; 

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({ ...prevState, [name]: value }));
    };

    const handleRequestOTP = async () => { 
        if (!emailValidation.test(formData.email)) {
            setErrorMessage("Enter a valid Gmail address.");
            return;
        }
        setLoading(true);
        try {
            const response = await axios.post(
                `${API_BASE_URL}/forgot-password/request-otp/`,
                { email: formData.email },
                { headers: { Authorization: `Token ${localStorage.getItem('user_token')}` } }
            );
            setStep(2);
            setSuccessMessage(response.data.message);
        } catch (error) {
            setErrorMessage(error.response?.data?.error || "Failed to send OTP.");
        } finally {
            setLoading(false);
        }
    };
    
    const handleVerifyOTP = async () => {
        if (!formData.otp) {
            setErrorMessage("Enter the OTP sent to your email.");
            return;
        }
        setLoading(true);
        try {
            const response = await axios.post(
                `${API_BASE_URL}/forgot-password/verify-otp/`,
                { email: formData.email, otp: formData.otp },
                { headers: { Authorization: `Token ${localStorage.getItem('user_token')}` } }
            );
            setStep(3);
            setSuccessMessage(response.data.message);
        } catch (error) {
            setErrorMessage(error.response?.data?.error || "OTP verification failed.");
        } finally {
            setLoading(false);
        }
    };
        
    const handleResetPassword = async () => {
        if (formData.newPassword !== formData.confirmNewPassword) {
            setErrorMessage("Passwords don't match.");
            return;
        }
        if (formData.newPassword.length < 8) {
            setErrorMessage("Password must be at least 8 characters.");
            return;
        }
        if (!/\d/.test(formData.newPassword)) {
            setErrorMessage("Password must include at least one number.");
            return;
        }
        if (!/[!@#$%^&*]/.test(formData.newPassword)) {
            setErrorMessage("Password must include at least one special character.");
            return;
        }
        if (!/[A-Z]/.test(formData.newPassword) || !/[a-z]/.test(formData.newPassword)) {
            setErrorMessage("Password must include both uppercase and lowercase letters.");
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/forgot-password/reset-password/`, {
                email: formData.email,
                new_password: formData.newPassword,
            });

            if (response.status === 200) {
                setSuccessMessage('Password reset successful. Redirecting to login...');
                setTimeout(() => navigate('/login'), 2000);
            }
        } catch (error) {
            setErrorMessage('Error resetting password. Please try again.');
        } finally {
            setLoading(false);
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
                            Forgot Password
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
                            <Grid container spacing={2}>
                                {step === 1 && (
                                    <>
                                        <Grid item xs={12}>
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
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Button variant="contained" color="primary" fullWidth onClick={handleRequestOTP} size="large" disabled={loading}>
                                                {loading ? "Sending OTP..." : "Request OTP"}
                                            </Button>
                                        </Grid>
                                    </>
                                )}

                                {step === 2 && (
                                    <>
                                        <Grid item xs={12}>
                                            <TextField
                                                label="OTP"
                                                type="text"
                                                name="otp"
                                                fullWidth
                                                variant="outlined"
                                                value={formData.otp}
                                                onChange={handleInputChange}
                                                required
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <Numbers />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Button variant="contained" color="primary" fullWidth onClick={handleVerifyOTP} size="large" disabled={loading}>
                                                {loading ? "Verifying OTP..." : "Verify OTP"}
                                            </Button>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Button variant="text" onClick={handleRequestOTP} disabled={loading}>
                                                Resend OTP
                                            </Button>
                                        </Grid>
                                    </>
                                )}

                                {step === 3 && (
                                    <>
                                        <Grid item xs={12}>
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
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <TextField
                                                label="Confirm New Password"
                                                type="password"
                                                name="confirmNewPassword"
                                                fullWidth
                                                variant="outlined"
                                                value={formData.confirmNewPassword}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Button variant="contained" color="primary" fullWidth onClick={handleResetPassword} size="large" disabled={loading}>
                                                {loading ? "Resetting..." : "Reset Password"}
                                            </Button>
                                        </Grid>
                                    </>
                                )}
                            </Grid>
                        </Box>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
};

export default ForgotPasswordPage;
