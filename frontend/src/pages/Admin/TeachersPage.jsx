import React from 'react';
import { Card } from 'antd';
import TeachersManagement from '../../components/dashboards/admin/pages/TeachersManagement';
import { useTheme } from '../../contexts/ThemeContext';

const TeachersPage = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className="p-6">
      <Card
        title={
          <span className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            Teachers Management
          </span>
        }
        styles={{
          body: {
            padding: '1.5rem',
          },
        }}
        className={`
          shadow-sm
          ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
        `}
      >
        <TeachersManagement />
      </Card>
    </div>
  );
};

export default TeachersPage;
