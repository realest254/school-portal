import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import LoginForm from './components/LoginForm';
import AdminLayout from './layouts/AdminLayout';
import TeacherLayout from './layouts/TeacherLayout';
import StudentLayout from './layouts/StudentLayout';
import Unauthorized from './pages/Unauthorized';
import LoadingScreen from './components/LoadingScreen';
import { Toaster } from 'react-hot-toast';

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        {/* Public route - Login */}
        <Route path="/login" element={<LoginForm />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

        {/* Protected Admin routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        />

        {/* Protected Teacher routes */}
        <Route
          path="/teacher/*"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherLayout />
            </ProtectedRoute>
          }
        />

        {/* Protected Student routes */}
        <Route
          path="/student/*"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentLayout />
            </ProtectedRoute>
          }
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default App;
