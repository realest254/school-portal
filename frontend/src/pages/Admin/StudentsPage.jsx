import React, { useState, useEffect } from 'react';
import { message, Card, Typography } from 'antd';
import SearchAndFilterBar from '../../components/dashboards/admin/pages/StudentsManagement/SearchAndFilterBar';
import StudentListTable from '../../components/dashboards/admin/pages/StudentsManagement/StudentListTable';
import AddStudentModal from '../../components/dashboards/admin/pages/StudentsManagement/AddStudentModal';
import EditStudentModal from '../../components/dashboards/admin/pages/StudentsManagement/EditStudentModal';
import DeleteStudentModal from '../../components/dashboards/admin/pages/StudentsManagement/DeleteStudentModal';
import { useTheme } from '../../contexts/ThemeContext';

const { Title } = Typography;

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const { isDarkMode } = useTheme();

  // Mock student data
  useEffect(() => {
    setStudents([
      {
        id: '1',
        name: 'John Smith',
        admissionNumber: 'STD2024001',
        email: 'john.smith@school.com',
        class: '10A',
        parentPhone: '+1234567890',
        dob: '2008-05-15'
      },
      {
        id: '2',
        name: 'Sarah Johnson',
        admissionNumber: 'STD2024002',
        email: 'sarah.j@school.com',
        class: '10B',
        parentPhone: '+1234567891',
        dob: '2008-07-22'
      },
      {
        id: '3',
        name: 'Michael Brown',
        admissionNumber: 'STD2024003',
        email: 'michael.b@school.com',
        class: '10A',
        parentPhone: '+1234567892',
        dob: '2008-03-10'
      },
      {
        id: '4',
        name: 'Emily Davis',
        admissionNumber: 'STD2024004',
        email: 'emily.d@school.com',
        class: '10C',
        parentPhone: '+1234567893',
        dob: '2008-11-30'
      }
    ]);
  }, []);

  const handleSearch = (values) => {
    setSearchParams(values);
    // Implement search logic here
  };

  const handleAddStudent = (values) => {
    setStudents([...students, { ...values, id: Date.now().toString() }]);
    setIsAddModalVisible(false);
    message.success('Student added successfully');
  };

  const handleEditStudent = (values) => {
    setStudents(students.map(student => 
      student.id === selectedStudent.id ? { ...student, ...values } : student
    ));
    setIsEditModalVisible(false);
    message.success('Student updated successfully');
  };

  const handleDeleteStudent = () => {
    setStudents(students.filter(student => student.id !== selectedStudent.id));
    setIsDeleteModalVisible(false);
    message.success('Student deleted successfully');
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-[1400px]">
      <Title level={2} className={`mb-6 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
        Student Management
      </Title>
      <div className="space-y-6">
        <SearchAndFilterBar 
          onSearch={handleSearch}
          onAddNew={() => setIsAddModalVisible(true)}
        />
        
        <Card 
          className="overflow-x-auto"
          styles={{ body: { padding: '1rem' } }}
        >
          <StudentListTable
            students={students}
            loading={loading}
            onEdit={(student) => {
              setSelectedStudent(student);
              setIsEditModalVisible(true);
            }}
            onDelete={(student) => {
              setSelectedStudent(student);
              setIsDeleteModalVisible(true);
            }}
          />
        </Card>
      </div>

      <AddStudentModal
        visible={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        onSubmit={handleAddStudent}
      />

      <EditStudentModal
        visible={isEditModalVisible}
        student={selectedStudent}
        onCancel={() => {
          setIsEditModalVisible(false);
          setSelectedStudent(null);
        }}
        onSubmit={handleEditStudent}
      />

      <DeleteStudentModal
        visible={isDeleteModalVisible}
        student={selectedStudent}
        onCancel={() => {
          setIsDeleteModalVisible(false);
          setSelectedStudent(null);
        }}
        onConfirm={handleDeleteStudent}
      />
    </div>
  );
};

export default StudentsPage;