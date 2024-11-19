import React from 'react';
import { Form, Input, Button, Space } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Search } from 'lucide-react';
import { useTheme } from '../../../../../contexts/ThemeContext';

const SearchAndFilterBar = ({ onSearch, onAddNew }) => {
  const [form] = Form.useForm();
  const { isDarkMode } = useTheme();

  const handleSearch = () => {
    form.validateFields().then(values => {
      const hasValue = Object.values(values).some(value => value && value.trim() !== '');
      if (!hasValue) {
        return;
      }
      onSearch(values.search);
    });
  };

  const handleReset = () => {
    form.resetFields();
    onSearch('');
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
      <Form form={form} layout="vertical" className="w-full">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex flex-col sm:flex-row gap-4">
            <Form.Item name="search" className="flex-1 mb-0 min-w-[150px]">
              <Input
                placeholder="Search teachers..."
                prefix={<Search className="text-gray-400" size={18} />}
                allowClear
                className={`h-10 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700'}`}
                style={{
                  backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                  borderColor: isDarkMode ? '#4B5563' : '#D1D5DB'
                }}
              />
            </Form.Item>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onAddNew}
            className="bg-blue-500 hover:bg-blue-600 border-0"
          >
            Add Teacher
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default SearchAndFilterBar;
