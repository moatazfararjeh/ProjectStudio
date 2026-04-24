import { useState } from 'react';
import { Card, Typography, Button, Table, Tag, Space, Modal, Form, Input, DatePicker, Select, InputNumber, App, Tabs, Progress } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import dayjs from 'dayjs';
import type { Project } from '../../types';

const { Title } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

export default function ProjectList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // Fetch projects
  const { data: projects, isLoading, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      console.log('🔍 Fetching projects...');
      const result = await api.getProjects();
      console.log('📊 Projects received:', result);
      return result;
    },
  });

  // Fetch accounts for dropdown
  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => api.getAccounts(),
  });

  // Create/Update project mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => api.createProject(data),
    onSuccess: async () => {
      message.success(t('projects.createSuccess'));
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      await refetch();
      handleModalClose();
    },
    onError: (error: any) => {
      console.error('Create project error:', error);
      message.error(error?.response?.data?.message || t('common.error'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateProject(id, data),
    onSuccess: async () => {
      message.success(t('projects.updateSuccess'));
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      await refetch();
      handleModalClose();
    },
    onError: (error: any) => {
      console.error('Update project error:', error);
      message.error(error?.response?.data?.message || t('common.error'));
    },
  });

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingProject(null);
    form.resetFields();
  };

  const handleCreate = () => {
    setEditingProject(null);
    setIsModalOpen(true);
    setTimeout(() => form.resetFields(), 0);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    form.setFieldsValue({
      ...project,
      dates: [dayjs(project.startDate), dayjs(project.endDate)],
      accountId: project.accountId,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const projectData = {
        ...values,
        startDate: values.dates[0].toISOString(),
        endDate: values.dates[1].toISOString(),
      };
      delete projectData.dates;

      if (editingProject) {
        updateMutation.mutate({ id: editingProject.id, data: projectData });
      } else {
        createMutation.mutate(projectData);
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const statusColors: Record<string, string> = {
    PLANNING: 'blue',
    IN_PROGRESS: 'green',
    ON_HOLD: 'orange',
    COMPLETED: 'purple',
    CANCELLED: 'red',
  };

  const columns = [
    {
      title: t('projects.code'),
      dataIndex: 'code',
      key: 'code',
      width: 100,
      fixed: 'left' as const,
    },
    {
      title: t('projects.name'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
      fixed: 'left' as const,
    },
    {
      title: t('projects.client'),
      dataIndex: ['account', 'name'],
      key: 'account',
      width: 150,
      render: (_: any, record: Project) => record.account?.name || record.client || '-',
    },
    {
      title: t('projects.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={statusColors[status]}>
          {t(`projects.status_${status.toLowerCase()}`)}
        </Tag>
      ),
    },
    {
      title: t('projects.startDate'),
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: t('projects.endDate'),
      dataIndex: 'endDate',
      key: 'endDate',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: t('projects.progress'),
      dataIndex: 'progress',
      key: 'progress',
      width: 140,
      render: (progress: number) => (
        <div style={{ minWidth: 100 }}>
          <Progress
            percent={progress ?? 0}
            size="small"
            strokeColor={progress >= 100 ? '#52c41a' : progress >= 50 ? '#1677ff' : '#faad14'}
            format={(p) => `${p}%`}
          />
        </div>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: Project) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/projects/${record.id}`)}
            title={t('common.view')}
          />
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title={t('common.edit')}
          />
        </Space>
      ),
    },
  ];

  return (
    <div style={{ width: '100%' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 16,
        width: '100%'
      }}>
        <Title level={2} style={{ margin: 0, whiteSpace: 'nowrap' }}>{t('projects.title')}</Title>
        <Button 
            type="default" 
            icon={<PlusOutlined />} 
            onClick={handleCreate}
            size="large"
          >
            {t('projects.new')}
          </Button>
      </div>
      <Card>
        <Table
          columns={columns}
          dataSource={projects}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1300 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `${t('common.total')}: ${total}`,
          }}
        />
      </Card>

      <Modal
        title={editingProject ? t('projects.edit') : t('projects.new')}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleModalClose}
        width={700}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            status: 'PLANNING',
            currency: 'USD',
          }}
        >
          <Form.Item
            name="name"
            label={t('projects.name')}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="code"
            label={t('projects.code')}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label={t('projects.description')}
          >
            <TextArea rows={3} />
          </Form.Item>

          <Form.Item
            name="accountId"
            label={t('projects.client')}
          >
            <Select
              showSearch
              allowClear
              placeholder={t('projects.selectClient')}
              filterOption={(input, option) =>
                ((option?.label as string) ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={accounts?.map(account => ({
                label: account.name,
                value: account.id,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="dates"
            label={t('projects.dates')}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="status"
            label={t('projects.status')}
            rules={[{ required: true }]}
          >
            <Select>
              <Select.Option value="PLANNING">{t('projects.status_planning')}</Select.Option>
              <Select.Option value="IN_PROGRESS">{t('projects.status_in_progress')}</Select.Option>
              <Select.Option value="ON_HOLD">{t('projects.status_on_hold')}</Select.Option>
              <Select.Option value="COMPLETED">{t('projects.status_completed')}</Select.Option>
              <Select.Option value="CANCELLED">{t('projects.status_cancelled')}</Select.Option>
            </Select>
          </Form.Item>

          <Space style={{ width: '100%' }}>
            <Form.Item
              name="price"
              label={t('projects.price')}
              rules={[{ required: true, message: t('common.required') }]}
              style={{ width: 200 }}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="budget"
              label={t('projects.budget')}
              style={{ width: 200 }}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="currency"
              label={t('projects.currency')}
              style={{ width: 100 }}
            >
              <Select>
                <Select.Option value="USD">USD</Select.Option>
                <Select.Option value="EUR">EUR</Select.Option>
                <Select.Option value="SAR">SAR</Select.Option>
              </Select>
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
