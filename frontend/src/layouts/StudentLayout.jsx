import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import StudentDashboard from '../pages/student/Dashboard';
import { useTheme } from '@/contexts/ThemeContext';

const { Header, Content } = Layout;

const StudentLayout = () => {
  const { isDarkMode } = useTheme();

  return (
    <Layout className="min-h-screen">
      <Header className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm px-4`}>
        <div className="h-16 flex items-center">
          <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-indigo-600'}`}>
            Student Portal
          </h1>
        </div>
      </Header>

      <Content className={`mx-auto w-full max-w-7xl p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <Routes>
          <Route path="dashboard" element={<StudentDashboard />} />
          {/* Add more student routes here */}
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </Content>
    </Layout>
  );
};

export default StudentLayout;
