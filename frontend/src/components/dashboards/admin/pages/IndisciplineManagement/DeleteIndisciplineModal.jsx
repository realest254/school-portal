import React from 'react';
import { Modal, Button } from 'antd';
import { useTheme } from '../../../../../contexts/ThemeContext';
import { useWindowSize } from '../../../../../hooks/useWindowSize';

const DeleteIndisciplineModal = ({ visible, onCancel, onConfirm, caseDetails }) => {
  const { isDarkMode } = useTheme();
  const { width } = useWindowSize();

  return (
    <Modal
      title={
        <span className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
          Delete Indiscipline Case
        </span>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={width >= 768 ? '40%' : '95%'}
      style={{
        top: width >= 768 ? '30%' : 10,
        maxWidth: '500px',
      }}
      className={`
        ${isDarkMode ? '[&_.ant-modal-content]:bg-gray-800' : '[&_.ant-modal-content]:bg-white'}
        [&_.ant-modal-header]:border-b
        ${isDarkMode ? '[&_.ant-modal-header]:border-gray-700' : '[&_.ant-modal-header]:border-gray-200'}
        ${isDarkMode ? '[&_.ant-modal-header]:bg-gray-800/50' : '[&_.ant-modal-header]:bg-gray-50/50'}
        ${isDarkMode ? '[&_.ant-modal-close-x]:text-gray-400 [&_.ant-modal-close-x:hover]:text-gray-300' : '[&_.ant-modal-close-x]:text-gray-500 [&_.ant-modal-close-x:hover]:text-gray-700'}
      `}
    >
      <div className="mt-4">
        <p className={`text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Are you sure you want to delete the indiscipline case for{' '}
          <span className="font-medium">{caseDetails?.studentName}</span>?
        </p>
        <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          This action cannot be undone.
        </p>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            onClick={onCancel}
            className={`
              border-0 px-4 h-9
              ${isDarkMode
                ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            danger
            onClick={onConfirm}
            className="border-0 px-4 h-9"
          >
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteIndisciplineModal;
