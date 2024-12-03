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

const { Text } = Typography;

const NotificationsCard = () => {
  const { isDarkMode } = useTheme();

  // Mock data - replace with actual API call
  const notifications = [
    {
      id: 1,
      title: 'Assignment Submission',
      message: 'John Doe submitted Math homework',
      time: '2 minutes ago',
      type: 'assignment'
    },
    {
      id: 2,
      title: 'Absence Report',
      message: 'Jane Smith was marked absent today',
      time: '1 hour ago',
      type: 'attendance'
    },
    {
      id: 3,
      title: 'Parent Meeting',
      message: 'Upcoming meeting with Mike\'s parents',
      time: '2 hours ago',
      type: 'meeting'
    },
  ];

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
      bodyStyle={{ padding: '0' }}
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
