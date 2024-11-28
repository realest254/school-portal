import React from 'react';
import { Modal, Form, Input, Select, DatePicker, Button } from 'antd';
import { useWindowSize } from '../../../../../hooks/useWindowSize';
import { useTheme } from '../../../../../contexts/ThemeContext';

const { Option } = Select;

const AddIndisciplineModal = ({ visible, onCancel, onSubmit }) => {
  const [form] = Form.useForm();
  const { width } = useWindowSize();
  const { isDarkMode } = useTheme();

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const formattedValues = {
        studentAdmissionNumber: values.studentAdmissionNumber,
        reporterEmail: values.reporterEmail,
        incident_date: values.incidentDate.toDate(),
        description: values.description,
        severity: values.severity,
        action_taken: values.actionTaken
      };
      onSubmit(formattedValues);
      form.resetFields();
    });
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={
        <span className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
          Add New Indiscipline Case
        </span>
      }
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" onClick={handleSubmit}>
          Add Case
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
      <Form
        form={form}
        layout="vertical"
        className="mt-4"
      >
        <Form.Item
          name="studentAdmissionNumber"
          label={<span className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>Student Admission Number</span>}
          rules={[{ required: true, message: 'Please enter student admission number' }]}
        >
          <Input
            placeholder="Enter student admission number"
            className={`
              h-10 transition-colors duration-200
              ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 hover:border-blue-400 focus:border-blue-400'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-500 hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30'
              }
            `}
          />
        </Form.Item>

        <Form.Item
          name="reporterEmail"
          label={<span className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>Reporter Email</span>}
          rules={[
            { required: true, message: 'Please enter reporter email' },
            { type: 'email', message: 'Please enter a valid email' }
          ]}
        >
          <Input
            placeholder="Enter reporter email"
            className={`
              h-10 transition-colors duration-200
              ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 hover:border-blue-400 focus:border-blue-400'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-500 hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30'
              }
            `}
          />
        </Form.Item>

        <Form.Item
          name="incidentDate"
          label={<span className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>Incident Date</span>}
          rules={[{ required: true, message: 'Please select incident date' }]}
        >
          <DatePicker
            className={`
              w-full h-10 transition-colors duration-200
              ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white [&_.ant-picker-input>input::placeholder]:text-gray-400 hover:border-blue-400'
                  : 'bg-slate-50 border-slate-300 text-slate-900 [&_.ant-picker-input>input::placeholder]:text-slate-500 hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30'
              }
            `}
          />
        </Form.Item>

        <Form.Item
          name="description"
          label={<span className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>Description</span>}
          rules={[{ required: true, message: 'Please enter description' }]}
        >
          <Input.TextArea
            rows={4}
            placeholder="Enter incident description"
            className={`
              transition-colors duration-200
              ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 hover:border-blue-400 focus:border-blue-400'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-500 hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30'
              }
            `}
          />
        </Form.Item>

        <Form.Item
          name="severity"
          label={<span className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>Severity</span>}
          rules={[{ required: true, message: 'Please select severity' }]}
        >
          <Select
            placeholder="Select severity"
            className={`
              h-10 transition-colors duration-200
              ${
                isDarkMode
                  ? '[&_.ant-select-selector]:bg-gray-700 [&_.ant-select-selector]:border-gray-600 [&_.ant-select-selection-item]:text-white [&_.ant-select-selection-placeholder]:text-gray-400 hover:border-blue-400'
                  : '[&_.ant-select-selector]:bg-slate-50 [&_.ant-select-selector]:border-slate-300 [&_.ant-select-selection-item]:text-slate-900 [&_.ant-select-selection-placeholder]:text-slate-500 hover:border-blue-500'
              }
            `}
          >
            <Option value="minor">Minor</Option>
            <Option value="moderate">Moderate</Option>
            <Option value="severe">Severe</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="actionTaken"
          label={<span className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>Action Taken</span>}
        >
          <Input.TextArea
            rows={4}
            placeholder="Enter action taken (optional)"
            className={`
              transition-colors duration-200
              ${
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 hover:border-blue-400 focus:border-blue-400'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-500 hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30'
              }
            `}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddIndisciplineModal;
