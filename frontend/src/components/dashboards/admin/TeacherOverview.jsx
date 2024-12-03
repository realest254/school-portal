import React, { useState, useEffect } from 'react';
import { Card, List, Avatar, Badge, Typography, Space, Input } from 'antd';
import { UserOutlined, SearchOutlined } from '@ant-design/icons';
import { useTheme } from '../../../contexts/ThemeContext';
import axios from '../../../utils/axios';

const { Text } = Typography;

const TeacherOverview = () => {
  const { isDarkMode } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await axios.get('/dashboard/teachers/recent');
        setTeachers(response.data);
      } catch (error) {
        console.error('Error fetching teachers:', error);
      }
    };

    fetchTeachers();
  }, []);

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card
      title={
        <Space>
          <UserOutlined style={{ color: isDarkMode ? '#fff' : undefined }} />
          <Text strong style={{ color: isDarkMode ? '#fff' : undefined }}>
            Recent Teachers
          </Text>
          <Badge 
            count={teachers.length} 
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
        placeholder="Search teachers..."
        prefix={<SearchOutlined />}
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        style={{ marginBottom: 16 }}
      />
      <List
        dataSource={filteredTeachers}
        renderItem={teacher => (
          <List.Item>
            <List.Item.Meta
              avatar={
                <Avatar 
                  style={{ 
                    backgroundColor: isDarkMode ? '#1668dc' : '#1890ff' 
                  }}
                >
                  {teacher.name[0]}
                </Avatar>
              }
              title={
                <Text style={{ color: isDarkMode ? '#fff' : undefined }}>
                  {teacher.name}
                </Text>
              }
              description={
                <Text type="secondary" style={{ color: isDarkMode ? 'rgba(255,255,255,0.65)' : undefined }}>
                  {teacher.department}
                </Text>
              }
            />
            <Badge 
              status={teacher.status === 'active' ? 'success' : 'default'} 
              text={
                <Text style={{ color: isDarkMode ? '#fff' : undefined }}>
                  {teacher.status}
                </Text>
              } 
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

export default TeacherOverview;
