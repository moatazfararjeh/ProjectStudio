import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, Row, Col, Progress, Space, Typography, Tag, Badge, Tooltip } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  WarningOutlined,
  RiseOutlined,
  DollarOutlined,
  CalendarOutlined,
  SyncOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { Column } from '@ant-design/plots';
import dayjs from 'dayjs';
import api from '../../lib/api';
import type { Project } from '../../types';

const { Title, Text } = Typography;

interface ProjectDashboardProps {
  project: Project;
}

export default function ProjectDashboard({ project }: ProjectDashboardProps) {
  const { t } = useTranslation();

  // Fetch project tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', project.id],
    queryFn: () => api.getTasks({ projectId: project.id }),
  });

  // Fetch project worklogs
  const { data: worklogs = [] } = useQuery({
    queryKey: ['worklogs', project.id],
    queryFn: () => api.getWorklogs({ projectId: project.id }),
  });

  // Fetch RAID items
  const { data: raidItems = [] } = useQuery({
    queryKey: ['raid-items', project.id],
    queryFn: () => api.getRAIDItems({ projectId: project.id }),
  });

  // Calculate statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task: any) => task.status === 'COMPLETED').length;
  const inProgressTasks = tasks.filter((task: any) => task.status === 'IN_PROGRESS').length;
  const notStartedTasks = tasks.filter((task: any) => task.status === 'NOT_STARTED').length;
  const blockedTasks = tasks.filter((task: any) => task.status === 'BLOCKED').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 10000) / 100 : 0;

  const totalHours = worklogs.reduce((sum: number, log: any) => sum + (log.hours || 0), 0);
  const totalMembers = project.members?.length || 0;

  // Count active (non-closed) risks and issues
  const activeRisks = raidItems.filter((item: any) => item.type === 'RISK' && item.status !== 'CLOSED').length;
  const activeIssues = raidItems.filter((item: any) => item.type === 'ISSUE' && item.status !== 'CLOSED').length;

  // Upcoming & Overdue
  const today    = dayjs().startOf('day');
  const in30days = today.add(30, 'day').endOf('day');
  const activeTasks = tasks.filter((t: any) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED');
  const overdueTasks  = activeTasks
    .filter((t: any) => t.endDate && dayjs(t.endDate).isBefore(today))
    .sort((a: any, b: any) => dayjs(a.endDate).diff(dayjs(b.endDate)));
  const upcomingTasks = activeTasks
    .filter((t: any) => t.endDate && !dayjs(t.endDate).isBefore(today) && dayjs(t.endDate).isBefore(in30days))
    .sort((a: any, b: any) => dayjs(a.endDate).diff(dayjs(b.endDate)));

  const taskStatusBadgeColor: Record<string, string> = {
    NOT_STARTED: '#8c8c8c',
    IN_PROGRESS: '#1677ff',
    BLOCKED:     '#ff4d4f',
  };

  // Task status distribution for chart
  const taskStatusData = [
    { status: t('tasks.status_not_started') || 'Not Started', count: notStartedTasks, type: 'NOT_STARTED' },
    { status: t('tasks.status_in_progress'), count: inProgressTasks, type: 'IN_PROGRESS' },
    { status: t('tasks.status_completed') || 'Completed', count: completedTasks, type: 'COMPLETED' },
    ...(blockedTasks > 0 ? [{ status: t('tasks.status_blocked') || 'Blocked', count: blockedTasks, type: 'BLOCKED' }] : []),
  ];

  const statusColors: any = {
    NOT_STARTED: '#faad14',
    IN_PROGRESS: '#1890ff',
    COMPLETED: '#52c41a',
    BLOCKED: '#ff4d4f',
  };

  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      {/* Project Info Header */}
      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col flex="auto">
            <Space direction="vertical" size="small">
              <Title level={3} style={{ margin: 0 }}>
                {project.name}
              </Title>
              <Text type="secondary">{project.description}</Text>
              <Space>
                <Tag color={project.status === 'IN_PROGRESS' ? 'blue' : 'default'}>
                  {t(`projects.status_${project.status?.toLowerCase()}`)}
                </Tag>
                <Text type="secondary">
                  {t('projects.startDate')}: {new Date(project.startDate).toLocaleDateString()}
                </Text>
                {project.endDate && (
                  <Text type="secondary">
                    {t('projects.endDate')}: {new Date(project.endDate).toLocaleDateString()}
                  </Text>
                )}
              </Space>
            </Space>
          </Col>
          <Col>
            <Progress
              type="circle"
              percent={completionRate}
              size={100}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
          </Col>
        </Row>
      </Card>

      {/* Key Metrics */}
      <Row gutter={[16, 16]} align="stretch">
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Space>
              <CheckCircleOutlined style={{ fontSize: 24, color: '#722ed1' }} />
              <div>
                <Text type="secondary">{t('reports.totalTasks')}</Text>
                <Title level={3} style={{ margin: 0 }}>{totalTasks}</Title>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Space>
              <CheckCircleOutlined style={{ fontSize: 24, color: '#722ed1' }} />
              <div>
                <Text type="secondary">{t('reports.completedTasks')}</Text>
                <Title level={3} style={{ margin: 0 }}>{completedTasks}<span style={{ fontSize: 16, color: '#8c8c8c' }}> / {totalTasks}</span></Title>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Space>
              <ClockCircleOutlined style={{ fontSize: 24, color: '#722ed1' }} />
              <div>
                <Text type="secondary">{t('reports.totalHours')}</Text>
                <Title level={3} style={{ margin: 0 }}>{totalHours}<span style={{ fontSize: 16 }}> hrs</span></Title>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Space>
              <TeamOutlined style={{ fontSize: 24, color: '#722ed1' }} />
              <div>
                <Text type="secondary">{t('dashboard.teamSize')}</Text>
                <Title level={3} style={{ margin: 0 }}>{totalMembers}</Title>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Charts and Details */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t('tasks.status')} extra={<RiseOutlined />}>
            <Column
              data={taskStatusData}
              xField="status"
              yField="count"
              seriesField="type"
              color={({ type }: any) => statusColors[type]}
              label={{
                position: 'top',
                style: {
                  fill: '#000000',
                  opacity: 0.6,
                },
              }}
              meta={{
                status: { alias: t('tasks.status') },
                count: { alias: t('common.total') },
              }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="RAID Summary">
            <Space orientation="vertical" size="large" style={{ width: '100%' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Card size="small" style={{ backgroundColor: activeRisks > 0 ? '#fff1f0' : '#f0f0f0' }}>
                    <Space>
                      <WarningOutlined style={{ fontSize: 20, color: activeRisks > 0 ? '#ff4d4f' : '#8c8c8c' }} />
                      <div>
                        <Text type="secondary">{t('raid.risks')}</Text>
                        <Title level={4} style={{ margin: 0, color: activeRisks > 0 ? '#ff4d4f' : '#8c8c8c' }}>{activeRisks}</Title>
                      </div>
                    </Space>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" style={{ backgroundColor: activeIssues > 0 ? '#fffbe6' : '#f0f0f0' }}>
                    <Space>
                      <WarningOutlined style={{ fontSize: 20, color: activeIssues > 0 ? '#faad14' : '#8c8c8c' }} />
                      <div>
                        <Text type="secondary">{t('raid.issues')}</Text>
                        <Title level={4} style={{ margin: 0, color: activeIssues > 0 ? '#faad14' : '#8c8c8c' }}>{activeIssues}</Title>
                      </div>
                    </Space>
                  </Card>
                </Col>
              </Row>

              {project.budget && (
                <Card size="small">
                  <Space>
                    <DollarOutlined style={{ fontSize: 20, color: '#722ed1' }} />
                    <div>
                      <Text type="secondary">{t('dashboard.budget')}</Text>
                      <Title level={4} style={{ margin: 0 }}>{project.budget}<span style={{ fontSize: 14 }}> {project.currency || 'USD'}</span></Title>
                    </div>
                  </Space>
                </Card>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Progress Details */}
      <Card title={t('projects.progress')}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <div>
            <Text strong>{t('reports.completionRate')}</Text>
            <Progress percent={completionRate} status={completionRate === 100 ? 'success' : 'active'} />
          </div>
          <Row gutter={16}>
            <Col span={8}>
              <Text type="secondary">{t('tasks.status_not_started') || 'Not Started'}</Text>
              <Progress percent={Math.round((notStartedTasks / totalTasks) * 10000) / 100 || 0} strokeColor="#faad14" />
            </Col>
            <Col span={8}>
              <Text type="secondary">{t('tasks.status_in_progress')}</Text>
              <Progress percent={Math.round((inProgressTasks / totalTasks) * 10000) / 100 || 0} strokeColor="#1890ff" />
            </Col>
            <Col span={8}>
              <Text type="secondary">{t('tasks.status_completed') || 'Completed'}</Text>
              <Progress percent={Math.round((completedTasks / totalTasks) * 10000) / 100 || 0} strokeColor="#52c41a" />
            </Col>
          </Row>
        </Space>
      </Card>

      {/* Upcoming & Overdue */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <WarningOutlined style={{ color: '#ff4d4f' }} />
                Overdue Tasks
                <Badge count={overdueTasks.length} style={{ backgroundColor: '#ff4d4f' }} />
              </span>
            }
          >
            {overdueTasks.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#52c41a', padding: '20px 0', fontSize: 13 }}>
                <CheckCircleOutlined style={{ marginRight: 6 }} />
                No overdue tasks — great work!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {overdueTasks.slice(0, 8).map((task: any) => (
                  <div key={task.id} style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', width: '100%', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Tooltip title={task.name}>
                        <div style={{ fontWeight: 500, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {task.name}
                        </div>
                      </Tooltip>
                      {task.assignedTo && (
                        <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 1 }}>
                          {task.assignedTo.firstName} {task.assignedTo.lastName}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                      <Tag
                        style={{ margin: 0, fontSize: 11, color: '#fff', backgroundColor: taskStatusBadgeColor[task.status] ?? '#8c8c8c', border: 'none' }}
                      >
                        {task.status === 'IN_PROGRESS' ? <SyncOutlined spin /> : task.status === 'BLOCKED' ? <WarningOutlined /> : <StopOutlined />}
                        {' '}{task.status.replace('_', ' ')}
                      </Tag>
                      <span style={{ fontSize: 11, color: '#ff4d4f', fontWeight: 500 }}>
                        <ClockCircleOutlined style={{ marginRight: 3 }} />
                        {dayjs(task.endDate).format('MMM D, YYYY')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CalendarOutlined style={{ color: '#1677ff' }} />
                Upcoming (Next 30 Days)
                <Badge count={upcomingTasks.length} style={{ backgroundColor: '#1677ff' }} />
              </span>
            }
          >
            {upcomingTasks.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#8c8c8c', padding: '20px 0', fontSize: 13 }}>
                No tasks due in the next 30 days
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {upcomingTasks.slice(0, 8).map((task: any) => (
                  <div key={task.id} style={{ padding: '6px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', width: '100%', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Tooltip title={task.name}>
                        <div style={{ fontWeight: 500, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {task.name}
                        </div>
                      </Tooltip>
                      {task.assignedTo && (
                        <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 1 }}>
                          {task.assignedTo.firstName} {task.assignedTo.lastName}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                      <Tag
                        style={{ margin: 0, fontSize: 11, color: '#fff', backgroundColor: taskStatusBadgeColor[task.status] ?? '#8c8c8c', border: 'none' }}
                      >
                        {task.status === 'IN_PROGRESS' ? <SyncOutlined spin /> : task.status === 'BLOCKED' ? <WarningOutlined /> : <StopOutlined />}
                        {' '}{task.status.replace('_', ' ')}
                      </Tag>
                      <span style={{ fontSize: 11, color: '#1677ff', fontWeight: 500 }}>
                        <CalendarOutlined style={{ marginRight: 3 }} />
                        {dayjs(task.endDate).format('MMM D, YYYY')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
