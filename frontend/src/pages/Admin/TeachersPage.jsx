import React from 'react';
import { Card } from 'antd';
import TeachersManagement from '../../components/dashboards/admin/pages/TeachersManagement';
import { useTheme } from '../../contexts/ThemeContext';

const TeachersPage = () => {
  const { isDarkMode } = useTheme();

  return (
    <div 
      className="p-6"
      style={{
        background: isDarkMode ? undefined : 'linear-gradient(to bottom, #f0f2f5, #fafafa)',
        minHeight: '100vh'
      }}
    >
      <Card
        title={
          <span className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            Teachers Management
          </span>
        }
        styles={{
          header: {
            background: isDarkMode ? undefined : '#f8fafc',
            borderBottom: isDarkMode ? undefined : '1px solid #e5e7eb',
            padding: '1rem 1.5rem',
          },
          body: {
            padding: '1.5rem',
            background: isDarkMode ? undefined : '#ffffff',
          },
        }}
        className={`
          ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
          shadow-lg
          rounded-lg
          hover:shadow-xl
          transition-shadow
          duration-300
        `}
      >
        <TeachersManagement />
      </Card>
    </div>
  );
};

export default TeachersPage;
