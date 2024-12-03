import React from 'react';
import { Row, Col, Typography } from 'antd';
import { useTheme } from '../../contexts/ThemeContext';
import SchoolOverview from '../../components/dashboards/admin/SchoolOverview';
import PerformanceChart from '../../components/dashboards/admin/PerformanceChart';
import RecentNotifications from '../../components/dashboards/admin/RecentNotifications';

const { Title, Text } = Typography;

const Overview = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className="p-6">
      {/* Page Title */}
      <div className="mb-6">
        <Title level={2} style={{ margin: 0, color: isDarkMode ? '#fff' : undefined }}>
          Admin Dashboard
        </Title>
        <Text type="secondary" style={{ color: isDarkMode ? 'rgba(255,255,255,0.65)' : undefined }}>
          Welcome back! Here's an overview of your school.
        </Text>
      </div>

      {/* Stats Overview */}
      <div className="mb-6">
        <SchoolOverview />
      </div>

      {/* Performance Chart and Notifications */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <PerformanceChart />
        </Col>
        <Col xs={24} lg={8}>
          <RecentNotifications />
        </Col>
      </Row>
    </div>
  );
};

export default Overview;
