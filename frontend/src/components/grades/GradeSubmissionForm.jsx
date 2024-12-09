import React, { useState, useEffect } from 'react';
import { useTeacher } from '../../contexts/TeacherContext';
import { gradeService } from '../../services/gradeService';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
} from '@mui/material';

const GradeSubmissionForm = () => {
  const { teacher } = useTeacher();
  const [examDetails, setExamDetails] = useState({
    examName: '',
    term: '',
    year: new Date().getFullYear(),
  });
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [grades, setGrades] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        if (teacher?.classId) {
          const studentsData = await gradeService.getClassStudents(teacher.classId);
          const subjectsData = await gradeService.getAllSubjects();
          setStudents(studentsData);
          setSubjects(subjectsData);
          
          // Initialize grades structure
          const initialGrades = {};
          studentsData.forEach(student => {
            initialGrades[student.id] = {};
            subjectsData.forEach(subject => {
              initialGrades[student.id][subject.id] = '';
            });
          });
          setGrades(initialGrades);
        }
      } catch (err) {
        setError('Failed to load students and subjects');
      }
    };

    loadData();
  }, [teacher]);

  const handleGradeChange = (studentId, subjectId, value) => {
    const score = parseFloat(value);
    if (isNaN(score) || score < 0 || score > 100) return;

    setGrades(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [subjectId]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const result = await gradeService.submitGrades({
        examDetails,
        classId: teacher.classId,
        grades
      });

      setSuccess('Grades submitted successfully!');
      // Reset form
      setExamDetails({
        examName: '',
        term: '',
        year: new Date().getFullYear(),
      });
      setGrades({});
    } catch (err) {
      setError('Failed to submit grades. Please try again.');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Submit Grades
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <TextField
          required
          label="Exam Name"
          value={examDetails.examName}
          onChange={(e) => setExamDetails(prev => ({ ...prev, examName: e.target.value }))}
        />
        <FormControl required sx={{ minWidth: 120 }}>
          <InputLabel>Term</InputLabel>
          <Select
            value={examDetails.term}
            label="Term"
            onChange={(e) => setExamDetails(prev => ({ ...prev, term: e.target.value }))}
          >
            <MenuItem value={1}>Term 1</MenuItem>
            <MenuItem value={2}>Term 2</MenuItem>
            <MenuItem value={3}>Term 3</MenuItem>
          </Select>
        </FormControl>
        <TextField
          required
          type="number"
          label="Year"
          value={examDetails.year}
          onChange={(e) => setExamDetails(prev => ({ ...prev, year: e.target.value }))}
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student</TableCell>
              {subjects.map(subject => (
                <TableCell key={subject.id}>{subject.name}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map(student => (
              <TableRow key={student.id}>
                <TableCell>{student.name}</TableCell>
                {subjects.map(subject => (
                  <TableCell key={subject.id}>
                    <TextField
                      type="number"
                      size="small"
                      value={grades[student.id]?.[subject.id] || ''}
                      onChange={(e) => handleGradeChange(student.id, subject.id, e.target.value)}
                      inputProps={{ min: 0, max: 100 }}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Button
        type="submit"
        variant="contained"
        sx={{ mt: 3 }}
        disabled={!examDetails.examName || !examDetails.term}
      >
        Submit Grades
      </Button>
    </Box>
  );
};

export default GradeSubmissionForm;
