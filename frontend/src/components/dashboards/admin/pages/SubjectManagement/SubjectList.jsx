import React from 'react';
import { Table, Button, Tag, Typography, Tooltip, Space, Input } from 'antd';
import { EditOutlined, DeleteOutlined, BookOutlined, ClockCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { useTheme } from '../../../../../contexts/ThemeContext';

const { Text } = Typography;

const SubjectList = ({ subjects, onEdit, onDelete }) => {
  const { isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredSubjects = subjects?.filter(subject =>
    subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    {
      title: 'Subject',
      key: 'subject',
      render: (_, record) => (
        <div className="flex items-center gap-3 py-2">
          <div className={`
            w-10 h-10 rounded-lg flex items-center justify-center
            ${isDarkMode ? 'bg-gray-700' : 'bg-purple-50'}
            ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}
          `}>
            <BookOutlined className="text-lg" />
          </div>
          <div className="flex flex-col">
            <Text className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>
              {record.name}
            </Text>
            <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {record.code}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (department) => (
        <Tag 
          className={`
            px-3 py-1 rounded-full border capitalize
            ${isDarkMode 
              ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' 
              : 'text-blue-600 bg-blue-50 border-blue-200'
            }
          `}
        >
          {department}
        </Tag>
      ),
    },
    {
      title: 'Credits',
      key: 'credits',
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <ClockCircleOutlined className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
          <Text className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
            {record.credits} Credits
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
          <Tooltip title="Edit Subject">
            <Button
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
              className={`
                border-none shadow-none
                ${isDarkMode 
                  ? 'text-gray-400 hover:text-purple-400 hover:bg-purple-400/10' 
                  : 'text-gray-500 hover:text-purple-500 hover:bg-purple-50'
                }
              `}
            />
          </Tooltip>
          <Tooltip title="Delete Subject">
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
          placeholder="Search subjects..."
          prefix={<SearchOutlined className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
      </div>

      <Table
        dataSource={filteredSubjects}
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
            : '[&_.ant-table-tbody>tr:hover>td]:!bg-purple-50/50'
          }
        `}
      />
    </div>
  );
};

export default SubjectList;
