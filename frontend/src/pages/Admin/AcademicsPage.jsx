import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Tabs, Button, Typography } from 'antd';
import { PlusOutlined, BookOutlined, TeamOutlined } from '@ant-design/icons';
import ClassList from '@/components/dashboards/admin/pages/ClassManagement/ClassList';
import SubjectList from '@/components/dashboards/admin/pages/SubjectManagement/SubjectList';
import AddClassModal from '@/components/dashboards/admin/pages/ClassManagement/AddClassModal';
import EditClassModal from '@/components/dashboards/admin/pages/ClassManagement/EditClassModal';
import DeleteClassModal from '@/components/dashboards/admin/pages/ClassManagement/DeleteClassModal';
import AddSubjectModal from '@/components/dashboards/admin/pages/SubjectManagement/AddSubjectModal';
import EditSubjectModal from '@/components/dashboards/admin/pages/SubjectManagement/EditSubjectModal';
import DeleteSubjectModal from '@/components/dashboards/admin/pages/SubjectManagement/DeleteSubjectModal';

const { Title, Text } = Typography;

const AcademicsPage = () => {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('classes');
  
  // Class state
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [isEditClassModalOpen, setIsEditClassModalOpen] = useState(false);
  const [isDeleteClassModalOpen, setIsDeleteClassModalOpen] = useState(false);

  // Subject state
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [isEditSubjectModalOpen, setIsEditSubjectModalOpen] = useState(false);
  const [isDeleteSubjectModalOpen, setIsDeleteSubjectModalOpen] = useState(false);

  // Class handlers
  const handleAddClass = () => {
    setIsAddClassModalOpen(true);
  };

  const handleEditClass = (classItem) => {
    setSelectedClass(classItem);
    setIsEditClassModalOpen(true);
  };

  const handleDeleteClass = (classItem) => {
    setSelectedClass(classItem);
    setIsDeleteClassModalOpen(true);
  };

  // Subject handlers
  const handleAddSubject = () => {
    setIsAddSubjectModalOpen(true);
  };

  const handleEditSubject = (subject) => {
    setSelectedSubject(subject);
    setIsEditSubjectModalOpen(true);
  };

  const handleDeleteSubject = (subject) => {
    setSelectedSubject(subject);
    setIsDeleteSubjectModalOpen(true);
  };

  // Success handlers
  const handleClassSuccess = () => {
    // Refresh classes data
    setIsAddClassModalOpen(false);
    setIsEditClassModalOpen(false);
    setIsDeleteClassModalOpen(false);
    setSelectedClass(null);
  };

  const handleSubjectSuccess = () => {
    // Refresh subjects data
    setIsAddSubjectModalOpen(false);
    setIsEditSubjectModalOpen(false);
    setIsDeleteSubjectModalOpen(false);
    setSelectedSubject(null);
  };

  const items = [
    {
      key: 'classes',
      label: (
        <span className="flex items-center gap-2">
          <TeamOutlined />
          <span>Classes</span>
        </span>
      ),
      children: (
        <ClassList
          classes={classes}
          onEdit={handleEditClass}
          onDelete={handleDeleteClass}
        />
      ),
    },
    {
      key: 'subjects',
      label: (
        <span className="flex items-center gap-2">
          <BookOutlined />
          <span>Subjects</span>
        </span>
      ),
      children: (
        <SubjectList
          subjects={subjects}
          onEdit={handleEditSubject}
          onDelete={handleDeleteSubject}
        />
      ),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-[1400px]">
      <div className="flex flex-col gap-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Title 
              level={2} 
              className={`
                mb-0 
                ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}
              `}
            >
              Academic Management
            </Title>
            <Text
              className={`
                text-sm mt-1 block
                ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}
              `}
            >
              Manage classes, subjects, and academic schedules
            </Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => activeTab === 'classes' ? handleAddClass() : handleAddSubject()}
            className={`
              h-9 rounded-md transition-all duration-200
              ${isDarkMode 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-blue-500 hover:bg-blue-600'
              }
            `}
            style={{
              border: 'none',
              boxShadow: isDarkMode ? 'none' : '0 2px 4px rgba(59, 130, 246, 0.1)',
            }}
          >
            Add {activeTab === 'classes' ? 'Class' : 'Subject'}
          </Button>
        </div>

        {/* Tabs Section */}
        <div 
          className={`
            rounded-lg overflow-hidden
            ${isDarkMode 
              ? 'bg-gray-800 border border-gray-700' 
              : 'bg-white border border-gray-100 shadow-sm'
            }
          `}
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={items}
            className={`
              p-4
              [&_.ant-tabs-nav]:!mb-4
              [&_.ant-tabs-nav::before]:!border-b-0
              [&_.ant-tabs-tab]:!px-4
              [&_.ant-tabs-tab]:!py-2
              [&_.ant-tabs-tab]:!rounded-md
              [&_.ant-tabs-tab]:transition-colors
              [&_.ant-tabs-tab]:duration-200
              ${isDarkMode 
                ? '[&_.ant-tabs-tab]:text-gray-400 [&_.ant-tabs-tab-active]:!text-blue-400 [&_.ant-tabs-tab-active]:!bg-gray-700' 
                : '[&_.ant-tabs-tab]:text-gray-500 [&_.ant-tabs-tab-active]:!text-blue-600 [&_.ant-tabs-tab-active]:!bg-blue-50'
              }
              ${isDarkMode 
                ? '[&_.ant-tabs-ink-bar]:!bg-blue-500' 
                : '[&_.ant-tabs-ink-bar]:!bg-blue-500'
              }
            `}
          />
        </div>

        {/* Class Modals */}
        <AddClassModal
          isOpen={isAddClassModalOpen}
          onClose={() => setIsAddClassModalOpen(false)}
          onSuccess={handleClassSuccess}
        />
        <EditClassModal
          isOpen={isEditClassModalOpen}
          onClose={() => setIsEditClassModalOpen(false)}
          classItem={selectedClass}
          onSuccess={handleClassSuccess}
        />
        <DeleteClassModal
          isOpen={isDeleteClassModalOpen}
          onClose={() => setIsDeleteClassModalOpen(false)}
          classItem={selectedClass}
          onSuccess={handleClassSuccess}
        />

        {/* Subject Modals */}
        <AddSubjectModal
          isOpen={isAddSubjectModalOpen}
          onClose={() => setIsAddSubjectModalOpen(false)}
          onSuccess={handleSubjectSuccess}
        />
        <EditSubjectModal
          isOpen={isEditSubjectModalOpen}
          onClose={() => setIsEditSubjectModalOpen(false)}
          subject={selectedSubject}
          onSuccess={handleSubjectSuccess}
        />
        <DeleteSubjectModal
          isOpen={isDeleteSubjectModalOpen}
          onClose={() => setIsDeleteSubjectModalOpen(false)}
          subject={selectedSubject}
          onSuccess={handleSubjectSuccess}
        />
      </div>
    </div>
  );
};

export default AcademicsPage;
