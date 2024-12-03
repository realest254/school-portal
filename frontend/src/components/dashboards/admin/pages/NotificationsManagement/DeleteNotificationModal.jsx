import React from 'react';
import { Modal } from 'antd';
import { useTheme } from '../../../../../contexts/ThemeContext';

const DeleteNotificationModal = ({
  visible,
  onCancel,
  onConfirm,
  loading,
  notification
}) => {
  const { isDarkMode } = useTheme();

  return (
    <Modal
      title="Delete Notification"
      open={visible}
      onCancel={onCancel}
      onOk={onConfirm}
      confirmLoading={loading}
      okText="Delete"
      okButtonProps={{ danger: true }}
    >
      <p>
        Are you sure you want to delete the notification "{notification?.title}"?
        This action cannot be undone.
      </p>
    </Modal>
  );
};

export default DeleteNotificationModal;
