import React, { useEffect, useState } from 'react';
import {
    Badge,
    IconButton,
    Menu,
    MenuItem,
    Typography,
    List,
    ListItem,
    ListItemText,
    Divider,
    Button
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import './NotificationBell.css';

const NotificationBell = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    let email = '';
    if (token) {
        try {
            const decoded = jwtDecode(token);
            email = decoded.email;
        } catch (e) {
            console.error("Token decode error", e);
        }
    }

    const fetchNotifications = async () => {
        if (!email) return;
        try {
            const res = await axios.get(`http://localhost:3096/notifications?email=${email}`);
            setNotifications(res.data);
            const count = res.data.filter(n => !n.isRead).length;
            setUnreadCount(count);
        } catch (error) {
            console.error("Error fetching notifications", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 60 seconds
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, [email]);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleNotificationClick = async (notification) => {
        // Mark as read
        try {
            await axios.put(`http://localhost:3096/markNotificationRead/${notification._id}`);
            fetchNotifications(); // Refresh
        } catch (error) {
            console.error("Error marking read", error);
        }

        handleClose();

        // Navigate
        if (notification.relatedFormType === 'studentForm') {
            // If received, logic might differ, but generic view works if permission allows
            // Assuming generic view or specific view based on ownership.
            // If I am the recipient, I usually view in ReceivedFormView? Or SubmissionView?
            // Since the system has multiple view pages, we assume:
            // If I submitted it -> SubmissionView
            // If I Received it -> ReceivedFormView

            // However, notification doesn't explicitly store "isRecipient".
            // We can infer or just try to route to generic view logic.
            // Given typical routes:
            // /submission/:id -> usually for submitter
            // /received-forms/:id -> usually for reviewer

            // Simple heursitic: If message says "New form", I am reviewer -> /received-forms/:id
            // If message says "Status updated", I am submitter -> /submission/:id

            if (notification.message.includes('New')) {
                navigate(`/received-forms/${notification.relatedFormId}`);
            } else {
                navigate(`/submission/${notification.relatedFormId}`);
            }

        } else if (notification.relatedFormType === 'facultyForm') {
            if (notification.message.includes('New')) {
                navigate(`/received-forms/${notification.relatedFormId}`);
            } else {
                navigate(`/submission/${notification.relatedFormId}`);
            }
        }
    };

    const handleMarkAllRead = async () => {
        if (!email) return;
        try {
            await axios.put('http://localhost:3096/markAllNotificationsRead', { email });
            fetchNotifications();
        } catch (error) {
            console.error("Error mark all read", error);
        }
    };

    const open = Boolean(anchorEl);

    return (
        <>
            <IconButton color="inherit" onClick={handleClick}>
                <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                PaperProps={{
                    style: {
                        maxHeight: 400,
                        width: '350px',
                    },
                }}
            >
                <div style={{ padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" style={{ fontSize: '1rem' }}>Notifications</Typography>
                    <Button size="small" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
                        Mark all read
                    </Button>
                </div>
                <Divider />
                {notifications.length === 0 ? (
                    <MenuItem disabled>
                        <Typography variant="body2">No notifications</Typography>
                    </MenuItem>
                ) : (
                    notifications.map((n) => (
                        <MenuItem
                            key={n._id}
                            onClick={() => handleNotificationClick(n)}
                            style={{
                                whiteSpace: 'normal',
                                backgroundColor: n.isRead ? 'inherit' : '#f0f4ff',
                                borderBottom: '1px solid #eee'
                            }}
                        >
                            <ListItemText
                                primary={n.message}
                                secondary={new Date(n.createdAt).toLocaleString()}
                                primaryTypographyProps={{ variant: 'body2', fontWeight: n.isRead ? 'normal' : 'bold' }}
                                secondaryTypographyProps={{ variant: 'caption' }}
                            />
                        </MenuItem>
                    ))
                )}
            </Menu>
        </>
    );
};

export default NotificationBell;
