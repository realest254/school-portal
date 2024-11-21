import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';

const ClassesSection = ({ classes, onAddClass, onDeleteClass }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    stream: '',
    academicYear: new Date().getFullYear(),
    teacherName: '', // We'll send the teacher name to backend
  });
  const { enqueueSnackbar } = useSnackbar();

  const handleOpenDialog = () => {
    setOpenDialog(true);
    setFormData({
      name: '',
      grade: '',
      stream: '',
      academicYear: new Date().getFullYear(),
      teacherName: '',
    });
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      name: '',
      grade: '',
      stream: '',
      academicYear: new Date().getFullYear(),
      teacherName: '',
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onAddClass({
        ...formData,
        grade: parseInt(formData.grade),
        academicYear: parseInt(formData.academicYear)
      });
      handleCloseDialog();
    } catch (error) {
      enqueueSnackbar(error.message || 'Failed to add class', { variant: 'error' });
    }
  };

  return (
    <>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Classes Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Add Class
        </Button>
      </Box>

      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Class Name</TableCell>
                <TableCell>Grade</TableCell>
                <TableCell>Stream</TableCell>
                <TableCell>Academic Year</TableCell>
                <TableCell>Teacher Name</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {classes.map((classItem) => (
                <TableRow key={classItem.id}>
                  <TableCell>{classItem.name}</TableCell>
                  <TableCell>{classItem.grade}</TableCell>
                  <TableCell>{classItem.stream || '-'}</TableCell>
                  <TableCell>{classItem.academicYear}</TableCell>
                  <TableCell>{classItem.teacherName || '-'}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      color="error"
                      onClick={() => onDeleteClass(classItem.id)}
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>Add New Class</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Class Name"
              name="name"
              type="text"
              fullWidth
              required
              value={formData.name}
              onChange={handleChange}
            />
            <TextField
              margin="dense"
              label="Grade"
              name="grade"
              type="number"
              fullWidth
              required
              value={formData.grade}
              onChange={handleChange}
              inputProps={{ min: 1, max: 12 }}
            />
            <TextField
              margin="dense"
              label="Stream (Optional)"
              name="stream"
              type="text"
              fullWidth
              value={formData.stream}
              onChange={handleChange}
            />
            <TextField
              margin="dense"
              label="Academic Year"
              name="academicYear"
              type="number"
              fullWidth
              required
              value={formData.academicYear}
              onChange={handleChange}
              inputProps={{ min: 2000, max: 2100 }}
            />
            <TextField
              margin="dense"
              label="Teacher Name"
              name="teacherName"
              type="text"
              fullWidth
              value={formData.teacherName}
              onChange={handleChange}
              helperText="Enter the name of the teacher for this class"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              Create
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default ClassesSection;
