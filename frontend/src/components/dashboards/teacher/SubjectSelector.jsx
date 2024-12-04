import React from 'react';
import { Select, Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTeacher } from '../../../contexts/TeacherContext';
import { useTheme } from '../../../contexts/ThemeContext';
import PropTypes from 'prop-types';

const SubjectSelector = ({ availableSubjects }) => {
  const { isDarkMode } = useTheme();
  const { selectedSubjects, setSelectedSubjects, loading } = useTeacher();

  // Filter out already selected subjects
  const filteredSubjects = availableSubjects.filter(
    subject => !selectedSubjects.find(s => s.id === subject.id)
  );

  const handleAddSubject = (subjectId) => {
    setSelectedSubjects([...selectedSubjects, subjectId]);
  };

  const selectStyle = {
    background: isDarkMode ? '#374151' : '#fff',
    color: isDarkMode ? '#fff' : 'inherit',
    borderColor: isDarkMode ? '#4B5563' : undefined
  };

  return (
    <Space className="w-full mb-4">
      <Select
        placeholder="Add a subject column"
        className="min-w-[200px]"
        loading={loading}
        disabled={loading || filteredSubjects.length === 0}
        onChange={handleAddSubject}
        style={selectStyle}
        dropdownStyle={{ 
          background: isDarkMode ? '#374151' : '#fff',
        }}
      >
        {filteredSubjects.map(subject => (
          <Select.Option 
            key={subject.id} 
            value={subject.id}
            style={{
              color: isDarkMode ? '#fff' : 'inherit'
            }}
          >
            {subject.name}
          </Select.Option>
        ))}
      </Select>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        disabled={loading || filteredSubjects.length === 0}
      >
        Add Subject
      </Button>
    </Space>
  );
};

SubjectSelector.propTypes = {
  availableSubjects: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  })).isRequired
};

export default SubjectSelector;
