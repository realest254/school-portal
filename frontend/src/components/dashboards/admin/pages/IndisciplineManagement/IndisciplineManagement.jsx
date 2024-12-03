import React, { useState, useEffect } from 'react';
import { Typography, Button, Card } from 'antd';
import { PlusOutlined, WarningOutlined } from '@ant-design/icons';
import { useTheme } from '../../../../../contexts/ThemeContext';
import SearchAndFilterBar from './SearchAndFilterBar';
import IndisciplineListTable from './IndisciplineListTable';
import AddIndisciplineModal from './AddIndisciplineModal';
import EditIndisciplineModal from './EditIndisciplineModal';
import DeleteIndisciplineModal from './DeleteIndisciplineModal';
import indisciplineService from '../../../../../services/indiscipline.service';

const { Title, Text } = Typography;

const IndisciplineManagement = () => {
  const { isDarkMode } = useTheme();
  const [indisciplineRecords, setIndisciplineRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    severity: 'all',
    date: null,
  });

  useEffect(() => {
    fetchIndisciplineRecords();
  }, [filters]);

  const fetchIndisciplineRecords = async () => {
    setLoading(true);
    try {
      const data = await indisciplineService.getAll(filters);
      setIndisciplineRecords(data);
    } catch (error) {
      console.error('Error fetching indiscipline records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (values) => {
    try {
      setLoading(true);
      await indisciplineService.create(values);
      setIsAddModalVisible(false);
      fetchIndisciplineRecords();
    } catch (error) {
      console.error('Error adding indiscipline record:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (values) => {
    try {
      setLoading(true);
      await indisciplineService.update(selectedRecord.id, values);
      setIsEditModalVisible(false);
      setSelectedRecord(null);
      fetchIndisciplineRecords();
    } catch (error) {
      console.error('Error editing indiscipline record:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await indisciplineService.delete(selectedRecord.id);
      setIsDeleteModalVisible(false);
      setSelectedRecord(null);
      fetchIndisciplineRecords();
    } catch (error) {
      console.error('Error deleting indiscipline record:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setIsAddModalVisible(false);
    setIsEditModalVisible(false);
    setIsDeleteModalVisible(false);
    setSelectedRecord(null);
    fetchIndisciplineRecords();
  };

  const handleSearch = (searchFilters) => {
    setFilters(searchFilters);
  };

  const handleEditRecord = (record) => {
    setSelectedRecord(record);
    setIsEditModalVisible(true);
  };

  const handleDeleteRecord = (record) => {
    setSelectedRecord(record);
    setIsDeleteModalVisible(true);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-[1400px]">
      <div className="flex flex-col gap-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center
                ${isDarkMode ? 'bg-orange-400/10' : 'bg-orange-50'}
              `}>
                <WarningOutlined className={`text-xl ${isDarkMode ? 'text-orange-400' : 'text-orange-500'}`} />
              </div>
              <Title 
                level={2} 
                className={`
                  mb-0 
                  ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}
                `}
              >
                Indiscipline Records
              </Title>
            </div>
            <Text
              className={`
                text-sm mt-1 block
                ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}
              `}
            >
              Manage and track student disciplinary incidents
            </Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsAddModalVisible(true)}
            className={`
              h-9 rounded-md transition-all duration-200
              ${isDarkMode 
                ? 'bg-orange-500 hover:bg-orange-600' 
                : 'bg-orange-500 hover:bg-orange-600'
              }
            `}
            style={{
              border: 'none',
              boxShadow: isDarkMode ? 'none' : '0 2px 4px rgba(234, 88, 12, 0.1)',
            }}
          >
            Add Record
          </Button>
        </div>

        {/* Search and Filter Section */}
        <Card
          className={`
            border
            ${isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-100'
            }
          `}
        >
          <SearchAndFilterBar
            filters={filters}
            setFilters={handleSearch}
          />
        </Card>

        {/* Table Section */}
        <Card
          className={`
            border
            ${isDarkMode 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-100'
            }
          `}
        >
          <IndisciplineListTable
            loading={loading}
            data={indisciplineRecords}
            onEdit={handleEditRecord}
            onDelete={handleDeleteRecord}
          />
        </Card>
      </div>

      {/* Modals */}
      <AddIndisciplineModal
        visible={isAddModalVisible}
        onCancel={() => setIsAddModalVisible(false)}
        onSubmit={handleAdd}
      />
      <EditIndisciplineModal
        visible={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        record={selectedRecord}
        onSubmit={handleEdit}
      />
      <DeleteIndisciplineModal
        visible={isDeleteModalVisible}
        onCancel={() => setIsDeleteModalVisible(false)}
        record={selectedRecord}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default IndisciplineManagement;
