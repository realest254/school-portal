import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import TeacherDashboard from '../pages/teacher/Dashboard';

const TeacherLayout = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Teacher Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-indigo-600">Teacher Portal</h1>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Teacher Routes */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="dashboard" element={<TeacherDashboard />} />
          {/* Add more teacher routes here */}
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default TeacherLayout;
