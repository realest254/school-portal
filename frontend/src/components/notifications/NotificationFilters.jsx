import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const NotificationFilters = ({ filters, onFilterChange }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onFilterChange({
      ...filters,
      [name]: value
    });
  };

  const handleDateChange = (field) => (date) => {
    onFilterChange({
      ...filters,
      [field]: date
    });
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
      <FormControl sx={{ minWidth: 120 }}>
        <InputLabel>Priority</InputLabel>
        <Select
          name="priority"
          value={filters.priority || ''}
          onChange={handleChange}
          label="Priority"
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="high">High</MenuItem>
          <MenuItem value="medium">Medium</MenuItem>
          <MenuItem value="low">Low</MenuItem>
        </Select>
      </FormControl>

      <FormControl sx={{ minWidth: 120 }}>
        <InputLabel>Target Audience</InputLabel>
        <Select
          name="targetAudience"
          value={filters.targetAudience || ''}
          onChange={handleChange}
          label="Target Audience"
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="students">Students</MenuItem>
          <MenuItem value="teachers">Teachers</MenuItem>
          <MenuItem value="parents">Parents</MenuItem>
        </Select>
      </FormControl>

      <FormControl sx={{ minWidth: 120 }}>
        <InputLabel>Status</InputLabel>
        <Select
          name="status"
          value={filters.status || ''}
          onChange={handleChange}
          label="Status"
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="expired">Expired</MenuItem>
          <MenuItem value="deleted">Deleted</MenuItem>
        </Select>
      </FormControl>

      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <DatePicker
          label="Start Date"
          value={filters.startDate || null}
          onChange={handleDateChange('startDate')}
          renderInput={(params) => (
            <TextField {...params} sx={{ minWidth: 120 }} />
          )}
        />

        <DatePicker
          label="End Date"
          value={filters.endDate || null}
          onChange={handleDateChange('endDate')}
          renderInput={(params) => (
            <TextField {...params} sx={{ minWidth: 120 }} />
          )}
        />
      </LocalizationProvider>
    </Box>
  );
};

export default NotificationFilters;
