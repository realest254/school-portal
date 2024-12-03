import React from 'react';
import { Table, Button, Tag, Typography, Tooltip, Space } from 'antd';
import { EditOutlined, DeleteOutlined, UserOutlined, CalendarOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useTheme } from '../../../../../contexts/ThemeContext';
import dayjs from 'dayjs';

const { Text } = Typography;

const IndisciplineListTable = ({ data, loading, onEdit, onDelete }) => {
  const { isDarkMode } = useTheme();

  const getSeverityConfig = (severity) => {
    const configs = {
      minor: {
        text: isDarkMode ? 'text-yellow-400' : 'text-yellow-600',
        bg: isDarkMode ? 'bg-yellow-400/10' : 'bg-yellow-50',
        border: isDarkMode ? 'border-yellow-400/20' : 'border-yellow-200',
        icon: 'text-yellow-400'
      },
      moderate: {
        text: isDarkMode ? 'text-orange-400' : 'text-orange-600',
        bg: isDarkMode ? 'bg-orange-400/10' : 'bg-orange-50',
        border: isDarkMode ? 'border-orange-400/20' : 'border-orange-200',
        icon: 'text-orange-400'
      },
      severe: {
        text: isDarkMode ? 'text-red-400' : 'text-red-600',
        bg: isDarkMode ? 'bg-red-400/10' : 'bg-red-50',
        border: isDarkMode ? 'border-red-400/20' : 'border-red-200',
        icon: 'text-red-400'
      }
    };
    return configs[severity.toLowerCase()] || configs.minor;
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: {
        text: isDarkMode ? 'text-blue-400' : 'text-blue-600',
        bg: isDarkMode ? 'bg-blue-400/10' : 'bg-blue-50',
        border: isDarkMode ? 'border-blue-400/20' : 'border-blue-200'
      },
      resolved: {
        text: isDarkMode ? 'text-green-400' : 'text-green-600',
        bg: isDarkMode ? 'bg-green-400/10' : 'bg-green-50',
        border: isDarkMode ? 'border-green-400/20' : 'border-green-200'
      },
      escalated: {
        text: isDarkMode ? 'text-purple-400' : 'text-purple-600',
        bg: isDarkMode ? 'bg-purple-400/10' : 'bg-purple-50',
        border: isDarkMode ? 'border-purple-400/20' : 'border-purple-200'
      }
    };
    return configs[status.toLowerCase()] || configs.pending;
  };

  const columns = [
    {
      title: 'Student',
      key: 'student',
      render: (_, record) => (
        <div className="flex items-center gap-3 py-2">
          <div className={`
            w-10 h-10 rounded-lg flex items-center justify-center
            ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}
          `}>
            <UserOutlined className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          <div className="flex flex-col">
            <Text className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>
              {record.studentName}
            </Text>
            <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Grade {record.grade}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: 'Incident',
      key: 'incident',
      render: (_, record) => (
        <div className="flex flex-col gap-1">
          <Text className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>
            {record.incident}
          </Text>
          <Text className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {record.description}
          </Text>
        </div>
      ),
    },
    {
      title: 'Date',
      key: 'date',
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <CalendarOutlined className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
          <Text className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
            {dayjs(record.date).format('MMM D, YYYY')}
          </Text>
        </div>
      ),
    },
    {
      title: 'Severity',
      key: 'severity',
      render: (_, record) => {
        const config = getSeverityConfig(record.severity);
        return (
          <div className="flex items-center gap-2">
            <Tag 
              className={`
                px-3 py-1 rounded-full border capitalize flex items-center gap-1
                ${config.text} ${config.bg} ${config.border}
              `}
            >
              <ExclamationCircleOutlined className={config.icon} />
              {record.severity}
            </Tag>
          </div>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const config = getStatusConfig(record.status);
        return (
          <Tag 
            className={`
              px-3 py-1 rounded-full border capitalize
              ${config.text} ${config.bg} ${config.border}
            `}
          >
            {record.status}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Edit Record">
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
          <Tooltip title="Delete Record">
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
      dataSource={data}
      columns={columns}
      loading={loading}
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
          : '[&_.ant-table-tbody>tr:hover>td]:!bg-orange-50/50'
        }
      `}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} records`,
      }}
    />
  );
};

export default IndisciplineListTable;
