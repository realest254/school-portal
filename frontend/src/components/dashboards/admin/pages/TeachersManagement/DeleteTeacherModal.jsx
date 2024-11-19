import React from 'react';
import { Modal, Button } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { useTheme } from '../../../../../contexts/ThemeContext';
import { useWindowSize } from '../../../../../hooks/useWindowSize';

const DeleteTeacherModal = ({ visible, onCancel, onConfirm, teacherName }) => {
  const { isDarkMode } = useTheme();
  const { width } = useWindowSize();

  return (
    <Modal
      title={
        <span className={`text-lg font-semibold flex items-center gap-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
          <ExclamationCircleOutlined className="text-red-500" />
          Delete Teacher
        </span>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={width >= 768 ? '500px' : '95%'}
      style={{
        top: width >= 768 ? '30%' : 10,
      }}
      className={`
        ${isDarkMode ? '[&_.ant-modal-content]:bg-gray-800' : '[&_.ant-modal-content]:bg-white'}
        [&_.ant-modal-header]:border-b
        ${isDarkMode ? '[&_.ant-modal-header]:border-gray-700' : '[&_.ant-modal-header]:border-gray-200'}
        ${isDarkMode ? '[&_.ant-modal-header]:bg-gray-800/50' : '[&_.ant-modal-header]:bg-gray-50/50'}
      `}
    >
      <div className="p-1">
        <p className={`text-base mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Are you sure you want to delete teacher <span className="font-semibold">{teacherName}</span>? This action cannot be undone.
        </p>

        <div className={`flex justify-end gap-3 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <Button
            onClick={onCancel}
            className={`h-10 px-6 ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 hover:text-white hover:border-gray-500' 
                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-400'
            }`}
          >
            Cancel
          </Button>
          <Button
            danger
            onClick={onConfirm}
            className="h-10 px-6"
          >
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteTeacherModal;
