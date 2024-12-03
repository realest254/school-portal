import React from 'react';
import { Row, Col, Typography } from 'antd';
import { useTheme } from '../../../contexts/ThemeContext';
import ClassStudents from './ClassStudents';
import NotificationsCard from './NotificationsCard';
import IndisciplineCases from './IndisciplineCases';
import ClassPerformance from './ClassPerformance';

const { Title, Text } = Typography;

const Dashboard = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className="p-6">
      {/* Page Title */}
      <div className="mb-6">
        <Title level={2} style={{ margin: 0, color: isDarkMode ? '#fff' : undefined }}>
          Dashboard Overview
        </Title>
        <Text type="secondary" style={{ color: isDarkMode ? 'rgba(255,255,255,0.65)' : undefined }}>
          Welcome back! Here's what's happening with your class.
        </Text>
      </div>

      {/* Dashboard Grid */}
      <Row gutter={[24, 24]}>
        {/* Left Column */}
        <Col xs={24} lg={12}>
          <div className="space-y-6">
            <ClassStudents />
            <ClassPerformance />
          </div>
        </Col>

        {/* Right Column */}
        <Col xs={24} lg={12}>
          <div className="space-y-6">
            <NotificationsCard />
            <IndisciplineCases />
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
