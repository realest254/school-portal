import React from 'react';
import { Modal, Form, Input, Switch, Button } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';

const AddSubjectModal = ({ isOpen, onClose, onSuccess }) => {
  const { isDarkMode } = useTheme();
  const [form] = Form.useForm();
  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    try {
      const response = await fetch('/api/subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success('Subject added successfully');
        form.resetFields();
        reset();
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to add subject');
      }
    } catch (error) {
      toast.error('An error occurred while adding the subject');
    }
  };

  const handleCancel = () => {
    form.resetFields();
    reset();
    onClose();
  };

  return (
    <Modal
      title="Add New Subject"
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
          label="Subject Name"
          validateStatus={errors.name ? 'error' : ''}
          help={errors.name?.message}
        >
          <Controller
            name="name"
            control={control}
            rules={{ required: 'Subject name is required' }}
            render={({ field }) => (
              <Input {...field} placeholder="Enter subject name" />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Description"
          validateStatus={errors.description ? 'error' : ''}
          help={errors.description?.message}
        >
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                rows={4}
                placeholder="Enter subject description"
              />
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
            defaultValue={true}
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
            Add Subject
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AddSubjectModal;
