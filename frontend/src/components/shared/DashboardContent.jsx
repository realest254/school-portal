import React from 'react';
import PropTypes from 'prop-types';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';

const DashboardContent = ({ routes, userRole }) => {
  const { isDarkMode: isDark } = useTheme();

  return (
    <div className={`p-6 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
      <Routes>
        {routes.map(({ path, element: Element }) => (
          <Route 
            key={path} 
            path={path} 
            element={<Element />} 
          />
        ))}
        
        <Route 
          path="/" 
          element={<Navigate to={`/${userRole}/dashboard`} replace />} 
        />
      </Routes>
    </div>
  );
};

DashboardContent.propTypes = {
  routes: PropTypes.arrayOf(
    PropTypes.shape({
      path: PropTypes.string.isRequired,
      element: PropTypes.elementType.isRequired
    })
  ).isRequired,
  userRole: PropTypes.oneOf(['admin', 'teacher', 'student']).isRequired
};

export default DashboardContent;
