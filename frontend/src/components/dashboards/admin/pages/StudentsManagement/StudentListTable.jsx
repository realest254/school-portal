import React from 'react';
import { Table, Button, Space } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useWindowSize } from '../../../../../hooks/useWindowSize';
import { useTheme } from '../../../../../contexts/ThemeContext';
import dayjs from 'dayjs';

const StudentListTable = ({ 
  students, 
  onEdit, 
  onDelete, 
  loading,
  pagination,
  onChange
}) => {
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
        render: (text) => <span>{text}</span>,
      },
      {
        title: <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Admission No.</span>,
        dataIndex: 'admissionNumber',
        key: 'admissionNumber',
        ellipsis: true,
        responsive: ['sm'],
        render: (text) => <div className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>{text}</div>,
      },
      {
        title: <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Email</span>,
        dataIndex: 'email',
        key: 'email',
        ellipsis: true,
        responsive: ['md'],
        render: (text) => <div className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>{text}</div>,
      },
      {
        title: <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Class</span>,
        dataIndex: 'class',
        key: 'class',
        ellipsis: true,
        responsive: ['sm'],
        render: (text) => <div className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>{text}</div>,
      },
      {
        title: <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Parent Phone</span>,
        dataIndex: 'parentPhone',
        key: 'parentPhone',
        ellipsis: true,
        responsive: ['lg'],
        render: (text) => <div className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>{text}</div>,
      },
      {
        title: <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Date of Birth</span>,
        dataIndex: 'dob',
        key: 'dob',
        ellipsis: true,
        responsive: ['lg'],
        render: (date) => (
          <div className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>
            {dayjs(date).format('YYYY-MM-DD')}
          </div>
        ),
      },
      {
        title: <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Status</span>,
        dataIndex: 'status',
        key: 'status',
        responsive: ['md'],
        render: (status) => (
          <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium
            ${status === 'active' 
              ? (isDarkMode ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-700')
              : (isDarkMode ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-700')
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </div>
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
              className={`${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-600'}`}
            />
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => onDelete(record)}
              className={`${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-600'}`}
            />
          </Space>
        ),
      },
    ];
    return baseColumns;
  };

  return (
    <div className={`w-full rounded-lg shadow-sm transition-colors duration-200 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <Table
        dataSource={students}
        columns={getResponsiveColumns()}
        loading={loading}
        pagination={pagination}
        onChange={onChange}
        rowKey="id"
        scroll={{ x: true }}
        className={`${isDarkMode ? 'dark-theme' : ''}`}
      />
    </div>
  );
};

export default StudentListTable;