import React, { useState } from 'react';
import { Form, Select, Button, Divider } from 'antd';
import { FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import { Column, Pie } from '@ant-design/plots';
import { useTheme } from '../../../../../contexts/ThemeContext';

const { Option } = Select;

const IndisciplineReports = () => {
  const [selectedFilters, setSelectedFilters] = useState({
    gradeLevel: null,
    class: null,
    term: null,
    year: null,
  });

  const [form] = Form.useForm();

  // Sample data - Replace with actual data from your backend
  const monthlyData = [
    { month: 'Jan', count: 5 },
    { month: 'Feb', count: 8 },
    { month: 'Mar', count: 3 },
    { month: 'Apr', count: 7 },
    { month: 'May', count: 4 },
    { month: 'Jun', count: 6 },
  ];

  const typeData = [
    { type: 'Late Arrival', count: 25 },
    { type: 'Uniform Violation', count: 15 },
    { type: 'Disruptive Behavior', count: 10 },
    { type: 'Homework Missing', count: 20 },
    { type: 'Other', count: 5 },
  ];

  const handleFilterChange = (values) => {
    setSelectedFilters(values);
    // Here you would typically fetch new data based on the filters
  };

  const exportToPDF = () => {
    // Implement PDF export logic
  };

  const exportToExcel = () => {
    // Implement Excel export logic
  };

  const { isDarkMode } = useTheme();

  const columnConfig = {
    data: monthlyData,
    xField: 'month',
    yField: 'count',
    color: isDarkMode ? '#60A5FA' : '#3B82F6',
    label: {
      position: 'middle',
      style: {
        fill: isDarkMode ? '#E5E7EB' : '#111827',
      },
    },
    xAxis: {
      label: {
        style: {
          fill: isDarkMode ? '#E5E7EB' : '#111827',
        },
      },
    },
    yAxis: {
      label: {
        style: {
          fill: isDarkMode ? '#E5E7EB' : '#111827',
        },
      },
    },
  };

  const pieConfig = {
    data: typeData,
    angleField: 'count',
    colorField: 'type',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name} {percentage}',
      style: {
        fill: isDarkMode ? '#E5E7EB' : '#111827',
      },
    },
    theme: {
      colors10: isDarkMode 
        ? ['#60A5FA', '#34D399', '#F472B6', '#FBBF24', '#F87171']
        : ['#3B82F6', '#10B981', '#EC4899', '#F59E0B', '#EF4444'],
    },
  };

  return (
    <div className="space-y-6">
      <Form
        form={form}
        onValuesChange={handleFilterChange}
        layout="vertical"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Form.Item name="gradeLevel" label={
          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Grade Level</span>
        }>
          <Select placeholder="Select Grade Level">
            <Option value="1">Grade 1</Option>
            <Option value="2">Grade 2</Option>
            <Option value="3">Grade 3</Option>
          </Select>
        </Form.Item>

        <Form.Item name="class" label={
          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Class</span>
        }>
          <Select placeholder="Select Class">
            <Option value="1A">1A</Option>
            <Option value="1B">1B</Option>
            <Option value="1C">1C</Option>
          </Select>
        </Form.Item>

        <Form.Item name="term" label={
          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Term</span>
        }>
          <Select placeholder="Select Term">
            <Option value="1">Term 1</Option>
            <Option value="2">Term 2</Option>
            <Option value="3">Term 3</Option>
          </Select>
        </Form.Item>

        <Form.Item name="year" label={
          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Year</span>
        }>
          <Select placeholder="Select Year">
            <Option value="2023">2023</Option>
            <Option value="2022">2022</Option>
            <Option value="2021">2021</Option>
          </Select>
        </Form.Item>
      </Form>

      <Divider className={isDarkMode ? 'border-gray-700' : 'border-gray-200'} />

      <div className="flex justify-end space-x-4 mb-6">
        <Button
          icon={<FilePdfOutlined />}
          onClick={exportToPDF}
          className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
        >
          Export as PDF
        </Button>
        <Button
          icon={<FileExcelOutlined />}
          onClick={exportToExcel}
          className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
        >
          Export as Excel
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            Monthly Indiscipline Cases
          </h3>
          <Column {...columnConfig} />
        </div>

        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            Types of Indiscipline Cases
          </h3>
          <div style={{ height: '400px' }}>
            <Pie {...pieConfig} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndisciplineReports;
