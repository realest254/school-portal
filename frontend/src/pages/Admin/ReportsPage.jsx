import React, { useState } from 'react';
import { Tabs } from 'antd';
import { useTheme } from '../../contexts/ThemeContext';
import ReportsFilters from '../../components/dashboards/admin/pages/ReportsManagement/ReportsFilters';
import SchoolOverview from '../../components/dashboards/admin/pages/ReportsManagement/SchoolOverview';
import ClassStats from '../../components/dashboards/admin/pages/ReportsManagement/ClassStats';
import TeacherStats from '../../components/dashboards/admin/pages/ReportsManagement/TeacherStats';
import StudentStats from '../../components/dashboards/admin/pages/ReportsManagement/StudentStats';
import IndisciplineReports from '../../components/dashboards/admin/pages/ReportsManagement/IndisciplineReports';

const ReportsPage = () => {
  const { isDarkMode } = useTheme();
  const [activeFilters, setActiveFilters] = useState(null);

  // Sample data - replace with API calls
  const schoolStats = {
    overallPerformance: [
      { term: 'Term 1', score: 68 },
      { term: 'Term 2', score: 72 },
      { term: 'Term 3', score: 75 },
    ],
    subjectPerformance: [
      { subject: 'Mathematics', score: 70 },
      { subject: 'English', score: 75 },
      { subject: 'Science', score: 68 },
      { subject: 'History', score: 72 },
    ],
    classDistribution: [
      { class: 'Form 1', students: 120 },
      { class: 'Form 2', students: 115 },
      { class: 'Form 3', students: 110 },
      { class: 'Form 4', students: 105 },
    ],
  };

  const teacherStats = {
    subjectPerformance: [
      { teacher: 'Mr. John', subject: 'Mathematics', score: 75 },
      { teacher: 'Mrs. Sarah', subject: 'English', score: 78 },
      { teacher: 'Mr. David', subject: 'Science', score: 72 },
    ],
    classPerformance: [
      { teacher: 'Mr. John', class: 'Form 1A', score: 70 },
      { teacher: 'Mr. John', class: 'Form 2A', score: 73 },
      { teacher: 'Mrs. Sarah', class: 'Form 1B', score: 75 },
    ],
  };

  const classStats = {
    performance: [
      { class: 'Form 1A', subject: 'Mathematics', score: 72 },
      { class: 'Form 1A', subject: 'English', score: 75 },
      { class: 'Form 1B', subject: 'Mathematics', score: 68 },
      { class: 'Form 1B', subject: 'English', score: 70 },
    ],
    distribution: [
      { grade: 'A', count: 25 },
      { grade: 'B', count: 35 },
      { grade: 'C', count: 20 },
      { grade: 'D', count: 15 },
      { grade: 'E', count: 5 },
    ],
  };

  const studentStats = {
    performanceTrend: [
      { term: 'Term 1', subject: 'Mathematics', score: 65 },
      { term: 'Term 2', subject: 'Mathematics', score: 70 },
      { term: 'Term 3', subject: 'Mathematics', score: 75 },
      { term: 'Term 1', subject: 'English', score: 70 },
      { term: 'Term 2', subject: 'English', score: 72 },
      { term: 'Term 3', subject: 'English', score: 78 },
    ],
    subjectPerformance: [
      { subject: 'Mathematics', score: 75 },
      { subject: 'English', score: 78 },
      { subject: 'Science', score: 72 },
      { subject: 'History', score: 70 },
    ],
  };

  const handleSearch = (filters) => {
    console.log('Searching with filters:', filters);
    setActiveFilters(filters);
    // TODO: Implement API call with filters
  };

  const handleExport = () => {
    if (!activeFilters) {
      return;
    }
    console.log('Exporting report with filters:', activeFilters);
    // TODO: Implement export functionality
  };

  const items = [
    {
      key: 'school',
      label: 'School Overview',
      children: <SchoolOverview schoolStats={schoolStats} />
    },
    {
      key: 'class',
      label: 'Class Statistics',
      children: <ClassStats classStats={classStats} />
    },
    {
      key: 'teacher',
      label: 'Teacher Statistics',
      children: <TeacherStats teacherStats={teacherStats} />
    },
    {
      key: 'student',
      label: 'Student Statistics',
      children: <StudentStats studentStats={studentStats} />
    },
    {
      key: 'indiscipline',
      label: 'Indiscipline Reports',
      children: <IndisciplineReports />
    }
  ];

  return (
    <div className={`p-6 min-h-screen ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-800'}`}>
      <div className="max-w-[1600px] mx-auto">
        <h1 className="text-2xl font-bold mb-6">Reports & Statistics</h1>

        <ReportsFilters
          onSearch={handleSearch}
          onExport={handleExport}
        />

        <Tabs 
          defaultActiveKey="school" 
          items={items}
          className={isDarkMode ? 'text-gray-100' : ''}
        />
      </div>
    </div>
  );
};

export default ReportsPage;
