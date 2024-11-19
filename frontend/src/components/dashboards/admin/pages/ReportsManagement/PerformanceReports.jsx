import React, { useState } from 'react';
import { Form, Select, Button, Space, Divider } from 'antd';
import { DownloadOutlined, FileExcelOutlined, FilePdfOutlined } from '@ant-design/icons';
import { useTheme } from '../../../../../contexts/ThemeContext';
import PerformanceCharts from './PerformanceCharts';
import { Bar } from '@ant-design/plots';

const { Option } = Select;

const PerformanceReports = () => {
  const { isDarkMode } = useTheme();
  const [selectedFilters, setSelectedFilters] = useState({
    gradeLevel: null,
    class: null,
    term: null,
    exam: null,
    subject: null,
  });

  const [form] = Form.useForm();

  // Sample data - Replace with actual data from your backend
  const performanceData = [
    { subject: 'Mathematics', average: 75 },
    { subject: 'English', average: 82 },
    { subject: 'Science', average: 78 },
    { subject: 'History', average: 85 },
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

  const config = {
    data: performanceData,
    xField: 'subject',
    yField: 'average',
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

  return (
    <div className="space-y-6">
      <Form
        form={form}
        onValuesChange={handleFilterChange}
        layout="vertical"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"
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

        <Form.Item name="exam" label={
          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Exam</span>
        }>
          <Select placeholder="Select Exam">
            <Option value="1">Exam 1</Option>
            <Option value="2">Exam 2</Option>
            <Option value="3">Exam 3</Option>
          </Select>
        </Form.Item>

        <Form.Item name="subject" label={
          <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Subject</span>
        }>
          <Select placeholder="Select Subject">
            <Option value="math">Mathematics</Option>
            <Option value="english">English</Option>
            <Option value="science">Science</Option>
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

      <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <h3 className={`text-lg font-medium mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
          Class Performance Overview
        </h3>
        <Bar {...config} />
      </div>

      <PerformanceCharts filters={selectedFilters} isDarkMode={isDarkMode} />
    </div>
  );
};

export default PerformanceReports;
