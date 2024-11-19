import React, { useState } from 'react';
import { Card, Form, Input, Select, Button, Table, Space } from 'antd';
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import { Line, Column } from '@ant-design/plots';
import { useTheme } from '../../../../../contexts/ThemeContext';

const ClassStats = () => {
  const { isDarkMode } = useTheme();
  const [searchForm] = Form.useForm();
  const [downloadForm] = Form.useForm();
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const handleSearch = async (values) => {
    setLoading(true);
    console.log('Search values:', values);
    // TODO: API call to fetch class performance data
    // This will fetch:
    // - Class performance data for the specified year (required)
    // - Further filtered by term/exam if provided
    setLoading(false);
  };

  const handleDownload = async (values) => {
    if (!values.class) {
      return;
    }
    console.log('Download values:', values);
    // TODO: API call to download report
  };

  const columns = [
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
    },
    {
      title: 'Teacher',
      dataIndex: 'teacher',
      key: 'teacher',
    },
    {
      title: 'Exam',
      dataIndex: 'exam',
      key: 'exam',
    },
    {
      title: 'Term',
      dataIndex: 'term',
      key: 'term',
    },
    {
      title: 'Class Average',
      dataIndex: 'classAverage',
      key: 'classAverage',
      render: (value) => `${value}%`,
    },
    {
      title: 'Pass Rate',
      dataIndex: 'passRate',
      key: 'passRate',
      render: (value) => `${value}%`,
    },
    {
      title: 'Highest Score',
      dataIndex: 'highestScore',
      key: 'highestScore',
      render: (value) => `${value}%`,
    },
    {
      title: 'Lowest Score',
      dataIndex: 'lowestScore',
      key: 'lowestScore',
      render: (value) => `${value}%`,
    }
  ];

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card title="Search Class Performance" className={isDarkMode ? 'bg-gray-800 text-gray-100' : ''}>
        <Form
          form={searchForm}
          onFinish={handleSearch}
          layout="vertical"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Form.Item
              label="Class"
              name="class"
              rules={[{ required: true, message: 'Please enter class' }]}
            >
              <Input placeholder="Enter class" />
            </Form.Item>

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
            >
              <Select placeholder="Select term (optional)">
                <Select.Option value="1">Term 1</Select.Option>
                <Select.Option value="2">Term 2</Select.Option>
                <Select.Option value="3">Term 3</Select.Option>
              </Select>
            </Form.Item>

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
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={loading}>
              Search
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Results Table */}
      {classData && (
        <Card 
          title={`Performance Results - ${classData.className}`}
          className={isDarkMode ? 'bg-gray-800 text-gray-100' : ''}
        >
          <div className="mb-4">
            <p><strong>Total Students:</strong> {classData.totalStudents}</p>
            <p><strong>Class Teacher:</strong> {classData.classTeacher}</p>
          </div>
          
          <Table
            columns={columns}
            dataSource={classData.performanceResults}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} results`
            }}
            loading={loading}
          />
        </Card>
      )}

      {/* Performance Charts */}
      {classData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card 
            title="Subject Performance Comparison" 
            className={isDarkMode ? 'bg-gray-800 text-gray-100' : ''}
          >
            <Column 
              {...{
                data: classData.subjectPerformance,
                xField: 'subject',
                yField: 'average',
                label: {
                  position: 'middle',
                  style: {
                    fill: isDarkMode ? '#fff' : '#000',
                  },
                },
                meta: {
                  average: {
                    alias: 'Average Score',
                  },
                },
              }} 
            />
          </Card>
          <Card 
            title="Performance Trend Over Time" 
            className={isDarkMode ? 'bg-gray-800 text-gray-100' : ''}
          >
            <Line 
              {...{
                data: classData.performanceTrend,
                xField: 'exam',
                yField: 'average',
                seriesField: 'subject',
                point: {
                  size: 5,
                  shape: 'diamond',
                },
                label: {
                  style: {
                    fill: isDarkMode ? '#fff' : '#000',
                  },
                },
              }}
            />
          </Card>
        </div>
      )}

      {/* Download Form */}
      <Card title="Download Reports" className={isDarkMode ? 'bg-gray-800 text-gray-100' : ''}>
        <Form
          form={downloadForm}
          onFinish={handleDownload}
          layout="vertical"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Form.Item
              label="Class"
              name="class"
              rules={[{ required: true, message: 'Please enter class' }]}
            >
              <Input placeholder="Enter class" />
            </Form.Item>

            <Form.Item
              label="Year"
              name="year"
            >
              <Select placeholder="Select year (optional)">
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
            >
              <Select placeholder="Select term (optional)">
                <Select.Option value="1">Term 1</Select.Option>
                <Select.Option value="2">Term 2</Select.Option>
                <Select.Option value="3">Term 3</Select.Option>
              </Select>
            </Form.Item>
          </div>

          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<DownloadOutlined />}>
              Download Report
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ClassStats;
