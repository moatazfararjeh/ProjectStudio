import { useState, useEffect } from 'react';
import { Card, Form, InputNumber, Select, Button, Space, Typography, message, Spin } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import type { Project } from '../../types';

const { Title } = Typography;

interface ProjectSettingsTabProps {
  project: Project;
}

const DEFAULTS = {
  timezone: 'Asia/Riyadh',
  workDays: [0, 1, 2, 3, 4],
  hoursPerDay: 8,
};

export default function ProjectSettingsTab({ project }: ProjectSettingsTabProps) {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const settings = project.settings || {};
    form.setFieldsValue({
      timezone: settings.timezone || DEFAULTS.timezone,
      workDays: settings.workDays || DEFAULTS.workDays,
      hoursPerDay: settings.hoursPerDay || DEFAULTS.hoursPerDay,
    });
  }, [project, form]);

  const mutation = useMutation({
    mutationFn: (values: any) => api.updateProject(project.id, { settings: { ...project.settings, ...values } }),
    onSuccess: () => {
      message.success('Project settings updated');
      queryClient.invalidateQueries({ queryKey: ['project', project.id] });
    },
    onError: () => {
      message.error('Failed to update settings');
    },
  });

  const handleSave = () => {
    form.validateFields().then((values) => {
      mutation.mutate(values);
    });
  };

  if (!project) return <Spin />;

  return (
    <Card>
      <Title level={4}>إعدادات المشروع</Title>
      <Form form={form} layout="vertical">
        <Form.Item label="المنطقة الزمنية" name="timezone" rules={[{ required: true }]}> 
          <Select
            showSearch
            style={{ width: 300 }}
            options={[
              { label: '(GMT+3) Asia/Riyadh', value: 'Asia/Riyadh' },
              { label: '(GMT+2) Africa/Cairo', value: 'Africa/Cairo' },
              { label: '(GMT+0) UTC', value: 'UTC' },
              { label: '(GMT-5) America/New_York', value: 'America/New_York' },
            ]}
          />
        </Form.Item>
        <Form.Item label="أيام العمل" name="workDays" rules={[{ required: true }]}> 
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            options={[
              { label: 'الأحد', value: 0 },
              { label: 'الاثنين', value: 1 },
              { label: 'الثلاثاء', value: 2 },
              { label: 'الأربعاء', value: 3 },
              { label: 'الخميس', value: 4 },
              { label: 'الجمعة', value: 5 },
              { label: 'السبت', value: 6 },
            ]}
          />
        </Form.Item>
        <Form.Item label="ساعات العمل في اليوم" name="hoursPerDay" rules={[{ required: true }]}> 
          <InputNumber min={1} max={24} style={{ width: 120 }} />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" onClick={handleSave} loading={mutation.isPending}>
              حفظ الإعدادات
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
