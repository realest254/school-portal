import React, { useState, useEffect } from 'react';
import { Card, Typography, Space } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AreaChartOutlined } from '@ant-design/icons';
import { useTheme } from '../../../contexts/ThemeContext';
import axios from '../../../utils/axios';

const { Text } = Typography;

const PerformanceChart = () => {
  const { isDarkMode } = useTheme();
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        const response = await axios.get('/dashboard/stats/performance-trend');
        setData(response.data);
      } catch (error) {
        console.error('Error fetching performance data:', error);
      }
    };

    fetchPerformanceData();
  }, []);

  return (
    <Card
      title={
        <Space>
          <AreaChartOutlined style={{ color: isDarkMode ? '#fff' : '#1890ff' }} />
          <Text strong style={{ color: isDarkMode ? '#fff' : '#262626' }}>
            Performance Trend
          </Text>
        </Space>
      }
      className={isDarkMode ? 'bg-gray-800' : undefined}
      style={{
        boxShadow: isDarkMode ? undefined : '0 2px 8px rgba(0,0,0,0.05)',
        borderRadius: '8px'
      }}
    >
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={isDarkMode ? 'rgba(255,255,255,0.1)' : '#f0f0f0'} 
            />
            <XAxis 
              dataKey="year" 
              stroke={isDarkMode ? '#fff' : '#595959'}
              tick={{ fill: isDarkMode ? '#fff' : '#595959' }}
            />
            <YAxis 
              stroke={isDarkMode ? '#fff' : '#595959'}
              tick={{ fill: isDarkMode ? '#fff' : '#595959' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: isDarkMode ? '#1f1f1f' : '#fff',
                border: `1px solid ${isDarkMode ? '#333' : '#f0f0f0'}`,
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                color: isDarkMode ? '#fff' : '#262626'
              }}
            />
            <Legend 
              wrapperStyle={{
                color: isDarkMode ? '#fff' : '#595959'
              }}
            />
            <Line
              type="monotone"
              dataKey="averageScore"
              name="Average Score"
              stroke="#1890ff"
              strokeWidth={2}
              dot={{ fill: '#1890ff', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#1890ff', stroke: '#fff', strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="passRate"
              name="Pass Rate"
              stroke="#52c41a"
              strokeWidth={2}
              dot={{ fill: '#52c41a', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#52c41a', stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

export default PerformanceChart;
