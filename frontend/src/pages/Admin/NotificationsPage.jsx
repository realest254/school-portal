import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Container,
  Pagination,
  Alert,
  Snackbar
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import NotificationList from '../../components/notifications/NotificationList';
import NotificationForm from '../../components/notifications/NotificationForm';
import NotificationFilters from '../../components/notifications/NotificationFilters';
import { useNotifications } from '../../hooks/useNotifications';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const NotificationsPage = () => {
  const [openForm, setOpenForm] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [filters, setFilters] = useState({
    priority: '',
    targetAudience: '',
    status: '',
    startDate: null,
    endDate: null
  });
  const [page, setPage] = useState(1);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const {
    notifications,
    totalPages,
    loading,
    error,
    createNotification,
    updateNotification,
    deleteNotification,
    fetchNotifications
  } = useNotifications();

  useEffect(() => {
    fetchNotifications(page, filters);
  }, [page, filters]);

  const handleCreateClick = () => {
    setSelectedNotification(null);
    setOpenForm(true);
  };

  const handleEditClick = (notification) => {
    setSelectedNotification(notification);
    setOpenForm(true);
  };

  const handleDeleteClick = async (id) => {
    try {
      await deleteNotification(id);
      setSnackbar({
        open: true,
        message: 'Notification deleted successfully',
        severity: 'success'
      });
      fetchNotifications(page, filters);
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to delete notification',
        severity: 'error'
      });
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (selectedNotification) {
        await updateNotification(selectedNotification.id, formData);
        setSnackbar({
          open: true,
          message: 'Notification updated successfully',
          severity: 'success'
        });
      } else {
        await createNotification(formData);
        setSnackbar({
          open: true,
          message: 'Notification created successfully',
          severity: 'success'
        });
      }
      setOpenForm(false);
      fetchNotifications(page, filters);
    } catch (err) {
      setSnackbar({
        open: true,
        message: 'Failed to save notification',
        severity: 'error'
      });
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handlePageChange = (event, value) => {
    setPage(value);
  };

  if (error) {
    return (
      <Container>
        <Alert severity="error">
          Error loading notifications: {error.message}
        </Alert>
      </Container>
    );
  }

  return (
    <Container>
      <Box sx={{ mb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3
          }}
        >
          <Typography variant="h4">Notifications</Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateClick}
          >
            Create Notification
          </Button>
        </Box>

        <NotificationFilters
          filters={filters}
          onFilterChange={handleFilterChange}
        />

        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            <NotificationList
              notifications={notifications}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
            />

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          </>
        )}
      </Box>

      <NotificationForm
        open={openForm}
        notification={selectedNotification}
        onClose={() => setOpenForm(false)}
        onSubmit={handleSubmit}
        loading={loading}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default NotificationsPage;
