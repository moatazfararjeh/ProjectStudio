import { useState } from 'react';
import { Card, Typography, Button, Table, Tag, Space, Modal, Form, Input, DatePicker, Select, InputNumber, App } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined, UserOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Title } = Typography;
const { TextArea } = Input;

interface Account {
  id: string;
  name: string;
  code: string;
  industry?: string;
  size?: string;
  status: string;
  healthScore?: number;
  renewalProbability?: number;
  annualValue?: number;
  lifetimeValue?: number;
  primaryContact?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  contractEndDate?: string;
  nextReviewDate?: string;
  createdAt: string;
}

export default function AccountList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  // Fetch accounts - مؤقتاً نستخدم بيانات وهمية حتى يتم إنشاء API
  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      // TODO: Replace with actual API call
      // return await api.getAccounts();
      
      // Mock data for now
      return [
        {
          id: '1',
          name: 'شركة النجاح التقني',
          code: 'ACC-2026-001',
          industry: 'Technology',
          size: 'Large',
          status: 'ACTIVE',
          healthScore: 85,
          renewalProbability: 90,
          annualValue: 500000,
          lifetimeValue: 1200000,
          primaryContact: 'أحمد محمد',
          primaryContactEmail: 'ahmad@success-tech.com',
          primaryContactPhone: '+966501234567',
          contractEndDate: '2026-12-31',
          nextReviewDate: '2026-12-01',
          createdAt: '2024-01-15',
        },
        {
          id: '2',
          name: 'مؤسسة التميز للتجارة',
          code: 'ACC-2026-002',
          industry: 'Retail',
          size: 'Medium',
          status: 'ACTIVE',
          healthScore: 72,
          renewalProbability: 75,
          annualValue: 200000,
          lifetimeValue: 450000,
          primaryContact: 'فاطمة أحمد',
          primaryContactEmail: 'fatima@excellence.com',
          contractEndDate: '2027-03-31',
          nextReviewDate: '2026-11-15',
          createdAt: '2024-06-20',
        },
        {
          id: '3',
          name: 'شركة الأمل الطبية',
          code: 'ACC-2025-015',
          industry: 'Healthcare',
          size: 'Enterprise',
          status: 'AT_RISK',
          healthScore: 45,
          renewalProbability: 40,
          annualValue: 800000,
          lifetimeValue: 2500000,
          primaryContact: 'د. خالد عبدالله',
          primaryContactEmail: 'khalid@amal-medical.com',
          contractEndDate: '2026-06-30',
          nextReviewDate: '2026-04-01',
          createdAt: '2023-07-01',
        },
      ] as Account[];
    },
  });

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingAccount(null);
    form.resetFields();
  };

  const handleCreate = () => {
    setEditingAccount(null);
    setIsModalOpen(true);
    setTimeout(() => form.resetFields(), 0);
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    form.setFieldsValue({
      ...account,
      contractStartDate: account.contractEndDate ? dayjs(account.contractEndDate).subtract(1, 'year') : null,
      contractEndDate: account.contractEndDate ? dayjs(account.contractEndDate) : null,
      nextReviewDate: account.nextReviewDate ? dayjs(account.nextReviewDate) : null,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      // TODO: Implement create/update mutation
      message.success(editingAccount ? t('accounts.updateSuccess') : t('accounts.createSuccess'));
      handleModalClose();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const statusColors: Record<string, string> = {
    ACTIVE: 'green',
    AT_RISK: 'orange',
    CHURNED: 'red',
    DORMANT: 'default',
  };

  const healthScoreColor = (score?: number) => {
    if (!score) return 'default';
    if (score >= 70) return 'green';
    if (score >= 40) return 'orange';
    return 'red';
  };

  const columns = [
    {
      title: t('accounts.code'),
      dataIndex: 'code',
      key: 'code',
      width: 130,
      fixed: 'left' as const,
    },
    {
      title: t('accounts.name'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
      fixed: 'left' as const,
      render: (name: string) => (
        <Space>
          <UserOutlined />
          {name}
        </Space>
      ),
    },
    {
      title: t('accounts.industry'),
      dataIndex: 'industry',
      key: 'industry',
      width: 120,
    },
    {
      title: t('accounts.size'),
      dataIndex: 'size',
      key: 'size',
      width: 100,
    },
    {
      title: t('accounts.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={statusColors[status]}>
          {t(`accounts.status_${status.toLowerCase()}`)}
        </Tag>
      ),
    },
    {
      title: t('accounts.healthScore'),
      dataIndex: 'healthScore',
      key: 'healthScore',
      width: 100,
      render: (score?: number) => (
        score ? (
          <Tag color={healthScoreColor(score)}>
            {score}%
          </Tag>
        ) : '-'
      ),
    },
    {
      title: t('accounts.renewalProbability'),
      dataIndex: 'renewalProbability',
      key: 'renewalProbability',
      width: 120,
      render: (prob?: number) => (
        prob ? `${prob}%` : '-'
      ),
    },
    {
      title: t('accounts.annualValue'),
      dataIndex: 'annualValue',
      key: 'annualValue',
      width: 150,
      render: (value?: number) => (
        value ? `$${value.toLocaleString()}` : '-'
      ),
    },
    {
      title: t('accounts.primaryContact'),
      dataIndex: 'primaryContact',
      key: 'primaryContact',
      width: 150,
    },
    {
      title: t('accounts.contractEndDate'),
      dataIndex: 'contractEndDate',
      key: 'contractEndDate',
      width: 120,
      render: (date?: string) => date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: Account) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/accounts/${record.id}`)}
          />
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
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
        <Title level={2} style={{ margin: 0, whiteSpace: 'nowrap' }}>
          {t('accounts.title')}
        </Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={handleCreate}
          size="large"
        >
          {t('accounts.new')}
        </Button>
      </div>
      
      <Card style={{ width: '100%' }}>
        <Table
          columns={columns}
          dataSource={accounts}
          rowKey="id"
          loading={isLoading}
          scroll={{ x: 1600 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `${t('common.total')}: ${total}`,
          }}
        />
      </Card>

      <Modal
        title={editingAccount ? t('accounts.edit') : t('accounts.new')}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleModalClose}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            status: 'ACTIVE',
            size: 'Medium',
          }}
        >
          <Form.Item
            name="name"
            label={t('accounts.name')}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="code"
            label={t('accounts.code')}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Input />
          </Form.Item>

          <Space style={{ width: '100%' }} size="large">
            <Form.Item
              name="industry"
              label={t('accounts.industry')}
              style={{ width: 200 }}
            >
              <Select>
                <Select.Option value="Technology">Technology</Select.Option>
                <Select.Option value="Healthcare">Healthcare</Select.Option>
                <Select.Option value="Retail">Retail</Select.Option>
                <Select.Option value="Finance">Finance</Select.Option>
                <Select.Option value="Education">Education</Select.Option>
                <Select.Option value="Other">Other</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="size"
              label={t('accounts.size')}
              style={{ width: 150 }}
            >
              <Select>
                <Select.Option value="Small">Small</Select.Option>
                <Select.Option value="Medium">Medium</Select.Option>
                <Select.Option value="Large">Large</Select.Option>
                <Select.Option value="Enterprise">Enterprise</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="status"
              label={t('accounts.status')}
              style={{ width: 150 }}
            >
              <Select>
                <Select.Option value="ACTIVE">{t('accounts.status_active')}</Select.Option>
                <Select.Option value="AT_RISK">{t('accounts.status_at_risk')}</Select.Option>
                <Select.Option value="CHURNED">{t('accounts.status_churned')}</Select.Option>
                <Select.Option value="DORMANT">{t('accounts.status_dormant')}</Select.Option>
              </Select>
            </Form.Item>
          </Space>

          <Form.Item
            name="primaryContact"
            label={t('accounts.primaryContact')}
          >
            <Input />
          </Form.Item>

          <Space style={{ width: '100%' }} size="large">
            <Form.Item
              name="primaryContactEmail"
              label={t('accounts.primaryContactEmail')}
              style={{ width: 300 }}
            >
              <Input type="email" />
            </Form.Item>

            <Form.Item
              name="primaryContactPhone"
              label={t('accounts.primaryContactPhone')}
              style={{ width: 200 }}
            >
              <Input />
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }} size="large">
            <Form.Item
              name="healthScore"
              label={t('accounts.healthScore')}
              style={{ width: 150 }}
            >
              <InputNumber min={0} max={100} suffix="%" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="renewalProbability"
              label={t('accounts.renewalProbability')}
              style={{ width: 150 }}
            >
              <InputNumber min={0} max={100} suffix="%" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="annualValue"
              label={t('accounts.annualValue')}
              style={{ width: 200 }}
            >
              <InputNumber min={0} prefix="$" style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }} size="large">
            <Form.Item
              name="contractEndDate"
              label={t('accounts.contractEndDate')}
              style={{ width: 200 }}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="nextReviewDate"
              label={t('accounts.nextReviewDate')}
              style={{ width: 200 }}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <Form.Item
            name="notes"
            label={t('common.notes')}
          >
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
