import React from 'react';
import { Table, Button, Tag, Typography, Tooltip, Space, Input } from 'antd';
import { EditOutlined, DeleteOutlined, UserOutlined, CalendarOutlined, SearchOutlined } from '@ant-design/icons';
import { useTheme } from '../../../../../contexts/ThemeContext';

const { Text } = Typography;

const ClassList = ({ classes, onEdit, onDelete }) => {
  const { isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = React.useState('');

  const columns = [
    {
      title: 'Class',
      key: 'class',
      filteredValue: [searchQuery],
      onFilter: (value, record) => 
        record.name.toLowerCase().includes(value.toLowerCase()) ||
        record.stream?.toLowerCase().includes(value.toLowerCase()),
      render: (_, record) => (
        <div className="flex items-center gap-3 py-2">
          <div className={`
            w-10 h-10 rounded-lg flex items-center justify-center text-lg font-medium
            ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}
            ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}
          `}>
            {record.grade}
          </div>
          <div className="flex flex-col">
            <Text className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>
              Grade {record.grade}-{record.section}
            </Text>
            <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {record.classId}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Teacher',
      key: 'teacher',
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <UserOutlined className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
          <Text className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
            {record.teacher}
          </Text>
        </div>
      ),
    },
    {
      title: 'Schedule',
      key: 'schedule',
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <CalendarOutlined className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
          <Text className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
            {record.schedule}
          </Text>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          active: {
            text: isDarkMode ? 'text-green-400' : 'text-green-600',
            bg: isDarkMode ? 'bg-green-400/10' : 'bg-green-50',
            border: isDarkMode ? 'border-green-400/20' : 'border-green-200'
          },
          inactive: {
            text: isDarkMode ? 'text-red-400' : 'text-red-600',
            bg: isDarkMode ? 'bg-red-400/10' : 'bg-red-50',
            border: isDarkMode ? 'border-red-400/20' : 'border-red-200'
          }
        }[status.toLowerCase()];

        return (
          <Tag 
            className={`
              px-3 py-1 rounded-full border capitalize
              ${colors.text} ${colors.bg} ${colors.border}
            `}
          >
            {status}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Edit Class">
            <Button
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
              className={`
                border-none shadow-none
                ${isDarkMode 
                  ? 'text-gray-400 hover:text-blue-400 hover:bg-blue-400/10' 
                  : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50'
                }
              `}
            />
          </Tooltip>
          <Tooltip title="Delete Class">
            <Button
              icon={<DeleteOutlined />}
              onClick={() => onDelete(record)}
              className={`
                border-none shadow-none
                ${isDarkMode 
                  ? 'text-gray-400 hover:text-red-400 hover:bg-red-400/10' 
                  : 'text-gray-500 hover:text-red-500 hover:bg-red-50'
                }
              `}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search classes..."
          prefix={<SearchOutlined />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: 300 }}
        />
      </div>

      <Table
        dataSource={classes}
        columns={columns}
        rowKey="id"
        className={`
          [&_.ant-table]:!bg-transparent
          [&_.ant-table-thead>tr>th]:!bg-transparent
          [&_.ant-table-thead>tr>th]:!border-b
          ${isDarkMode 
            ? '[&_.ant-table-thead>tr>th]:!border-gray-700 [&_.ant-table-tbody>tr>td]:!border-gray-700' 
            : '[&_.ant-table-thead>tr>th]:!border-gray-100 [&_.ant-table-tbody>tr>td]:!border-gray-100 [&_.ant-table-thead>tr>th]:!bg-gray-50'
          }
          ${isDarkMode 
            ? '[&_.ant-table-tbody>tr:hover>td]:!bg-gray-700/50'
            : '[&_.ant-table-tbody>tr:hover>td]:!bg-blue-50/50'
          }
        `}
      />
    </div>
  );
};

export default ClassList;
