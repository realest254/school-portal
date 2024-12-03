import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Tabs, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import ClassList from '@/components/dashboards/admin/pages/ClassManagement/ClassList';
import SubjectList from '@/components/dashboards/admin/pages/SubjectManagement/SubjectList';
import AddClassModal from '@/components/dashboards/admin/pages/ClassManagement/AddClassModal';
import EditClassModal from '@/components/dashboards/admin/pages/ClassManagement/EditClassModal';
import DeleteClassModal from '@/components/dashboards/admin/pages/ClassManagement/DeleteClassModal';
import AddSubjectModal from '@/components/dashboards/admin/pages/SubjectManagement/AddSubjectModal';
import EditSubjectModal from '@/components/dashboards/admin/pages/SubjectManagement/EditSubjectModal';
import DeleteSubjectModal from '@/components/dashboards/admin/pages/SubjectManagement/DeleteSubjectModal';

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
      label: 'Classes',
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
      label: 'Subjects',
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
    <div className={`p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Academic Management</h1>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => activeTab === 'classes' ? handleAddClass() : handleAddSubject()}
          >
            Add {activeTab === 'classes' ? 'Class' : 'Subject'}
          </Button>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={items}
          className={isDarkMode ? 'ant-tabs-dark' : ''}
        />

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
