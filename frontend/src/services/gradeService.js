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

  // Submit grades with optimized structure
  submitGrades: async (gradesData) => {
    // First create exam record
    const examPayload = {
      name: gradesData.examDetails.examName,
      term: gradesData.examDetails.term,
      year: gradesData.examDetails.year,
      class_id: gradesData.classId
    };

    if (USE_MOCK) {
      console.log('Mock Create Exam:', examPayload);
      const mockExamId = 'exam-' + Date.now();

      // Transform grades with exam reference
      const transformedGrades = [];
      Object.entries(gradesData.grades).forEach(([studentId, studentGrades]) => {
        Object.entries(studentGrades).forEach(([subjectId, score]) => {
          transformedGrades.push({
            exam_id: mockExamId,
            student_id: studentId,
            subject_id: subjectId,
            score: parseFloat(score)
          });
        });
      });

      console.log('Mock Submit Grades:', transformedGrades);
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { 
        success: true,
        examId: mockExamId,
        gradesSubmitted: transformedGrades.length 
      };
    }

    try {
      // Create exam first
      const examResponse = await axios.post('/api/exams', examPayload);
      const examId = examResponse.data.id;

      // Transform grades with exam reference
      const transformedGrades = [];
      Object.entries(gradesData.grades).forEach(([studentId, studentGrades]) => {
        Object.entries(studentGrades).forEach(([subjectId, score]) => {
          transformedGrades.push({
            exam_id: examId,
            student_id: studentId,
            subject_id: subjectId,
            score: parseFloat(score)
          });
        });
      });

      // Submit grades in batches of 500
      const batchSize = 500;
      const batches = [];
      for (let i = 0; i < transformedGrades.length; i += batchSize) {
        batches.push(transformedGrades.slice(i, i + batchSize));
      }

      // Submit all batches
      const results = await Promise.all(
        batches.map(batch => axios.post('/api/grades/batch', batch))
      );

      return {
        success: true,
        examId,
        gradesSubmitted: transformedGrades.length
      };
    } catch (error) {
      console.error('Error submitting grades:', error);
      throw error;
    }
  },

  // Get grade statistics with optimized queries
  getGradeStatistics: async (examId) => {
    if (USE_MOCK) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock statistics
      const mockStats = {
        examDetails: {
          id: examId,
          name: "Mid-Term Exam",
          term: 2,
          year: 2024,
          class_name: "Form 1A"
        },
        classAverage: 72.5,
        highestScore: 98,
        lowestScore: 45,
        studentRankings: mockStudents.data.map((student, index) => ({
          ...student,
          total_score: 350 - (index * 20),
          average_score: 70 - (index * 4),
          rank: index + 1,
          subject_scores: mockSubjects.data.reduce((acc, subject) => ({
            ...acc,
            [subject.id]: Math.max(45, Math.floor(85 - (index * 5) + (Math.random() * 10)))
          }), {})
        })),
        subjectStatistics: mockSubjects.data.map(subject => ({
          subject_id: subject.id,
          subject_name: subject.name,
          average: 70 + (Math.random() * 10),
          highest: 95 + (Math.random() * 5),
          lowest: 45 + (Math.random() * 10),
          passes: 4,
          fails: 1
        }))
      };
      
      return { data: mockStats };
    }
    return axios.get(`/api/exams/${examId}/statistics`);
  }
};
