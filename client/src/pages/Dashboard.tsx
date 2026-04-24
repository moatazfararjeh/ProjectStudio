import { Row, Col, Card, Typography, Table, Tag, Space, Progress, Skeleton, Badge, Tooltip } from 'antd';
import { ProjectOutlined, CheckSquareOutlined, TeamOutlined, EyeOutlined, SyncOutlined, StopOutlined, WarningOutlined, CheckCircleOutlined, CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useAuthStore } from '../stores/authStore';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

const { Title, Text } = Typography;

interface Project {
  id: string;
  name: string;
  code: string;
  status: string;
  manager: {
    id: string;
    firstName: string;
    lastName: string;
  };
  members: Array<{ role: string; allocation: number }>;
  _count: {
    members: number;
    tasks: number;
  };
}

export default function Dashboard() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<any[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  useEffect(() => {
    const fetchMyProjects = async () => {
      try {
        const projects = await api.getMyProjects();
        console.log('My projects:', projects);
        setProjects(projects);
      } catch (error) {
        console.error('Error fetching my projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyProjects();
  }, []);

  useEffect(() => {
    if (!projects.length) { setTasksLoading(false); return; }
    setTasksLoading(true);
    Promise.allSettled(projects.map((p) => api.getTasks({ projectId: p.id })))
      .then((results) => {
        const all: any[] = [];
        results.forEach((r) => { if (r.status === 'fulfilled') all.push(...r.value); });
        setTasks(all);
      })
      .catch(console.error)
      .finally(() => setTasksLoading(false));
  }, [projects]);

  const totalTasks     = tasks.length;
  const completionRate = totalTasks > 0 ? Math.round((tasks.filter(t => t.status === 'COMPLETED').length / totalTasks) * 100) : 0;

  const activeTasks = tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED');

  const today    = dayjs().startOf('day');
  const in30days  = today.add(30, 'day').endOf('day');

  const overdueTasks  = activeTasks
    .filter(t => t.endDate && dayjs(t.endDate).isBefore(today))
    .sort((a, b) => dayjs(a.endDate).diff(dayjs(b.endDate)));

  const upcomingTasks = activeTasks
    .filter(t => t.endDate && !dayjs(t.endDate).isBefore(today) && dayjs(t.endDate).isBefore(in30days))
    .sort((a, b) => dayjs(a.endDate).diff(dayjs(b.endDate)));

  const projectMap = new Map(projects.map(p => [p.id, p.name]));

  const taskStatusBadge: Record<string, string> = {
    NOT_STARTED: '#8c8c8c',
    IN_PROGRESS: '#1677ff',
    BLOCKED:     '#ff4d4f',
  };

  const taskStatusConfig = [
    { status: 'NOT_STARTED', label: 'Not Started', color: '#8c8c8c', icon: <StopOutlined /> },
    { status: 'IN_PROGRESS', label: 'In Progress', color: '#1677ff', icon: <SyncOutlined spin /> },
    { status: 'BLOCKED',     label: 'Blocked',     color: '#ff4d4f', icon: <WarningOutlined /> },
    { status: 'COMPLETED',   label: 'Completed',   color: '#52c41a', icon: <CheckCircleOutlined /> },
    { status: 'CANCELLED',   label: 'Cancelled',   color: '#fa8c16', icon: <StopOutlined /> },
  ];

  const statusColors: Record<string, string> = {
    PLANNING: 'blue',
    IN_PROGRESS: 'green',
    ON_HOLD: 'orange',
    COMPLETED: 'gray',
    CANCELLED: 'red',
  };

  const columns = [
    {
      title: t('projects.code'),
      dataIndex: 'code',
      key: 'code',
      width: 120,
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
      width: 140,
      render: (status: string) => (
        <Tag color={statusColors[status]}>
          {t(`projects.status_${status.toLowerCase()}`)}
        </Tag>
      ),
    },
    {
      title: t('projects.role'),
      key: 'role',
      width: 150,
      render: (_: any, record: Project) => {
        if (record.manager && user?.id === record.manager.id) {
          return <Tag color="purple">{t('projects.manager')}</Tag>;
        }
        if (record.members && record.members.length > 0) {
          const role = record.members[0].role;
          let roleKey = '';
          if (role === 'MANAGER') roleKey = 'manager';
          else if (role === 'TEAM_LEAD') roleKey = 'team_lead';
          else if (role === 'MEMBER') roleKey = 'member';
          else if (role === 'DEVELOPER') roleKey = 'developer';
          else if (role === 'DESIGNER') roleKey = 'designer';
          else if (role === 'QA') roleKey = 'qa';
          else roleKey = role.toLowerCase();
          
          return <Tag color="blue">{t(`projects.role_${roleKey}`)}</Tag>;
        }
        return '-';
      },
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 100,
      render: (_: any, record: Project) => (
        <Space>
          <a onClick={() => navigate(`/projects/${record.id}`)}>
            <EyeOutlined /> {t('common.view')}
          </a>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ width: '100%' }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        {t('dashboard.welcome')}, {user?.firstName}!
      </Title>
      
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Space>
              <ProjectOutlined style={{ fontSize: 24, color: '#722ed1' }} />
              <div>
                <Text type="secondary">{t('projects.title')}</Text>
                <Title level={3} style={{ margin: 0 }}>{projects.length}</Title>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Space>
              <CheckSquareOutlined style={{ fontSize: 24, color: '#722ed1' }} />
              <div>
                <Text type="secondary">{t('dashboard.myTasks')}</Text>
                <Title level={3} style={{ margin: 0 }}>{tasksLoading ? '-' : totalTasks}</Title>
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Space>
              <TeamOutlined style={{ fontSize: 24, color: '#722ed1' }} />
              <div>
                <Text type="secondary">{t('nav.team')}</Text>
                <Title level={3} style={{ margin: 0 }}>8</Title>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={14}>
          <Card title={t('dashboard.myProjects')} variant="borderless">
            <Table
              columns={columns}
              dataSource={projects}
              rowKey="id"
              loading={loading}
              locale={{ emptyText: t('common.noData') }}
              pagination={false}
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title={
              <span>
                <CheckSquareOutlined style={{ marginRight: 8, color: '#1677ff' }} />
                Task Breakdown
              </span>
            }
            style={{ height: '100%' }}
          >
            {tasksLoading ? (
              <Skeleton active />
            ) : totalTasks === 0 ? (
              <div style={{ textAlign: 'center', color: '#8c8c8c', padding: '20px 0' }}>No tasks found</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {taskStatusConfig.map(({ status, label, color, icon }) => {
                  const count = tasks.filter((t) => t.status === status).length;
                  const pct = Math.round((count / totalTasks) * 100);
                  return (
                    <div key={status}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, color, fontWeight: 500 }}>
                          {icon} {label}
                        </span>
                        <span style={{ color: '#595959', fontWeight: 600 }}>
                          {count} <span style={{ color: '#bfbfbf', fontWeight: 400 }}>({pct}%)</span>
                        </span>
                      </div>
                      <Progress
                        percent={pct}
                        showInfo={false}
                        strokeColor={color}
                        trailColor="#f0f0f0"
                        size={['100%', 7] as any}
                      />
                    </div>
                  );
                })}
                <div style={{
                  marginTop: 8, paddingTop: 14,
                  borderTop: '1px solid rgba(0,0,0,0.06)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontSize: 13, color: '#8c8c8c' }}>Overall Completion</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: completionRate >= 70 ? '#52c41a' : '#faad14' }}>
                    {completionRate}%
                  </span>
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Upcoming & Overdue Panel */}
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <WarningOutlined style={{ color: '#ff4d4f' }} />
                Overdue Tasks
                <Badge count={overdueTasks.length} style={{ backgroundColor: '#ff4d4f' }} />
              </span>
            }
            style={{ minHeight: 220 }}
          >
            {tasksLoading ? (
              <Skeleton active />
            ) : overdueTasks.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#52c41a', padding: '24px 0', fontSize: 13 }}>
                <CheckCircleOutlined style={{ marginRight: 6 }} />
                No overdue tasks — great work!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Array.from(new Set(overdueTasks.map((t: any) => t.projectId))).map((pid) => {
                  const pName = projectMap.get(pid as string) ?? 'Unknown Project';
                  const pts = overdueTasks.filter((t: any) => t.projectId === pid);
                  return (
                    <div key={pid as string}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#595959', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4, paddingBottom: 3, borderBottom: '1px solid #f0f0f0' }}>
                        <ProjectOutlined style={{ marginRight: 5, color: '#8c8c8c' }} />{pName}
                      </div>
                      {pts.map((task: any) => (
                        <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0 4px 10px', gap: 8 }}>
                          <Tooltip title={task.name}>
                            <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {task.name}
                            </div>
                          </Tooltip>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                            <Tag color={taskStatusBadge[task.status] ?? '#8c8c8c'} style={{ margin: 0, fontSize: 11 }}>
                              {task.status.replace('_', ' ')}
                            </Tag>
                            <span style={{ fontSize: 11, color: '#ff4d4f', fontWeight: 500, whiteSpace: 'nowrap' }}>
                              <ClockCircleOutlined style={{ marginRight: 3 }} />
                              {dayjs(task.endDate).format('MMM D')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
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
            style={{ minHeight: 220 }}
          >
            {tasksLoading ? (
              <Skeleton active />
            ) : upcomingTasks.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#8c8c8c', padding: '24px 0', fontSize: 13 }}>
                No tasks due in the next 30 days
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Array.from(new Set(upcomingTasks.map((t: any) => t.projectId))).map((pid) => {
                  const pName = projectMap.get(pid as string) ?? 'Unknown Project';
                  const pts = upcomingTasks.filter((t: any) => t.projectId === pid);
                  return (
                    <div key={pid as string}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#595959', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4, paddingBottom: 3, borderBottom: '1px solid #f0f0f0' }}>
                        <ProjectOutlined style={{ marginRight: 5, color: '#8c8c8c' }} />{pName}
                      </div>
                      {pts.map((task: any) => (
                        <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0 4px 10px', gap: 8 }}>
                          <Tooltip title={task.name}>
                            <div style={{ flex: 1, minWidth: 0, fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {task.name}
                            </div>
                          </Tooltip>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                            <Tag color={taskStatusBadge[task.status] ?? '#8c8c8c'} style={{ margin: 0, fontSize: 11 }}>
                              {task.status.replace('_', ' ')}
                            </Tag>
                            <span style={{ fontSize: 11, color: '#1677ff', fontWeight: 500, whiteSpace: 'nowrap' }}>
                              <CalendarOutlined style={{ marginRight: 3 }} />
                              {dayjs(task.endDate).format('MMM D')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
