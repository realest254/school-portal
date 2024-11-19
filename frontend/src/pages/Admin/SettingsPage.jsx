import React, { useState } from 'react';
import { Card, Form, Input, Button, Switch, Divider, message, Tabs } from 'antd';
import { useTheme } from '../../contexts/ThemeContext';
import { KeyIcon, UserIcon, PaletteIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const SettingsPage = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [accountForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const handleAccountUpdate = async (values) => {
    setLoading(true);
    try {
      // TODO: API call to update account details
      console.log('Account update values:', values);
      message.success('Account details updated successfully');
      accountForm.resetFields();
    } catch (error) {
      console.error('Error updating account:', error);
      message.error('Failed to update account details');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (values) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ 
        password: values.newPassword 
      });

      if (error) {
        throw error;
      }

      message.success('Password changed successfully');
      passwordForm.resetFields();
    } catch (error) {
      console.error('Error changing password:', error);
      message.error(error.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const items = [
    {
      key: 'account',
      label: (
        <span className="flex items-center gap-2">
          <UserIcon size={16} />
          Account Settings
        </span>
      ),
      children: (
        <Form
          form={accountForm}
          layout="vertical"
          onFinish={handleAccountUpdate}
          className="max-w-lg"
        >
          <Form.Item
            label="Full Name"
            name="fullName"
            rules={[{ required: true, message: 'Please enter your full name' }]}
          >
            <Input placeholder="Enter your full name" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input placeholder="Enter your email" />
          </Form.Item>

          <Form.Item
            label="Phone Number"
            name="phone"
            rules={[{ required: true, message: 'Please enter your phone number' }]}
          >
            <Input placeholder="Enter your phone number" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Update Account Details
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'security',
      label: (
        <span className="flex items-center gap-2">
          <KeyIcon size={16} />
          Security
        </span>
      ),
      children: (
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordChange}
          className="max-w-lg"
        >
          <Form.Item
            label="Current Password"
            name="currentPassword"
            rules={[{ required: true, message: 'Please enter your current password' }]}
          >
            <Input.Password placeholder="Enter current password" />
          </Form.Item>

          <Form.Item
            label="New Password"
            name="newPassword"
            rules={[
              { required: true, message: 'Please enter your new password' },
              { min: 8, message: 'Password must be at least 8 characters' },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
              },
            ]}
          >
            <Input.Password placeholder="Enter new password" />
          </Form.Item>

          <Form.Item
            label="Confirm New Password"
            name="confirmPassword"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Please confirm your new password' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('The two passwords do not match'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Confirm new password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Change Password
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'appearance',
      label: (
        <span className="flex items-center gap-2">
          <PaletteIcon size={16} />
          Appearance
        </span>
      ),
      children: (
        <div className="max-w-lg">
          <div className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Dark Mode</h3>
              <p className="text-gray-500 dark:text-gray-400">
                Toggle between light and dark themes
              </p>
            </div>
            <Switch
              checked={isDarkMode}
              onChange={toggleTheme}
              className={isDarkMode ? 'bg-blue-600' : ''}
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Manage your account settings and preferences
        </p>
      </div>

      <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
        <Tabs
          defaultActiveKey="account"
          items={items}
          className={isDarkMode ? 'text-white' : ''}
        />
      </Card>
    </div>
  );
};

export default SettingsPage;
