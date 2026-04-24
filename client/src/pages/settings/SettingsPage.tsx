import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Tabs,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  InputNumber,
  App,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import api from '../../lib/api';

const { Title } = Typography;

interface SystemSetting {
  id: string;
  category: string;
  key: string;
  labelEn: string;
  labelAr: string;
  color?: string;
  icon?: string;
  order: number;
  isActive: boolean;
  isSystem: boolean;
}

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { message, modal: antdModal } = App.useApp();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null);
  const [activeTab, setActiveTab] = useState('project_member_role');

  // Fetch settings
  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.getSettings(),
  });

  // Seed default settings mutation
  const seedMutation = useMutation({
    mutationFn: () => api.seedDefaultSettings(),
    onSuccess: () => {
      message.success(t('systemSettings.seedSuccess'));
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: () => {
      message.error(t('common.error'));
    },
  });

  // Create/Update setting mutation
  const saveMutation = useMutation({
    mutationFn: (data: any) =>
      editingSetting
        ? api.updateSetting(editingSetting.id, data)
        : api.createSetting(data),
    onSuccess: () => {
      message.success(
        editingSetting ? t('systemSettings.updateSuccess') : t('systemSettings.createSuccess')
      );
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      handleCloseModal();
    },
    onError: () => {
      message.error(t('common.error'));
    },
  });

  // Delete setting mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteSetting(id),
    onSuccess: () => {
      message.success(t('systemSettings.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: () => {
      message.error(t('common.error'));
    },
  });

  const handleOpenModal = (category: string, setting?: SystemSetting) => {
    if (setting) {
      setEditingSetting(setting);
      form.setFieldsValue(setting);
    } else {
      setEditingSetting(null);
      form.setFieldsValue({ category, isActive: true, order: 0 });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSetting(null);
    form.resetFields();
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      saveMutation.mutate(values);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleDelete = (setting: SystemSetting) => {
    if (setting.isSystem) {
      message.warning(t('systemSettings.cannotDeleteSystem'));
      return;
    }

    antdModal.confirm({
      title: t('systemSettings.deleteConfirm'),
      content: `${t('systemSettings.deleteMessage')}: ${i18n.language === 'ar' ? setting.labelAr : setting.labelEn}?`,
      onOk: () => deleteMutation.mutate(setting.id),
    });
  };

  const categories = [
    { key: 'project_member_role', labelEn: 'Project Member Roles', labelAr: 'أدوار أعضاء الفريق' },
    { key: 'project_status', labelEn: 'Project Status', labelAr: 'حالات المشروع' },
    { key: 'task_priority', labelEn: 'Task Priority', labelAr: 'أولوية المهمة' },
    { key: 'task_status', labelEn: 'Task Status', labelAr: 'حالات المهمة' },
    { key: 'raid_priority', labelEn: 'RAID Priority', labelAr: 'أولوية RAID' },
  ];

  const columns = [
    {
      title: t('systemSettings.key'),
      dataIndex: 'key',
      key: 'key',
      width: 150,
    },
    {
      title: t('systemSettings.labelEn'),
      dataIndex: 'labelEn',
      key: 'labelEn',
    },
    {
      title: t('systemSettings.labelAr'),
      dataIndex: 'labelAr',
      key: 'labelAr',
    },
    {
      title: t('systemSettings.color'),
      dataIndex: 'color',
      key: 'color',
      width: 120,
      render: (color: string, record: SystemSetting) => (
        <Tag color={color}>
          {i18n.language === 'ar' ? record.labelAr : record.labelEn}
        </Tag>
      ),
    },
    {
      title: t('systemSettings.order'),
      dataIndex: 'order',
      key: 'order',
      width: 80,
    },
    {
      title: t('systemSettings.isActive'),
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? t('common.active') : t('common.inactive')}
        </Tag>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 150,
      render: (_: any, record: SystemSetting) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleOpenModal(record.category, record)}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
            disabled={record.isSystem}
          />
        </Space>
      ),
    },
  ];

  const tabItems = categories.map((category) => ({
    key: category.key,
    label: i18n.language === 'ar' ? category.labelAr : category.labelEn,
    children: (
      <div>
        <div style={{ marginBottom: 16, textAlign: 'right' }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal(category.key)}
          >
            {t('systemSettings.addNew')}
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={settings.filter((s: SystemSetting) => s.category === category.key)}
          rowKey="id"
          loading={isLoading}
          pagination={false}
        />
      </div>
    ),
  }));

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2}>{t('systemSettings.title')}</Title>
        <Button
          icon={<ReloadOutlined />}
          onClick={() => seedMutation.mutate()}
          loading={seedMutation.isPending}
        >
          {t('systemSettings.seedDefaults')}
        </Button>
      </div>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingSetting ? t('systemSettings.edit') : t('systemSettings.add')}
        open={isModalOpen}
        onOk={handleSave}
        onCancel={handleCloseModal}
        confirmLoading={saveMutation.isPending}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="category" label={t('systemSettings.category')} hidden>
            <Input />
          </Form.Item>

          <Form.Item
            name="key"
            label={t('systemSettings.key')}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Input placeholder="e.g., DEVELOPER" disabled={!!editingSetting} />
          </Form.Item>

          <Form.Item
            name="labelEn"
            label={t('systemSettings.labelEn')}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Input placeholder="English Label" />
          </Form.Item>

          <Form.Item
            name="labelAr"
            label={t('systemSettings.labelAr')}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Input placeholder="التسمية بالعربية" />
          </Form.Item>

          <Form.Item name="color" label={t('systemSettings.color')}>
            <Select>
              <Select.Option value="default">Default</Select.Option>
              <Select.Option value="blue">Blue</Select.Option>
              <Select.Option value="green">Green</Select.Option>
              <Select.Option value="red">Red</Select.Option>
              <Select.Option value="orange">Orange</Select.Option>
              <Select.Option value="purple">Purple</Select.Option>
              <Select.Option value="cyan">Cyan</Select.Option>
              <Select.Option value="gray">Gray</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="order" label={t('systemSettings.order')} initialValue={0}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="isActive" label={t('systemSettings.isActive')} valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

