import React, { useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, Button, message } from 'antd';
import moment from 'moment';
import { useWindowSize } from '../../../../../hooks/useWindowSize';
import { useTheme } from '../../../../../contexts/ThemeContext';
import { TeacherService } from '../../../../../services/teacher.service';

const { Option } = Select;

const EditTeacherModal = ({ visible, onClose, teacher, subjects }) => {
  const [form] = Form.useForm();
  const { width } = useWindowSize();
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (visible && teacher) {
      form.setFieldsValue({
        ...teacher,
        joinDate: teacher.joinDate ? moment(teacher.joinDate) : null,
      });
    }
  }, [visible, teacher, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const formattedValues = {
        ...values,
        joinDate: values.joinDate?.format('YYYY-MM-DD'),
      };

      await TeacherService.updateTeacher(teacher.key, formattedValues);
      message.success('Teacher updated successfully');
      onClose(true);
    } catch (error) {
      console.error('Error updating teacher:', error);
      message.error(error.response?.data?.message || 'Failed to update teacher');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  const inputClassName = `h-10 ${
    isDarkMode 
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 hover:border-blue-400 focus:border-blue-400' 
      : 'bg-white border-gray-300 text-gray-700 placeholder-gray-500 hover:border-blue-400 focus:border-blue-400'
  }`;

  const labelClassName = `font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`;

  return (
    <Modal
      title={
        <span className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
          Edit Teacher
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
          Update Teacher
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
          className="w-full"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Form.Item
              name="name"
              label={<span className={labelClassName}>Full Name</span>}
              rules={[{ required: true, message: 'Please enter teacher name' }]}
              className="mb-4"
            >
              <Input 
                placeholder="Enter teacher name" 
                className={inputClassName}
              />
            </Form.Item>

            <Form.Item
              name="employeeId"
              label={<span className={labelClassName}>Employee ID</span>}
              rules={[{ required: true, message: 'Please enter employee ID' }]}
              className="mb-4"
            >
              <Input 
                placeholder="Enter employee ID" 
                className={inputClassName}
                disabled // Employee ID should not be editable
              />
            </Form.Item>

            <Form.Item
              name="email"
              label={<span className={labelClassName}>Email Address</span>}
              rules={[
                { required: true, message: 'Please enter email' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
              className="mb-4"
            >
              <Input 
                placeholder="Enter email address" 
                className={inputClassName}
              />
            </Form.Item>

            <Form.Item
              name="phone"
              label={<span className={labelClassName}>Phone Number</span>}
              rules={[
                { required: true, message: 'Please enter phone number' },
                { pattern: /^\+?\d+$/, message: 'Please enter a valid phone number' },
              ]}
              className="mb-4"
            >
              <Input 
                placeholder="Enter phone number" 
                className={inputClassName}
              />
            </Form.Item>

            <Form.Item
              name="qualification"
              label={<span className={labelClassName}>Qualification</span>}
              rules={[{ required: true, message: 'Please enter qualification' }]}
              className="mb-4"
            >
              <Input 
                placeholder="Enter qualification" 
                className={inputClassName}
              />
            </Form.Item>

            <Form.Item
              name="experience"
              label={<span className={labelClassName}>Experience (years)</span>}
              rules={[{ required: true, message: 'Please enter years of experience' }]}
              className="mb-4"
            >
              <InputNumber 
                min={0}
                placeholder="Enter years of experience" 
                className={`w-full ${inputClassName}`}
              />
            </Form.Item>

            <Form.Item
              name="joinDate"
              label={<span className={labelClassName}>Join Date</span>}
              rules={[{ required: true, message: 'Please select join date' }]}
              className="mb-4"
            >
              <DatePicker 
                className={`w-full ${inputClassName}`}
                format="YYYY-MM-DD"
                placeholder="Select join date"
              />
            </Form.Item>

            <Form.Item
              name="status"
              label={<span className={labelClassName}>Status</span>}
              rules={[{ required: true, message: 'Please select status' }]}
              className="mb-4"
            >
              <Select
                className={inputClassName}
                placeholder="Select status"
              >
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="subjects"
              label={<span className={labelClassName}>Subjects</span>}
              rules={[{ required: true, message: 'Please select at least one subject' }]}
              className="mb-4"
            >
              <Select 
                mode="multiple"
                placeholder="Select subjects"
                className={isDarkMode ? 'dark-select' : ''}
                popupClassName={isDarkMode ? 'bg-gray-700' : 'bg-white'}
                style={{
                  backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                }}
              >
                {subjects.map(subject => (
                  <Option key={subject} value={subject}>{subject}</Option>
                ))}
              </Select>
            </Form.Item>
          </div>
        </Form>
      </div>
    </Modal>
  );
};

export default EditTeacherModal;
