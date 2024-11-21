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
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';

const ClassesSection = ({ classes, onAddClass, onDeleteClass }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [className, setClassName] = useState('');
  const { enqueueSnackbar } = useSnackbar();

  const handleOpenDialog = () => {
    setOpenDialog(true);
    setClassName('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setClassName('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onAddClass({ name: className });
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
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {classes.map((classItem) => (
                <TableRow key={classItem.name}>
                  <TableCell>{classItem.name}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      color="error"
                      onClick={() => onDeleteClass(classItem.name)}
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
              type="text"
              fullWidth
              required
              value={className}
              onChange={(e) => setClassName(e.target.value)}
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
