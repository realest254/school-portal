import React, { useState, useEffect } from 'react';
import { Container, Grid, Divider } from '@mui/material';
import { useSnackbar } from 'notistack';
import { api } from '../../utils/api';
import SubjectsSection from '../../components/dashboards/admin/pages/SubjectsManagement/SubjectsSection';
import ClassesSection from '../../components/dashboards/admin/pages/SubjectsManagement/ClassesSection';

const SubjectsPage = () => {
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const { enqueueSnackbar } = useSnackbar();

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/subjects');
      setSubjects(response.data);
    } catch (error) {
      enqueueSnackbar(error.response?.data?.error || 'Failed to fetch subjects', {
        variant: 'error',
      });
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes');
      setClasses(response.data);
    } catch (error) {
      enqueueSnackbar(error.response?.data?.error || 'Failed to fetch classes', {
        variant: 'error',
      });
    }
  };

  useEffect(() => {
    fetchSubjects();
    fetchClasses();
  }, []);

  const handleAddSubject = async (data) => {
    try {
      await api.post('/subjects', data);
      enqueueSnackbar('Subject created successfully', { variant: 'success' });
      fetchSubjects();
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to create subject');
    }
  };

  const handleEditSubject = async (id, data) => {
    try {
      await api.put(`/subjects/${id}`, data);
      enqueueSnackbar('Subject updated successfully', { variant: 'success' });
      fetchSubjects();
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to update subject');
    }
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject?')) return;

    try {
      await api.delete(`/subjects/${id}`);
      enqueueSnackbar('Subject deleted successfully', { variant: 'success' });
      fetchSubjects();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.error || 'Failed to delete subject', {
        variant: 'error',
      });
    }
  };

  const handleAddClass = async (data) => {
    try {
      await api.post('/classes', data);
      enqueueSnackbar('Class created successfully', { variant: 'success' });
      fetchClasses();
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to create class');
    }
  };

  const handleDeleteClass = async (name) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return;

    try {
      await api.delete(`/classes/${encodeURIComponent(name)}`);
      enqueueSnackbar('Class deleted successfully', { variant: 'success' });
      fetchClasses();
    } catch (error) {
      enqueueSnackbar(error.response?.data?.error || 'Failed to delete class', {
        variant: 'error',
      });
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <SubjectsSection
            subjects={subjects}
            onAddSubject={handleAddSubject}
            onEditSubject={handleEditSubject}
            onDeleteSubject={handleDeleteSubject}
          />
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 4 }} />
          <ClassesSection
            classes={classes}
            onAddClass={handleAddClass}
            onDeleteClass={handleDeleteClass}
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default SubjectsPage;
