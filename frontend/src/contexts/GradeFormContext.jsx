import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const GradeFormContext = createContext();

export const useGradeForm = () => {
  const context = useContext(GradeFormContext);
  if (!context) {
    throw new Error('useGradeForm must be used within a GradeFormProvider');
  }
  return context;
};

const STORAGE_KEY = 'gradeFormDraft';
const EXPIRY_HOURS = 24;

export const GradeFormProvider = ({ children }) => {
  const [examDetails, setExamDetails] = useState({ examName: '', term: null, year: null });
  const [grades, setGrades] = useState({});
  const [selectedSubjects, setSelectedSubjects] = useState([]);

  // Load draft from localStorage on mount
  useEffect(() => {
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
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    };

    loadDraft();
  }, []);

  // Save draft to localStorage whenever form data changes
  useEffect(() => {
    const saveDraft = () => {
      const draft = {
        data: {
          examDetails,
          grades,
          selectedSubjects
        },
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    };

    saveDraft();
  }, [examDetails, grades, selectedSubjects]);

  const clearForm = () => {
    setExamDetails({ examName: '', term: null, year: null });
    setGrades({});
    setSelectedSubjects([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <GradeFormContext.Provider value={{
      examDetails,
      setExamDetails,
      grades,
      setGrades,
      selectedSubjects,
      setSelectedSubjects,
      clearForm
    }}>
      {children}
    </GradeFormContext.Provider>
  );
};

GradeFormProvider.propTypes = {
  children: PropTypes.node.isRequired
};
