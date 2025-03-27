import React from "react";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaHome } from "react-icons/fa";
import { Box, Button, Typography, Paper, Stack } from "@mui/material";
import styled from "styled-components";

const LogoutContainer = styled(Box)`
  position: fixed; /* Set position to fixed */
  top: 0; /* Align to the top */
  left: 0; /* Align to the left */
  right: 0; /* Align to the right */
  bottom: 0; /* Align to the bottom */
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f4f6f8; /* Background color */
`;

const LogoutBox = styled(Paper)`
  padding: 60px; /* Increased padding for a larger box */
  border-radius: 12px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  text-align: center;
  max-width: 500px; /* Increased max-width for a larger box */
  width: 100%;
  border: 1px solid #ddd;
`;

const StyledButton = styled(Button)`
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  text-transform: none;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s;

  &:hover {
    transform: scale(1.05);
  }
`;

const LogoutPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("userId");
    console.log("User  ID cleared from local storage");
    navigate("/login");
  };

  const handleCancel = () => {
    navigate("/");
  };

  return (
    <LogoutContainer>
      <LogoutBox elevation={3}>
        <Typography variant="h4" fontWeight={700} color="primary" gutterBottom>
          Thank You!
        </Typography>
        <Typography variant="body1" color="textSecondary" gutterBottom>
          Are you sure you want to log out? We’ll be sad to see you go, but we understand!
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center" mt={3}>
          <StyledButton
            variant="contained"
            color="primary"
            onClick={handleLogout}
            startIcon={<FaSignOutAlt />}
          >
            Log Out
          </StyledButton>
          <StyledButton
            variant="contained"
            color="primary"
            onClick={handleCancel}
            startIcon={<FaHome />}
          >
            Go Back Home
          </StyledButton>
        </Stack>
      </LogoutBox>
    </LogoutContainer>
  );
};

export default LogoutPage;