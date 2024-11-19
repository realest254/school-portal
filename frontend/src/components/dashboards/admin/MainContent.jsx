import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Overview from '../../../pages/Admin/Overview';
import StudentsPage from '../../../pages/Admin/StudentsPage';
import TeachersPage from '../../../pages/Admin/TeachersPage';
import IndisciplinePage from '../../../pages/Admin/IndisciplinePage';
import ReportsPage from '../../../pages/Admin/ReportsPage';
import NotificationsPage from '../../../pages/Admin/NotificationsPage';
import SettingsPage from '../../../pages/Admin/SettingsPage';

const MainContent = () => {
  return (
    <Routes>
      <Route path="/overview" element={<Overview />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/students" element={<StudentsPage/>} />
      <Route path="/teachers" element={<TeachersPage />} />
      <Route path="/discipline" element={<IndisciplinePage />} />
      <Route path="/notifications" element={<NotificationsPage />} />
      <Route path="/reports" element={<ReportsPage />} />
    </Routes>
  );
};

export default MainContent;
