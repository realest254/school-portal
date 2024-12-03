import React from 'react';
import { Table, Button, Tag, Typography, Tooltip, Space } from 'antd';
import { EditOutlined, DeleteOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useTheme } from '../../../../../contexts/ThemeContext';

const { Text } = Typography;

const StudentListTable = ({ students, loading, pagination, onChange, onEdit, onDelete }) => {
  const { isDarkMode } = useTheme();

  const getStatusColor = (status) => {
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
      },
      pending: {
        text: isDarkMode ? 'text-yellow-400' : 'text-yellow-600',
        bg: isDarkMode ? 'bg-yellow-400/10' : 'bg-yellow-50',
        border: isDarkMode ? 'border-yellow-400/20' : 'border-yellow-200'
      }
    };
    return colors[status] || colors.pending;
  };

  const columns = [
    {
      title: 'Student',
      key: 'name',
      render: (_, record) => (
        <div className="flex items-center gap-3 py-2">
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center text-lg font-medium
            ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}
            ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}
          `}>
            {record.firstName[0]}{record.lastName[0]}
          </div>
          <div className="flex flex-col">
            <Text className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>
              {record.firstName} {record.lastName}
            </Text>
            <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              ID: {record.studentId}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <div className="flex items-center gap-2">
            <MailOutlined className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
            <Text className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
              {record.email}
            </Text>
          </div>
          {record.phone && (
            <div className="flex items-center gap-2">
              <PhoneOutlined className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
              <Text className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                {record.phone}
              </Text>
            </div>
          )}
        </Space>
      ),
    },
    {
      title: 'Grade',
      dataIndex: 'grade',
      key: 'grade',
      render: (grade) => (
        <Text className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
          Grade {grade}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = getStatusColor(status.toLowerCase());
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
          <Tooltip title="Edit Student">
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
          <Tooltip title="Delete Student">
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
    <Table
      dataSource={students}
      columns={columns}
      loading={loading}
      pagination={pagination}
      onChange={onChange}
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
  );
};

export default StudentListTable;