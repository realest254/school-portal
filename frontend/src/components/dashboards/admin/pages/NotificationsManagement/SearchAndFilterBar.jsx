import React from 'react';
import { Input, Button, Space, Select, DatePicker, Form } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import { useTheme } from '../../../../../contexts/ThemeContext';

const { RangePicker } = DatePicker;

const SearchAndFilterBar = ({ onSearch, onAdd }) => {
  const { isDarkMode } = useTheme();
  const [form] = Form.useForm();

  const handleSearch = (values) => {
    onSearch(values);
  };

  return (
    <Form form={form} onFinish={handleSearch}>
      <Space direction="vertical" size="middle" style={{ width: '100%', marginBottom: 16 }}>
        <Space wrap>
          <Form.Item name="search" style={{ marginBottom: 0 }}>
            <Input
              placeholder="Search notifications..."
              prefix={<SearchOutlined />}
              style={{ width: 250 }}
              onChange={(e) => onSearch({ search: e.target.value })}
            />
          </Form.Item>

          <Form.Item name="priority" style={{ marginBottom: 0 }}>
            <Select
              placeholder="Priority"
              style={{ width: 120 }}
              onChange={(value) => onSearch({ priority: value })}
              allowClear
            >
              <Select.Option value="high">High</Select.Option>
              <Select.Option value="medium">Medium</Select.Option>
              <Select.Option value="low">Low</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="status" style={{ marginBottom: 0 }}>
            <Select
              placeholder="Status"
              style={{ width: 120 }}
              onChange={(value) => onSearch({ status: value })}
              allowClear
            >
              <Select.Option value="active">Active</Select.Option>
              <Select.Option value="expired">Expired</Select.Option>
              <Select.Option value="scheduled">Scheduled</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="dateRange" style={{ marginBottom: 0 }}>
            <RangePicker
              onChange={(dates) => {
                if (dates) {
                  onSearch({
                    startDate: dates[0].format('YYYY-MM-DD'),
                    endDate: dates[1].format('YYYY-MM-DD')
                  });
                } else {
                  onSearch({ startDate: null, endDate: null });
                }
              }}
            />
          </Form.Item>

          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onAdd}
          >
            Add Notification
          </Button>
        </Space>
      </Space>
    </Form>
  );
};

export default SearchAndFilterBar;
