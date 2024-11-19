import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import Nav from '../components/dashboards/admin/Nav';

const DashboardContent = ({ sidebar: Sidebar, children, sidebarWidth = '250px' }) => {
  const [collapsed, setCollapsed] = useState(false);
  const actualSidebarWidth = collapsed ? '80px' : sidebarWidth;
  const { isDarkMode: isDark, toggleTheme } = useTheme();

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div 
        className="fixed h-full transition-all duration-300 ease-in-out" 
        style={{ width: actualSidebarWidth }}
      >
        <Sidebar collapsed={collapsed} />
      </div>

      {/* Main Content Area */}
      <div 
        className="flex flex-col min-h-screen transition-all duration-300 ease-in-out" 
        style={{ marginLeft: actualSidebarWidth, width: `calc(100% - ${actualSidebarWidth})` }}
      >
        {/* Navigation */}
        <div className="sticky top-0 z-10">
          <Nav onMenuClick={toggleCollapsed} onThemeToggle={toggleTheme} isDark={isDark} />
        </div>
        
        {/* Main Content */}
        <div className="flex-grow p-6 overflow-auto">
          <div className="max-w-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

DashboardContent.propTypes = {
  sidebar: PropTypes.elementType.isRequired,
  children: PropTypes.node.isRequired,
  sidebarWidth: PropTypes.string
};

const DashboardLayout = (props) => {
  return (
    <ThemeProvider>
      <DashboardContent {...props} />
    </ThemeProvider>
  );
};

DashboardLayout.propTypes = {
  sidebar: PropTypes.elementType.isRequired,
  children: PropTypes.node.isRequired,
  sidebarWidth: PropTypes.string
};

export default DashboardLayout;
