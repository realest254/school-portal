import React from 'react';
import { Card } from 'antd';
import { Line, Column, Pie } from '@ant-design/plots';
import { useTheme } from '../../../../../contexts/ThemeContext';

const SchoolOverview = ({ schoolStats }) => {
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
          stroke: isDarkMode ? '#6B7280' : '#E5E7EB',
          lineWidth: 1,
          lineDash: [4, 5],
          strokeOpacity: 1,
          cursor: 'pointer'
        }
      }
    },
    line: {
      style: {
        stroke: isDarkMode ? '#9CA3AF' : '#E5E7EB',
      }
    },
    label: {
      style: {
        fill: isDarkMode ? '#FFFFFF' : '#374151',
        fontSize: 12,
      },
    },
    title: {
      style: {
        fill: isDarkMode ? '#FFFFFF' : '#374151',
        fontSize: 12,
        fontWeight: 600,
      },
    },
    tickLine: {
      style: {
        stroke: isDarkMode ? '#9CA3AF' : '#E5E7EB',
      },
    },
    tick: {
      style: {
        fill: isDarkMode ? '#FFFFFF' : '#374151',
      },
    },
  };

  const lineConfig = {
    data: schoolStats.overallPerformance,
    xField: 'term',
    yField: 'score',
    theme,
    point: {
      size: 5,
      shape: 'diamond',
      style: {
        fill: isDarkMode ? '#60A5FA' : '#3B82F6',
        stroke: isDarkMode ? '#60A5FA' : '#3B82F6',
      },
    },
    line: {
      style: {
        stroke: isDarkMode ? '#60A5FA' : '#3B82F6',
      },
    },
    xAxis: commonAxisConfig,
    yAxis: commonAxisConfig,
    tooltip: {
      domStyles: {
        'g2-tooltip': {
          backgroundColor: isDarkMode ? '#374151' : '#FFFFFF',
          color: isDarkMode ? '#FFFFFF' : '#374151',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        },
      },
    },
  };

  const columnConfig = {
    data: schoolStats.subjectPerformance,
    xField: 'subject',
    yField: 'score',
    theme,
    label: {
      position: 'middle',
      style: {
        fill: '#FFFFFF',
        fontSize: 12,
        fontWeight: 500,
      },
    },
    xAxis: commonAxisConfig,
    yAxis: commonAxisConfig,
    columnStyle: {
      fill: isDarkMode ? '#60A5FA' : '#3B82F6',
    },
    tooltip: {
      domStyles: {
        'g2-tooltip': {
          backgroundColor: isDarkMode ? '#374151' : '#FFFFFF',
          color: isDarkMode ? '#FFFFFF' : '#374151',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        },
      },
    },
  };

  const pieConfig = {
    data: schoolStats.classDistribution,
    angleField: 'students',
    colorField: 'class',
    theme,
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name} ({percentage})',
      style: {
        fill: isDarkMode ? '#FFFFFF' : '#374151',
        fontSize: 12,
      },
    },
    legend: {
      itemName: {
        style: {
          fill: isDarkMode ? '#FFFFFF' : '#374151',
          fontSize: 12,
        },
      },
    },
    tooltip: {
      domStyles: {
        'g2-tooltip': {
          backgroundColor: isDarkMode ? '#374151' : '#FFFFFF',
          color: isDarkMode ? '#FFFFFF' : '#374151',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
        },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
      <Card 
        title="Overall Performance Trend" 
        className={`${isDarkMode ? 'bg-gray-800 text-gray-100' : ''} shadow-sm`}
        headStyle={{ borderBottom: isDarkMode ? '1px solid #4B5563' : undefined }}
      >
        <Line {...lineConfig} />
      </Card>
      <Card 
        title="Subject Performance" 
        className={`${isDarkMode ? 'bg-gray-800 text-gray-100' : ''} shadow-sm`}
        headStyle={{ borderBottom: isDarkMode ? '1px solid #4B5563' : undefined }}
      >
        <Column {...columnConfig} />
      </Card>
      <Card 
        title="Class Distribution" 
        className={`${isDarkMode ? 'bg-gray-800 text-gray-100' : ''} shadow-sm`}
        headStyle={{ borderBottom: isDarkMode ? '1px solid #4B5563' : undefined }}
      >
        <Pie {...pieConfig} />
      </Card>
    </div>
  );
};

export default SchoolOverview;
