import React from 'react';
import PropTypes from 'prop-types';
import { Card, Table, Statistic, Row, Col, Progress } from 'antd';
import { useTeacher } from '../../../contexts/TeacherContext';
import { useTheme } from '../../../contexts/ThemeContext';

const GradesSummary = () => {
  const { isDarkMode } = useTheme();
  const { statistics, loading } = useTeacher();

  const cardStyle = {
    background: isDarkMode ? '#1f2937' : '#fff',
    borderColor: isDarkMode ? '#374151' : '#f0f0f0'
  };

  const headStyle = {
    background: isDarkMode ? '#374151' : '#fff',
    color: isDarkMode ? '#fff' : 'inherit',
    borderBottom: isDarkMode ? '1px solid #4B5563' : '1px solid #f0f0f0'
  };

  const textStyle = {
    color: isDarkMode ? '#fff' : 'inherit'
  };

  // Column definition for the rankings table
  const rankingsColumns = [
    {
      title: 'Rank',
      dataIndex: 'rank',
      width: 80,
      fixed: 'left',
      className: isDarkMode ? 'bg-gray-800 text-white' : 'bg-white',
    },
    {
      title: 'Name',
      dataIndex: 'student_name',
      width: 200,
      fixed: 'left',
      className: isDarkMode ? 'bg-gray-800 text-white' : 'bg-white',
    },
    {
      title: 'Admission No.',
      dataIndex: 'admission_number',
      width: 150,
      fixed: 'left',
      className: isDarkMode ? 'bg-gray-800 text-white' : 'bg-white',
    },
    {
      title: 'Total Score',
      dataIndex: 'total_score',
      width: 120,
      sorter: (a, b) => a.total_score - b.total_score,
    },
    {
      title: 'Average Score',
      dataIndex: 'average_score',
      width: 120,
      render: (score) => score.toFixed(1),
      sorter: (a, b) => a.average_score - b.average_score,
    },
    // Dynamic subject columns will be added based on available subjects
  ];

  // Column definition for the subject statistics table
  const subjectColumns = [
    {
      title: 'Subject',
      dataIndex: 'subject_name',
      width: 200,
    },
    {
      title: 'Average',
      dataIndex: 'average',
      width: 100,
      render: (avg) => avg.toFixed(1),
    },
    {
      title: 'Highest',
      dataIndex: 'highest',
      width: 100,
    },
    {
      title: 'Lowest',
      dataIndex: 'lowest',
      width: 100,
    },
    {
      title: 'Pass Rate',
      dataIndex: 'passes',
      width: 200,
      render: (passes, record) => {
        const total = record.passes + record.fails;
        const rate = (passes / total) * 100;
        return (
          <Progress 
            percent={Math.round(rate)} 
            size="small"
            format={(percent) => `${percent}% (${passes}/${total})`}
            strokeColor={isDarkMode ? '#60A5FA' : undefined}
            trailColor={isDarkMode ? '#4B5563' : undefined}
          />
        );
      },
    },
  ];

  // Add dynamic subject columns to rankings table
  if (statistics?.studentRankings?.length > 0) {
    const firstStudent = statistics.studentRankings[0];
    Object.keys(firstStudent.subject_scores).forEach(subjectId => {
      const subject = statistics.subjectStatistics.find(s => s.subject_id === subjectId);
      if (subject) {
        rankingsColumns.push({
          title: subject.subject_name,
          dataIndex: ['subject_scores', subjectId],
          width: 100,
          sorter: (a, b) => (a.subject_scores[subjectId] || 0) - (b.subject_scores[subjectId] || 0),
        });
      }
    });
  }

  return (
    <Card 
      title="Exam Summary" 
      className="mt-4"
      style={cardStyle}
      headStyle={headStyle}
    >
      {/* Overall Statistics */}
      <Row gutter={16} className="mb-4">
        <Col span={8}>
          <Statistic
            title={<span style={textStyle}>Class Average</span>}
            value={statistics?.classAverage?.toFixed(1) || 0}
            suffix="%"
            loading={loading}
            valueStyle={textStyle}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title={<span style={textStyle}>Highest Score</span>}
            value={statistics?.highestScore || 0}
            suffix="%"
            loading={loading}
            valueStyle={textStyle}
          />
        </Col>
        <Col span={8}>
          <Statistic
            title={<span style={textStyle}>Lowest Score</span>}
            value={statistics?.lowestScore || 0}
            suffix="%"
            loading={loading}
            valueStyle={textStyle}
          />
        </Col>
      </Row>

      {/* Subject Statistics */}
      <Card
        title="Subject Performance"
        type="inner"
        className="mb-4"
        style={cardStyle}
        headStyle={headStyle}
      >
        <Table
          dataSource={statistics?.subjectStatistics || []}
          columns={subjectColumns}
          loading={loading}
          pagination={false}
          scroll={{ x: 'max-content' }}
          rowKey="subject_id"
          size="small"
          className={isDarkMode ? 'dark-theme-table' : ''}
        />
      </Card>

      {/* Student Rankings */}
      <Card
        title="Student Rankings"
        type="inner"
        style={cardStyle}
        headStyle={headStyle}
      >
        <Table
          dataSource={statistics?.studentRankings || []}
          columns={rankingsColumns}
          loading={loading}
          pagination={false}
          scroll={{ x: 'max-content' }}
          rowKey="student_id"
          size="small"
          className={isDarkMode ? 'dark-theme-table' : ''}
        />
      </Card>
    </Card>
  );
};

GradesSummary.propTypes = {
  statistics: PropTypes.shape({
    classAverage: PropTypes.number,
    highestScore: PropTypes.number,
    lowestScore: PropTypes.number,
    studentRankings: PropTypes.arrayOf(PropTypes.shape({
      student_id: PropTypes.string,
      student_name: PropTypes.string,
      admission_number: PropTypes.string,
      total_score: PropTypes.number,
      average_score: PropTypes.number,
      rank: PropTypes.number,
      subject_scores: PropTypes.object,
    })),
    subjectStatistics: PropTypes.arrayOf(PropTypes.shape({
      subject_id: PropTypes.string,
      subject_name: PropTypes.string,
      average: PropTypes.number,
      highest: PropTypes.number,
      lowest: PropTypes.number,
      passes: PropTypes.number,
      fails: PropTypes.number,
    })),
  }),
  loading: PropTypes.bool,
  isDarkMode: PropTypes.bool
};

export default GradesSummary;
