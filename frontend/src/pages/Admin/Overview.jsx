import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin } from 'antd';
import { 
  UsergroupAddOutlined,
  UserOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  BookOutlined
} from '@ant-design/icons';
import axios from '../../utils/axios';
import { useTheme } from '@/contexts/ThemeContext';

const Overview = () => {
  const { isDarkMode } = useTheme();
  const [stats, setStats] = useState({
    students: { total: 0 },
    teachers: { total: 0 },
    subjects: { total: 0 },
    indiscipline: { total: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/dashboard/stats/basic');
        setStats(response.data.stats);
        setError(null);
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError('Failed to load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const cards = [
    {
      title: 'Total Students',
      value: stats.students.total,
      icon: <UsergroupAddOutlined style={{ fontSize: '24px', color: '#1890ff' }} />,
      color: '#1890ff'
    },
    {
      title: 'Total Teachers',
      value: stats.teachers.total,
      icon: <UserOutlined style={{ fontSize: '24px', color: '#52c41a' }} />,
      color: '#52c41a'
    },
    {
      title: 'Total Subjects',
      value: stats.subjects.total,
      icon: <BookOutlined style={{ fontSize: '24px', color: '#722ed1' }} />,
      color: '#722ed1'
    },
    {
      title: 'Indiscipline Cases',
      value: stats.indiscipline.total,
      icon: <WarningOutlined style={{ fontSize: '24px', color: '#faad14' }} />,
      color: '#faad14'
    }
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
      
      <Row gutter={[16, 16]}>
        {cards.map((card, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card
              className={`h-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
              bodyStyle={{ padding: '24px' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  {card.icon}
                </div>
              </div>
              <Statistic
                title={
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                    {card.title}
                  </span>
                }
                value={card.value}
                valueStyle={{ 
                  color: isDarkMode ? '#fff' : '#000',
                  fontSize: '24px',
                  fontWeight: 'bold'
                }}
                prefix={loading && <Spin size="small" className="mr-2" />}
              />
              {error && (
                <div className="text-red-500 text-sm mt-2">
                  Failed to load data
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>

      {/* Recent Activity Section - We can add this later */}
      {/* <Card className="mt-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        // Activity content will go here
      </Card> */}
    </div>
  );
};

export default Overview;
