import React, { useState, useEffect } from 'react';
import { Card, List, Avatar, Badge, Typography, Space, Input } from 'antd';
import { TeamOutlined, SearchOutlined } from '@ant-design/icons';
import { useTheme } from '../../../contexts/ThemeContext';
import axios from '../../../utils/axios';

const { Text } = Typography;

const StudentOverview = () => {
  const { isDarkMode } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await axios.get('/dashboard/students/recent');
        setStudents(response.data);
      } catch (error) {
        console.error('Error fetching students:', error);
      }
    };

    fetchStudents();
  }, []);

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card
      title={
        <Space>
          <TeamOutlined style={{ color: isDarkMode ? '#fff' : undefined }} />
          <Text strong style={{ color: isDarkMode ? '#fff' : undefined }}>
            Recent Students
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
    >
      <Input
        placeholder="Search students..."
        prefix={<SearchOutlined />}
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        style={{ marginBottom: 16 }}
      />
      <List
        dataSource={filteredStudents}
        renderItem={student => (
          <List.Item>
            <List.Item.Meta
              avatar={
                <Avatar 
                  style={{ 
                    backgroundColor: isDarkMode ? '#1668dc' : '#1890ff' 
                  }}
                >
                  {student.name[0]}
                </Avatar>
              }
              title={
                <Text style={{ color: isDarkMode ? '#fff' : undefined }}>
                  {student.name}
                </Text>
              }
              description={
                <Text type="secondary" style={{ color: isDarkMode ? 'rgba(255,255,255,0.65)' : undefined }}>
                  Class {student.class}
                </Text>
              }
            />
            <Badge 
              status={student.status === 'active' ? 'success' : 'default'} 
              text={
                <Text style={{ color: isDarkMode ? '#fff' : undefined }}>
                  {student.status}
                </Text>
              } 
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

export default StudentOverview;
