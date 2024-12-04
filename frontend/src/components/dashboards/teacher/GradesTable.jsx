import React, { useState } from 'react';
import { Table, Input, Button, Space, Tooltip } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useTeacher } from '../../../contexts/TeacherContext';
import { useTheme } from '../../../contexts/ThemeContext';

const GradesTable = () => {
  const { isDarkMode } = useTheme();
  const { 
    students, 
    selectedSubjects,
    grades,
    setGrades,
    setSelectedSubjects,
    loading,
    subjects 
  } = useTeacher();
  
  // Keep track of all input values
  const [inputValues, setInputValues] = useState({});

  if (!students || !selectedSubjects || !grades || !setGrades || !setSelectedSubjects) {
    return null; // or return a loading state
  }

  // Validate grade input
  const validateGrade = (value) => {
    if (value === '') return true;
    const num = parseFloat(value);
    return !isNaN(num) && num >= 0 && num <= 100;
  };

  // Handle grade input change
  const handleGradeChange = (studentId, subjectId, value) => {
    // Update input value immediately for responsive UI
    setInputValues(prev => ({
      ...prev,
      [`${studentId}-${subjectId}`]: value
    }));

    // Only update parent state if valid
    if (validateGrade(value)) {
      const updatedGrades = {
        ...grades,
        [studentId]: {
          ...grades[studentId],
          [subjectId]: value
        }
      };
      setGrades(updatedGrades);
    }
  };

  // Handle removing a subject column
  const handleRemoveSubject = (subjectId) => {
    // Remove subject from selected subjects
    setSelectedSubjects(selectedSubjects.filter(s => s !== subjectId));
    
    // Remove grades for this subject
    const updatedGrades = { ...grades };
    Object.keys(updatedGrades).forEach(studentId => {
      const { [subjectId]: removed, ...rest } = updatedGrades[studentId];
      updatedGrades[studentId] = rest;
    });
    setGrades(updatedGrades);
  };

  // Define base columns (these are always present)
  const baseColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 200,
      className: isDarkMode ? 'bg-gray-800 text-white' : 'bg-white',
    },
    {
      title: 'Admission No.',
      dataIndex: 'admission_number',
      key: 'admission_number',
      fixed: 'left',
      width: 150,
      className: isDarkMode ? 'bg-gray-800 text-white' : 'bg-white',
    },
    {
      title: 'Class',
      dataIndex: 'class_name',
      key: 'class_name',
      fixed: 'left',
      width: 120,
      className: isDarkMode ? 'bg-gray-800 text-white' : 'bg-white',
    }
  ];

  // Generate columns for selected subjects
  const subjectColumns = selectedSubjects.map(subjectId => {
    const subject = subjects.find(s => s.id === subjectId);
    return {
      title: (
        <Space>
          {subject?.name || 'Subject'}
          <Tooltip title="Remove subject">
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => handleRemoveSubject(subjectId)}
              size="small"
              danger
              className={isDarkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-600 hover:text-red-600'}
            />
          </Tooltip>
        </Space>
      ),
      dataIndex: subjectId,
      key: subjectId,
      width: 150,
      render: (_, record) => (
        <Input
          value={inputValues[`${record.key}-${subjectId}`] ?? grades[record.key]?.[subjectId] ?? ''}
          onChange={(e) => handleGradeChange(record.key, subjectId, e.target.value)}
          onBlur={() => handleBlur(record.key, subjectId)}
          onPressEnter={() => handleBlur(record.key, subjectId)}
          style={{ background: isDarkMode ? '#374151' : '#fff', color: isDarkMode ? '#fff' : 'inherit', borderColor: isDarkMode ? '#4B5563' : '#f0f0f0' }}
          className="grade-input"
          placeholder="Enter grade"
        />
      )
    };
  });

  // Combine base columns with subject columns
  const columns = [...baseColumns, ...subjectColumns];

  // Transform students data for the table
  const tableData = students.map(student => ({
    key: student.id,
    ...student,
    ...subjects.reduce((acc, subject) => ({
      ...acc,
      [subject.id]: grades[student.id]?.[subject.id] || ''
    }), {})
  }));

  const handleBlur = (studentId, subjectId) => {
    const value = inputValues[`${studentId}-${subjectId}`];
    if (!validateGrade(value)) {
      // Reset invalid input to last valid value
      setInputValues(prev => ({
        ...prev,
        [`${studentId}-${subjectId}`]: grades[studentId]?.[subjectId] || ''
      }));
    }
  };

  const tableStyle = {
    background: isDarkMode ? '#1f2937' : '#fff',
  };

  return (
    <Table
      columns={columns}
      dataSource={tableData}
      loading={loading}
      scroll={{ x: 'max-content' }}
      pagination={false}
      style={tableStyle}
      className="border border-gray-200 dark:border-gray-700 grades-table"
    />
  );
};

export default GradesTable;
