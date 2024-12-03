import React from 'react';
import { Card, Select, DatePicker, Button, Space, Typography } from 'antd';
import { FilterOutlined, ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import { useTheme } from '../../../../../contexts/ThemeContext';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const ReportsFilters = ({ 
  onFilterChange, 
  onExport,
  onRefresh,
  classes = [],
  subjects = [],
  teachers = []
}) => {
  const { isDarkMode } = useTheme();

  const selectClassName = `
    min-w-[200px]
    ${isDarkMode 
      ? 'ant-select-dark' 
      : ''
    }
  `;

  const handleFilterChange = (type, value) => {
    onFilterChange?.({ type, value });
  };

  return (
    <Card
      className={`
        mb-6 border transition-all duration-200
        ${isDarkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-100'
        }
      `}
    >
      <div className="flex flex-col lg:flex-row lg:items-end gap-4">
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Text 
              className={`
                block mb-2 text-sm font-medium
                ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}
              `}
            >
              Date Range
            </Text>
            <RangePicker 
              className={`w-full ${isDarkMode ? 'ant-picker-dark' : ''}`}
              onChange={(dates) => handleFilterChange('dateRange', dates)}
            />
          </div>
          
          <div>
            <Text 
              className={`
                block mb-2 text-sm font-medium
                ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}
              `}
            >
              Class
            </Text>
            <Select
              className={selectClassName}
              placeholder="Select class"
              allowClear
              onChange={(value) => handleFilterChange('class', value)}
              options={classes.map(c => ({ label: c.name, value: c.id }))}
            />
          </div>
          
          <div>
            <Text 
              className={`
                block mb-2 text-sm font-medium
                ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}
              `}
            >
              Subject
            </Text>
            <Select
              className={selectClassName}
              placeholder="Select subject"
              allowClear
              onChange={(value) => handleFilterChange('subject', value)}
              options={subjects.map(s => ({ label: s.name, value: s.id }))}
            />
          </div>
          
          <div>
            <Text 
              className={`
                block mb-2 text-sm font-medium
                ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}
              `}
            >
              Teacher
            </Text>
            <Select
              className={selectClassName}
              placeholder="Select teacher"
              allowClear
              onChange={(value) => handleFilterChange('teacher', value)}
              options={teachers.map(t => ({ 
                label: `${t.firstName} ${t.lastName}`, 
                value: t.id 
              }))}
            />
          </div>
        </div>

        <Space className="flex-none">
          <Button 
            type="default"
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            className={
              isDarkMode 
                ? 'border-gray-600 text-gray-300 hover:border-gray-500 hover:text-gray-200' 
                : ''
            }
          >
            Refresh
          </Button>
          <Button 
            type="primary"
            icon={<DownloadOutlined />}
            onClick={onExport}
          >
            Export Report
          </Button>
        </Space>
      </div>
    </Card>
  );
};

export default ReportsFilters;
