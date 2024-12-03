import React from 'react';
import { Table, Space, Button, Tag, Tooltip, theme } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTheme } from '../../../../../contexts/ThemeContext';

const NotificationListTable = ({
  loading,
  dataSource,
  pagination,
  onChange,
  onEdit,
  onDelete
}) => {
  const { isDarkMode } = useTheme();
  const { token } = theme.useToken();

  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      case 'low':
        return 'green';
      default:
        return 'blue';
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'green';
      case 'expired':
        return 'red';
      case 'scheduled':
        return 'blue';
      default:
        return 'default';
    }
  };

  const getAudienceColor = (audience) => {
    switch (audience.toLowerCase()) {
      case 'students':
        return 'geekblue';
      case 'teachers':
        return 'purple';
      case 'parents':
        return 'cyan';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text) => <span className="table-text">{text}</span>
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <span className="table-text">{text}</span>
        </Tooltip>
      )
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => (
        <Tag color={getPriorityColor(priority)}>
          {priority.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Target Audience',
      dataIndex: 'targetAudience',
      key: 'targetAudience',
      render: (audience) => (
        <Space size={[0, 4]} wrap style={{ maxWidth: '200px' }}>
          {Array.isArray(audience) && audience.map((item, index) => (
            <Tag 
              key={index}
              color={getAudienceColor(item)}
              style={{ 
                margin: '2px',
                fontSize: '12px'
              }}
            >
              {item}
            </Tag>
          ))}
        </Space>
      )
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => (
        <span className="table-text">
          {new Date(date).toLocaleDateString()}
        </span>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined className="action-icon" />}
            onClick={() => onEdit(record)}
          />
          <Button
            type="link"
            danger
            icon={<DeleteOutlined className="action-icon" />}
            onClick={() => onDelete(record)}
          />
        </Space>
      )
    }
  ];

  return (
    <>
      <style jsx="true">{`
        .table-text {
          color: ${isDarkMode ? token.colorTextLight : token.colorText};
        }
        .action-icon {
          color: ${isDarkMode ? token.colorTextLight : token.colorText};
        }
        .ant-table-cell {
          background: ${isDarkMode ? token.colorBgContainer : 'inherit'} !important;
        }
        .ant-table-row:hover .ant-table-cell {
          background: ${isDarkMode ? token.colorFillSecondary : token.colorFillQuaternary} !important;
        }
      `}</style>
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        pagination={pagination}
        onChange={onChange}
        loading={loading}
        style={{
          backgroundColor: isDarkMode ? token.colorBgContainer : undefined,
        }}
      />
    </>
  );
};

export default NotificationListTable;
