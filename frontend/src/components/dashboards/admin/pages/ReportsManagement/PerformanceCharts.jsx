import React from 'react';
import { Card, Row, Col, Typography } from 'antd';
import { Line, Column, Pie } from '@ant-design/plots';
import { useTheme } from '../../../../../contexts/ThemeContext';

const { Title } = Typography;

const PerformanceCharts = ({ data }) => {
  const { isDarkMode } = useTheme();

  // Theme configuration for dark mode
  const theme = {
    defaultColor: isDarkMode ? '#60A5FA' : '#3B82F6',
    background: 'transparent',
    subColor: isDarkMode ? '#FFFFFF' : '#374151',
    semanticRed: '#F87171',
    semanticGreen: '#34D399',
    padding: [20, 20, 20, 20],
    fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
  };

  const commonAxisConfig = {
    grid: {
      line: {
        style: {
          stroke: isDarkMode ? '#4B5563' : '#E5E7EB',
          lineWidth: 1,
          lineDash: [4, 5],
          strokeOpacity: 0.7,
          cursor: 'pointer'
        }
      }
    },
    line: {
      style: {
        stroke: isDarkMode ? '#6B7280' : '#E5E7EB',
      }
    },
    label: {
      style: {
        fill: isDarkMode ? '#D1D5DB' : '#374151',
        fontSize: 12,
      },
    },
    title: {
      style: {
        fill: isDarkMode ? '#F3F4F6' : '#1F2937',
        fontSize: 13,
        fontWeight: 600,
      },
    },
    tickLine: {
      style: {
        stroke: isDarkMode ? '#6B7280' : '#E5E7EB',
      },
    },
    tick: {
      style: {
        fill: isDarkMode ? '#D1D5DB' : '#374151',
      },
    },
  };

  const lineConfig = {
    data: data.overallPerformance,
    xField: 'term',
    yField: 'score',
    smooth: true,
    theme,
    point: {
      size: 5,
      shape: 'diamond',
      style: {
        fill: isDarkMode ? '#60A5FA' : '#3B82F6',
        stroke: isDarkMode ? '#60A5FA' : '#3B82F6',
        lineWidth: 2,
      },
    },
    line: {
      style: {
        stroke: isDarkMode ? '#60A5FA' : '#3B82F6',
        lineWidth: 3,
      },
    },
    xAxis: {
      ...commonAxisConfig,
      title: {
        text: 'Academic Term',
        ...commonAxisConfig.title,
      },
    },
    yAxis: {
      ...commonAxisConfig,
      title: {
        text: 'Average Score',
        ...commonAxisConfig.title,
      },
    },
    tooltip: {
      domStyles: {
        'g2-tooltip': {
          backgroundColor: isDarkMode ? '#374151' : '#FFFFFF',
          color: isDarkMode ? '#F3F4F6' : '#1F2937',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: isDarkMode ? '1px solid #4B5563' : '1px solid #E5E7EB',
          borderRadius: '6px',
          padding: '8px 12px',
        },
      },
    },
  };

  const columnConfig = {
    data: data.subjectPerformance,
    xField: 'subject',
    yField: 'score',
    theme,
    label: {
      position: 'middle',
      style: {
        fill: '#FFFFFF',
        fontSize: 12,
        fontWeight: 500,
        shadowColor: 'rgba(0,0,0,0.2)',
        shadowBlur: 2,
      },
    },
    xAxis: {
      ...commonAxisConfig,
      title: {
        text: 'Subject',
        ...commonAxisConfig.title,
      },
    },
    yAxis: {
      ...commonAxisConfig,
      title: {
        text: 'Average Score',
        ...commonAxisConfig.title,
      },
    },
    columnStyle: {
      fill: isDarkMode ? '#60A5FA' : '#3B82F6',
      radius: [4, 4, 0, 0],
    },
    tooltip: {
      domStyles: {
        'g2-tooltip': {
          backgroundColor: isDarkMode ? '#374151' : '#FFFFFF',
          color: isDarkMode ? '#F3F4F6' : '#1F2937',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: isDarkMode ? '1px solid #4B5563' : '1px solid #E5E7EB',
          borderRadius: '6px',
          padding: '8px 12px',
        },
      },
    },
  };

  const pieConfig = {
    data: data.classDistribution,
    angleField: 'students',
    colorField: 'class',
    theme,
    radius: 0.8,
    innerRadius: 0.64,
    label: {
      type: 'outer',
      content: '{name} ({percentage})',
      style: {
        fill: isDarkMode ? '#D1D5DB' : '#374151',
        fontSize: 12,
        fontWeight: 500,
      },
    },
    legend: {
      layout: 'horizontal',
      position: 'bottom',
      itemName: {
        style: {
          fill: isDarkMode ? '#D1D5DB' : '#374151',
          fontSize: 12,
        },
      },
    },
    statistic: {
      title: {
        style: {
          color: isDarkMode ? '#F3F4F6' : '#1F2937',
          fontSize: '14px',
          lineHeight: '20px',
        },
        content: 'Total',
      },
      content: {
        style: {
          color: isDarkMode ? '#60A5FA' : '#3B82F6',
          fontSize: '24px',
          lineHeight: '32px',
        },
      },
    },
    tooltip: {
      domStyles: {
        'g2-tooltip': {
          backgroundColor: isDarkMode ? '#374151' : '#FFFFFF',
          color: isDarkMode ? '#F3F4F6' : '#1F2937',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: isDarkMode ? '1px solid #4B5563' : '1px solid #E5E7EB',
          borderRadius: '6px',
          padding: '8px 12px',
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card 
            title={
              <Title level={5} className={isDarkMode ? 'text-gray-200 mb-0' : 'mb-0'}>
                Overall Performance Trend
              </Title>
            }
            className={`
              h-full border transition-all duration-200
              ${isDarkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-100'
              }
            `}
            bodyStyle={{ height: 400 }}
          >
            <Line {...lineConfig} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card 
            title={
              <Title level={5} className={isDarkMode ? 'text-gray-200 mb-0' : 'mb-0'}>
                Class Distribution
              </Title>
            }
            className={`
              h-full border transition-all duration-200
              ${isDarkMode 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-100'
              }
            `}
            bodyStyle={{ height: 400 }}
          >
            <Pie {...pieConfig} />
          </Card>
        </Col>
      </Row>

      <Card 
        title={
          <Title level={5} className={isDarkMode ? 'text-gray-200 mb-0' : 'mb-0'}>
            Subject Performance Analysis
          </Title>
        }
        className={`
          border transition-all duration-200
          ${isDarkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-100'
          }
        `}
        bodyStyle={{ height: 400 }}
      >
        <Column {...columnConfig} />
      </Card>
    </div>
  );
};

export default PerformanceCharts;
