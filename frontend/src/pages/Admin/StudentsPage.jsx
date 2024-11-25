import React, { useState, useEffect } from 'react';
import { message, Card, Typography } from 'antd';
import SearchAndFilterBar from '../../components/dashboards/admin/pages/StudentsManagement/SearchAndFilterBar';
import StudentListTable from '../../components/dashboards/admin/pages/StudentsManagement/StudentListTable';
import AddStudentModal from '../../components/dashboards/admin/pages/StudentsManagement/AddStudentModal';
import EditStudentModal from '../../components/dashboards/admin/pages/StudentsManagement/EditStudentModal';
import DeleteStudentModal from '../../components/dashboards/admin/pages/StudentsManagement/DeleteStudentModal';
import { useTheme } from '../../contexts/ThemeContext';
import { StudentService } from '../../services/student.service';

const { Title } = Typography;

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [searchParams, setSearchParams] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const { isDarkMode } = useTheme();

  const fetchStudents = async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const response = await StudentService.getStudents({
        page,
        limit,
        ...searchParams
      });
      
      setStudents(response.data);
      setPagination({
        current: page,
        pageSize: limit,
        total: response.total
      });
    } catch (error) {
      message.error('Failed to fetch students');
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents(pagination.current, pagination.pageSize);
  }, [searchParams]);

  const handleTableChange = (pagination, filters, sorter) => {
    fetchStudents(pagination.current, pagination.pageSize);
  };

  const handleSearch = (values) => {
    setSearchParams(values);
    setPagination(prev => ({ ...prev, current: 1 })); // Reset to first page on new search
  };

  const handleAddStudent = async (values) => {
    try {
      setLoading(true);
      await StudentService.createStudent(values);
      message.success('Student added successfully');
      setIsAddModalVisible(false);
      fetchStudents(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('Failed to add student');
      console.error('Error adding student:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditStudent = async (values) => {
    try {
      setLoading(true);
      await StudentService.updateStudent(selectedStudent.id, values);
      message.success('Student updated successfully');
      setIsEditModalVisible(false);
      fetchStudents(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('Failed to update student');
      console.error('Error updating student:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async () => {
    try {
      setLoading(true);
      await StudentService.deleteStudent(selectedStudent.id);
      message.success('Student deleted successfully');
      setIsDeleteModalVisible(false);
      fetchStudents(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('Failed to delete student');
      console.error('Error deleting student:', error);
    } finally {
      setLoading(false);
    }
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
        
        <Card className="overflow-x-auto">
          <StudentListTable 
            students={students}
            loading={loading}
            pagination={pagination}
            onChange={handleTableChange}
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
        loading={loading}
      />

      <EditStudentModal
        visible={isEditModalVisible}
        student={selectedStudent}
        onCancel={() => {
          setIsEditModalVisible(false);
          setSelectedStudent(null);
        }}
        onSubmit={handleEditStudent}
        loading={loading}
      />

      <DeleteStudentModal
        visible={isDeleteModalVisible}
        student={selectedStudent}
        onCancel={() => {
          setIsDeleteModalVisible(false);
          setSelectedStudent(null);
        }}
        onConfirm={handleDeleteStudent}
        loading={loading}
      />
    </div>
  );
};

export default StudentsPage;