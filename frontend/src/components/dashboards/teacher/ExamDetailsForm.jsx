import React from 'react';
import { Form, Input, Select, Space } from 'antd';
import { useTeacher } from '../../../contexts/TeacherContext';
import { useTheme } from '../../../contexts/ThemeContext';

const { Option } = Select;

const ExamDetailsForm = () => {
  const { isDarkMode } = useTheme();
  const { examDetails, setExamDetails, loading } = useTeacher();
  
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: 5 }, 
    (_, i) => currentYear + i
  );

  const selectStyle = {
    background: isDarkMode ? '#374151' : '#fff',
    color: isDarkMode ? '#fff' : 'inherit',
    borderColor: isDarkMode ? '#4B5563' : undefined
  };

  const labelStyle = {
    color: isDarkMode ? '#fff' : 'inherit'
  };

  const handleFieldChange = (field, value) => {
    setExamDetails({
      ...examDetails,
      [field]: value
    });
  };

  return (
    <Space className="w-full mb-6" size="large">
      <Form.Item 
        label={<span style={labelStyle}>Term</span>}
        className="mb-0"
      >
        <Select
          className="w-32"
          value={examDetails.term}
          onChange={(value) => handleFieldChange('term', value)}
          disabled={loading}
          style={selectStyle}
          dropdownStyle={{ 
            background: isDarkMode ? '#374151' : '#fff',
          }}
        >
          <Option value={1}>Term 1</Option>
          <Option value={2}>Term 2</Option>
          <Option value={3}>Term 3</Option>
        </Select>
      </Form.Item>

      <Form.Item 
        label={<span style={labelStyle}>Year</span>}
        className="mb-0"
      >
        <Select
          className="w-32"
          value={examDetails.year}
          onChange={(value) => handleFieldChange('year', value)}
          disabled={loading}
          style={selectStyle}
          dropdownStyle={{ 
            background: isDarkMode ? '#374151' : '#fff',
          }}
        >
          {years.map(year => (
            <Option key={year} value={year}>{year}</Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item 
        label={<span style={labelStyle}>Exam Name</span>}
        className="mb-0 flex-1"
      >
        <Input
          value={examDetails.examName}
          onChange={(e) => handleFieldChange('examName', e.target.value)}
          placeholder="Enter exam name"
          disabled={loading}
          style={{
            background: isDarkMode ? '#374151' : '#fff',
            color: isDarkMode ? '#fff' : 'inherit',
            borderColor: isDarkMode ? '#4B5563' : undefined
          }}
        />
      </Form.Item>
    </Space>
  );
};

export default ExamDetailsForm;
