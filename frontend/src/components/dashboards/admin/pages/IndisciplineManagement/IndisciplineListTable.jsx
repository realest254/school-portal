import React from 'react';
import { Table, Button, Space, Tag } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useWindowSize } from '../../../../../hooks/useWindowSize';
import { useTheme } from '../../../../../contexts/ThemeContext';
import moment from 'moment';

const IndisciplineListTable = ({ cases, onEdit, onDelete, loading }) => {
  const { width } = useWindowSize();
  const { isDarkMode } = useTheme();
  
  const columns = [
    {
      title: <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Admission No.</span>,
      dataIndex: 'studentAdmissionNumber',
      key: 'studentAdmissionNumber',
      sorter: (a, b) => a.studentAdmissionNumber.localeCompare(b.studentAdmissionNumber),
      render: (text) => <span className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>{text}</span>,
    },
    {
      title: <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Reporter</span>,
      dataIndex: 'reporterEmail',
      key: 'reporterEmail',
      render: (text) => <span className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>{text}</span>,
    },
    {
      title: <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Incident Date</span>,
      dataIndex: 'incident_date',
      key: 'incident_date',
      sorter: (a, b) => moment(a.incident_date).unix() - moment(b.incident_date).unix(),
      render: (date) => (
        <span className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>
          {moment(date).format('YYYY-MM-DD')}
        </span>
      ),
    },
    {
      title: <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Description</span>,
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text) => <span className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>{text}</span>,
    },
    {
      title: <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Severity</span>,
      dataIndex: 'severity',
      key: 'severity',
      render: (severity) => {
        const color = {
          minor: 'blue',
          moderate: 'orange',
          severe: 'red',
        }[severity.toLowerCase()] || 'default';
        
        return <Tag color={color}>{severity.toUpperCase()}</Tag>;
      },
    },
    {
      title: <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Action Taken</span>,
      dataIndex: 'action_taken',
      key: 'action_taken',
      ellipsis: true,
      render: (text) => <span className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>{text || '-'}</span>,
    },
    {
      title: <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>Actions</span>,
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EditOutlined className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} />}
            onClick={() => onEdit(record)}
            className="hover:bg-transparent"
          />
          <Button
            type="text"
            icon={<DeleteOutlined className={isDarkMode ? 'text-red-400' : 'text-red-600'} />}
            onClick={() => onDelete(record)}
            className="hover:bg-transparent"
          />
        </Space>
      ),
    },
  ];

  return (
    <div className={`w-full rounded-lg shadow-sm transition-colors duration-200 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <Table
        dataSource={cases}
        columns={columns}
        loading={loading}
        rowKey="id"
        locale={{
          emptyText: <div className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>No cases found</div>
        }}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) => (
            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
              {`${range[0]}-${range[1]} of ${total} items`}
            </span>
          ),
          className: isDarkMode ? 'dark-pagination' : ''
        }}
        scroll={{ x: true }}
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
