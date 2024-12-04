import React, { useState, useEffect } from 'react';
import { Card, Button, message, Space } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useTeacher } from '@/contexts/TeacherContext';
import { useNavigationGuard } from '@/hooks/useNavigationGuard';
import GradesTable from '../../components/dashboards/teacher/GradesTable';
import SubjectSelector from '../../components/dashboards/teacher/SubjectSelector';
import ExamDetailsForm from '../../components/dashboards/teacher/ExamDetailsForm';
import GradesSummary from '../../components/dashboards/teacher/GradesSummary';
import { gradeService } from '../../services/gradeService';

const GradesManagement = () => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const { 
    examDetails, setExamDetails,
    grades, setGrades,
    selectedSubjects, setSelectedSubjects,
    clearForm,
    students,
    loading: teacherDataLoading
  } = useTeacher();
  
  const [saving, setSaving] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Use navigation guard if there are unsaved changes
  useNavigationGuard(unsavedChanges);

  const cardStyles = {
    style: {
      background: isDarkMode ? '#1f2937' : '#fff',
      borderColor: isDarkMode ? '#374151' : '#f0f0f0'
    },
    styles: {
      header: {
        background: isDarkMode ? '#374151' : '#fff',
        color: isDarkMode ? '#fff' : 'inherit',
        borderBottom: isDarkMode ? '1px solid #4B5563' : '1px solid #f0f0f0'
      }
    }
  };

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // For now using mock data
        setAvailableSubjects([
          { id: 'math', name: 'Mathematics' },
          { id: 'eng', name: 'English' },
          { id: 'sci', name: 'Science' },
          { id: 'hist', name: 'History' },
          { id: 'geo', name: 'Geography' }
        ]);
      } catch (error) {
        console.error('Error fetching data:', error);
        message.error('Failed to load data');
      }
    };

    fetchData();
  }, []);

  const handleAddSubject = (subjectId) => {
    const subject = availableSubjects.find(s => s.id === subjectId);
    if (subject) {
      setSelectedSubjects([...(selectedSubjects || []), subject]);
    }
  };

  const handleRemoveSubject = (subjectId) => {
    setSelectedSubjects(selectedSubjects.filter(s => s.id !== subjectId));
    // Remove grades for this subject
    setGrades(prev => {
      const newGrades = { ...prev };
      Object.keys(newGrades).forEach(studentId => {
        if (newGrades[studentId]?.[subjectId]) {
          const studentGrades = { ...newGrades[studentId] };
          delete studentGrades[subjectId];
          newGrades[studentId] = studentGrades;
        }
      });
      return newGrades;
    });
  };

  const handleGradeChange = (studentId, subjectId, value) => {
    setUnsavedChanges(true);
    setGrades(prev => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [subjectId]: value
      }
    }));
  };

  const handleExamDetailsChange = (details) => {
    setUnsavedChanges(true);
    setExamDetails(details);
  };

  const validateGrades = () => {
    // Check if exam details are filled
    if (!examDetails.examName || !examDetails.term || !examDetails.year) {
      message.error('Please fill in all exam details');
      return false;
    }

    // Check if subjects are selected
    if (!selectedSubjects || selectedSubjects.length === 0) {
      message.error('Please select at least one subject');
      return false;
    }

    // Check if all students have grades for all subjects
    const missingGrades = [];
    students.forEach(student => {
      selectedSubjects.forEach(subject => {
        const grade = grades[student.id]?.[subject.id];
        if (!grade && grade !== 0) {
          missingGrades.push(`${student.name} - ${subject.name}`);
        }
      });
    });

    if (missingGrades.length > 0) {
      message.error(`Missing grades for: ${missingGrades.slice(0, 3).join(', ')}${missingGrades.length > 3 ? ' and more...' : ''}`);
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateGrades()) {
      return;
    }

    try {
      setSaving(true);
      
      const gradesData = {
        examDetails: {
          examName: examDetails.examName,
          term: examDetails.term,
          year: examDetails.year
        },
        grades,
        classId: students[0]?.class_id
      };

      const result = await gradeService.submitGrades(gradesData);
      message.success(`Successfully saved ${result.gradesSubmitted} grades for exam ${examDetails.examName}`);
      setUnsavedChanges(false);

      // Load statistics for the new exam
      try {
        const stats = await gradeService.getGradeStatistics(result.examId);
        setStatistics(stats.data);
      } catch (error) {
        console.error('Error loading statistics:', error);
        message.warning('Grades saved but could not load statistics');
      }

      clearForm();
    } catch (error) {
      console.error('Error saving grades:', error);
      message.error('Failed to save grades. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card
        title="Grade Entry Form"
        {...cardStyles}
        className="shadow-sm"
        extra={
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saving}
            disabled={teacherDataLoading || !unsavedChanges}
          >
            Save All Grades
          </Button>
        }
      >
        <Space direction="vertical" className="w-full">
          <ExamDetailsForm
            examDetails={examDetails}
            onChange={handleExamDetailsChange}
            loading={teacherDataLoading}
            isDarkMode={isDarkMode}
          />
          
          <SubjectSelector
            availableSubjects={availableSubjects}
            selectedSubjects={selectedSubjects || []}
            onAddSubject={handleAddSubject}
            loading={teacherDataLoading}
            isDarkMode={isDarkMode}
          />

          <GradesTable
            students={students}
            subjects={selectedSubjects || []}
            grades={grades}
            onGradeChange={handleGradeChange}
            onDeleteSubject={handleRemoveSubject}
            loading={teacherDataLoading}
            isDarkMode={isDarkMode}
          />
        </Space>
      </Card>

      {unsavedChanges && (
        <Card
          title="Grade Summary"
          {...cardStyles}
          className="shadow-sm"
          loading={loadingStats}
        >
          <GradesSummary
            grades={grades}
            subjects={selectedSubjects || []}
            students={students}
            statistics={statistics}
            isDarkMode={isDarkMode}
          />
        </Card>
      )}
    </div>
  );
};

export default GradesManagement;
