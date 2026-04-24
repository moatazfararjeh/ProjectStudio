import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Descriptions, Tag, Button, Space, Tabs, Row, Col, Table, Timeline } from 'antd';
import { ArrowLeftOutlined, EditOutlined, DollarOutlined, CalendarOutlined, UserOutlined, LineChartOutlined, HeartOutlined, RiseOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

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
  notes?: string;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  code: string;
  status: string;
  price: number;
  startDate: string;
  endDate: string;
}

export default function AccountDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Fetch account - مؤقتاً بيانات وهمية
  const { data: account, isLoading } = useQuery({
    queryKey: ['account', id],
    queryFn: async () => {
      // TODO: Replace with actual API call
      // return await api.getAccount(id);
      
      // Mock data
      const accounts: Record<string, Account> = {
        '1': {
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
          notes: 'عميل استراتيجي - علاقة ممتازة - يحتاج متابعة شهرية',
          createdAt: '2024-01-15',
        },
        '2': {
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
          primaryContactPhone: '+966509876543',
          contractEndDate: '2027-03-31',
          nextReviewDate: '2026-11-15',
          notes: 'عميل جيد - يحتاج دعم فني منتظم',
          createdAt: '2024-06-20',
        },
        '3': {
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
          primaryContactPhone: '+966501111222',
          contractEndDate: '2026-06-30',
          nextReviewDate: '2026-04-01',
          notes: '⚠️ يحتاج اهتمام عاجل - تواصل أسبوعي - حل المشاكل الفنية',
          createdAt: '2023-07-01',
        },
      };
      return accounts[id || '1'];
    },
  });

  // Fetch account projects - مؤقتاً
  const { data: projects } = useQuery({
    queryKey: ['accountProjects', id],
    queryFn: async () => {
      // TODO: Replace with actual API call
      // return await api.getAccountProjects(id);
      
      // Mock projects
      const projectsData: Record<string, Project[]> = {
        '1': [
          {
            id: '1',
            name: 'نظام إدارة الموارد البشرية',
            code: 'PRJ-2026-001',
            status: 'COMPLETED',
            price: 120000,
            startDate: '2026-01-15',
            endDate: '2026-03-15',
          },
          {
            id: '2',
            name: 'نظام إدارة علاقات العملاء (CRM)',
            code: 'PRJ-2026-015',
            status: 'COMPLETED',
            price: 150000,
            startDate: '2026-04-01',
            endDate: '2026-06-30',
          },
          {
            id: '3',
            name: 'تطبيق Mobile للموظفين',
            code: 'PRJ-2026-028',
            status: 'IN_PROGRESS',
            price: 100000,
            startDate: '2026-07-01',
            endDate: '2026-10-31',
          },
        ],
        '2': [
          {
            id: '4',
            name: 'موقع التجارة الإلكترونية',
            code: 'PRJ-2026-012',
            status: 'COMPLETED',
            price: 80000,
            startDate: '2026-02-01',
            endDate: '2026-04-30',
          },
          {
            id: '5',
            name: 'نظام إدارة المخزون',
            code: 'PRJ-2026-033',
            status: 'IN_PROGRESS',
            price: 60000,
            startDate: '2026-08-01',
            endDate: '2026-11-30',
          },
        ],
        '3': [
          {
            id: '6',
            name: 'نظام السجلات الطبية الإلكترونية',
            code: 'PRJ-2025-045',
            status: 'COMPLETED',
            price: 500000,
            startDate: '2025-01-01',
            endDate: '2025-12-31',
          },
          {
            id: '7',
            name: 'نظام حجز المواعيد',
            code: 'PRJ-2026-005',
            status: 'COMPLETED',
            price: 200000,
            startDate: '2026-01-15',
            endDate: '2026-04-30',
          },
        ],
      };
      return projectsData[id || '1'] || [];
    },
  });

  if (isLoading || !account) {
    return <div>Loading...</div>;
  }

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

  const projectStatusColors: Record<string, string> = {
    PLANNING: 'blue',
    IN_PROGRESS: 'green',
    ON_HOLD: 'orange',
    COMPLETED: 'purple',
    CANCELLED: 'red',
  };

  const projectColumns = [
    {
      title: t('projects.code'),
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: t('projects.name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('projects.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={projectStatusColors[status]}>
          {t(`projects.status_${status.toLowerCase()}`)}
        </Tag>
      ),
    },
    {
      title: t('projects.price'),
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => `$${price.toLocaleString()}`,
    },
    {
      title: t('projects.startDate'),
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: t('projects.endDate'),
      dataIndex: 'endDate',
      key: 'endDate',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
  ];

  const totalRevenue = projects?.reduce((sum, p) => sum + p.price, 0) || 0;

  const OverviewTab = () => (
    <div>
      <Card title={t('accounts.accountInformation')} style={{ marginBottom: 16 }}>
        <Descriptions column={2}>
          <Descriptions.Item label={t('accounts.code')}>{account.code}</Descriptions.Item>
          <Descriptions.Item label={t('accounts.name')}>{account.name}</Descriptions.Item>
          <Descriptions.Item label={t('accounts.industry')}>{account.industry || '-'}</Descriptions.Item>
          <Descriptions.Item label={t('accounts.size')}>{account.size || '-'}</Descriptions.Item>
          <Descriptions.Item label={t('accounts.status')}>
            <Tag color={statusColors[account.status]}>
              {t(`accounts.status_${account.status.toLowerCase()}`)}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('accounts.createdAt')}>
            {dayjs(account.createdAt).format('YYYY-MM-DD')}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card hoverable>
            <Space>
              <HeartOutlined style={{ fontSize: 24, color: '#722ed1' }} />
              <div>
                <Text type="secondary">{t('accounts.healthScore')}</Text>
                <Title level={3} style={{ margin: 0, color: account.healthScore && account.healthScore >= 70 ? '#3f8600' : account.healthScore && account.healthScore >= 40 ? '#faad14' : '#cf1322' }}>
                  {account.healthScore ?? '-'}<span style={{ fontSize: 16 }}>%</span>
                </Title>
              </div>
            </Space>
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Space>
              <RiseOutlined style={{ fontSize: 24, color: '#722ed1' }} />
              <div>
                <Text type="secondary">{t('accounts.renewalProbability')}</Text>
                <Title level={3} style={{ margin: 0, color: account.renewalProbability && account.renewalProbability >= 70 ? '#3f8600' : '#faad14' }}>
                  {account.renewalProbability ?? '-'}<span style={{ fontSize: 16 }}>%</span>
                </Title>
              </div>
            </Space>
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Space>
              <DollarOutlined style={{ fontSize: 24, color: '#722ed1' }} />
              <div>
                <Text type="secondary">{t('accounts.annualValue')}</Text>
                <Title level={3} style={{ margin: 0 }}>${(account.annualValue ?? 0).toLocaleString()}</Title>
              </div>
            </Space>
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable>
            <Space>
              <DollarOutlined style={{ fontSize: 24, color: '#722ed1' }} />
              <div>
                <Text type="secondary">{t('accounts.lifetimeValue')}</Text>
                <Title level={3} style={{ margin: 0 }}>${(account.lifetimeValue ?? 0).toLocaleString()}</Title>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title={t('accounts.contactInformation')} style={{ marginBottom: 16 }}>
        <Descriptions column={2}>
          <Descriptions.Item label={t('accounts.primaryContact')}>
            <Space>
              <UserOutlined />
              {account.primaryContact || '-'}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label={t('accounts.primaryContactEmail')}>
            {account.primaryContactEmail || '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('accounts.primaryContactPhone')} span={2}>
            {account.primaryContactPhone || '-'}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={t('accounts.contractInformation')}>
        <Descriptions column={2}>
          <Descriptions.Item label={t('accounts.contractEndDate')}>
            <Space>
              <CalendarOutlined />
              {account.contractEndDate ? dayjs(account.contractEndDate).format('YYYY-MM-DD') : '-'}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label={t('accounts.nextReviewDate')}>
            <Space>
              <CalendarOutlined />
              {account.nextReviewDate ? dayjs(account.nextReviewDate).format('YYYY-MM-DD') : '-'}
            </Space>
          </Descriptions.Item>
        </Descriptions>
        {account.notes && (
          <>
            <br />
            <Text strong>{t('common.notes')}:</Text>
            <br />
            <Text>{account.notes}</Text>
          </>
        )}
      </Card>
    </div>
  );

  const ProjectsTab = () => (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card hoverable>
            <Space>
              <LineChartOutlined style={{ fontSize: 24, color: '#722ed1' }} />
              <div>
                <Text type="secondary">{t('accounts.totalProjects')}</Text>
                <Title level={3} style={{ margin: 0 }}>{projects?.length || 0}</Title>
              </div>
            </Space>
          </Card>
        </Col>
        <Col span={8}>
          <Card hoverable>
            <Space>
              <DollarOutlined style={{ fontSize: 24, color: '#722ed1' }} />
              <div>
                <Text type="secondary">{t('accounts.totalRevenue')}</Text>
                <Title level={3} style={{ margin: 0 }}>${totalRevenue.toLocaleString()}</Title>
              </div>
            </Space>
          </Card>
        </Col>
        <Col span={8}>
          <Card hoverable>
            <Space>
              <DollarOutlined style={{ fontSize: 24, color: '#722ed1' }} />
              <div>
                <Text type="secondary">{t('accounts.averageProjectValue')}</Text>
                <Title level={3} style={{ margin: 0 }}>${(projects?.length ? Math.round(totalRevenue / projects.length) : 0).toLocaleString()}</Title>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          columns={projectColumns}
          dataSource={projects}
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  );

  const ActivityTab = () => (
    <Card>
      <Timeline
        items={[
          {
            color: 'green',
            children: (
              <>
                <Text strong>{dayjs().subtract(2, 'days').format('YYYY-MM-DD')}</Text>
                <br />
                <Text>تم إكمال مشروع "نظام CRM" بنجاح</Text>
              </>
            ),
          },
          {
            color: 'blue',
            children: (
              <>
                <Text strong>{dayjs().subtract(7, 'days').format('YYYY-MM-DD')}</Text>
                <br />
                <Text>اجتماع مراجعة أسبوعي مع {account.primaryContact}</Text>
              </>
            ),
          },
          {
            color: 'orange',
            children: (
              <>
                <Text strong>{dayjs().subtract(15, 'days').format('YYYY-MM-DD')}</Text>
                <br />
                <Text>تحديث Health Score إلى {account.healthScore}%</Text>
              </>
            ),
          },
          {
            color: 'green',
            children: (
              <>
                <Text strong>{dayjs().subtract(30, 'days').format('YYYY-MM-DD')}</Text>
                <br />
                <Text>توقيع عقد تمديد خدمات</Text>
              </>
            ),
          },
        ]}
      />
    </Card>
  );

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/accounts')}>
            {t('common.back')}
          </Button>
          <Title level={2} style={{ margin: 0 }}>
            {account.name}
          </Title>
          <Tag color={statusColors[account.status]} style={{ fontSize: 14 }}>
            {t(`accounts.status_${account.status.toLowerCase()}`)}
          </Tag>
          {account.healthScore && (
            <Tag color={healthScoreColor(account.healthScore)} style={{ fontSize: 14 }}>
              Health: {account.healthScore}%
            </Tag>
          )}
        </Space>
        <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/accounts`)}>
          {t('common.edit')}
        </Button>
      </Space>

      <Tabs
        defaultActiveKey="overview"
        items={[
          {
            key: 'overview',
            label: t('accounts.overview'),
            children: <OverviewTab />,
          },
          {
            key: 'projects',
            label: `${t('nav.projects')} (${projects?.length || 0})`,
            children: <ProjectsTab />,
          },
          {
            key: 'activity',
            label: t('accounts.activity'),
            children: <ActivityTab />,
          },
        ]}
      />
    </div>
  );
}
