import React from 'react';
import { Form, Input, Button, Select } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Search } from 'lucide-react';
import { useTheme } from '../../../../../contexts/ThemeContext';

const SearchAndFilterBar = ({ onSearch, onAddNew, classes = [] }) => {
  const [form] = Form.useForm();
  const { isDarkMode } = useTheme();

  const handleSearch = () => {
    form.validateFields().then(values => {
      const filters = {};
      
      // Search terms (will be combined in backend)
      if (values.searchTerm) {
        filters.search = values.searchTerm;
      }
      
      // Filters
      if (values.class) {
        filters.class = values.class;
      }
      if (values.status) {
        filters.status = values.status;
      }
      
      onSearch(filters);
    });
  };

  const handleReset = () => {
    form.resetFields();
    onSearch({});
  };

  const inputStyle = {
    backgroundColor: isDarkMode ? '#374151' : '#ffffff',
    borderColor: isDarkMode ? '#4B5563' : '#D1D5DB'
  };

  const inputClass = `h-10 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700'}`;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
      <Form form={form} layout="vertical" className="w-full">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Combined search field */}
            <Form.Item name="searchTerm" className="mb-0" label="Search">
              <Input
                placeholder="Search by name, email, or admission no."
                prefix={<Search className="text-gray-400" size={18} />}
                allowClear
                className={inputClass}
                style={inputStyle}
              />
            </Form.Item>
            
            {/* Filters */}
            <Form.Item name="class" className="mb-0" label="Class Filter">
              <Select
                placeholder="Filter by class"
                allowClear
                className={inputClass}
                style={inputStyle}
                options={classes.map(c => ({ label: c, value: c }))}
              />
            </Form.Item>

            <Form.Item name="status" className="mb-0" label="Status">
              <Select
                placeholder="Filter by status"
                allowClear
                className={inputClass}
                style={inputStyle}
                options={[
                  { label: 'Active', value: 'active' },
                  { label: 'Inactive', value: 'inactive' }
                ]}
              />
            </Form.Item>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-end">
            <Button
              onClick={handleReset}
              className={`${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-700'}`}
              style={inputStyle}
            >
              Reset
            </Button>
            <Button 
              type="primary" 
              onClick={handleSearch}
              className={`${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`}
            >
              Search
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onAddNew}
              className="bg-blue-500 hover:bg-blue-600 border-0"
            >
              Add Student
            </Button>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default SearchAndFilterBar;
