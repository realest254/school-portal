import React, { createContext, useContext, useState, useEffect } from 'react';
import { ConfigProvider, theme } from 'antd';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  useEffect(() => {
    const applyTheme = () => {
      // Apply theme class in a single batch
      document.documentElement.className = isDarkMode ? 'dark' : '';
      localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    };

    // Use RAF to ensure smooth transition
    requestAnimationFrame(applyTheme);
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  // Configure Ant Design theme
  const antTheme = {
    algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: 'var(--ant-primary-color)',
      colorBgContainer: 'var(--ant-component-bg)',
      colorBorder: 'var(--ant-border-color)',
      borderRadius: 6,
    },
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <ConfigProvider theme={antTheme}>
        {children}
      </ConfigProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
