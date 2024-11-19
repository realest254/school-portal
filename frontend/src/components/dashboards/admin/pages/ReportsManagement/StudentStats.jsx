import React, { useState } from 'react';
import { Card, Form, Input, Select, Button, Table, Space } from 'antd';
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import { Line, Column } from '@ant-design/plots';
import { useTheme } from '../../../../../contexts/ThemeContext';

const StudentStats = () => {
  const { isDarkMode } = useTheme();
  const [searchForm] = Form.useForm();
  const [downloadForm] = Form.useForm();
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const handleSearch = async (values) => {
    setLoading(true);
    console.log('Search values:', values);
    // TODO: API call to fetch student data
    // The API will handle the logic to return:
    // - All exams if only year is provided
    // - Term exams if term is specified
    // - Specific exam if exam is specified
    setLoading(false);
  };

  const handleDownload = async (values) => {
    if (!values.studentIdentifier) {
      return;
    }
    console.log('Download values:', values);
    // TODO: API call to download report
  };

  const columns = [
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
      title: 'Total Marks',
      dataIndex: 'totalMarks',
      key: 'totalMarks',
    },
    {
      title: 'Grade',
      dataIndex: 'grade',
      key: 'grade',
    },
    {
      title: 'Position',
      dataIndex: 'position',
      key: 'position'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <Card title="Search Student Performance" className={isDarkMode ? 'bg-gray-800 text-gray-100' : ''}>
        <Form
          form={searchForm}
          onFinish={handleSearch}
          layout="vertical"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Form.Item
              label="Student Search"
              name="studentIdentifier"
              extra="Enter either name or admission number"
              rules={[{ required: true, message: 'Please enter student name or admission number' }]}
            >
              <Input placeholder="Enter student name or admission number" />
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
      {studentData && (
        <Card 
          title={`Performance Results - ${studentData.name}`}
          className={isDarkMode ? 'bg-gray-800 text-gray-100' : ''}
        >
          <div className="mb-4">
            <p><strong>Admission Number:</strong> {studentData.admissionNumber}</p>
            <p><strong>Class:</strong> {studentData.class}</p>
          </div>
          
          <Table
            columns={columns}
            dataSource={studentData.examResults}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} results`
            }}
            loading={loading}
          />
        </Card>
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
              label="Student"
              name="studentIdentifier"
              rules={[{ required: true, message: 'Please enter student name or admission number' }]}
            >
              <Input placeholder="Enter student name or admission number" />
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

      {/* Performance Charts */}
      {studentData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card 
            title="Performance Trend" 
            className={isDarkMode ? 'bg-gray-800 text-gray-100' : ''}
          >
            <Line {...studentData.trendConfig} />
          </Card>
          <Card 
            title="Subject Performance" 
            className={isDarkMode ? 'bg-gray-800 text-gray-100' : ''}
          >
            <Column {...studentData.subjectConfig} />
          </Card>
        </div>
      )}
    </div>
  );
};

export default StudentStats;
