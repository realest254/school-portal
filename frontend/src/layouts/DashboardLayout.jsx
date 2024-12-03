import React from 'react';
import PropTypes from 'prop-types';
import { Layout } from 'antd';
import { useTheme } from '@/contexts/ThemeContext';

const { Header, Sider, Content } = Layout;

const DashboardLayout = ({ sidebar: Sidebar, navbar: Navbar, children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const { isDarkMode } = useTheme();

  const handleMenuClick = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <Layout className="h-screen overflow-hidden">
      <Sider
        trigger={null}
        collapsible
        collapsed={sidebarCollapsed}
        width={256}
        collapsedWidth={80}
        className={`fixed left-0 h-screen ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg z-20`}
      >
        {Sidebar && <Sidebar collapsed={sidebarCollapsed} />}
      </Sider>

      <Layout className={`ml-[${sidebarCollapsed ? '80px' : '256px'}]`}>
        <Header 
          className={`fixed right-0 ${sidebarCollapsed ? 'left-[80px]' : 'left-[256px]'} top-0 p-0 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm z-10`}
          style={{ height: '64px', lineHeight: 'normal', padding: 0 }}
        >
          {Navbar && <Navbar onMenuClick={handleMenuClick} />}
        </Header>

        <Content 
          className={`mt-16 p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}
          style={{
            minHeight: 'calc(100vh - 64px)',
            marginTop: '64px',
            overflow: 'auto',
            height: 'calc(100vh - 64px)',
          }}
        >
          <div className="h-full overflow-auto">
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

DashboardLayout.propTypes = {
  sidebar: PropTypes.func,
  navbar: PropTypes.func,
  children: PropTypes.node.isRequired
};

export default DashboardLayout;
