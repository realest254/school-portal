import React, { useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, Button, message } from 'antd';
import { useWindowSize } from '../../../../../hooks/useWindowSize';
import { useTheme } from '../../../../../contexts/ThemeContext';
import { TeacherService } from '../../../../../services/teacher.service';

const { Option } = Select;

const AddTeacherModal = ({ visible, onClose, subjects = [] }) => {
  const [form] = Form.useForm();
  const { width } = useWindowSize();
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const formattedValues = {
        ...values,
        joinDate: values.joinDate.format('YYYY-MM-DD'),
        status: 'active'
      };

      await TeacherService.createTeacher(formattedValues);
      message.success('Teacher added successfully');
      form.resetFields();
      onClose(true);
    } catch (error) {
      console.error('Error adding teacher:', error);
      message.error(error.message || 'Failed to add teacher');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title={
        <span className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
          Add New Teacher
        </span>
      }
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
          className={`${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`}
        >
          Add Teacher
        </Button>
      ]}
      width={width >= 768 ? '60%' : '95%'}
      style={{
        top: width >= 768 ? '20%' : 10,
        maxWidth: '800px',
      }}
      className={`
        ${isDarkMode ? '[&_.ant-modal-content]:bg-gray-800' : '[&_.ant-modal-content]:bg-white'}
        [&_.ant-modal-header]:border-b
        ${isDarkMode ? '[&_.ant-modal-header]:border-gray-700' : '[&_.ant-modal-header]:border-gray-200'}
        ${isDarkMode ? '[&_.ant-modal-header]:bg-gray-800/50' : '[&_.ant-modal-header]:bg-gray-50/50'}
        ${isDarkMode ? '[&_.ant-modal-close-x]:text-gray-400 [&_.ant-modal-close-x:hover]:text-gray-300' : '[&_.ant-modal-close-x]:text-gray-500 [&_.ant-modal-close-x:hover]:text-gray-700'}
      `}
    >
      <div className="p-1">
        <Form
          form={form}
          layout="vertical"
          className={`w-full [&_.ant-form-item-label>label]:${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Form.Item
              name="name"
              label="Full Name"
              rules={[{ required: true, message: 'Please enter teacher name' }]}
            >
              <Input 
                placeholder="Enter teacher name" 
                className={`h-10 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700'}`}
              />
            </Form.Item>

            <Form.Item
              name="employeeId"
              label="Employee ID"
              rules={[{ required: true, message: 'Please enter employee ID' }]}
            >
              <Input 
                placeholder="Enter employee ID" 
                className={`h-10 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700'}`}
              />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email Address"
              rules={[
                { required: true, message: 'Please enter email' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input 
                placeholder="Enter email address" 
                className={`h-10 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700'}`}
              />
            </Form.Item>

            <Form.Item
              name="subject"
              label="Subject"
              rules={[{ required: true, message: 'Please select subject' }]}
            >
              <Select 
                placeholder="Select subject"
                className={`h-10 ${isDarkMode ? 'dark-select' : ''}`}
                popupClassName={`${isDarkMode ? 'dark-select-dropdown' : ''} ${
                  isDarkMode 
                    ? '[&_.ant-select-item]:text-white [&_.ant-select-item-option-selected]:bg-gray-600 [&_.ant-select-item-option-active]:bg-gray-600/50'
                    : '[&_.ant-select-item]:text-gray-700 [&_.ant-select-item-option-selected]:bg-blue-50 [&_.ant-select-item-option-active]:bg-gray-100'
                }`}
                style={{
                  backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                }}
              >
                {subjects.map(subject => (
                  <Option key={subject} value={subject}>{subject}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="phone"
              label="Phone Number"
              rules={[
                { required: true, message: 'Please enter phone number' },
                { pattern: /^\d{10}$/, message: 'Please enter a valid 10-digit phone number' },
              ]}
            >
              <Input 
                placeholder="Enter phone number" 
                className={`h-10 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700'}`}
              />
            </Form.Item>

            <Form.Item
              name="joinDate"
              label="Join Date"
              rules={[{ required: true, message: 'Please select join date' }]}
            >
              <DatePicker 
                className={`w-full h-10 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700'}`}
                format="YYYY-MM-DD"
                placeholder="Select join date"
                popupClassName={`
                  ${isDarkMode 
                    ? '[&_.ant-picker-panel]:bg-gray-700 [&_.ant-picker-content]:text-white [&_.ant-picker-header]:text-gray-200 [&_.ant-picker-header-view]:text-gray-200 [&_.ant-picker-cell]:text-gray-300 [&_.ant-picker-cell-in-view]:text-white [&_.ant-picker-cell-selected]:text-blue-500'
                    : '[&_.ant-picker-panel]:bg-white [&_.ant-picker-content]:text-gray-700 [&_.ant-picker-header]:text-gray-600 [&_.ant-picker-header-view]:text-gray-600 [&_.ant-picker-cell]:text-gray-500 [&_.ant-picker-cell-in-view]:text-gray-700 [&_.ant-picker-cell-selected]:text-blue-500'
                  }
                `}
              />
            </Form.Item>
          </div>
        </Form>
      </div>
    </Modal>
  );
};

export default AddTeacherModal;
