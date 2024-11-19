import React from 'react';
import { Table, Button, Space } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useWindowSize } from '../../../../../hooks/useWindowSize';
import { useTheme } from '../../../../../contexts/ThemeContext';

const StudentListTable = ({ students, onEdit, onDelete, loading }) => {
  const { width } = useWindowSize();
  const { isDarkMode } = useTheme();
  
  const getResponsiveColumns = () => {
    const baseColumns = [
      {
        title: () => <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Name</span>,
        dataIndex: 'name',
        key: 'name',
        className: "name-column",
        sorter: (a, b) => a.name.localeCompare(b.name),
        render: (text) => <span key={`name-${text}`}>{text}</span>,
      },
      {
        title: () => <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Admission No.</span>,
        dataIndex: 'admissionNumber',
        key: 'admissionNumber',
        ellipsis: true,
        responsive: ['sm'],
        render: (text) => <div key={`admission-${text}`} className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>{text}</div>,
      },
      {
        title: () => <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Email</span>,
        dataIndex: 'email',
        key: 'email',
        ellipsis: true,
        responsive: ['md'],
        render: (text) => <div key={`email-${text}`} className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>{text}</div>,
      },
      {
        title: () => <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Class</span>,
        dataIndex: 'class',
        key: 'class',
        ellipsis: true,
        responsive: ['sm'],
        render: (text) => <div key={`class-${text}`} className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>{text}</div>,
      },
      {
        title: () => <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Parent Phone</span>,
        dataIndex: 'parentPhone',
        key: 'parentPhone',
        ellipsis: true,
        responsive: ['lg'],
        render: (text) => <div key={`phone-${text}`} className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>{text}</div>,
      },
      {
        title: () => <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>DOB</span>,
        dataIndex: 'dob',
        key: 'dob',
        ellipsis: true,
        responsive: ['md'],
        render: (text) => <div key={`dob-${text}`} className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>{text}</div>,
      },
      {
        title: () => <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Actions</span>,
        key: 'actions',
        className: "actions-column",
        render: (_, record) => (
          <Space key={`actions-${record.admissionNumber}`}>
            <Button
              key={`edit-${record.admissionNumber}`}
              type="text"
              icon={<EditOutlined />}
              onClick={() => onEdit(record)}
              className={`${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-500 hover:text-blue-600'}`}
            />
            <Button
              key={`delete-${record.admissionNumber}`}
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
        columns={getResponsiveColumns()}
        dataSource={students}
        rowKey="admissionNumber"
        loading={loading}
        locale={{
          emptyText: <div key="empty-text" className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>No students found</div>
        }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) => (
            <span key="pagination-total" className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
              {`${range[0]}-${range[1]} of ${total} items`}
            </span>
          ),
          className: isDarkMode ? 'dark-pagination' : ''
        }}
        scroll={{
          x: 'max-content',
        }}
        className={`
          [&_.ant-table]:bg-transparent
          [&_.ant-table-thead>tr>th]:bg-gray-50
          [&_.ant-table-tbody>tr>td]:bg-transparent
          [&_.ant-table-tbody>tr:hover>td]:bg-gray-50
          ${isDarkMode ? `
            [&_.ant-table-thead>tr>th]:!bg-gray-800
            [&_.ant-table-tbody>tr>td]:!bg-gray-800
            [&_.ant-table-tbody>tr:hover>td]:!bg-gray-700
            [&_.ant-table]:!text-gray-200
            [&_.ant-table-cell]:!border-gray-700
            [&_.ant-table-thead>tr>th]:!border-gray-700
            [&_.ant-pagination-item-link]:!bg-gray-700
            [&_.ant-pagination-item-link]:!border-gray-600
            [&_.ant-pagination-item-link]:!text-gray-200
            [&_.ant-pagination-item]:!bg-gray-700
            [&_.ant-pagination-item]:!border-gray-600
            [&_.ant-pagination-item-active]:!bg-blue-600
            [&_.ant-pagination-item-active]:!border-blue-600
            [&_.ant-pagination-item>a]:!text-gray-200
            [&_.ant-select-selector]:!bg-gray-700
            [&_.ant-select-selector]:!border-gray-600
            [&_.ant-select-selection-item]:!text-gray-200
          ` : `
            [&_.ant-table]:text-gray-700
            [&_.ant-table-cell]:border-gray-200
            [&_.ant-table-thead>tr>th]:border-gray-200
            [&_.ant-pagination-item-link]:bg-white
            [&_.ant-pagination-item-link]:border-gray-300
            [&_.ant-pagination-item-link]:text-gray-600
            [&_.ant-pagination-item]:bg-white
            [&_.ant-pagination-item]:border-gray-300
            [&_.ant-pagination-item-active]:bg-blue-500
            [&_.ant-pagination-item-active]:border-blue-500
            [&_.ant-pagination-item>a]:text-gray-600
            [&_.ant-select-selector]:bg-white
            [&_.ant-select-selector]:border-gray-300
            [&_.ant-select-selection-item]:text-gray-600
          `}
        `}
      />
    </div>
  );
};

export default StudentListTable;