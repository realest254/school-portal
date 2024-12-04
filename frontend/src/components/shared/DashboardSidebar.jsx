import React from 'react';
import { NavLink } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useTheme } from '@/contexts/ThemeContext';
import { dashboardConfig } from '@/config/dashboard.config';

const DashboardSidebar = ({ collapsed = false, userRole }) => {
  const { isDarkMode } = useTheme();
  const config = dashboardConfig[userRole];
  
  if (!config) return null;

  return (
    <div className={`h-full ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} shadow-lg`}>
      {/* Logo */}
      <div className={`flex items-center justify-center h-16 ${isDarkMode ? 'border-b border-gray-700' : 'border-b'}`}>
        <h1 className={`text-xl font-bold ${collapsed ? 'hidden' : 'block'}`}>
          {config.title}
        </h1>
        {collapsed && (
          <span className="text-xl font-bold">{config.title[0]}</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="mt-4">
        {config.navigation.map((item) => (
          <NavLink
            key={item.path}
            to={`/${userRole}/${item.path}`}
            className={({ isActive }) => `
              flex items-center px-4 py-2 my-1 mx-2 rounded-lg transition-colors
              ${isActive 
                ? (isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900')
                : (isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100')
              }
            `}
          >
            {item.icon && (
              <span className="mr-3">
                {React.createElement(item.icon, {
                  className: 'h-5 w-5',
                  'aria-hidden': 'true'
                })}
              </span>
            )}
            {!collapsed && (
              <span>{item.name}</span>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

DashboardSidebar.propTypes = {
  collapsed: PropTypes.bool,
  userRole: PropTypes.oneOf(['admin', 'teacher', 'student']).isRequired
};

export default DashboardSidebar;
