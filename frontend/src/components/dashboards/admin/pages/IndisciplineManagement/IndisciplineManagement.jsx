import React, { useState, useEffect } from 'react';
import { message } from 'antd';
import IndisciplineListTable from './IndisciplineListTable';
import AddIndisciplineModal from './AddIndisciplineModal';
import EditIndisciplineModal from './EditIndisciplineModal';
import DeleteIndisciplineModal from './DeleteIndisciplineModal';
import SearchAndFilterBar from './SearchAndFilterBar';
import indisciplineService from '../../../../../services/indiscipline.service';

const IndisciplineManagement = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [filters, setFilters] = useState({});

  const fetchCases = async () => {
    try {
      setLoading(true);
      const data = await indisciplineService.getAll(filters);
      setCases(data);
    } catch (error) {
      message.error('Failed to fetch indiscipline cases');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [filters]);

  const handleAdd = async (values) => {
    try {
      setLoading(true);
      await indisciplineService.create(values);
      message.success('Indiscipline case added successfully');
      setAddModalVisible(false);
      fetchCases();
    } catch (error) {
      message.error('Failed to add indiscipline case');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (values) => {
    try {
      setLoading(true);
      await indisciplineService.update(selectedCase.id, values);
      message.success('Indiscipline case updated successfully');
      setEditModalVisible(false);
      setSelectedCase(null);
      fetchCases();
    } catch (error) {
      message.error('Failed to update indiscipline case');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await indisciplineService.delete(selectedCase.id);
      message.success('Indiscipline case deleted successfully');
      setDeleteModalVisible(false);
      setSelectedCase(null);
      fetchCases();
    } catch (error) {
      message.error('Failed to delete indiscipline case');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchFilters) => {
    setFilters(searchFilters);
  };

  return (
    <div className="p-6">
      <SearchAndFilterBar 
        onSearch={handleSearch}
        onAdd={() => setAddModalVisible(true)}
      />
      
      <IndisciplineListTable
        cases={cases}
        loading={loading}
        onEdit={(record) => {
          setSelectedCase(record);
          setEditModalVisible(true);
        }}
        onDelete={(record) => {
          setSelectedCase(record);
          setDeleteModalVisible(true);
        }}
      />

      <AddIndisciplineModal
        visible={addModalVisible}
        onCancel={() => setAddModalVisible(false)}
        onSubmit={handleAdd}
      />

      {selectedCase && (
        <>
          <EditIndisciplineModal
            visible={editModalVisible}
            onCancel={() => {
              setEditModalVisible(false);
              setSelectedCase(null);
            }}
            onSubmit={handleEdit}
            initialValues={selectedCase}
          />

          <DeleteIndisciplineModal
            visible={deleteModalVisible}
            onCancel={() => {
              setDeleteModalVisible(false);
              setSelectedCase(null);
            }}
            onConfirm={handleDelete}
            case={selectedCase}
          />
        </>
      )}
    </div>
  );
};

export default IndisciplineManagement;
