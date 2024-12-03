import React from 'react';
import { Card, Row, Col, Statistic, Typography, Progress } from 'antd';
import { 
  UserOutlined, 
  TeamOutlined, 
  BookOutlined, 
  TrophyOutlined,
  RiseOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useTheme } from '../../../../../contexts/ThemeContext';

const { Title, Text } = Typography;

const StatCard = ({ title, value, icon, trend, color, isDarkMode }) => {
  const Icon = icon;
  return (
    <Card
      className={`
        h-full border transition-all duration-200 hover:shadow-md
        ${isDarkMode 
          ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
          : 'bg-white border-gray-100 hover:border-gray-200'
        }
      `}
    >
      <div className="flex items-start justify-between">
        <div>
          <Text 
            className={`
              block mb-1 text-sm font-medium
              ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}
            `}
          >
            {title}
          </Text>
          <Title 
            level={3} 
            className={`
              mb-0 
              ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}
            `}
          >
            {value}
          </Title>
          {trend && (
            <Text 
              className={`
                text-sm mt-1
                ${trend >= 0 
                  ? (isDarkMode ? 'text-green-400' : 'text-green-600')
                  : (isDarkMode ? 'text-red-400' : 'text-red-600')
                }
              `}
            >
              <RiseOutlined className={trend >= 0 ? '' : 'rotate-180'} /> {Math.abs(trend)}% vs last month
            </Text>
          )}
        </div>
        <div 
          className={`
            w-12 h-12 rounded-lg flex items-center justify-center
            ${color === 'blue' && (isDarkMode ? 'bg-blue-400/10' : 'bg-blue-50')}
            ${color === 'green' && (isDarkMode ? 'bg-green-400/10' : 'bg-green-50')}
            ${color === 'purple' && (isDarkMode ? 'bg-purple-400/10' : 'bg-purple-50')}
            ${color === 'orange' && (isDarkMode ? 'bg-orange-400/10' : 'bg-orange-50')}
          `}
        >
          <Icon 
            className={`
              text-2xl
              ${color === 'blue' && (isDarkMode ? 'text-blue-400' : 'text-blue-500')}
              ${color === 'green' && (isDarkMode ? 'text-green-400' : 'text-green-500')}
              ${color === 'purple' && (isDarkMode ? 'text-purple-400' : 'text-purple-500')}
              ${color === 'orange' && (isDarkMode ? 'text-orange-400' : 'text-orange-500')}
            `}
          />
        </div>
      </div>
    </Card>
  );
};

const ProgressCard = ({ title, value, target, color, isDarkMode }) => (
  <Card
    className={`
      h-full border transition-all duration-200 hover:shadow-md
      ${isDarkMode 
        ? 'bg-gray-800 border-gray-700 hover:border-gray-600' 
        : 'bg-white border-gray-100 hover:border-gray-200'
      }
    `}
  >
    <div className="flex flex-col">
      <Text 
        className={`
          block mb-1 text-sm font-medium
          ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}
        `}
      >
        {title}
      </Text>
      <div className="flex items-baseline gap-2 mb-2">
        <Title 
          level={3} 
          className={`
            mb-0
            ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}
          `}
        >
          {value}%
        </Title>
        <Text 
          className={`
            text-sm
            ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}
          `}
        >
          of {target}
        </Text>
      </div>
      <Progress 
        percent={value} 
        showInfo={false}
        strokeColor={
          isDarkMode 
            ? {
                '0%': `var(--ant-${color}-4)`,
                '100%': `var(--ant-${color}-6)`
              }
            : {
                '0%': `var(--ant-${color}-5)`,
                '100%': `var(--ant-${color}-7)`
              }
        }
        trailColor={isDarkMode ? '#374151' : '#f3f4f6'}
      />
    </div>
  </Card>
);

const SchoolOverview = ({ schoolStats }) => {
  const { isDarkMode } = useTheme();
  
  const stats = {
    totalStudents: schoolStats.totalStudents,
    totalTeachers: schoolStats.totalTeachers,
    totalClasses: schoolStats.totalClasses,
    averageGrade: schoolStats.averageGrade,
    attendanceRate: schoolStats.attendanceRate,
    disciplineRate: schoolStats.disciplineRate,
  };

  return (
    <div className="space-y-6">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            icon={UserOutlined}
            trend={5.2}
            color="blue"
            isDarkMode={isDarkMode}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Teachers"
            value={stats.totalTeachers}
            icon={TeamOutlined}
            trend={2.1}
            color="green"
            isDarkMode={isDarkMode}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Total Classes"
            value={stats.totalClasses}
            icon={BookOutlined}
            trend={0}
            color="purple"
            isDarkMode={isDarkMode}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Average Grade"
            value={stats.averageGrade}
            icon={TrophyOutlined}
            trend={1.8}
            color="orange"
            isDarkMode={isDarkMode}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <ProgressCard
            title="Attendance Rate"
            value={stats.attendanceRate}
            target="100% attendance"
            color="blue"
            isDarkMode={isDarkMode}
          />
        </Col>
        <Col xs={24} md={12}>
          <ProgressCard
            title="Discipline Rate"
            value={stats.disciplineRate}
            target="incidents this month"
            color="orange"
            isDarkMode={isDarkMode}
          />
        </Col>
      </Row>
    </div>
  );
};

export default SchoolOverview;
