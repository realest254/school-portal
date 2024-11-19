import React from 'react';
import { Layout, Space, Button } from 'antd';
import ThemeToggle from './ThemeToggle';
import ProfileMenu from './ProfileMenu';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';

const { Header } = Layout;

const Navbar = ({ collapsed, toggleCollapsed }) => {
  return (
    <Header className="flex items-center justify-between px-4 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Left side */}
      <div className="flex items-center">
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={toggleCollapsed}
          className="mr-4 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white"
        />
        <h1 className="text-lg font-semibold text-gray-800 dark:text-white">School Portal</h1>
      </div>

      {/* Right side */}
      <Space size="large" className="flex items-center">
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
          <ProfileMenu />
        </div>
      </Space>
    </Header>
  );
};

export default Navbar;
