import React from 'react';
import { Table, Button, Space } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useWindowSize } from '../../../../../hooks/useWindowSize';
import { useTheme } from '../../../../../contexts/ThemeContext';
import moment from 'moment';

const IndisciplineListTable = ({ cases, onEdit, onDelete, loading }) => {
  const { width } = useWindowSize();
  const { isDarkMode } = useTheme();
  
  const columns = [
    {
      title: <span key="title-name" className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Student Name</span>,
      dataIndex: 'studentName',
      key: 'studentName',
      sorter: (a, b) => a.studentName.localeCompare(b.studentName),
      render: (text) => <span key={`name-${text}`} className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>{text}</span>,
    },
    {
      title: <span key="title-class" className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Class</span>,
      dataIndex: 'class',
      key: 'class',
      render: (text) => <span key={`class-${text}`} className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>{text}</span>,
    },
    {
      title: <span key="title-date" className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Incident Date</span>,
      dataIndex: 'incidentDate',
      key: 'incidentDate',
      render: (date) => (
        <span key={`date-${date}`} className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>
          {moment(date).format('YYYY-MM-DD')}
        </span>
      ),
    },
    {
      title: <span key="title-desc" className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Description</span>,
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => <span key={`desc-${text}`} className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>{text}</span>,
    },
    {
      title: <span key="title-action" className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Action Taken</span>,
      dataIndex: 'actionTaken',
      key: 'actionTaken',
      ellipsis: true,
      render: (text) => <span key={`action-${text}`} className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>{text}</span>,
    },
    {
      title: <span key="title-status" className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Status</span>,
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            status === 'Resolved'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : status === 'Pending'
              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}
        >
          {status}
        </span>
      ),
    },
    {
      title: <span key="title-actions" className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Actions</span>,
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
            className={`${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}
          >
            Edit
          </Button>
          <Button
            type="link"
            icon={<DeleteOutlined />}
            onClick={() => onDelete(record)}
            className={`${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-500'}`}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className={`w-full rounded-lg shadow-sm transition-colors duration-200 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <Table
        columns={columns}
        dataSource={cases}
        loading={loading}
        rowKey="key"
        locale={{
          emptyText: <div key="empty-text" className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>No cases found</div>
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

export default IndisciplineListTable;
