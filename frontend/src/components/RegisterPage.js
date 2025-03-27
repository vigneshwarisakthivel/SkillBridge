import React, { useState } from 'react';  
import axios from 'axios';
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
    FormControl,
    RadioGroup,
    FormControlLabel,
    Radio,
} from '@mui/material';
import { Lock, AccountCircle } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

const RegisterPage = () => {
    const [formData, setFormData] = useState({ 
        username: '', 
        email: '', 
        password: '', 
        confirmpassword: '', 
        first_name: '', 
        last_name: '', 
        role: 'user' // Default role
    });
    const [errorMessage, setErrorMessage] = useState('');
    const { enqueueSnackbar } = useSnackbar();
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [name]: value,
        }));
        setErrorMessage('');
    };

    const handleRoleChange = (e) => {
        setFormData((prevState) => ({
            ...prevState,
            role: e.target.value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmpassword) {
            setErrorMessage("Passwords don't match!");
            enqueueSnackbar("Passwords don't match!", { variant: 'error' });
            return;
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/register/`, formData);
            localStorage.setItem('role', response.data.role); // Store role instead of token
            enqueueSnackbar('Registration successful!', { variant: 'success' });
            navigate('/LoginPage');
        } catch (error) {
            console.error('Registration error:', error);
            setErrorMessage('Registration failed. Please check your input.');
            enqueueSnackbar('Registration failed. Please check your input!', { variant: 'error' });
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            <Container maxWidth="xs">
                <Card elevation={3} sx={{ p: 2 }}>
                    <CardContent>
                        <Typography variant="h5" align="center" gutterBottom>
                            Register
                        </Typography>
                        <Box component="form" onSubmit={handleSubmit} noValidate>
                            {['username', 'first_name', 'last_name', 'email'].map((field, index) => (
                                <TextField
                                    key={index}
                                    label={field.replace('_', ' ').replace(/\b\w/g, char => char.toUpperCase())}
                                    type="text"
                                    name={field}
                                    fullWidth
                                    variant="outlined"
                                    value={formData[field]}
                                    onChange={handleInputChange}
                                    required
                                    sx={{ mt: 2 }}
                                    InputProps={field === 'email' ? {} : {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <AccountCircle />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            ))}
                            <TextField
                                label="Password"
                                type="password"
                                name="password"
                                fullWidth
                                variant="outlined"
                                value={formData.password}
                                onChange={handleInputChange}
                                required
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Lock />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ mt: 2 }}
                            />
                            <TextField
                                label="Confirm Password"
                                type="password"
                                name="confirmpassword"
                                fullWidth
                                variant="outlined"
                                value={formData.confirmpassword}
                                onChange={handleInputChange}
                                required
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Lock />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ mt: 2 }}
                            />
                            <FormControl component="fieldset" sx={{ mt: 2 }}>
                                <Typography variant="subtitle1">Select Role</Typography>
                                <RadioGroup row name="role" value={formData.role} onChange={handleRoleChange}>
                                    <FormControlLabel value="user" control={<Radio />} label="User" />
                                    <FormControlLabel value="admin" control={<Radio />} label="Admin" />
                                </RadioGroup>
                            </FormControl>
                            {errorMessage && (
                                <Box mt={2}>
                                    <Alert severity="error">{errorMessage}</Alert>
                                </Box>
                            )}
                            <Box mt={2}>
                                <Button type="submit" variant="contained" color="primary" fullWidth>
                                    Register
                                </Button>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
};

export default RegisterPage;