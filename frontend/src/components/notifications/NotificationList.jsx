import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Tooltip
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { formatDate } from '../../utils/dateUtils';

const priorityColors = {
  high: 'error',
  medium: 'warning',
  low: 'info'
};

const NotificationList = ({ notifications, onEdit, onDelete }) => {
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Title</TableCell>
            <TableCell>Message</TableCell>
            <TableCell>Priority</TableCell>
            <TableCell>Target Audience</TableCell>
            <TableCell>Expiry Date</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {notifications.map((notification) => (
            <TableRow key={notification.id}>
              <TableCell>{notification.title}</TableCell>
              <TableCell>{notification.message}</TableCell>
              <TableCell>
                <Chip
                  label={notification.priority}
                  color={priorityColors[notification.priority]}
                  size="small"
                />
              </TableCell>
              <TableCell>
                {notification.targetAudience.map((audience) => (
                  <Chip
                    key={audience}
                    label={audience}
                    size="small"
                    style={{ marginRight: 4 }}
                  />
                ))}
              </TableCell>
              <TableCell>{formatDate(notification.expiryDate)}</TableCell>
              <TableCell>
                <Chip
                  label={notification.status}
                  color={notification.status === 'active' ? 'success' : 'default'}
                  size="small"
                />
              </TableCell>
              <TableCell>
                <Tooltip title="Edit">
                  <IconButton
                    size="small"
                    onClick={() => onEdit(notification)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                  <IconButton
                    size="small"
                    onClick={() => onDelete(notification.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default NotificationList;
