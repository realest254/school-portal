import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';
import DashboardSidebar from '@/components/shared/DashboardSidebar';
import DashboardNav from '@/components/shared/DashboardNav';

// Import admin pages from pages/Admin directory
import Overview from '@/pages/Admin/Overview';
import StudentsPage from '@/pages/Admin/StudentsPage';
import TeachersPage from '@/pages/Admin/TeachersPage';
import AcademicsPage from '@/pages/Admin/AcademicsPage';
import IndisciplinePage from '@/pages/Admin/IndisciplinePage';
import SettingsPage from '@/pages/Admin/SettingsPage';
import NotificationsPage from '@/pages/Admin/NotificationsPage';
import ReportsPage from '@/pages/Admin/ReportsPage';

const AdminLayout = () => {
  console.log('AdminLayout rendering');
  
  return (
    <DashboardLayout
      sidebar={(props) => {
        console.log('Sidebar props:', props);
        return <DashboardSidebar {...props} userRole="admin" />;
      }}
      navbar={(props) => {
        console.log('Navbar props:', props);
        return <DashboardNav {...props} userRole="admin" />;
      }}
    >
      <Routes>
        <Route path="dashboard" element={<Overview />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="teachers" element={<TeachersPage />} />
        <Route path="academics" element={<AcademicsPage />} />
        <Route path="indiscipline" element={<IndisciplinePage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        
        {/* Default route */}
        <Route path="/" element={<Navigate to="dashboard" replace />} />
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default AdminLayout;
