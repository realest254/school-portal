import React, { useEffect } from 'react';
import { Modal, Form, Input, Switch, Button } from 'antd';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';
import { useTheme } from '@/contexts/ThemeContext';

const EditSubjectModal = ({ isOpen, onClose, subject, onSuccess }) => {
  const { isDarkMode } = useTheme();
  const [form] = Form.useForm();
  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      name: subject?.name || '',
      description: subject?.description || '',
      is_active: subject?.is_active ?? true,
    },
  });

  useEffect(() => {
    if (subject) {
      reset({
        name: subject.name,
        description: subject.description,
        is_active: subject.is_active,
      });
      form.setFieldsValue({
        name: subject.name,
        description: subject.description,
        is_active: subject.is_active,
      });
    }
  }, [subject, reset, form]);

  const onSubmit = async (data) => {
    try {
      const response = await fetch(`/api/subjects/${subject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast.success('Subject updated successfully');
        onSuccess();
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to update subject');
      }
    } catch (error) {
      toast.error('An error occurred while updating the subject');
    }
  };

  const handleCancel = () => {
    form.resetFields();
    reset();
    onClose();
  };

  return (
    <Modal
      title="Edit Subject"
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
            Update Subject
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default EditSubjectModal;
