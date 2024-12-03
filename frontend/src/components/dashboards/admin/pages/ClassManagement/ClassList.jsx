import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Table, Input, Button, Tag, Space } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const ClassList = ({ classes, onEdit, onDelete }) => {
  const { isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      filteredValue: [searchQuery],
      onFilter: (value, record) => 
        record.name.toLowerCase().includes(value.toLowerCase()) ||
        record.stream?.toLowerCase().includes(value.toLowerCase()),
    },
    {
      title: 'Grade',
      dataIndex: 'grade',
      key: 'grade',
    },
    {
      title: 'Stream',
      dataIndex: 'stream',
      key: 'stream',
      render: (stream) => (
        <Tag color={isDarkMode ? 'blue' : 'geekblue'}>
          {stream || '-'}
        </Tag>
      ),
    },
    {
      title: 'Academic Year',
      dataIndex: 'academic_year',
      key: 'academic_year',
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (is_active) => (
        <Tag 
          color={is_active ? (isDarkMode ? 'green' : 'success') : (isDarkMode ? 'gray' : 'default')}
        >
          {is_active ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => onEdit(record)}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDelete(record)}
          />
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
        columns={columns}
        dataSource={classes}
        rowKey="id"
        pagination={{ pageSize: 10 }}
        theme={isDarkMode ? 'dark' : 'light'}
      />
    </div>
  );
};

export default ClassList;
