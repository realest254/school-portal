import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import TeacherListTable from './TeacherListTable';
import SearchAndFilterBar from './SearchAndFilterBar';
import AddTeacherModal from './AddTeacherModal';
import EditTeacherModal from './EditTeacherModal';
import DeleteTeacherModal from './DeleteTeacherModal';
import axios from 'axios';

const TeachersManagement = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  
  // Modal states
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  
  // Current filters state
  const [currentFilters, setCurrentFilters] = useState({});

  // Load teachers when filters or pagination changes
  useEffect(() => {
    loadTeachers();
  }, [currentFilters, pagination.current, pagination.pageSize]);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/teachers', {
        params: {
          ...currentFilters,
          page: pagination.current,
          limit: pagination.pageSize
        }
      });
      
      setTeachers(response.data.teachers);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total
      }));
    } catch (error) {
      message.error('Failed to load teachers');
      console.error('Error loading teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (filters) => {
    setCurrentFilters(filters);
    // Reset to first page when filters change
    setPagination(prev => ({
      ...prev,
      current: 1
    }));
  };

  const handleTableChange = (pagination, filters, sorter) => {
    setPagination(prev => ({
      ...prev,
      current: pagination.current,
      pageSize: pagination.pageSize
    }));
  };

  const handleAddTeacher = () => {
    setIsAddModalVisible(true);
  };

  const handleEditTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    setIsEditModalVisible(true);
  };

  const handleDeleteTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    setIsDeleteModalVisible(true);
  };

  const handleModalClose = (shouldRefresh = false) => {
    setIsAddModalVisible(false);
    setIsEditModalVisible(false);
    setIsDeleteModalVisible(false);
    setSelectedTeacher(null);
    
    if (shouldRefresh) {
      loadTeachers();
    }
  };

  return (
    <div className="p-6">
      <SearchAndFilterBar 
        onSearch={handleSearch}
        onAddNew={handleAddTeacher}
      />
      
      <TeacherListTable 
        teachers={teachers}
        loading={loading}
        pagination={pagination}
        onChange={handleTableChange}
        onEdit={handleEditTeacher}
        onDelete={handleDeleteTeacher}
      />
      
      {isAddModalVisible && (
        <AddTeacherModal 
          visible={isAddModalVisible}
          onClose={handleModalClose}
        />
      )}
      
      {isEditModalVisible && selectedTeacher && (
        <EditTeacherModal 
          visible={isEditModalVisible}
          teacher={selectedTeacher}
          onClose={handleModalClose}
        />
      )}
      
      {isDeleteModalVisible && selectedTeacher && (
        <DeleteTeacherModal 
          visible={isDeleteModalVisible}
          teacher={selectedTeacher}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default TeachersManagement;
