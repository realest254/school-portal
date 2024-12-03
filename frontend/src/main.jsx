import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { SnackbarProvider } from 'notistack';
import { AuthProvider } from './contexts/AuthContext';
import 'antd/dist/reset.css'
import './index.css'
import App from './App'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'

const ThemedApp = () => {
  const { isDarkMode } = useTheme();
  
  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#3b82f6',
          borderRadius: 6,
        },
      }}
    >
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <SnackbarProvider maxSnack={3}>
          <ThemedApp />
        </SnackbarProvider>
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>
)
