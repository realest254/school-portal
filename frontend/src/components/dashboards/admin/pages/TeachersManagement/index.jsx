import React, { useState, useEffect } from 'react';
import TeacherListTable from './TeacherListTable';
import SearchAndFilterBar from './SearchAndFilterBar';
import AddTeacherModal from './AddTeacherModal';
import EditTeacherModal from './EditTeacherModal';
import DeleteTeacherModal from './DeleteTeacherModal';

// TODO: Replace with actual API calls
const mockSubjects = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'History',
  'Geography',
  'Computer Science',
];

const TeachersManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [filteredTeachers, setFilteredTeachers] = useState([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // TODO: Replace with actual API call
    // Fetch teachers data
    const mockTeachers = [
      {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@school.com',
        class: '10A',
        subjects: ['Mathematics', 'Physics'],
      },
      // Add more mock data as needed
    ];
    setTeachers(mockTeachers);
    setFilteredTeachers(mockTeachers);
  }, []);

  const handleSearch = (value) => {
    setSearchQuery(value);
    const filtered = teachers.filter((teacher) =>
      teacher.name.toLowerCase().includes(value.toLowerCase()) ||
      teacher.email.toLowerCase().includes(value.toLowerCase()) ||
      teacher.class.toLowerCase().includes(value.toLowerCase()) ||
      teacher.subjects.some(subject => 
        subject.toLowerCase().includes(value.toLowerCase())
      )
    );
    setFilteredTeachers(filtered);
  };

  const handleAddTeacher = (values) => {
    // TODO: Replace with actual API call
    const newTeacher = {
      id: teachers.length + 1,
      ...values,
    };
    setTeachers([...teachers, newTeacher]);
    setFilteredTeachers([...teachers, newTeacher]);
    setIsAddModalVisible(false);
    message.success('Teacher added successfully');
  };

  const handleEditTeacher = (values) => {
    // TODO: Replace with actual API call
    const updatedTeachers = teachers.map((teacher) =>
      teacher.id === values.id ? values : teacher
    );
    setTeachers(updatedTeachers);
    setFilteredTeachers(updatedTeachers);
    setIsEditModalVisible(false);
    message.success('Teacher updated successfully');
  };

  const handleDeleteTeacher = (teacher) => {
    // TODO: Replace with actual API call
    const updatedTeachers = teachers.filter((t) => t.id !== teacher.id);
    setTeachers(updatedTeachers);
    setFilteredTeachers(updatedTeachers);
    setIsDeleteModalVisible(false);
    message.success('Teacher deleted successfully');
  };

  return (
    <div className="space-y-4">
      <SearchAndFilterBar
        onSearch={handleSearch}
        onAddNew={() => setIsAddModalVisible(true)}
      />
      
      <TeacherListTable
        teachers={filteredTeachers}
        onEdit={(teacher) => {
          setSelectedTeacher(teacher);
          setIsEditModalVisible(true);
        }}
        onDelete={(teacher) => {
          setSelectedTeacher(teacher);
          setIsDeleteModalVisible(true);
        }}
      />

      <AddTeacherModal
        visible={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        onSubmit={handleAddTeacher}
        subjects={mockSubjects}
      />

      <EditTeacherModal
        visible={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        onSubmit={handleEditTeacher}
        initialData={selectedTeacher}
        subjects={mockSubjects}
      />

      <DeleteTeacherModal
        visible={isDeleteModalVisible}
        onCancel={() => setIsDeleteModalVisible(false)}
        onConfirm={handleDeleteTeacher}
        teacher={selectedTeacher}
      />
    </div>
  );
};

export default TeachersManagement;
