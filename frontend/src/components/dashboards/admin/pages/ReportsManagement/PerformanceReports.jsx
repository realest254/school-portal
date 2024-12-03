import React, { useState, useEffect } from 'react';
import { Typography, Spin, Alert, Card, Tabs } from 'antd';
import { LineChartOutlined, UserOutlined, TeamOutlined, BookOutlined } from '@ant-design/icons';
import { useTheme } from '../../../../../contexts/ThemeContext';
import ReportsFilters from './ReportsFilters';
import PerformanceCharts from './PerformanceCharts';
import StudentStats from './StudentStats';
import TeacherStats from './TeacherStats';
import ClassStats from './ClassStats';

const { Title } = Typography;

const PerformanceReports = () => {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    overallPerformance: [],
    subjectPerformance: [],
    classDistribution: [],
    studentStats: {},
    teacherStats: {},
    classStats: {},
  });
  const [filters, setFilters] = useState({});

  useEffect(() => {
    fetchReportData();
  }, [filters]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Replace with actual API call
      const response = await new Promise(resolve => 
        setTimeout(() => resolve({
          overallPerformance: [
            { term: 'Term 1', score: 75 },
            { term: 'Term 2', score: 78 },
            { term: 'Term 3', score: 82 },
            { term: 'Term 4', score: 85 },
          ],
          subjectPerformance: [
            { subject: 'Mathematics', score: 82 },
            { subject: 'English', score: 78 },
            { subject: 'Science', score: 85 },
            { subject: 'History', score: 76 },
            { subject: 'Geography', score: 80 },
          ],
          classDistribution: [
            { class: 'Form 1', students: 120 },
            { class: 'Form 2', students: 115 },
            { class: 'Form 3', students: 108 },
            { class: 'Form 4', students: 105 },
          ],
          studentStats: {
            topPerformers: [],
            improvementCases: [],
            attentionNeeded: [],
          },
          teacherStats: {
            performanceByTeacher: [],
            classesHandled: [],
            subjectDistribution: [],
          },
          classStats: {
            averagesByClass: [],
            subjectPerformance: [],
            attendanceRates: [],
          },
        }), 1500)
      );

      setData(response);
    } catch (err) {
      setError('Failed to fetch report data. Please try again later.');
      console.error('Error fetching report data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilters(prev => ({
      ...prev,
      [newFilter.type]: newFilter.value
    }));
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting reports with filters:', filters);
  };

  const items = [
    {
      key: 'overview',
      label: (
        <span className="flex items-center gap-2">
          <LineChartOutlined />
          Overview
        </span>
      ),
      children: <PerformanceCharts data={data} />,
    },
    {
      key: 'students',
      label: (
        <span className="flex items-center gap-2">
          <UserOutlined />
          Student Analysis
        </span>
      ),
      children: <StudentStats data={data.studentStats} />,
    },
    {
      key: 'teachers',
      label: (
        <span className="flex items-center gap-2">
          <TeamOutlined />
          Teacher Analysis
        </span>
      ),
      children: <TeacherStats data={data.teacherStats} />,
    },
    {
      key: 'classes',
      label: (
        <span className="flex items-center gap-2">
          <BookOutlined />
          Class Analysis
        </span>
      ),
      children: <ClassStats data={data.classStats} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Title 
          level={4}
          className={isDarkMode ? 'text-gray-100 mb-0' : 'text-gray-800 mb-0'}
        >
          Performance Reports
        </Title>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Comprehensive analysis of academic performance across students, teachers, and classes
        </p>
      </div>

      <ReportsFilters
        onFilterChange={handleFilterChange}
        onExport={handleExport}
        onRefresh={fetchReportData}
        classes={[]}  // TODO: Add actual data
        subjects={[]} // TODO: Add actual data
        teachers={[]} // TODO: Add actual data
      />

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          className="mb-6"
        />
      )}

      <Card
        className={`
          border transition-all duration-200
          ${isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-100'
          }
        `}
      >
        <Tabs
          items={items}
          className={isDarkMode ? 'text-gray-100' : ''}
          animated={{ inkBar: true, tabPane: true }}
        />
      </Card>

      {loading && (
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
          <Spin size="large" />
        </div>
      )}
    </div>
  );
};

export default PerformanceReports;
