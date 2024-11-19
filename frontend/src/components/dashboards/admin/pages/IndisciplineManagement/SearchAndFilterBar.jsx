import React from 'react';
import { Input, Select, Button, Space } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { useTheme } from '../../../../../contexts/ThemeContext';

const { Option } = Select;

const SearchAndFilterBar = ({ onSearch, onStatusFilter, onAddNew }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className={`
      w-full p-4 rounded-lg mb-4 transition-colors duration-200
      ${isDarkMode ? 'bg-gray-800' : 'bg-white'}
      ${isDarkMode ? 'border border-gray-700' : 'shadow-sm'}
    `}>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by student name or description"
            prefix={<SearchOutlined className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />}
            onChange={(e) => onSearch(e.target.value)}
            className={`
              h-10 transition-colors duration-200
              ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 hover:border-blue-400 focus:border-blue-400'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-500 hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30'
              }
            `}
          />
        </div>

        <Space>
          <Select
            placeholder="Filter by status"
            allowClear
            style={{ minWidth: '150px' }}
            onChange={onStatusFilter}
            className={`
              h-10 transition-colors duration-200
              ${
                isDarkMode
                  ? '[&_.ant-select-selector]:bg-gray-700 [&_.ant-select-selector]:border-gray-600 [&_.ant-select-selection-item]:text-white [&_.ant-select-selection-placeholder]:text-gray-400 hover:border-blue-400'
                  : '[&_.ant-select-selector]:bg-slate-50 [&_.ant-select-selector]:border-slate-300 [&_.ant-select-selection-item]:text-slate-900 [&_.ant-select-selection-placeholder]:text-slate-500 hover:border-blue-500'
              }
            `}
          >
            <Option value="Pending">Pending</Option>
            <Option value="In Progress">In Progress</Option>
            <Option value="Resolved">Resolved</Option>
          </Select>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onAddNew}
            className={`${isDarkMode ? 'bg-blue-500 hover:bg-blue-600' : 'bg-blue-600 hover:bg-blue-700'} border-0 h-10`}
          >
            Add New Case
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default SearchAndFilterBar;
