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
    <Layout className="min-h-screen">
      <Sider
        trigger={null}
        collapsible
        collapsed={sidebarCollapsed}
        width={256}
        collapsedWidth={80}
        className={`fixed left-0 top-0 h-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg z-20`}
      >
        {Sidebar && <Sidebar collapsed={sidebarCollapsed} />}
      </Sider>

      <Layout style={{ marginLeft: sidebarCollapsed ? '80px' : '256px', minHeight: '100vh' }}>
        <Header 
          className={`fixed top-0 right-0 left-0 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm z-10`}
          style={{ height: '64px', padding: 0 }}
        >
          {Navbar && <Navbar onMenuClick={handleMenuClick} />}
        </Header>

        <Content 
          className={`${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'} p-6`}
          style={{
            marginTop: '64px',
            minHeight: 'calc(100vh - 64px)',
            overflow: 'auto'
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
