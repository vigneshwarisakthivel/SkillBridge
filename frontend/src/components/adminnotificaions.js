import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { List, ListItem, Typography } from '@mui/material';
const API_BASE_URL = 'https://onlinetestcreationbackend.onrender.com/api';
const AdminNotifications = () => {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await axios.get(`${API_BASE_URL}/admin-notifications/`);
                setNotifications(response.data);
            } catch (error) {
                console.error("Error fetching admin notifications:", error);
            }
        };

        fetchNotifications();
    }, []);

    return (
        <List>
            {notifications.map((notification) => (
                <ListItem key={notification.id}>
                    <Typography variant="body1">{notification.message}</Typography>
                </ListItem>
            ))}
        </List>
    );
};

export default AdminNotifications;