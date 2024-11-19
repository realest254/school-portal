import React from 'react';
import { Grid, Users, UserCheck, AlertTriangle, BarChart2, Settings, Bell } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ collapsed }) => {
  const menuItems = [
    { icon: <Grid size={20} />, label: 'Dashboard Overview', path: '/admin/overview' },
    { icon: <Users size={20} />, label: 'Students Management', path: '/admin/students' },
    { icon: <UserCheck size={20} />, label: 'Teachers Management', path: '/admin/teachers' },
    { icon: <AlertTriangle size={20} />, label: 'Indiscipline Cases', path: '/admin/discipline' },
    { icon: <Bell size={20} />, label: 'Notifications', path: '/admin/notifications' },
    { icon: <BarChart2 size={20} />, label: 'Reports and Stats', path: '/admin/reports' },
    { icon: <Settings size={20} />, label: 'Settings', path: '/admin/settings' },
  ];

  return (
    <div className={`fixed h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${
      collapsed ? 'w-[80px]' : 'w-[250px]'
    }`}>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className={`font-semibold text-gray-900 dark:text-white transition-all duration-300 ${
          collapsed ? 'text-center text-sm' : 'text-xl'
        }`}>
          {collapsed ? 'SP' : 'School Portal'}
        </h1>
      </div>
      
      <nav className="mt-4">
        {menuItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            className={({ isActive }) => `
              flex items-center px-4 py-3 text-gray-600 dark:text-gray-300
              hover:bg-gray-100 dark:hover:bg-gray-700
              ${isActive ? 'bg-blue-50 dark:bg-gray-700 text-blue-600 dark:text-white' : ''}
              transition-colors duration-200
            `}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            {!collapsed && (
              <span className="ml-3 text-sm font-medium">
                {item.label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;