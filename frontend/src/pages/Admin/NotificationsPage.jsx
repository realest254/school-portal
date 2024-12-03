import React, { useState } from 'react';
import { Card, Typography, message } from 'antd';
import SearchAndFilterBar from '../../components/dashboards/admin/pages/NotificationsManagement/SearchAndFilterBar';
import NotificationListTable from '../../components/dashboards/admin/pages/NotificationsManagement/NotificationListTable';
import AddNotificationModal from '../../components/dashboards/admin/pages/NotificationsManagement/AddNotificationModal';
import EditNotificationModal from '../../components/dashboards/admin/pages/NotificationsManagement/EditNotificationModal';
import DeleteNotificationModal from '../../components/dashboards/admin/pages/NotificationsManagement/DeleteNotificationModal';
import { useTheme } from '../../contexts/ThemeContext';

const { Title } = Typography;

// Mock data for development
const mockNotifications = [
  {
    id: '1',
    title: 'School Holiday Announcement',
    message: 'School will be closed for winter break from Dec 20 to Jan 5',
    priority: 'high',
    status: 'active',
    targetAudience: ['students', 'teachers', 'parents'],
    createdAt: '2023-12-01T10:00:00Z'
  },
  {
    id: '2',
    title: 'Parent-Teacher Meeting',
    message: 'Parent-teacher meetings scheduled for next week',
    priority: 'medium',
    status: 'scheduled',
    targetAudience: ['parents', 'teachers'],
    createdAt: '2023-12-02T09:30:00Z'
  },
  {
    id: '3',
    title: 'Sports Day Event',
    message: 'Annual sports day will be held on December 15',
    priority: 'low',
    status: 'active',
    targetAudience: ['students', 'teachers'],
    createdAt: '2023-12-03T14:20:00Z'
  }
];

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [loading, setLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const { isDarkMode } = useTheme();

  const handleSearch = (values) => {
    setLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      let filteredNotifications = [...mockNotifications];

      if (values.search) {
        filteredNotifications = filteredNotifications.filter(
          notification => 
            notification.title.toLowerCase().includes(values.search.toLowerCase()) ||
            notification.message.toLowerCase().includes(values.search.toLowerCase())
        );
      }

      if (values.priority) {
        filteredNotifications = filteredNotifications.filter(
          notification => notification.priority === values.priority
        );
      }

      if (values.status) {
        filteredNotifications = filteredNotifications.filter(
          notification => notification.status === values.status
        );
      }

      setNotifications(filteredNotifications);
      setLoading(false);
    }, 500);
  };

  const handleAddNotification = (values) => {
    const newNotification = {
      id: String(Date.now()),
      ...values,
      createdAt: new Date().toISOString(),
      status: values.status || 'active'
    };

    setNotifications([newNotification, ...notifications]);
    setIsAddModalVisible(false);
    message.success('Notification added successfully');
  };

  const handleEditNotification = (values) => {
    const updatedNotifications = notifications.map(notification =>
      notification.id === selectedNotification.id
        ? { ...notification, ...values }
        : notification
    );

    setNotifications(updatedNotifications);
    setIsEditModalVisible(false);
    message.success('Notification updated successfully');
  };

  const handleDeleteNotification = () => {
    const filteredNotifications = notifications.filter(
      notification => notification.id !== selectedNotification.id
    );

    setNotifications(filteredNotifications);
    setIsDeleteModalVisible(false);
    message.success('Notification deleted successfully');
  };

  return (
    <div className="p-6">
      <Card bordered={false}>
        <div className="mb-4">
          <Title level={2} style={{ margin: 0, color: isDarkMode ? '#fff' : undefined }}>
            Notifications Management
          </Title>
        </div>

        <SearchAndFilterBar
          onSearch={handleSearch}
          onAdd={() => setIsAddModalVisible(true)}
        />

        <NotificationListTable
          loading={loading}
          dataSource={notifications}
          pagination={{
            total: notifications.length,
            pageSize: 10,
            current: 1
          }}
          onEdit={(record) => {
            setSelectedNotification(record);
            setIsEditModalVisible(true);
          }}
          onDelete={(record) => {
            setSelectedNotification(record);
            setIsDeleteModalVisible(true);
          }}
        />

        <AddNotificationModal
          visible={isAddModalVisible}
          onCancel={() => setIsAddModalVisible(false)}
          onSubmit={handleAddNotification}
          loading={loading}
        />

        <EditNotificationModal
          visible={isEditModalVisible}
          onCancel={() => setIsEditModalVisible(false)}
          onSubmit={handleEditNotification}
          loading={loading}
          notification={selectedNotification}
        />

        <DeleteNotificationModal
          visible={isDeleteModalVisible}
          onCancel={() => setIsDeleteModalVisible(false)}
          onConfirm={handleDeleteNotification}
          loading={loading}
          notification={selectedNotification}
        />
      </Card>
    </div>
  );
};

export default NotificationsPage;
