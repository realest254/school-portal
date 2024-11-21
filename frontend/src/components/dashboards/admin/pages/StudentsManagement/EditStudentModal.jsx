import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, DatePicker, Button } from 'antd';
import moment from 'moment';
import { useWindowSize } from '../../../../../hooks/useWindowSize';
import { useTheme } from '../../../../../contexts/ThemeContext';

const { Option } = Select;

const EditStudentModal = ({ visible, onCancel, onSubmit, student }) => {
  const [form] = Form.useForm();
  const { width } = useWindowSize();
  const { isDarkMode } = useTheme();

  useEffect(() => {
    if (visible && student) {
      form.setFieldsValue({
        name: student.name,
        admissionNumber: student.admissionNumber,
        email: student.email,
        class: student.class,
        parentPhone: student.parentPhone,
        dob: student.dob ? moment(student.dob) : null,
      });
    }
  }, [visible, student, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const formattedValues = {
        ...values,
        id: student?.id,
        dob: values.dob?.format('YYYY-MM-DD'),
      };
      onSubmit(formattedValues);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={
        <span className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
          Edit Student
        </span>
      }
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button 
          key="cancel" 
          onClick={handleCancel}
          className={`h-10 px-6 ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600' 
              : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          Cancel
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          onClick={handleSubmit}
          className="h-10 px-6"
        >
          Save Changes
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
          className={`w-full ${isDarkMode ? '[&_.ant-form-item-label>label]:text-gray-300' : '[&_.ant-form-item-label>label]:text-gray-700'}`}
          onFinish={handleSubmit}
          preserve={false}
          initialValues={student ? {
            name: student.name,
            admissionNumber: student.admissionNumber,
            email: student.email,
            class: student.class,
            parentPhone: student.parentPhone,
            dob: student.dob ? moment(student.dob) : null,
          } : {}}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Form.Item
              name="name"
              label="Full Name"
              rules={[{ required: true, message: 'Please enter student name' }]}
            >
              <Input 
                placeholder="Enter student name" 
                className={`
                  h-10 transition-colors duration-200
                  ${isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 hover:border-blue-400 focus:border-blue-400' 
                    : 'bg-slate-100 border-slate-300 text-slate-900 placeholder:text-slate-500 hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30'
                  }
                `}
              />
            </Form.Item>

            <Form.Item
              name="admissionNumber"
              label="Admission Number"
              rules={[{ required: true, message: 'Please enter admission number' }]}
            >
              <Input 
                placeholder="Enter admission number" 
                className={`
                  h-10 transition-colors duration-200
                  ${isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 hover:border-blue-400 focus:border-blue-400' 
                    : 'bg-slate-100 border-slate-300 text-slate-900 placeholder:text-slate-500 hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30'
                  }
                `}
              />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email Address"
              rules={[
                { required: true, message: 'Please enter email' },
                { type: 'email', message: 'Please enter a valid email' }
              ]}
            >
              <Input 
                placeholder="Enter email address" 
                className={`
                  h-10 transition-colors duration-200
                  ${isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 hover:border-blue-400 focus:border-blue-400' 
                    : 'bg-slate-100 border-slate-300 text-slate-900 placeholder:text-slate-500 hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30'
                  }
                `}
              />
            </Form.Item>

            <Form.Item
              name="class"
              label="Class"
              rules={[{ required: true, message: 'Please select class' }]}
            >
              <Select
                placeholder="Select class"
                className={`
                  h-10 transition-colors duration-200
                  ${isDarkMode 
                    ? '[&_.ant-select-selector]:bg-gray-700 [&_.ant-select-selector]:border-gray-600 [&_.ant-select-selection-item]:text-white [&_.ant-select-selection-placeholder]:text-gray-400 hover:border-blue-400' 
                    : '[&_.ant-select-selector]:bg-slate-100 [&_.ant-select-selector]:border-slate-300 [&_.ant-select-selection-item]:text-slate-900 [&_.ant-select-selection-placeholder]:text-slate-500 hover:border-blue-500'
                  }
                `}
                popupClassName={`
                  ${isDarkMode 
                    ? 'dark-select-dropdown [&_.ant-select-item]:text-gray-200 [&_.ant-select-item-option-selected]:bg-gray-600 [&_.ant-select-item-option-active]:bg-gray-600/50' 
                    : '[&_.ant-select-item]:text-slate-900 [&_.ant-select-item-option-selected]:bg-blue-50 [&_.ant-select-item-option-active]:bg-slate-100'
                  }
                `}
              >
                <Option value="10A">10A</Option>
                <Option value="10B">10B</Option>
                <Option value="10C">10C</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="parentPhone"
              label="Parent Phone"
              rules={[
                { required: true, message: 'Please enter parent phone number' },
                { pattern: /^\+?[\d\s-]+$/, message: 'Please enter a valid phone number' }
              ]}
            >
              <Input 
                placeholder="Enter parent phone number" 
                className={`
                  h-10 transition-colors duration-200
                  ${isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-400 hover:border-blue-400 focus:border-blue-400' 
                    : 'bg-slate-100 border-slate-300 text-slate-900 placeholder:text-slate-500 hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30'
                  }
                `}
              />
            </Form.Item>

            <Form.Item
              name="dob"
              label="Date of Birth"
              rules={[{ required: true, message: 'Please select date of birth' }]}
            >
              <DatePicker 
                className={`
                  w-full h-10 transition-colors duration-200
                  ${isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white [&_.ant-picker-input>input::placeholder]:text-gray-400 hover:border-blue-400' 
                    : 'bg-slate-100 border-slate-300 text-slate-900 [&_.ant-picker-input>input::placeholder]:text-slate-500 hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30'
                  }
                `}
                popupClassName={`
                  ${isDarkMode 
                    ? '[&_.ant-picker-panel]:bg-gray-700 [&_.ant-picker-content]:text-white [&_.ant-picker-header]:text-gray-200 [&_.ant-picker-header-view]:text-gray-200' 
                    : '[&_.ant-picker-panel]:bg-white [&_.ant-picker-content]:text-slate-900 [&_.ant-picker-header]:text-slate-700 [&_.ant-picker-header-view]:text-slate-900 shadow-lg'
                  }
                `}
                format="YYYY-MM-DD"
              />
            </Form.Item>
          </div>
        </Form>
      </div>
    </Modal>
  );
};

export default EditStudentModal;