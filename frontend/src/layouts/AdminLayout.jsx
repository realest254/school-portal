import React from 'react';
import DashboardLayout from './DashboardLayout';
import AdminSidebar from '../components/dashboards/admin/Sidebar';
import AdminNav from '../components/dashboards/admin/Nav';
import MainContent from '../components/dashboards/admin/MainContent';

const AdminLayout = () => {
  return (
    <DashboardLayout
      sidebar={AdminSidebar}
      navbar={AdminNav}
    >
      <MainContent />
    </DashboardLayout>
  );
};

export default AdminLayout;
