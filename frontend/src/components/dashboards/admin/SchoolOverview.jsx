import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography } from 'antd';
import { 
  TeamOutlined, 
  UserOutlined,
  TrophyOutlined,
  RiseOutlined 
} from '@ant-design/icons';
import { useTheme } from '../../../contexts/ThemeContext';
import axios from '../../../utils/axios';

const { Text } = Typography;

const SchoolOverview = () => {
  const { isDarkMode } = useTheme();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    averagePerformance: 0,
    yearOverYearGrowth: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/dashboard/stats/overview');
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching school stats:', error);
      }
    };

    fetchStats();
  }, []);

  const items = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: <TeamOutlined style={{ fontSize: 24, color: isDarkMode ? '#1668dc' : '#1890ff' }} />,
      bgColor: '#e6f4ff',
      borderColor: '#91caff'
    },
    {
      title: 'Total Teachers',
      value: stats.totalTeachers,
      icon: <UserOutlined style={{ fontSize: 24, color: isDarkMode ? '#52c41a' : '#52c41a' }} />,
      bgColor: '#f0f9eb',
      borderColor: '#b7eb8f'
    },
    {
      title: 'School Average',
      value: stats.averagePerformance,
      icon: <TrophyOutlined style={{ fontSize: 24, color: isDarkMode ? '#faad14' : '#faad14' }} />,
      bgColor: '#fff7e6',
      borderColor: '#ffd591',
      suffix: '%'
    },
    {
      title: 'Annual Growth',
      value: stats.yearOverYearGrowth,
      icon: <RiseOutlined style={{ fontSize: 24, color: isDarkMode ? '#13c2c2' : '#13c2c2' }} />,
      bgColor: '#e6fffb',
      borderColor: '#87e8de',
      suffix: '%'
    }
  ];

  return (
    <Card 
      className={isDarkMode ? 'bg-gray-800' : undefined}
      style={{ 
        marginBottom: '24px',
        boxShadow: isDarkMode ? undefined : '0 2px 8px rgba(0,0,0,0.05)'
      }}
    >
      <Row gutter={[24, 24]}>
        {items.map((item, index) => (
          <Col xs={12} sm={12} md={6} key={index}>
            <Card 
              bordered={!isDarkMode}
              className={isDarkMode ? 'bg-gray-700' : undefined}
              bodyStyle={{ 
                padding: '20px 24px',
                backgroundColor: isDarkMode ? undefined : item.bgColor,
                border: isDarkMode ? undefined : `1px solid ${item.borderColor}`,
                borderRadius: '8px',
                transition: 'all 0.3s'
              }}
              style={{
                cursor: 'pointer',
                ':hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }
              }}
            >
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                {item.icon}
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  color: isDarkMode ? '#fff' : '#595959',
                  fontSize: '14px',
                  marginBottom: '8px',
                  whiteSpace: 'nowrap',
                  fontWeight: '500'
                }}>
                  {item.title}
                </div>
                <div style={{ 
                  color: isDarkMode ? '#fff' : '#262626',
                  fontSize: '24px',
                  fontWeight: '600',
                  lineHeight: '1.2'
                }}>
                  {item.value}{item.suffix}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </Card>
  );
};

export default SchoolOverview;
