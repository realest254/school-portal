import React from 'react';
import { Line, Pie } from '@ant-design/plots';
import { Card, Row, Col } from 'antd';

const PerformanceCharts = ({ filters, isDarkMode }) => {
  // Sample data - Replace with actual data from your backend
  const trendData = [
    { term: 'Term 1 Exam 1', average: 72 },
    { term: 'Term 1 Exam 2', average: 75 },
    { term: 'Term 1 Exam 3', average: 78 },
    { term: 'Term 2 Exam 1', average: 76 },
    { term: 'Term 2 Exam 2', average: 80 },
    { term: 'Term 2 Exam 3', average: 82 },
  ];

  const distributionData = [
    { range: '90-100', count: 15 },
    { range: '80-89', count: 25 },
    { range: '70-79', count: 35 },
    { range: '60-69', count: 20 },
    { range: 'Below 60', count: 5 },
  ];

  const trendConfig = {
    data: trendData,
    xField: 'term',
    yField: 'average',
    smooth: true,
    color: isDarkMode ? '#60A5FA' : '#3B82F6',
    point: {
      size: 4,
      shape: 'circle',
      style: {
        fill: isDarkMode ? '#60A5FA' : '#3B82F6',
        stroke: isDarkMode ? '#60A5FA' : '#3B82F6',
        lineWidth: 2,
      },
    },
    xAxis: {
      label: {
        style: {
          fill: isDarkMode ? '#FFFFFF' : '#111827',
        },
      },
    },
    yAxis: {
      label: {
        style: {
          fill: isDarkMode ? '#FFFFFF' : '#111827',
        },
      },
    },
  };

  const distributionConfig = {
    data: distributionData,
    angleField: 'count',
    colorField: 'range',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name} {percentage}',
      style: {
        fill: isDarkMode ? '#E5E7EB' : '#111827',
      },
    },
    theme: {
      colors10: isDarkMode 
        ? ['#60A5FA', '#34D399', '#F472B6', '#FBBF24', '#F87171']
        : ['#3B82F6', '#10B981', '#EC4899', '#F59E0B', '#EF4444'],
    },
  };

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Card 
          title={
            <span className={`text-base font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              Performance Trend
            </span>
          }
          className={`shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        >
          <Line {...trendConfig} />
        </Card>
      </Col>
      <Col span={24}>
        <Card 
          title={
            <span className={`text-base font-medium ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
              Grade Distribution
            </span>
          }
          className={`shadow-sm ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}
        >
          <div style={{ height: '400px' }}>
            <Pie {...distributionConfig} />
          </div>
        </Card>
      </Col>
    </Row>
  );
};

export default PerformanceCharts;
