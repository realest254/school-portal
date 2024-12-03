import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import DashboardSidebar from '@/components/shared/DashboardSidebar';
import DashboardNav from '@/components/shared/DashboardNav';

// Import teacher pages
import Dashboard from '@/pages/teacher/Dashboard';

const TeacherLayout = () => {
  return (
    <DashboardLayout
      sidebar={(props) => <DashboardSidebar {...props} userRole="teacher" />}
      navbar={(props) => <DashboardNav {...props} userRole="teacher" />}
    >
      <Routes>
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Default route */}
        <Route path="/" element={<Navigate to="dashboard" replace />} />
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default TeacherLayout;
