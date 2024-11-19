import React, { useState } from 'react';
import { Card, Form, Input, Select, Button, Table, Space } from 'antd';
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import { Line, Column } from '@ant-design/plots';
import { useTheme } from '../../../../../contexts/ThemeContext';

const TeacherStats = () => {
  const { isDarkMode } = useTheme();
  const [searchForm] = Form.useForm();
  const [downloadForm] = Form.useForm();
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const handleSearch = async (values) => {
    setLoading(true);
    console.log('Search values:', values);
    // TODO: API call to fetch performance data
    // This will fetch performance progression for the specified:
    // - Teacher teaching specific subject to specific class
    // - All exam results for the selected year
    // - Optionally filtered by term
    setLoading(false);
  };

  const handleDownload = async (values) => {
    console.log('Download values:', values);
    // TODO: API call to download report
  };

  // Columns for the performance progression table
  const progressionColumns = [
    {
      title: 'Year',
      dataIndex: 'year',
      key: 'year',
    },
    {
      title: 'Term',
      dataIndex: 'term',
      key: 'term',
    },
    {
      title: 'Exam',
      dataIndex: 'exam',
      key: 'exam',
    },
    {
      title: 'Class Average',
      dataIndex: 'average',
      key: 'average',
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
      <Card title="Teacher Subject Performance" className={isDarkMode ? 'bg-gray-800 text-gray-100' : ''}>
        <Form
          form={searchForm}
          onFinish={handleSearch}
          layout="vertical"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Form.Item
              label="Teacher Name"
              name="teacherName"
              rules={[{ required: true, message: 'Please enter teacher name' }]}
            >
              <Input placeholder="Enter teacher name" />
            </Form.Item>

            <Form.Item
              label="Subject"
              name="subject"
              rules={[{ required: true, message: 'Please enter subject' }]}
            >
              <Input placeholder="Enter subject (e.g., Mathematics)" />
            </Form.Item>

            <Form.Item
              label="Class"
              name="class"
              rules={[{ required: true, message: 'Please enter class' }]}
            >
              <Input placeholder="Enter class (e.g., 10B)" />
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
          </div>

          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />} loading={loading}>
              View Performance
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Results Display */}
      {performanceData && (
        <>
          {/* Performance Summary */}
          <Card 
            title="Performance Summary" 
            className={isDarkMode ? 'bg-gray-800 text-gray-100' : ''}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <p className="text-sm opacity-75">Teacher</p>
                <p className="text-lg font-semibold">{performanceData.teacherName}</p>
              </div>
              <div>
                <p className="text-sm opacity-75">Subject</p>
                <p className="text-lg font-semibold">{performanceData.subject}</p>
              </div>
              <div>
                <p className="text-sm opacity-75">Class</p>
                <p className="text-lg font-semibold">{performanceData.class}</p>
              </div>
              <div>
                <p className="text-sm opacity-75">Overall Average</p>
                <p className="text-lg font-semibold">{performanceData.overallAverage}%</p>
              </div>
            </div>
          </Card>

          {/* Performance Progression Table */}
          <Card 
            title="Performance Progression"
            className={isDarkMode ? 'bg-gray-800 text-gray-100' : ''}
          >
            <Table
              columns={progressionColumns}
              dataSource={performanceData.progression}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} results`
              }}
              loading={loading}
            />
          </Card>

          {/* Performance Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card 
              title="Performance Trend" 
              className={isDarkMode ? 'bg-gray-800 text-gray-100' : ''}
            >
              <Line 
                {...{
                  data: performanceData.trendData,
                  xField: 'period',
                  yField: 'average',
                  point: {
                    size: 5,
                    shape: 'diamond',
                  },
                  label: {
                    style: {
                      fill: isDarkMode ? '#fff' : '#000',
                    },
                  },
                  tooltip: {
                    formatter: (datum) => {
                      return { name: 'Average', value: `${datum.average}%` };
                    },
                  },
                }}
              />
            </Card>
            <Card 
              title="Pass Rate Distribution" 
              className={isDarkMode ? 'bg-gray-800 text-gray-100' : ''}
            >
              <Column 
                {...{
                  data: performanceData.passRateData,
                  xField: 'period',
                  yField: 'rate',
                  label: {
                    position: 'middle',
                    style: {
                      fill: isDarkMode ? '#fff' : '#000',
                    },
                  },
                  meta: {
                    rate: {
                      alias: 'Pass Rate',
                      formatter: (val) => `${val}%`,
                    },
                  },
                }}
              />
            </Card>
          </div>
        </>
      )}

      {/* Download Form */}
      <Card title="Download Performance Report" className={isDarkMode ? 'bg-gray-800 text-gray-100' : ''}>
        <Form
          form={downloadForm}
          onFinish={handleDownload}
          layout="vertical"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Form.Item
              label="Teacher Name"
              name="teacherName"
              rules={[{ required: true, message: 'Please enter teacher name' }]}
            >
              <Input placeholder="Enter teacher name" />
            </Form.Item>

            <Form.Item
              label="Subject"
              name="subject"
              rules={[{ required: true, message: 'Please enter subject' }]}
            >
              <Input placeholder="Enter subject" />
            </Form.Item>

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

export default TeacherStats;
