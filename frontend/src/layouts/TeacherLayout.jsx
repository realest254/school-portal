import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import DashboardSidebar from '@/components/shared/DashboardSidebar';
import DashboardNav from '@/components/shared/DashboardNav';
import { TeacherProvider } from '@/contexts/TeacherContext';

// Import teacher pages
import Dashboard from '@/pages/teacher/Dashboard';
import GradesManagement from '@/pages/teacher/GradesManagement';

const TeacherLayout = () => {
  return (
    <TeacherProvider>
      <DashboardLayout
        sidebar={(props) => <DashboardSidebar {...props} userRole="teacher" />}
        navbar={(props) => <DashboardNav {...props} userRole="teacher" />}
      >
        <Routes>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="grades" element={<GradesManagement />} />
          
          {/* Default route */}
          <Route path="/" element={<Navigate to="dashboard" replace />} />
          {/* Catch all route */}
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </DashboardLayout>
    </TeacherProvider>
  );
};

export default TeacherLayout;
