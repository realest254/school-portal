import React from 'react';
import { Table, Button, Space, Typography } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useWindowSize } from '../../../../../hooks/useWindowSize';
import { useTheme } from '../../../../../contexts/ThemeContext';
import dayjs from 'dayjs';

const { Text } = Typography;

const TeacherListTable = ({ teachers, onEdit, onDelete, loading }) => {
  const { width } = useWindowSize();
  const { isDarkMode } = useTheme();
  
  const getResponsiveColumns = () => {
    const baseColumns = [
      {
        title: <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Name</span>,
        dataIndex: 'name',
        key: 'name',
        className: "name-column",
        sorter: (a, b) => a.name.localeCompare(b.name),
        render: (text) => (
          <Text strong className={isDarkMode ? 'text-gray-200' : 'text-gray-800'}>
            {text}
          </Text>
        ),
      },
      {
        title: <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Employee ID</span>,
        dataIndex: 'employeeId',
        key: 'employeeId',
        ellipsis: true,
        responsive: ['sm'],
        render: (text) => (
          <Text className={isDarkMode ? 'text-gray-200' : 'text-gray-600'}>
            {text}
          </Text>
        ),
      },
      {
        title: <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Email</span>,
        dataIndex: 'email',
        key: 'email',
        ellipsis: true,
        responsive: ['md'],
        render: (text) => (
          <Text className={isDarkMode ? 'text-gray-200' : 'text-gray-600'}>
            {text}
          </Text>
        ),
      },
      {
        title: <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Phone</span>,
        dataIndex: 'phone',
        key: 'phone',
        ellipsis: true,
        responsive: ['lg'],
        render: (text) => (
          <Text className={isDarkMode ? 'text-gray-200' : 'text-gray-600'}>
            {text}
          </Text>
        ),
      },
      {
        title: <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Status</span>,
        dataIndex: 'status',
        key: 'status',
        responsive: ['md'],
        render: (status) => (
          <div className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold
            ${status === 'active' 
              ? (isDarkMode ? 'bg-green-900/50 text-green-400' : 'bg-green-50 text-green-700 border border-green-200')
              : (isDarkMode ? 'bg-red-900/50 text-red-400' : 'bg-red-50 text-red-700 border border-red-200')
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </div>
        ),
      },
      {
        title: <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Join Date</span>,
        dataIndex: 'joinDate',
        key: 'joinDate',
        ellipsis: true,
        responsive: ['lg'],
        render: (date) => (
          <Text className={isDarkMode ? 'text-gray-200' : 'text-gray-600'}>
            {dayjs(date).format('YYYY-MM-DD')}
          </Text>
        ),
      },
      {
        title: <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Subjects</span>,
        dataIndex: 'subject_details',
        key: 'subjects',
        ellipsis: true,
        responsive: ['xl'],
        render: (subjects) => (
          <Text className={isDarkMode ? 'text-gray-200' : 'text-gray-600'}>
            {subjects?.map(s => s.name).join(', ') || 'No subjects'}
          </Text>
        ),
      },
      {
        title: <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Actions</span>,
        key: 'actions',
        className: "actions-column",
        render: (_, record) => (
          <Space size="middle">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
              className={`${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
            />
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => onDelete(record)}
              className={`${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-700'}`}
            />
          </Space>
        ),
      },
    ];

    return baseColumns;
  };

  return (
    <Table
      dataSource={teachers}
      columns={getResponsiveColumns()}
      loading={loading}
      rowKey="id"
      className={`
        ${isDarkMode ? 'bg-gray-800' : 'bg-white'}
        rounded-lg
        overflow-hidden
        [&_.ant-table-thead>tr>th]:!bg-transparent
        [&_.ant-table-thead>tr>th]:!border-b
        ${isDarkMode 
          ? '[&_.ant-table-thead>tr>th]:!border-gray-700' 
          : '[&_.ant-table-thead>tr>th]:!border-gray-100 [&_.ant-table-thead>tr>th]:!bg-gray-50'
        }
      `}
      style={{
        '--header-bg': isDarkMode ? undefined : '#f8fafc',
        '--row-hover-bg': isDarkMode ? undefined : '#f1f5f9',
      }}
      onRow={(record) => ({
        className: `
          transition-colors
          duration-150
          ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-50/50'}
          ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}
        `,
      })}
    />
  );
};

export default TeacherListTable;
