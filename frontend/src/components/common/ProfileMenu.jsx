import React from 'react';
import { Menu, Dropdown, Button } from 'antd';
import { UserOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const ProfileMenu = () => {
  const navigate = useNavigate();

  const handleMenuClick = ({ key }) => {
    switch (key) {
      case 'profile':
        navigate('/profile');
        break;
      case 'settings':
        navigate('/settings');
        break;
      case 'logout':
        // Add logout logic here
        navigate('/login');
        break;
      default:
        break;
    }
  };

  const menu = (
    <Menu 
      onClick={handleMenuClick}
      className="w-48 dark:bg-gray-800 dark:text-white"
    >
      <Menu.Item 
        key="profile" 
        icon={<UserOutlined />}
        className="dark:text-white dark:hover:bg-gray-700"
      >
        <span>Profile</span>
      </Menu.Item>
      <Menu.Item 
        key="settings" 
        icon={<SettingOutlined />}
        className="dark:text-white dark:hover:bg-gray-700"
      >
        <span>Settings</span>
      </Menu.Item>
      <Menu.Divider className="dark:bg-gray-700" />
      <Menu.Item 
        key="logout" 
        icon={<LogoutOutlined />} 
        danger
        className="dark:hover:bg-red-900"
      >
        <span>Logout</span>
      </Menu.Item>
    </Menu>
  );

  return (
    <Dropdown 
      overlay={menu} 
      placement="bottomRight" 
      arrow={{ pointAtCenter: true }}
      trigger={['click']}
    >
      <div className="flex items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
          <span className="text-white font-medium">
            JD
          </span>
        </div>
        <div className="ml-2 hidden md:block">
          <div className="text-sm font-medium dark:text-white">John Doe</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Admin</div>
        </div>
      </div>
    </Dropdown>
  );
};

export default ProfileMenu;
