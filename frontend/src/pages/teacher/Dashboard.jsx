import React from 'react';
import { Row, Col } from 'antd';
import { useTheme } from '@/contexts/ThemeContext';
import ClassStudents from '@/components/dashboards/teacher/ClassStudents';
import NotificationsCard from '@/components/dashboards/teacher/NotificationsCard';
import IndisciplineCases from '@/components/dashboards/teacher/IndisciplineCases';
import ClassPerformance from '@/components/dashboards/teacher/ClassPerformance';

const TeacherDashboard = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`p-4 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <ClassPerformance />
        </Col>
        <Col xs={24} lg={8}>
          <NotificationsCard />
        </Col>
        <Col xs={24} lg={12}>
          <ClassStudents />
        </Col>
        <Col xs={24} lg={12}>
          <IndisciplineCases />
        </Col>
      </Row>
    </div>
  );
};

export default TeacherDashboard;
