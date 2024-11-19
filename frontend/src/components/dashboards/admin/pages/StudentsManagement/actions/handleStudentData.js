//import axios from 'axios';

export const validateEmail = (email) => {
    // Simplified email validation regex
    const emailRegex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    return emailRegex.test(email);
};

export const validatePhone = (phone) => {
    // Simplified phone number validation (10 digits)
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
};

export const addStudent = (students, newStudent) => {
    return [...students, newStudent];
};

export const updateStudent = (students, updatedStudent) => {
    return students.map((student) =>
        student.admissionNumber === updatedStudent.admissionNumber
            ? updatedStudent
            : student
    );
};

export const deleteStudent = (students, student) => {
    return students.filter(
        (s) => s.admissionNumber !== student.admissionNumber
    );
};

// Axios API calls (commented out for future use)
/*
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';

// Add student with API
export const addStudentAPI = async (student) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/students`, student);
        return response.data;
    } catch (error) {
        console.error('Error adding student:', error);
        throw error;
    }
};

// Update student with API
export const updateStudentAPI = async (updatedStudent) => {
    try {
        const response = await axios.put(
            `${API_BASE_URL}/students/${updatedStudent.admissionNumber}`,
            updatedStudent
        );
        return response.data;
    } catch (error) {
        console.error('Error updating student:', error);
        throw error;
    }
};

// Delete student with API
export const deleteStudentAPI = async (admissionNumber) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/students/${admissionNumber}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting student:', error);
        throw error;
    }
};

// Get all students
export const getStudentsAPI = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/students`);
        return response.data;
    } catch (error) {
        console.error('Error fetching students:', error);
        throw error;
    }
};

// Get single student by admission number
export const getStudentAPI = async (admissionNumber) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/students/${admissionNumber}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching student:', error);
        throw error;
    }
};

export const searchStudentsAPI = async (searchParams) => {
  try {
    const response = await axios.get(
      `${process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api'}/students/search`,
      {
        params: searchParams, // Query parameters
      }
    );
    return response.data; // Return filtered students
  } catch (error) {
    console.error('Error fetching students:', error);
    return []; // Return an empty array on error
  }
};
*/