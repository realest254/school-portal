import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import IndisciplineListTable from '../../components/dashboards/admin/pages/IndisciplineManagement/IndisciplineListTable';
import AddIndisciplineModal from '../../components/dashboards/admin/pages/IndisciplineManagement/AddIndisciplineModal';
import EditIndisciplineModal from '../../components/dashboards/admin/pages/IndisciplineManagement/EditIndisciplineModal';
import DeleteIndisciplineModal from '../../components/dashboards/admin/pages/IndisciplineManagement/DeleteIndisciplineModal';
import SearchAndFilterBar from '../../components/dashboards/admin/pages/IndisciplineManagement/SearchAndFilterBar';
import { Column, Pie } from '@ant-design/plots';
import { Card, Select, DatePicker, Button, Space, Table } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;

const IndisciplinePage = () => {
  const { isDarkMode } = useTheme();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);

  // Sample data for the charts
  const monthlyData = [
    { month: 'Jan', cases: 15 },
    { month: 'Feb', cases: 12 },
    { month: 'Mar', cases: 8 },
    { month: 'Apr', cases: 10 },
    { month: 'May', cases: 5 },
    { month: 'Jun', cases: 7 },
  ];

  const caseTypeData = [
    { type: 'Late Coming', value: 25 },
    { type: 'Uniform Violation', value: 20 },
    { type: 'Disruptive Behavior', value: 15 },
    { type: 'Homework Missing', value: 30 },
    { type: 'Others', value: 10 },
  ];

  // Chart configurations
  const columnConfig = {
    data: monthlyData,
    xField: 'month',
    yField: 'cases',
    label: {
      position: 'middle',
      style: {
        fill: '#FFFFFF',
        opacity: 0.6,
      },
    },
    xAxis: {
      label: {
        autoHide: true,
        autoRotate: false,
      },
    },
    meta: {
      month: {
        alias: 'Month',
      },
      cases: {
        alias: 'Number of Cases',
      },
    },
  };

  const pieConfig = {
    data: caseTypeData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name} ({percentage})',
    },
    interactions: [
      {
        type: 'pie-legend-active',
      },
      {
        type: 'element-active',
      },
    ],
  };

  // Filter cases based on search text and status
  const filteredCases = cases.filter((indisciplineCase) => {
    const matchesSearch =
      !searchText ||
      indisciplineCase.studentName.toLowerCase().includes(searchText.toLowerCase()) ||
      indisciplineCase.description.toLowerCase().includes(searchText.toLowerCase());

    const matchesStatus = !statusFilter || indisciplineCase.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Handle search
  const handleSearch = (value) => {
    setSearchText(value);
  };

  // Handle status filter
  const handleStatusFilter = (value) => {
    setStatusFilter(value);
  };

  // Handle add new case
  const handleAddCase = (values) => {
    const newCase = {
      key: Date.now().toString(),
      ...values,
    };
    setCases([...cases, newCase]);
    setAddModalVisible(false);
  };

  // Handle edit case
  const handleEditCase = (values) => {
    const updatedCases = cases.map((indisciplineCase) =>
      indisciplineCase.key === selectedCase.key
        ? { ...indisciplineCase, ...values }
        : indisciplineCase
    );
    setCases(updatedCases);
    setEditModalVisible(false);
    setSelectedCase(null);
  };

  // Handle delete case
  const handleDeleteCase = () => {
    const updatedCases = cases.filter(
      (indisciplineCase) => indisciplineCase.key !== selectedCase.key
    );
    setCases(updatedCases);
    setDeleteModalVisible(false);
    setSelectedCase(null);
  };

  return (
    <div className={`p-6 min-h-screen transition-colors duration-200 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="max-w-[1600px] mx-auto">
        <div className="mb-6">
          <h1 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            Indiscipline Cases
          </h1>
          <Space className="mb-4" wrap>
            <Select
              defaultValue="all"
              style={{ width: 120 }}
              options={[
                { value: 'all', label: 'All Classes' },
                { value: 'form1', label: 'Form 1' },
                { value: 'form2', label: 'Form 2' },
                { value: 'form3', label: 'Form 3' },
                { value: 'form4', label: 'Form 4' },
              ]}
            />
            <RangePicker />
            <Button type="primary" icon={<DownloadOutlined />}>
              Export Report
            </Button>
          </Space>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card title="Monthly Cases">
            <Column {...columnConfig} />
          </Card>
          <Card title="Cases by Type">
            <Pie {...pieConfig} />
          </Card>
        </div>

        <SearchAndFilterBar
          onSearch={handleSearch}
          onStatusFilter={handleStatusFilter}
          onAddNew={() => setAddModalVisible(true)}
        />

        <IndisciplineListTable
          cases={filteredCases}
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
          onSubmit={handleAddCase}
        />

        <EditIndisciplineModal
          visible={editModalVisible}
          initialValues={selectedCase}
          onCancel={() => {
            setEditModalVisible(false);
            setSelectedCase(null);
          }}
          onSubmit={handleEditCase}
        />

        <DeleteIndisciplineModal
          visible={deleteModalVisible}
          caseDetails={selectedCase}
          onCancel={() => {
            setDeleteModalVisible(false);
            setSelectedCase(null);
          }}
          onConfirm={handleDeleteCase}
        />
      </div>
    </div>
  );
};

export default IndisciplinePage;
