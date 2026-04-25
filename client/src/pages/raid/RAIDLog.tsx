import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Typography,
  Button,
  Table,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Tabs,
  App,
} from 'antd';
import {
  PlusOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LinkOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../lib/api';
import type { RAIDItem, Project } from '../../types';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { TabPane } = Tabs;

type RAIDType = 'RISK' | 'ASSUMPTION' | 'ISSUE' | 'DEPENDENCY';

export default function RAIDLog() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { message, modal } = App.useApp();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RAIDItem | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState<RAIDType>('RISK');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (!selectedProject) {
      message.warning('Please select a project to export');
      return;
    }
    try {
      setIsExporting(true);
      const blob = await api.exportRAIDLog(selectedProject);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `RAID_Log_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      message.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [selectedProject, message]);

  // Fetch projects for filter
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.getProjects(),
  });

  // Fetch RAID items
  const { data: raidItems, isLoading } = useQuery({
    queryKey: ['raid-items', selectedProject],
    queryFn: () => api.getRAIDItems({ projectId: selectedProject }),
  });

  // Create RAID item mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => api.createRAIDItem(data),
    onSuccess: () => {
      message.success(t('raid.createSuccess'));
      queryClient.invalidateQueries({ queryKey: ['raid-items'] });
      handleModalClose();
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || t('common.error'));
    },
  });

  // Update RAID item mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateRAIDItem(id, data),
    onSuccess: () => {
      message.success(t('raid.updateSuccess'));
      queryClient.invalidateQueries({ queryKey: ['raid-items'] });
      handleModalClose();
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || t('common.error'));
    },
  });

  // Delete RAID item mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteRAIDItem(id),
    onSuccess: () => {
      message.success(t('raid.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['raid-items'] });
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || t('common.error'));
    },
  });

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    form.resetFields();
  };

  const handleCreate = (type: RAIDType) => {
    setEditingItem(null);
    setActiveTab(type);
    form.setFieldsValue({ type });
    setIsModalOpen(true);
  };

  const handleEdit = (item: RAIDItem) => {
    setEditingItem(item);
    form.setFieldsValue({
      ...item,
      identifiedDate: dayjs(item.identifiedDate),
      targetDate: item.targetDate ? dayjs(item.targetDate) : undefined,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, title: string) => {
    modal.confirm({
      title: t('raid.deleteConfirm'),
      content: `${t('raid.deleteMessage')}: ${title}?`,
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const itemData = {
        ...values,
        identifiedDate: values.identifiedDate.toISOString(),
        targetDate: values.targetDate ? values.targetDate.toISOString() : null,
      };

      if (editingItem) {
        updateMutation.mutate({ id: editingItem.id, data: itemData });
      } else {
        createMutation.mutate(itemData);
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const typeColors: Record<RAIDType, string> = {
    RISK: 'red',
    ASSUMPTION: 'blue',
    ISSUE: 'orange',
    DEPENDENCY: 'purple',
  };

  const statusColors: Record<string, string> = {
    OPEN: 'orange',
    IN_PROGRESS: 'blue',
    MITIGATED: 'cyan',
    CLOSED: 'green',
  };

  const impactColors: Record<string, string> = {
    LOW: 'green',
    MEDIUM: 'blue',
    HIGH: 'orange',
    VERY_HIGH: 'volcano',
    CRITICAL: 'red',
  };

  const columns = [
    {
      title: t('raid.title'),
      dataIndex: 'title',
      key: 'title',
      width: 200,
    },
    {
      title: t('raid.type'),
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: RAIDType) => (
        <Tag color={typeColors[type || 'RISK']}>{type ? t(`raid.${type.toLowerCase()}`) : '-'}</Tag>
      ),
    },
    {
      title: t('raid.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={statusColors[status || 'OPEN']}>{status ? t(`raid.status_${status.toLowerCase()}`) : '-'}</Tag>
      ),
    },
    {
      title: t('raid.impact'),
      dataIndex: 'impact',
      key: 'impact',
      width: 100,
      render: (impact: string) => (
        <Tag color={impactColors[impact || 'LOW']}>{impact ? t(`raid.impact_${impact.toLowerCase()}`) : '-'}</Tag>
      ),
    },
    {
      title: t('raid.probability'),
      dataIndex: 'probability',
      key: 'probability',
      width: 100,
      render: (probability: string) => (
        <Tag color={impactColors[probability || 'LOW']}>{probability ? t(`raid.probability_${probability.toLowerCase()}`) : '-'}</Tag>
      ),
    },
    {
      title: t('raid.riskScore'),
      key: 'riskScore',
      width: 100,
      render: (_: any, record: RAIDItem) => {
        const impactValue = { LOW: 1, MEDIUM: 2, HIGH: 3, VERY_HIGH: 4, CRITICAL: 5 }[record.impact || 'LOW'] || 0;
        const probValue = { VERY_LOW: 1, LOW: 2, MEDIUM: 3, HIGH: 4, VERY_HIGH: 5 }[record.probability || 'LOW'] || 0;
        const score = impactValue * probValue;
        const color = score >= 16 ? 'red' : score >= 9 ? 'orange' : 'green';
        return <Tag color={color}>{score}</Tag>;
      },
    },
    {
      title: t('raid.project'),
      dataIndex: ['project', 'name'],
      key: 'project',
      width: 150,
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: RAIDItem) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id, record.title)}
          />
        </Space>
      ),
    },
  ];

  const filterItemsByType = (type: RAIDType) => {
    return raidItems?.filter((item: RAIDItem) => item.type === type) || [];
  };

  const getTypeIcon = (type: RAIDType) => {
    switch (type) {
      case 'RISK':
        return <WarningOutlined />;
      case 'ASSUMPTION':
        return <CheckCircleOutlined />;
      case 'ISSUE':
        return <CloseCircleOutlined />;
      case 'DEPENDENCY':
        return <LinkOutlined />;
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <Space>
          <Title level={2} style={{ margin: 0 }}>
            {t('raid.title')}
          </Title>
          <Select
            placeholder={t('reports.allProjects')}
            style={{ width: 200 }}
            allowClear
            value={selectedProject}
            onChange={setSelectedProject}
            options={projects?.map((project: Project) => ({
              label: project.name,
              value: project.id,
            }))}
          />
        </Space>
        <Button
          icon={<DownloadOutlined />}
          onClick={handleExport}
          loading={isExporting}
          disabled={!selectedProject}
          title={!selectedProject ? 'Select a project first' : 'Export RAID Log to Excel'}
        >
          Export to Excel
        </Button>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            onClick={() => setActiveTab('RISK')}
            style={{
              borderColor: activeTab === 'RISK' ? '#ff4d4f' : undefined,
              backgroundColor: activeTab === 'RISK' ? '#fff1f0' : undefined,
            }}
          >
            <Space>
              <WarningOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />
              <div>
                <Text type="secondary">{t('raid.risks')}</Text>
                <Title level={3} style={{ margin: 0 }}>
                  {filterItemsByType('RISK').length}
                </Title>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            onClick={() => setActiveTab('ASSUMPTION')}
            style={{
              borderColor: activeTab === 'ASSUMPTION' ? '#1890ff' : undefined,
              backgroundColor: activeTab === 'ASSUMPTION' ? '#e6f7ff' : undefined,
            }}
          >
            <Space>
              <CheckCircleOutlined style={{ fontSize: 24, color: '#1890ff' }} />
              <div>
                <Text type="secondary">{t('raid.assumptions')}</Text>
                <Title level={3} style={{ margin: 0 }}>
                  {filterItemsByType('ASSUMPTION').length}
                </Title>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            onClick={() => setActiveTab('ISSUE')}
            style={{
              borderColor: activeTab === 'ISSUE' ? '#faad14' : undefined,
              backgroundColor: activeTab === 'ISSUE' ? '#fffbe6' : undefined,
            }}
          >
            <Space>
              <CloseCircleOutlined style={{ fontSize: 24, color: '#faad14' }} />
              <div>
                <Text type="secondary">{t('raid.issues')}</Text>
                <Title level={3} style={{ margin: 0 }}>
                  {filterItemsByType('ISSUE').length}
                </Title>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            hoverable
            onClick={() => setActiveTab('DEPENDENCY')}
            style={{
              borderColor: activeTab === 'DEPENDENCY' ? '#722ed1' : undefined,
              backgroundColor: activeTab === 'DEPENDENCY' ? '#f9f0ff' : undefined,
            }}
          >
            <Space>
              <LinkOutlined style={{ fontSize: 24, color: '#722ed1' }} />
              <div>
                <Text type="secondary">{t('raid.dependencies')}</Text>
                <Title level={3} style={{ margin: 0 }}>
                  {filterItemsByType('DEPENDENCY').length}
                </Title>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Tabs activeKey={activeTab} onChange={(key) => setActiveTab(key as RAIDType)}>
        {(['RISK', 'ASSUMPTION', 'ISSUE', 'DEPENDENCY'] as RAIDType[]).map((type) => (
          <TabPane
            tab={
              <span>
                {getTypeIcon(type)} {t(`raid.${type.toLowerCase()}s`)}
              </span>
            }
            key={type}
          >
            <Card
              extra={
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleCreate(type)}
                >
                  {t('raid.new')}
                </Button>
              }
            >
              <Table
                columns={columns}
                dataSource={filterItemsByType(type)}
                rowKey="id"
                loading={isLoading}
                scroll={{ x: 1200 }}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `${t('common.total')}: ${total}`,
                }}
              />
            </Card>
          </TabPane>
        ))}
      </Tabs>

      {/* Create/Edit Modal */}
      <Modal
        title={editingItem ? t('raid.edit') : t('raid.new')}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleModalClose}
        width={700}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical" initialValues={{ type: 'RISK', status: 'OPEN' }}>
          <Form.Item name="type" label={t('raid.type')} rules={[{ required: true }]}>
            <Select>
              <Select.Option value="RISK">{t('raid.risk')}</Select.Option>
              <Select.Option value="ASSUMPTION">{t('raid.assumption')}</Select.Option>
              <Select.Option value="ISSUE">{t('raid.issue')}</Select.Option>
              <Select.Option value="DEPENDENCY">{t('raid.dependency')}</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="projectId"
            label={t('raid.project')}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Select
              placeholder={t('raid.selectProject')}
              options={projects?.map((project: Project) => ({
                label: project.name,
                value: project.id,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="title"
            label={t('raid.title')}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="description" label={t('raid.description')}>
            <TextArea rows={3} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label={t('raid.status')}
                rules={[{ required: true, message: t('common.required') }]}
              >
                <Select>
                  <Select.Option value="OPEN">{t('raid.status_open')}</Select.Option>
                  <Select.Option value="IN_PROGRESS">{t('raid.status_in_progress')}</Select.Option>
                  <Select.Option value="MITIGATED">{t('raid.status_mitigated')}</Select.Option>
                  <Select.Option value="CLOSED">{t('raid.status_closed')}</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="owner" label={t('raid.owner')}>
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="impact"
                label={t('raid.impact')}
                rules={[{ required: true, message: t('common.required') }]}
              >
                <Select>
                  <Select.Option value="LOW">{t('raid.impact_low')}</Select.Option>
                  <Select.Option value="MEDIUM">{t('raid.impact_medium')}</Select.Option>
                  <Select.Option value="HIGH">{t('raid.impact_high')}</Select.Option>
                  <Select.Option value="VERY_HIGH">{t('raid.impact_very_high')}</Select.Option>
                  <Select.Option value="CRITICAL">{t('raid.impact_critical')}</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="probability"
                label={t('raid.probability')}
                rules={[{ required: true, message: t('common.required') }]}
              >
                <Select>
                  <Select.Option value="VERY_LOW">{t('raid.probability_very_low')}</Select.Option>
                  <Select.Option value="LOW">{t('raid.probability_low')}</Select.Option>
                  <Select.Option value="MEDIUM">{t('raid.probability_medium')}</Select.Option>
                  <Select.Option value="HIGH">{t('raid.probability_high')}</Select.Option>
                  <Select.Option value="VERY_HIGH">{t('raid.probability_very_high')}</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="mitigation" label={t('raid.mitigation')}>
            <TextArea rows={2} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="identifiedDate"
                label={t('raid.identifiedDate')}
                rules={[{ required: true, message: t('common.required') }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="targetDate" label={t('raid.targetDate')}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
