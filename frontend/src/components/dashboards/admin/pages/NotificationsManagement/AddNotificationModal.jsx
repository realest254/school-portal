import React from 'react';
import { Modal, Form, Input, Select, DatePicker } from 'antd';
import { useTheme } from '../../../../../contexts/ThemeContext';

const { TextArea } = Input;

const AddNotificationModal = ({
  visible,
  onCancel,
  onSubmit,
  loading
}) => {
  const [form] = Form.useForm();
  const { isDarkMode } = useTheme();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
      form.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <Modal
      title="Add New Notification"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          priority: 'medium',
          status: 'active'
        }}
      >
        <Form.Item
          name="title"
          label="Title"
          rules={[{ required: true, message: 'Please input the title!' }]}
        >
          <Input placeholder="Enter notification title" />
        </Form.Item>

        <Form.Item
          name="message"
          label="Message"
          rules={[{ required: true, message: 'Please input the message!' }]}
        >
          <TextArea
            rows={4}
            placeholder="Enter notification message"
          />
        </Form.Item>

        <Form.Item
          name="priority"
          label="Priority"
          rules={[{ required: true, message: 'Please select the priority!' }]}
        >
          <Select>
            <Select.Option value="high">High</Select.Option>
            <Select.Option value="medium">Medium</Select.Option>
            <Select.Option value="low">Low</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="status"
          label="Status"
          rules={[{ required: true, message: 'Please select the status!' }]}
        >
          <Select>
            <Select.Option value="active">Active</Select.Option>
            <Select.Option value="scheduled">Scheduled</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="targetAudience"
          label="Target Audience"
          rules={[{ required: true, message: 'Please select the target audience!' }]}
        >
          <Select mode="multiple">
            <Select.Option value="students">Students</Select.Option>
            <Select.Option value="teachers">Teachers</Select.Option>
            <Select.Option value="parents">Parents</Select.Option>
            <Select.Option value="staff">Staff</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="scheduledDate"
          label="Scheduled Date"
          rules={[
            {
              required: false,
              message: 'Please select the scheduled date!'
            }
          ]}
        >
          <DatePicker showTime style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddNotificationModal;
