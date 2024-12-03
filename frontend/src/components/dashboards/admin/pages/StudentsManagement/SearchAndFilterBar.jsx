import React from 'react';
import { Form, Input, Button, Select, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { Search } from 'lucide-react';
import { useTheme } from '../../../../../contexts/ThemeContext';

const { Text } = Typography;

const SearchAndFilterBar = ({ onSearch, onAddNew }) => {
  const [form] = Form.useForm();
  const { isDarkMode } = useTheme();

  const handleSearch = () => {
    form.validateFields().then(values => {
      const filters = {};
      
      if (values.searchTerm) {
        filters.search = values.searchTerm;
      }
      
      if (values.grade) {
        filters.grade = values.grade;
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

  return (
    <div 
      className={`
        p-6 rounded-lg
        ${isDarkMode 
          ? 'bg-gray-800 border border-gray-700' 
          : 'bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200'
        }
      `}
      style={{
        background: isDarkMode ? undefined : 'linear-gradient(to right, #ffffff, #f8fafc)'
      }}
    >
      <Form form={form} layout="vertical" className="w-full">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search field */}
            <Form.Item 
              name="searchTerm" 
              className="mb-0" 
              label={
                <Text 
                  className={`
                    text-sm font-medium
                    ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}
                  `}
                >
                  Search Students
                </Text>
              }
            >
              <Input
                placeholder="Search by name, ID, or email"
                prefix={
                  <Search 
                    className={`
                      mr-2
                      ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}
                    `} 
                    size={18} 
                  />
                }
                allowClear
                className={`
                  h-10
                  ${isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                  }
                `}
                style={{
                  borderRadius: '8px',
                  transition: 'all 0.3s ease',
                }}
                onFocus={(e) => {
                  e.target.style.backgroundColor = isDarkMode ? '#374151' : '#ffffff';
                  e.target.style.borderColor = isDarkMode ? '#4B5563' : '#3b82f6';
                  e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.backgroundColor = isDarkMode ? '#374151' : '#f9fafb';
                  e.target.style.borderColor = isDarkMode ? '#4B5563' : '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </Form.Item>

            {/* Grade filter */}
            <Form.Item 
              name="grade" 
              className="mb-0" 
              label={
                <Text 
                  className={`
                    text-sm font-medium
                    ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}
                  `}
                >
                  Grade Level
                </Text>
              }
            >
              <Select
                placeholder="Select grade"
                allowClear
                className={`
                  h-10
                  ${isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-gray-50 border-gray-200 text-gray-900'
                  }
                `}
                style={{
                  borderRadius: '8px',
                }}
                dropdownStyle={{
                  backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                  borderRadius: '8px',
                  border: `1px solid ${isDarkMode ? '#4B5563' : '#e5e7eb'}`,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                }}
                options={[
                  { value: '9', label: 'Grade 9' },
                  { value: '10', label: 'Grade 10' },
                  { value: '11', label: 'Grade 11' },
                  { value: '12', label: 'Grade 12' }
                ]}
              />
            </Form.Item>

            {/* Status filter */}
            <Form.Item 
              name="status" 
              className="mb-0" 
              label={
                <Text 
                  className={`
                    text-sm font-medium
                    ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}
                  `}
                >
                  Status
                </Text>
              }
            >
              <Select
                placeholder="Select status"
                allowClear
                className={`
                  h-10
                  ${isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-gray-50 border-gray-200 text-gray-900'
                  }
                `}
                style={{
                  borderRadius: '8px',
                }}
                dropdownStyle={{
                  backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                  borderRadius: '8px',
                  border: `1px solid ${isDarkMode ? '#4B5563' : '#e5e7eb'}`,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                }}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'pending', label: 'Pending' }
                ]}
              />
            </Form.Item>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-end mt-2">
            <Button
              onClick={handleReset}
              className={`
                px-4 h-9 rounded-md transition-all duration-200
                ${isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600' 
                  : 'bg-gray-100 border-gray-200 text-gray-600 hover:bg-gray-200 hover:text-gray-700'
                }
              `}
            >
              Reset
            </Button>
            <Button 
              type="primary"
              onClick={handleSearch}
              className={`
                px-4 h-9 rounded-md transition-all duration-200
                ${isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-blue-500 hover:bg-blue-600'
                }
              `}
              style={{
                border: 'none',
                boxShadow: isDarkMode ? 'none' : '0 2px 4px rgba(59, 130, 246, 0.1)',
              }}
            >
              Search
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={onAddNew}
              className={`
                px-4 h-9 rounded-md transition-all duration-200
                ${isDarkMode 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-green-500 hover:bg-green-600'
                }
              `}
              style={{
                border: 'none',
                boxShadow: isDarkMode ? 'none' : '0 2px 4px rgba(34, 197, 94, 0.1)',
              }}
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
