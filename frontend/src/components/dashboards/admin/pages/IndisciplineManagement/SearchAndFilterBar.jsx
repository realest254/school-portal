import React from 'react';
import { Input, Select, DatePicker, Space } from 'antd';
import { SearchOutlined, FilterOutlined } from '@ant-design/icons';
import { useTheme } from '../../../../../contexts/ThemeContext';

const { Option } = Select;

const SearchAndFilterBar = ({ filters, setFilters }) => {
  const { isDarkMode } = useTheme();

  const handleSearch = (value) => {
    setFilters({ ...filters, search: value });
  };

  const handleStatusChange = (value) => {
    setFilters({ ...filters, status: value });
  };

  const handleSeverityChange = (value) => {
    setFilters({ ...filters, severity: value });
  };

  const handleDateChange = (date) => {
    setFilters({ ...filters, date: date });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <Input
        placeholder="Search by student name or incident..."
        prefix={<SearchOutlined className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />}
        onChange={(e) => handleSearch(e.target.value)}
        className={`
          flex-1 min-w-[200px]
          [&_.ant-input]:!bg-transparent
          [&_.ant-input]:!border-0
          [&_.ant-input-prefix]:!mr-2
          ${isDarkMode 
            ? '[&_.ant-input]:!text-gray-200 [&_.ant-input-prefix]:!text-gray-400' 
            : '[&_.ant-input]:!text-gray-700 [&_.ant-input-prefix]:!text-gray-400'
          }
        `}
        style={{
          background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
          border: 'none',
          borderRadius: '0.5rem',
          padding: '0.5rem 1rem',
        }}
      />
      
      <Space.Compact className="flex-none">
        <Select
          defaultValue="all"
          onChange={handleStatusChange}
          className={`
            min-w-[120px]
            [&_.ant-select-selector]:!border-0
            [&_.ant-select-selection-item]:!pl-2
            ${isDarkMode 
              ? '[&_.ant-select-selector]:!bg-gray-700 [&_.ant-select-selection-item]:!text-gray-200' 
              : '[&_.ant-select-selector]:!bg-gray-100 [&_.ant-select-selection-item]:!text-gray-700'
            }
          `}
        >
          <Option value="all">All Status</Option>
          <Option value="pending">Pending</Option>
          <Option value="resolved">Resolved</Option>
          <Option value="escalated">Escalated</Option>
        </Select>

        <Select
          defaultValue="all"
          onChange={handleSeverityChange}
          className={`
            min-w-[120px]
            [&_.ant-select-selector]:!border-0
            [&_.ant-select-selection-item]:!pl-2
            ${isDarkMode 
              ? '[&_.ant-select-selector]:!bg-gray-700 [&_.ant-select-selection-item]:!text-gray-200' 
              : '[&_.ant-select-selector]:!bg-gray-100 [&_.ant-select-selection-item]:!text-gray-700'
            }
          `}
        >
          <Option value="all">All Severity</Option>
          <Option value="minor">Minor</Option>
          <Option value="moderate">Moderate</Option>
          <Option value="severe">Severe</Option>
        </Select>

        <DatePicker
          onChange={handleDateChange}
          placeholder="Select date"
          className={`
            min-w-[150px]
            [&_.ant-picker-input>input]:!pl-2
            ${isDarkMode 
              ? '[&_.ant-picker-input>input]:!text-gray-200 [&]:!bg-gray-700 [&]:!border-0' 
              : '[&_.ant-picker-input>input]:!text-gray-700 [&]:!bg-gray-100 [&]:!border-0'
            }
          `}
        />
      </Space.Compact>
    </div>
  );
};

export default SearchAndFilterBar;
