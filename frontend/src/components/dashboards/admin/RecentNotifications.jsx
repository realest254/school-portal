import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Typography, Space } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useTheme } from '../../../contexts/ThemeContext';
import axios from '../../../utils/axios';

const { Text } = Typography;

const RecentNotifications = () => {
  const { isDarkMode } = useTheme();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get('/dashboard/notifications/recent');
        setNotifications(response.data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, []);

  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return isDarkMode ? '#cf1322' : '#f5222d';
      case 'medium':
        return isDarkMode ? '#d4b106' : '#faad14';
      case 'low':
        return isDarkMode ? '#389e0d' : '#52c41a';
      default:
        return isDarkMode ? '#1668dc' : '#1890ff';
    }
  };

  return (
    <Card
      title={
        <Space>
          <BellOutlined style={{ color: isDarkMode ? '#fff' : '#1890ff' }} />
          <Text strong style={{ color: isDarkMode ? '#fff' : '#262626' }}>
            Recent Notifications
          </Text>
        </Space>
      }
      className={isDarkMode ? 'bg-gray-800' : undefined}
      style={{
        boxShadow: isDarkMode ? undefined : '0 2px 8px rgba(0,0,0,0.05)',
        borderRadius: '8px'
      }}
    >
      <List
        dataSource={notifications}
        renderItem={notification => (
          <List.Item
            style={{
              padding: '12px 0',
              borderBottom: `1px solid ${isDarkMode ? '#333' : '#f0f0f0'}`
            }}
            extra={
              <Tag color={getPriorityColor(notification.priority)}>
                {notification.priority.toUpperCase()}
              </Tag>
            }
          >
            <List.Item.Meta
              title={
                <Text 
                  strong
                  style={{ 
                    color: isDarkMode ? '#fff' : '#262626',
                    fontSize: '14px'
                  }}
                >
                  {notification.title}
                </Text>
              }
              description={
                <Text 
                  type="secondary" 
                  style={{ 
                    color: isDarkMode ? 'rgba(255,255,255,0.65)' : '#595959',
                    fontSize: '13px'
                  }}
                >
                  {notification.message}
                </Text>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

export default RecentNotifications;
