import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { gradeService } from '@/services/gradeService';

const TeacherContext = createContext();

export const useTeacher = () => {
  const context = useContext(TeacherContext);
  if (!context) {
    throw new Error('useTeacher must be used within a TeacherProvider');
  }
  return context;
};

// Constants from GradeFormContext
const STORAGE_KEY = 'gradeFormDraft';
const EXPIRY_HOURS = 24;

export const TeacherProvider = ({ children }) => {
  // Teacher & Dashboard Data
  const [teacherData, setTeacherData] = useState(null);
  const [classData, setClassData] = useState(null);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [grades, setGrades] = useState({});
  const [examDetails, setExamDetails] = useState({ examName: '', term: null, year: null });
  const [performanceData, setPerformanceData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [indisciplineCases, setIndisciplineCases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // First get teacher data to get the class ID
        const teacherResponse = await gradeService.getTeacherData();
        const teacherData = teacherResponse.data;
        setTeacherData(teacherData);

        if (teacherData && teacherData.class) {
          // Use the class ID to get students
          const studentsData = await gradeService.getClassStudents(teacherData.class.id);
          setStudents(studentsData.data || []);
          setClassData(teacherData.class);
        }

        // Get subjects
        const subjectsData = await gradeService.getAllSubjects();
        setSubjects(subjectsData.data || []);

        // Set mock data for dashboard components
        setPerformanceData({
          currentTerm: {
            average: 72.5,
            trend: 'up',
            change: 3.2
          },
          termlyAverages: [
            { term: 'T1', average: 68.2 },
            { term: 'T2', average: 69.3 },
            { term: 'T3', average: 72.5 }
          ],
          subjectPerformance: [
            { subject: 'Math', score: 75, trend: 'up' },
            { subject: 'English', score: 70, trend: 'down' },
            { subject: 'Science', score: 73, trend: 'up' },
            { subject: 'History', score: 68, trend: 'down' }
          ]
        });

        // Set mock notifications
        setNotifications([
          { 
            id: 1, 
            title: 'End of Term Meeting', 
            message: 'Scheduled for next week', 
            priority: 'high',
            type: 'meeting',
            timestamp: new Date().toISOString()
          },
          { 
            id: 2, 
            title: 'Grade Submission', 
            message: 'Due in 3 days', 
            priority: 'medium',
            type: 'assignment',
            timestamp: new Date().toISOString()
          },
          {
            id: 3,
            title: 'Student Attendance',
            message: 'Please update today\'s attendance',
            priority: 'low',
            type: 'attendance',
            timestamp: new Date().toISOString()
          }
        ]);

        // Set mock indiscipline cases
        setIndisciplineCases([
          { 
            id: 1, 
            student: 'Alice Smith', 
            issue: 'Late submission of assignment', 
            status: 'pending',
            date: new Date().toISOString()
          },
          { 
            id: 2, 
            student: 'Bob Johnson', 
            issue: 'Missing homework', 
            status: 'resolved',
            date: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: 3,
            student: 'Carol Williams',
            issue: 'Disruptive behavior in class',
            status: 'in-progress',
            date: new Date(Date.now() - 172800000).toISOString()
          }
        ]);
        
        // Load saved draft if exists
        loadDraft();
      } catch (error) {
        console.error('Error fetching teacher data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Load draft from localStorage
  const loadDraft = () => {
    const savedDraft = localStorage.getItem(STORAGE_KEY);
    if (savedDraft) {
      try {
        const { data, timestamp } = JSON.parse(savedDraft);
        const expiryTime = timestamp + (EXPIRY_HOURS * 60 * 60 * 1000);
        
        if (Date.now() < expiryTime) {
          setExamDetails(data.examDetails || { examName: '', term: null, year: null });
          setGrades(data.grades || {});
          setSelectedSubjects(data.selectedSubjects || []);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  };

  // Clear form data
  const clearForm = () => {
    setExamDetails({ examName: '', term: null, year: null });
    setGrades({});
    setSelectedSubjects([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Function to submit grades
  const submitGrades = async (examId) => {
    try {
      // Transform grades into simplified format
      const gradesData = {
        examId,
        grades: Object.entries(grades).map(([studentId, studentGrades]) => ({
          student_id: studentId,
          subject_scores: studentGrades
        }))
      };

      const response = await gradeService.submitGrades(gradesData);
      
      if (response.success) {
        // Clear form after successful submission
        setGrades({});
        setExamDetails({ examName: '', term: null, year: null });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error submitting grades:', error);
      return false;
    }
  };

  // Function to load existing grades
  const loadGrades = async (examId) => {
    try {
      const response = await gradeService.getExamGrades(examId);
      if (response.success) {
        // Transform JSONB data back to our state format
        const gradesMap = {};
        response.data.forEach(grade => {
          gradesMap[grade.student_id] = grade.subject_scores;
        });
        setGrades(gradesMap);
      }
    } catch (error) {
      console.error('Error loading grades:', error);
    }
  };

  const value = {
    teacherData,
    classData,
    students,
    subjects,
    performanceData,
    notifications,
    indisciplineCases,
    loading,
    examDetails,
    setExamDetails,
    grades,
    setGrades,
    selectedSubjects,
    setSelectedSubjects,
    clearForm,
    submitGrades,
    loadGrades
  };

  return (
    <TeacherContext.Provider value={value}>
      {children}
    </TeacherContext.Provider>
  );
};

TeacherProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default TeacherContext;
