import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Typography,
  Button,
  Row,
  Col,
  Statistic,
  Tag,
  Descriptions,
  Table,
  Space,
  Modal,
  Form,
  Select,
  Progress,
  Spin,
  App,
  Tabs,
  Input,
  InputNumber,
  DatePicker,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  UserAddOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../lib/api';
import type { Project, User } from '../../types';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { message, modal } = App.useApp();
  const [form] = Form.useForm();
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);

  // Fetch project details
  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => api.getProject(id!),
    enabled: !!id,
  });

  // Fetch all users for member selection
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.getUsers(),
  });

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: (data: { userId: string; role: string }) =>
      api.addProjectMember(id!, data),
    onSuccess: () => {
      message.success(t('projects.memberAdded'));
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      setIsMemberModalOpen(false);
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || t('common.error'));
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => api.removeProjectMember(id!, memberId),
    onSuccess: () => {
      message.success(t('projects.memberRemoved'));
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || t('common.error'));
    },
  });

  const handleAddMember = async () => {
    try {
      const values = await form.validateFields();
      addMemberMutation.mutate(values);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleRemoveMember = (memberId: string, userName: string) => {
    modal.confirm({
      title: t('projects.removeMemberConfirm'),
      content: `${t('projects.removeMemberMessage')}: ${userName}?`,
      onOk: () => removeMemberMutation.mutate(memberId),
    });
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Text>{t('projects.notFound')}</Text>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    PLANNING: 'blue',
    IN_PROGRESS: 'green',
    ON_HOLD: 'orange',
    COMPLETED: 'purple',
    CANCELLED: 'red',
  };

  const roleColors: Record<string, string> = {
    MANAGER: 'red',
    TEAM_LEAD: 'orange',
    MEMBER: 'blue',
  };

  const memberColumns = [
    {
      title: t('projects.memberName'),
      dataIndex: ['user', 'firstName'],
      key: 'name',
      render: (_: any, record: any) => (
        <Space>
          <Text>{`${record.user.firstName} ${record.user.lastName}`}</Text>
        </Space>
      ),
    },
    {
      title: t('projects.memberEmail'),
      dataIndex: ['user', 'email'],
      key: 'email',
    },
    {
      title: t('projects.memberRole'),
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={roleColors[role] || 'default'}>{t(`projects.role_${role.toLowerCase()}`)}</Tag>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: any, record: any) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() =>
            handleRemoveMember(record.id, `${record.user.firstName} ${record.user.lastName}`)
          }
        >
          {t('common.remove')}
        </Button>
      ),
    },
  ];

  const availableUsers = users?.filter(
    (user: User) =>
      !project.members?.some((member: any) => member.userId === user.id) &&
      user.id !== project.managerId
  );

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
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/projects')}>
            {t('common.back')}
          </Button>
          <Title level={2} style={{ margin: 0 }}>
            {project.name}
          </Title>
          <Tag color={statusColors[project.status]}>
            {t(`projects.status_${project.status.toLowerCase()}`)}
          </Tag>
        </Space>
        <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/projects/${id}/edit`)}>
          {t('common.edit')}
        </Button>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('projects.budget')}
              value={project.budget || 0}
              prefix={<DollarOutlined />}
              suffix={project.currency}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('projects.progress')}
              value={project.progress || 0}
              suffix="%"
              prefix={<CheckCircleOutlined />}
            />
            <Progress percent={project.progress || 0} showInfo={false} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('projects.tasks')}
              value={project._count?.tasks || 0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title={t('projects.teamSize')}
              value={(project.members?.length || 0) + 1}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Tabs defaultActiveKey="overview">
        <TabPane tab={t('projects.overview')} key="overview">
          <Card>
            <Descriptions bordered column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label={t('projects.code')}>{project.code}</Descriptions.Item>
              <Descriptions.Item label={t('projects.status')}>
                <Tag color={statusColors[project.status]}>
                  {t(`projects.status_${project.status.toLowerCase()}`)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('projects.manager')}>
                {project.manager ? `${project.manager.firstName} ${project.manager.lastName}` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('projects.client')}>
                {project.client || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('projects.startDate')}>
                {dayjs(project.startDate).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label={t('projects.endDate')}>
                {dayjs(project.endDate).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label={t('projects.budget')}>
                {project.budget || 0} {project.currency}
              </Descriptions.Item>
              <Descriptions.Item label={t('projects.price')}>
                {project.price || 0} {project.currency}
              </Descriptions.Item>
              <Descriptions.Item label={t('projects.description')} span={2}>
                {project.description || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span>
              <TeamOutlined /> {t('projects.members')} ({(project.members?.length || 0) + 1})
            </span>
          }
          key="members"
        >
          <Card
            extra={
              <Button
                type="primary"
                icon={<UserAddOutlined />}
                onClick={() => setIsMemberModalOpen(true)}
              >
                {t('projects.addMember')}
              </Button>
            }
          >
            <Table
              columns={memberColumns}
              dataSource={project.members}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </TabPane>

      </Tabs>

      {/* Add Member Modal */}
      <Modal
        title={t('projects.addMember')}
        open={isMemberModalOpen}
        onOk={handleAddMember}
        onCancel={() => {
          setIsMemberModalOpen(false);
          form.resetFields();
        }}
        confirmLoading={addMemberMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="userId"
            label={t('projects.selectUser')}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Select
              showSearch
              placeholder={t('projects.selectUser')}
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={availableUsers?.map((user: User) => ({
                label: `${user.firstName} ${user.lastName} (${user.email})`,
                value: user.id,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="role"
            label={t('projects.memberRole')}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Select>
              <Select.Option value="TEAM_LEAD">{t('projects.role_team_lead')}</Select.Option>
              <Select.Option value="MEMBER">{t('projects.role_member')}</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
}
