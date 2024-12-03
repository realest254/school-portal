import React from 'react';
import { useTheme } from '../../../../../contexts/ThemeContext';

const StudentsManagement = () => {
  const { isDarkMode: isDark } = useTheme();

  return (
    <div className={`p-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
      <h1 className="text-2xl font-bold mb-4">Students Management</h1>
      <p>Students management content will be implemented here.</p>
    </div>
  );
};

export default StudentsManagement;
