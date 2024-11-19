import React from 'react';
import { Form, Input, DatePicker, Button, Space, Select } from 'antd';
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import { useTheme } from '../../../../../contexts/ThemeContext';

const ReportsFilters = ({ onSearch, onExport }) => {
  const [form] = Form.useForm();
  const { isDarkMode } = useTheme();

  const handleSearch = (values) => {
    // Ensure at least one search criteria is provided
    const hasSearchCriteria = Object.values(values).some(value => value && value !== '');
    if (!hasSearchCriteria) {
      return;
    }
    onSearch(values);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  return (
    <Form
      form={form}
      onFinish={handleSearch}
      className="mb-6"
      layout="vertical"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Student Filters */}
        <Form.Item
          name="studentName"
          label="Student Name"
        >
          <Input placeholder="Enter student name" />
        </Form.Item>

        <Form.Item
          name="admissionNumber"
          label="Admission Number"
        >
          <Input placeholder="Enter admission number" />
        </Form.Item>

        {/* Class Filter */}
        <Form.Item
          name="className"
          label="Class Name"
        >
          <Input placeholder="Enter class name" />
        </Form.Item>

        {/* Teacher Filter */}
        <Form.Item
          name="teacherName"
          label="Teacher Name"
        >
          <Input placeholder="Enter teacher name" />
        </Form.Item>

        {/* Term and Year Filters - Required Group */}
        <Form.Item
          label="Academic Year"
          name="year"
          rules={[{ required: true, message: 'Year is required' }]}
        >
          <Select placeholder="Select year">
            {years.map(year => (
              <Select.Option key={year} value={year}>
                {year}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Term"
          name="term"
          rules={[{ required: true, message: 'Term is required' }]}
        >
          <Select placeholder="Select term">
            <Select.Option value="1">Term 1</Select.Option>
            <Select.Option value="2">Term 2</Select.Option>
            <Select.Option value="3">Term 3</Select.Option>
          </Select>
        </Form.Item>

        {/* Optional Exam Filter */}
        <Form.Item
          label="Exam"
          name="exam"
        >
          <Select placeholder="Select exam (optional)">
            <Select.Option value="1">Exam 1</Select.Option>
            <Select.Option value="2">Exam 2</Select.Option>
            <Select.Option value="3">Exam 3</Select.Option>
            <Select.Option value="final">Final Exam</Select.Option>
          </Select>
        </Form.Item>
      </div>

      <Form.Item>
        <Space>
          <Button 
            type="primary" 
            htmlType="submit" 
            icon={<SearchOutlined />}
          >
            Search
          </Button>
          <Button 
            onClick={onExport} 
            icon={<DownloadOutlined />}
          >
            Export
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default ReportsFilters;
