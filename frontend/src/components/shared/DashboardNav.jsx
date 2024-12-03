import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import { dashboardConfig } from '@/config/dashboard.config';
import PropTypes from 'prop-types';
import { Button, Dropdown, Badge, Space } from 'antd';
import { 
  BellOutlined, 
  MenuOutlined, 
  UserOutlined,
  SunOutlined,
  MoonOutlined,
  DownOutlined
} from '@ant-design/icons';

const DashboardNav = ({ onMenuClick, userRole }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [notifications] = useState(dashboardConfig[userRole]?.defaultNotifications || []);

  const notificationItems = {
    items: [
      {
        key: 'notifications',
        label: (
          <div className="p-4 min-w-[320px]">
            <h3 className="text-lg font-semibold mb-2">Notifications</h3>
            {notifications.length > 0 ? (
              <div className="space-y-2">
                {notifications.map((notification, index) => (
                  <div 
                    key={index} 
                    className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  >
                    {notification.message}
                  </div>
                ))}
              </div>
            ) : (
              <p>No new notifications</p>
            )}
          </div>
        ),
      },
    ],
  };

  const profileItems = {
    items: [
      {
        key: 'profile',
        label: <Link to={`/${userRole}/profile`}>Profile</Link>,
      },
      {
        key: 'settings',
        label: <Link to={`/${userRole}/settings`}>Settings</Link>,
      },
      {
        type: 'divider',
      },
      {
        key: 'logout',
        label: <Link to="/logout">Logout</Link>,
      },
    ],
  };

  return (
    <nav className={`px-4 py-3 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} shadow-md`}>
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={onMenuClick}
            className={isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'}
          />
        </div>

        {/* Right side */}
        <Space size="middle">
          <Button
            type="text"
            icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />}
            onClick={toggleTheme}
            className={isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'}
          />

          <Dropdown
            menu={notificationItems}
            placement="bottomRight"
            trigger={['click']}
            overlayClassName={isDarkMode ? 'ant-dropdown-dark' : ''}
          >
            <Badge count={notifications.length} size="small">
              <Button
                type="text"
                icon={<BellOutlined />}
                className={isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'}
              />
            </Badge>
          </Dropdown>

          <Dropdown
            menu={profileItems}
            placement="bottomRight"
            trigger={['click']}
            overlayClassName={isDarkMode ? 'ant-dropdown-dark' : ''}
          >
            <Button
              type="text"
              className={isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-800 hover:bg-gray-100'}
            >
              <Space>
                <UserOutlined />
                <DownOutlined />
              </Space>
            </Button>
          </Dropdown>
        </Space>
      </div>
    </nav>
  );
};

DashboardNav.propTypes = {
  onMenuClick: PropTypes.func.isRequired,
  userRole: PropTypes.oneOf(['admin', 'teacher', 'student']).isRequired
};

export default DashboardNav;
