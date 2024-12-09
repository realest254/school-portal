import axios from '../utils/axios';
import { mockTeacherData, mockStudents, mockSubjects } from '../mocks/gradeManagementMocks';

const USE_MOCK = true; // Toggle this to switch between mock and real API

export const gradeService = {
  // Get teacher's data including assigned class
  getTeacherData: async () => {
    if (USE_MOCK) {
      return { data: mockTeacherData };
    }
    return axios.get('/api/teachers/me');
  },

  // Get students in a class
  getClassStudents: async (classId) => {
    if (USE_MOCK) {
      return mockStudents;
    }
    return axios.get(`/api/classes/${classId}/students`);
  },

  // Get all subjects
  getAllSubjects: async () => {
    if (USE_MOCK) {
      return mockSubjects;
    }
    return axios.get('/api/subjects');
  },

  // Submit grades with JSONB structure
  submitGrades: async (gradesData) => {
    try {
      // First create the exam
      const examPayload = {
        name: gradesData.examDetails.examName,
        term: gradesData.examDetails.term,
        year: gradesData.examDetails.year,
        classId: gradesData.classId
      };

      // Create exam using exam endpoint
      const examResponse = await axios.post('/api/exams', examPayload);
      const examId = examResponse.data.data.id;

      // Prepare grades data
      const gradesPayload = Object.entries(gradesData.grades).map(([studentId, subjectScores]) => ({
        exam_id: examId,
        student_id: studentId,
        class_id: gradesData.classId,
        subject_scores: subjectScores,
        academic_year: gradesData.examDetails.year
      }));

      // Submit grades using grades endpoint
      const gradesResponse = await axios.post('/api/grades', gradesPayload);

      return {
        success: true,
        examId,
        gradesSubmitted: gradesPayload.length,
        data: gradesResponse.data
      };
    } catch (error) {
      console.error('Error submitting grades:', error);
      throw error;
    }
  },

  // Get grade statistics
  getGradeStatistics: async (examId) => {
    if (USE_MOCK) {
      return {
        data: {
          classAverage: 75.5,
          highestScore: 95,
          lowestScore: 45,
          submissions: 40,
          subjectAverages: {
            'Mathematics': 78.5,
            'English': 72.3,
            'Science': 76.8
          }
        }
      };
    }
    return axios.get(`/api/grades/statistics?examId=${examId}`);
  },

  // Get student's term report
  getStudentTermReport: async (studentId, term, year) => {
    if (USE_MOCK) {
      return {
        data: {
          student: mockStudents.data.find(s => s.id === studentId),
          termAverage: 78.5,
          rank: 5,
          totalStudents: 40,
          subjects: mockSubjects.data.map(sub => ({
            id: sub.id,
            name: sub.name,
            score: Math.floor(Math.random() * 30) + 70
          }))
        }
      };
    }
    return axios.get(`/api/grades/student/${studentId}/term?term=${term}&year=${year}`);
  },

  // Get student's yearly report
  getStudentYearlyReport: async (studentId, year) => {
    if (USE_MOCK) {
      // Mock data for yearly report
      return {
        data: [
          {
            term: 1,
            subjects: {
              Mathematics: { average_score: 87.7, rank: 4, total_students: 40 },
              English: { average_score: 81.7, rank: 7, total_students: 40 },
              Science: { average_score: 92.0, rank: 2, total_students: 40 },
              History: { average_score: 87.3, rank: 4, total_students: 40 },
              Geography: { average_score: 79.7, rank: 8, total_students: 40 }
            },
            term_average: 85.7
          },
          {
            term: 2,
            subjects: {
              Mathematics: { average_score: 89.3, rank: 3, total_students: 40 },
              English: { average_score: 84.0, rank: 5, total_students: 40 },
              Science: { average_score: 93.3, rank: 1, total_students: 40 },
              History: { average_score: 88.7, rank: 3, total_students: 40 },
              Geography: { average_score: 80.7, rank: 7, total_students: 40 }
            },
            term_average: 87.2
          },
          {
            term: 3,
            subjects: {
              Mathematics: { average_score: 91.7, rank: 2, total_students: 40 },
              English: { average_score: 86.3, rank: 4, total_students: 40 },
              Science: { average_score: 94.7, rank: 1, total_students: 40 },
              History: { average_score: 90.3, rank: 2, total_students: 40 },
              Geography: { average_score: 84.0, rank: 5, total_students: 40 }
            },
            term_average: 89.4
          }
        ]
      };
    }
    return axios.get(`/api/grades/student/${studentId}/year?year=${year}`);
  },

  // Get class term report
  getClassTermReport: async (classId, term, year) => {
    if (USE_MOCK) {
      // Mock data for class term report
      return {
        data: [
          {
            exam_name: 'CAT 1',
            students: [
              {
                student_id: 'student-001',
                student_name: 'John Doe',
                admission_number: 'ADM001',
                total_score: 419,
                average_score: 83.8,
                rank: 8,
                subject_scores: {
                  Mathematics: 85,
                  English: 78,
                  Science: 92,
                  History: 88,
                  Geography: 76
                }
              },
              // ... more students
            ]
          },
          // ... more exams
        ]
      };
    }
    return axios.get(`/api/grades/class/${classId}/term?term=${term}&year=${year}`);
  }
};
