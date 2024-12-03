import React, { useState } from 'react';
import { Modal, Button, Typography } from 'antd';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';

const { Text } = Typography;

const DeleteSubjectModal = ({ isOpen, onClose, subject, onSuccess }) => {
  const { isDarkMode } = useTheme();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/subjects/${subject.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Subject deleted successfully');
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete subject');
      }
    } catch (error) {
      toast.error('An error occurred while deleting the subject');
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
        This will permanently delete the subject "{subject?.name}". This action cannot be undone.
      </Text>
    </Modal>
  );
};

export default DeleteSubjectModal;
