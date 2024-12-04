import React from 'react';
import { Card, Progress, Typography, Space, Row, Col, Statistic } from 'antd';
import { 
  TrophyOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  UserOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useTheme } from '../../../contexts/ThemeContext';
import { useTeacher } from '../../../contexts/TeacherContext';

const { Text, Title } = Typography;

const ClassPerformance = () => {
  const { isDarkMode } = useTheme();
  const { performanceData } = useTeacher();

  const cardStyle = {
    backgroundColor: isDarkMode ? '#1f2937' : undefined,
    borderColor: isDarkMode ? '#374151' : undefined
  };

  const textStyle = {
    color: isDarkMode ? '#fff' : undefined
  };

  // Handle case where performanceData is null or undefined
  if (!performanceData || !performanceData.termlyAverages) {
    return (
      <Card
        title={
          <Space>
            <TrophyOutlined style={{ color: isDarkMode ? '#fff' : undefined }} />
            <Text strong style={{ color: isDarkMode ? '#fff' : undefined }}>
              Class Performance
            </Text>
          </Space>
        }
        className={isDarkMode ? 'bg-gray-800' : undefined}
      >
        <Text>Loading performance data...</Text>
      </Card>
    );
  }

  // Calculate the maximum value for the graph
  const maxAverage = Math.max(...performanceData.termlyAverages.map(term => term.average));
  const minAverage = Math.min(...performanceData.termlyAverages.map(term => term.average));
  const range = maxAverage - minAverage;

  return (
    <Card
      title={
        <Space>
          <TrophyOutlined style={{ color: isDarkMode ? '#fff' : undefined }} />
          <Text strong style={{ color: isDarkMode ? '#fff' : undefined }}>
            Class Performance
          </Text>
        </Space>
      }
      className={isDarkMode ? 'bg-gray-800' : undefined}
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12}>
          <Card style={cardStyle}>
            <Statistic
              title={
                <Text style={textStyle}>Current Term Average</Text>
              }
              value={performanceData.currentTerm.average}
              suffix="%"
              valueStyle={{
                color: isDarkMode ? '#fff' : '#1890ff'
              }}
              prefix={<TrophyOutlined />}
            />
            <Progress
              percent={performanceData.currentTerm.average}
              status="active"
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
            <div className="mt-2">
              <Space>
                {performanceData.currentTerm.trend === 'up' ? (
                  <ArrowUpOutlined style={{ color: '#52c41a' }} />
                ) : (
                  <ArrowDownOutlined style={{ color: '#f5222d' }} />
                )}
                <Text type={performanceData.currentTerm.trend === 'up' ? 'success' : 'danger'}>
                  {performanceData.currentTerm.change}%
                </Text>
              </Space>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12}>
          <Card style={cardStyle}>
            <div className="mt-4 sm:mt-6 h-24 sm:h-32 flex items-end justify-between gap-1 sm:gap-2">
              {performanceData.termlyAverages.map((term, index) => {
                const height = ((term.average - minAverage) / range) * 100;
                return (
                  <div key={term.term} className="flex flex-col items-center flex-1">
                    <div className="w-full flex justify-center mb-1 sm:mb-2">
                      <div
                        style={{ height: `${height}%` }}
                        className={`w-full max-w-[20px] sm:max-w-[30px] rounded-t-lg ${
                          index === performanceData.termlyAverages.length - 1
                            ? 'bg-indigo-500'
                            : isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                        }`}
                      />
                    </div>
                    <span className={`text-[10px] sm:text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {term.term}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12}>
          <Card style={cardStyle}>
            <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
              <h3 className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Subject Performance
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {performanceData.subjectPerformance.map((subject) => (
                  <div
                    key={subject.subject}
                    className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-opacity-50
                      ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}"
                  >
                    <span className={`text-xs sm:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {subject.subject}
                    </span>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className={`text-xs sm:text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {subject.score}%
                      </span>
                      {subject.trend === 'up' ? (
                        <ArrowUpOutlined style={{ color: '#52c41a' }} />
                      ) : (
                        <ArrowDownOutlined style={{ color: '#f5222d' }} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </Card>
  );
};

export default ClassPerformance;
