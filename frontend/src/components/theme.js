import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#003366', // Deep blue for primary UI elements
            contrastText: '#ffffff', // White text for contrast
        },
        secondary: {
            main: '#00509E', // Accent blue for buttons and highlights
            contrastText: '#ffffff', // White text for contrast
        },
        background: {
            default: '#EAF6FF', // Light blue for the page background
            paper: '#ffffff', // White for cards and containers
        },
        text: {
            primary: '#003366', // Deep blue for main text
            secondary: '#00509E', // Accent blue for secondary text
        },
    },
    typography: {
        fontFamily: 'Roboto, sans-serif', // Ensure a modern, clean font
        h4: {
            fontWeight: 'bold',
            color: '#003366', // Consistent deep blue for headers
        },
        body2: {
            color: '#003366', // Default text color for body
        },
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    textTransform: 'none', // Disable uppercase transformation
                    borderRadius: 8, // Add a subtle border radius for softer UI
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', // Default shadow for cards
                    borderRadius: 12, // Rounded corners for modern look
                },
            },
        },
    },
});

export default theme;