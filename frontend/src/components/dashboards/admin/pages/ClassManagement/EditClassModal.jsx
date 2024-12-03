import React, { useEffect } from 'react';
import { Modal, Form, Input, Select, Switch, Button } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';

const { Option } = Select;

const EditClassModal = ({ isOpen, onClose, classItem, onSuccess }) => {
  const { isDarkMode } = useTheme();
  const [form] = Form.useForm();
  const { handleSubmit, control, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      name: classItem?.name || '',
      grade: classItem?.grade?.toString() || '',
      stream: classItem?.stream || '',
      academic_year: classItem?.academic_year?.toString() || '',
      is_active: classItem?.is_active ?? true,
    },
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear + i);
  const grades = Array.from({ length: 12 }, (_, i) => i + 1);

  useEffect(() => {
    if (classItem) {
      const values = {
        name: classItem.name,
        grade: classItem.grade.toString(),
        stream: classItem.stream,
        academic_year: classItem.academic_year.toString(),
        is_active: classItem.is_active,
      };
      reset(values);
      form.setFieldsValue(values);
    }
  }, [classItem, reset, form]);

  const onSubmit = async (data) => {
    try {
      const response = await fetch(`/api/classes/${classItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success('Class updated successfully');
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update class');
      }
    } catch (error) {
      toast.error('An error occurred while updating the class');
    }
  };

  const handleCancel = () => {
    form.resetFields();
    reset();
    onClose();
  };

  return (
    <Modal
      title="Edit Class"
      open={isOpen}
      onCancel={handleCancel}
      footer={null}
      className={isDarkMode ? 'ant-modal-dark' : ''}
    >
      <Form
        form={form}
        onFinish={handleSubmit(onSubmit)}
        layout="vertical"
        className="space-y-4"
      >
        <Form.Item
          label="Class Name"
          validateStatus={errors.name ? 'error' : ''}
          help={errors.name?.message}
        >
          <Controller
            name="name"
            control={control}
            rules={{ required: 'Class name is required' }}
            render={({ field }) => (
              <Input {...field} placeholder="Enter class name" />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Grade"
          validateStatus={errors.grade ? 'error' : ''}
          help={errors.grade?.message}
        >
          <Controller
            name="grade"
            control={control}
            rules={{ required: 'Grade is required' }}
            render={({ field }) => (
              <Select
                {...field}
                placeholder="Select grade"
                className="w-full"
              >
                {grades.map(grade => (
                  <Option key={grade} value={grade.toString()}>
                    Grade {grade}
                  </Option>
                ))}
              </Select>
            )}
          />
        </Form.Item>

        <Form.Item
          label="Stream (Optional)"
          validateStatus={errors.stream ? 'error' : ''}
          help={errors.stream?.message}
        >
          <Controller
            name="stream"
            control={control}
            render={({ field }) => (
              <Input {...field} placeholder="Enter stream (e.g., A, B, Science)" />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Academic Year"
          validateStatus={errors.academic_year ? 'error' : ''}
          help={errors.academic_year?.message}
        >
          <Controller
            name="academic_year"
            control={control}
            rules={{ required: 'Academic year is required' }}
            render={({ field }) => (
              <Select
                {...field}
                placeholder="Select academic year"
                className="w-full"
              >
                {years.map(year => (
                  <Option key={year} value={year.toString()}>
                    {year}
                  </Option>
                ))}
              </Select>
            )}
          />
        </Form.Item>

        <Form.Item
          label="Status"
          valuePropName="checked"
        >
          <Controller
            name="is_active"
            control={control}
            render={({ field: { value, onChange } }) => (
              <Switch
                checked={value}
                onChange={onChange}
                checkedChildren="Active"
                unCheckedChildren="Inactive"
              />
            )}
          />
        </Form.Item>

        <div className="flex justify-end space-x-2 pt-4">
          <Button onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={isSubmitting}
          >
            Update Class
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default EditClassModal;
