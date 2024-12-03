import React, { useState } from 'react';
import { Card, Input, List, Avatar, Badge, Typography, Space } from 'antd';
import { UserOutlined, SearchOutlined } from '@ant-design/icons';
import { useTheme } from '../../../../../contexts/ThemeContext';

const { Text, Title } = Typography;

const ClassStudents = () => {
  const { isDarkMode } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mock data - replace with actual API call
  const students = [
    { id: 1, name: 'John Doe', class: '4A', attendance: 'present' },
    { id: 2, name: 'Jane Smith', class: '4A', attendance: 'absent' },
    { id: 3, name: 'Mike Johnson', class: '4A', attendance: 'present' },
    { id: 4, name: 'Sarah Williams', class: '4A', attendance: 'late' },
  ];

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAttendanceStatus = (status) => {
    switch (status) {
      case 'present':
        return { status: 'success', text: 'Present' };
      case 'absent':
        return { status: 'error', text: 'Absent' };
      case 'late':
        return { status: 'warning', text: 'Late' };
      default:
        return { status: 'default', text: status };
    }
  };

  return (
    <Card
      title={
        <Space>
          <UserOutlined style={{ color: isDarkMode ? '#fff' : undefined }} />
          <Text strong style={{ color: isDarkMode ? '#fff' : undefined }}>
            Class Students
          </Text>
          <Badge 
            count={students.length} 
            style={{ 
              backgroundColor: isDarkMode ? '#1668dc' : '#1890ff',
              marginLeft: '8px' 
            }} 
          />
        </Space>
      }
      className={isDarkMode ? 'bg-gray-800' : undefined}
      bodyStyle={{ padding: '0' }}
    >
      <div className="px-4 py-2">
        <Input
          placeholder="Search students..."
          prefix={<SearchOutlined style={{ color: isDarkMode ? '#6b7280' : undefined }} />}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={isDarkMode ? 'bg-gray-700 border-gray-600' : undefined}
          style={{ 
            backgroundColor: isDarkMode ? '#374151' : undefined,
            borderColor: isDarkMode ? '#4b5563' : undefined,
            color: isDarkMode ? '#fff' : undefined
          }}
        />
      </div>

      <List
        dataSource={filteredStudents}
        renderItem={(student) => {
          const attendance = getAttendanceStatus(student.attendance);
          return (
            <List.Item
              className={`px-4 ${isDarkMode ? 'border-gray-700' : undefined}`}
            >
              <List.Item.Meta
                avatar={
                  <Avatar 
                    icon={<UserOutlined />}
                    style={{ 
                      backgroundColor: isDarkMode ? '#1668dc' : '#1890ff' 
                    }}
                  />
                }
                title={
                  <Text strong style={{ color: isDarkMode ? '#fff' : undefined }}>
                    {student.name}
                  </Text>
                }
                description={
                  <Text type="secondary" style={{ color: isDarkMode ? 'rgba(255,255,255,0.45)' : undefined }}>
                    Class {student.class}
                  </Text>
                }
              />
              <Badge 
                status={attendance.status} 
                text={
                  <Text style={{ color: isDarkMode ? '#fff' : undefined }}>
                    {attendance.text}
                  </Text>
                } 
              />
            </List.Item>
          );
        }}
      />
    </Card>
  );
};

export default ClassStudents;
