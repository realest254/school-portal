import React from 'react';
import { Card, List, Typography, Space, Tag } from 'antd';
import { 
  BellOutlined, 
  ClockCircleOutlined,
  BookOutlined,
  UserOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTeacher } from '../../../contexts/TeacherContext';

const { Text } = Typography;

const NotificationsCard = () => {
  const { isDarkMode } = useTheme();
  const { notifications } = useTeacher();

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'assignment':
        return <BookOutlined style={{ color: '#1890ff' }} />;
      case 'attendance':
        return <UserOutlined style={{ color: '#52c41a' }} />;
      case 'meeting':
        return <TeamOutlined style={{ color: '#722ed1' }} />;
      default:
        return <BellOutlined style={{ color: '#faad14' }} />;
    }
  };

  const getNotificationTag = (type) => {
    const tags = {
      assignment: { color: 'blue', text: 'Assignment' },
      attendance: { color: 'green', text: 'Attendance' },
      meeting: { color: 'purple', text: 'Meeting' }
    };
    return tags[type] || { color: 'orange', text: type };
  };

  return (
    <Card
      title={
        <Space>
          <BellOutlined style={{ color: isDarkMode ? '#fff' : undefined }} />
          <Text strong style={{ color: isDarkMode ? '#fff' : undefined }}>
            Recent Notifications
          </Text>
        </Space>
      }
      className={isDarkMode ? 'bg-gray-800' : undefined}
      styles={{
        body: {
          padding: '0 24px',
          maxHeight: '400px',
          overflowY: 'auto'
        }
      }}
    >
      <List
        dataSource={notifications}
        renderItem={(notification) => {
          const tag = getNotificationTag(notification.type);
          return (
            <List.Item
              className={`px-4 ${isDarkMode ? 'border-gray-700' : undefined}`}
            >
              <List.Item.Meta
                avatar={getNotificationIcon(notification.type)}
                title={
                  <Space>
                    <Text strong style={{ color: isDarkMode ? '#fff' : undefined }}>
                      {notification.title}
                    </Text>
                    <Tag color={tag.color}>{tag.text}</Tag>
                  </Space>
                }
                description={
                  <Space>
                    <Text type="secondary" style={{ color: isDarkMode ? 'rgba(255,255,255,0.45)' : undefined }}>
                      {notification.message}
                    </Text>
                    <Space>
                      <ClockCircleOutlined style={{ color: isDarkMode ? '#6b7280' : undefined }} />
                      <Text type="secondary" style={{ color: isDarkMode ? 'rgba(255,255,255,0.45)' : undefined }}>
                        {notification.time}
                      </Text>
                    </Space>
                  </Space>
                }
              />
            </List.Item>
          );
        }}
      />
    </Card>
  );
};

export default NotificationsCard;
