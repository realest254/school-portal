import React from 'react';
import { Card, List, Typography, Space, Tag, Button } from 'antd';
import { 
  WarningOutlined,
  UserOutlined,
  ClockCircleOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTeacher } from '../../../contexts/TeacherContext';

const { Text, Paragraph } = Typography;

const IndisciplineCases = () => {
  const { isDarkMode: isDark } = useTheme();
  const { indisciplineCases: cases } = useTeacher();

  const getSeverityTag = (severity) => {
    const config = {
      high: { color: 'error', text: 'High' },
      medium: { color: 'warning', text: 'Medium' },
      low: { color: 'success', text: 'Low' }
    };
    return config[severity] || { color: 'default', text: severity };
  };

  const getStatusTag = (status) => {
    const config = {
      pending: { color: 'processing', text: 'Pending' },
      resolved: { color: 'success', text: 'Resolved' }
    };
    return config[status] || { color: 'default', text: status };
  };

  return (
    <Card
      title={
        <Space>
          <WarningOutlined style={{ color: isDark ? '#fff' : undefined }} />
          <Text strong style={{ color: isDark ? '#fff' : undefined }}>
            Indiscipline Cases
          </Text>
        </Space>
      }
      extra={
        <Button 
          type="link" 
          icon={<RightOutlined />}
          style={{ color: isDark ? '#fff' : undefined }}
        >
          View All
        </Button>
      }
      styles={{
        body: {
          padding: '0 24px 24px'
        }
      }}
      className={isDark ? 'bg-gray-800' : undefined}
    >
      <List
        dataSource={cases}
        renderItem={(case_) => {
          const severityTag = getSeverityTag(case_.severity);
          const statusTag = getStatusTag(case_.status);
          
          return (
            <List.Item
              className={`px-4 ${isDark ? 'border-gray-700' : undefined}`}
            >
              <List.Item.Meta
                avatar={
                  <UserOutlined 
                    style={{ 
                      fontSize: '24px',
                      color: isDark ? '#fff' : undefined 
                    }} 
                  />
                }
                title={
                  <Space>
                    <Text strong style={{ color: isDark ? '#fff' : undefined }}>
                      {case_.student}
                    </Text>
                    <Tag color={severityTag.color}>
                      {severityTag.text} Severity
                    </Tag>
                    <Tag color={statusTag.color}>
                      {statusTag.text}
                    </Tag>
                  </Space>
                }
                description={
                  <Space direction="vertical" size={1}>
                    <Paragraph 
                      style={{ 
                        margin: 0,
                        color: isDark ? 'rgba(255,255,255,0.65)' : undefined 
                      }}
                    >
                      {case_.incident}
                    </Paragraph>
                    <Space>
                      <ClockCircleOutlined style={{ color: isDark ? '#6b7280' : undefined }} />
                      <Text type="secondary" style={{ color: isDark ? 'rgba(255,255,255,0.45)' : undefined }}>
                        {new Date(case_.date).toLocaleDateString()}
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

export default IndisciplineCases;
