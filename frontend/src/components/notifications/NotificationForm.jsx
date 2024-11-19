import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Box
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const NotificationForm = ({
  open,
  notification,
  onClose,
  onSubmit,
  loading
}) => {
  const [formData, setFormData] = React.useState({
    title: '',
    message: '',
    priority: 'medium',
    targetAudience: [],
    expiryDate: new Date()
  });

  React.useEffect(() => {
    if (notification) {
      setFormData({
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        targetAudience: notification.targetAudience,
        expiryDate: new Date(notification.expiryDate)
      });
    } else {
      setFormData({
        title: '',
        message: '',
        priority: 'medium',
        targetAudience: [],
        expiryDate: new Date()
      });
    }
  }, [notification]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {notification ? 'Edit Notification' : 'Create Notification'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              name="title"
              label="Title"
              value={formData.title}
              onChange={handleChange}
              required
              fullWidth
            />

            <TextField
              name="message"
              label="Message"
              value={formData.message}
              onChange={handleChange}
              required
              multiline
              rows={4}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                required
              >
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Target Audience</InputLabel>
              <Select
                name="targetAudience"
                multiple
                value={formData.targetAudience}
                onChange={handleChange}
                required
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} />
                    ))}
                  </Box>
                )}
              >
                <MenuItem value="students">Students</MenuItem>
                <MenuItem value="teachers">Teachers</MenuItem>
                <MenuItem value="parents">Parents</MenuItem>
              </Select>
            </FormControl>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="Expiry Date"
                value={formData.expiryDate}
                onChange={(newValue) => {
                  setFormData((prev) => ({
                    ...prev,
                    expiryDate: newValue
                  }));
                }}
                renderInput={(params) => <TextField {...params} fullWidth />}
                minDateTime={new Date()}
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default NotificationForm;
