import React, { useState } from 'react';
import { Modal, Button, Typography } from 'antd';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';

const { Text } = Typography;

const DeleteClassModal = ({ isOpen, onClose, classItem, onSuccess }) => {
  const { isDarkMode } = useTheme();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/classes/${classItem.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Class deleted successfully');
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete class');
      }
    } catch (error) {
      toast.error('An error occurred while deleting the class');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      title="Are you sure?"
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button
          key="delete"
          type="primary"
          danger
          onClick={handleDelete}
          loading={isDeleting}
        >
          Delete
        </Button>,
      ]}
      className={isDarkMode ? 'ant-modal-dark' : ''}
    >
      <Text className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
        This will permanently delete the class "{classItem?.name}". This action cannot be undone.
      </Text>
    </Modal>
  );
};

export default DeleteClassModal;
