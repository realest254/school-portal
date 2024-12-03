import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker } from 'antd';
import { useTheme } from '../../../../../contexts/ThemeContext';
import moment from 'moment';

const { TextArea } = Input;

const EditNotificationModal = ({
  visible,
  onCancel,
  onSubmit,
  loading,
  notification
}) => {
  const [form] = Form.useForm();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (notification) {
      form.setFieldsValue({
        ...notification,
        scheduledDate: notification.scheduledDate ? moment(notification.scheduledDate) : undefined
      });
    }
  }, [notification, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <Modal
      title="Edit Notification"
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
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
            <Select.Option value="expired">Expired</Select.Option>
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
        >
          <DatePicker showTime style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditNotificationModal;
