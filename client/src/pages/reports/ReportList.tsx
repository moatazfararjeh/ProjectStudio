import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  Typography,
  Row,
  Col,
  Select,
  DatePicker,
  Button,
  Table,
  Space,
  Tag,
  Tabs,
} from 'antd';
import {
  DownloadOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  RiseOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import api from '../../lib/api';
import type { Project, Task, Worklog, Report } from '../../types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

type ReportType = 'weekly' | 'monthly' | 'custom';

export default function ReportList() {
  const { t } = useTranslation();
  const [reportType, setReportType] = useState<ReportType>('weekly');
  const [selectedProject, setSelectedProject] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('week'),
    dayjs().endOf('week'),
  ]);

  // Fetch projects for filter
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.getProjects(),
  });

  // Fetch reports
  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ['reports', selectedProject],
    queryFn: () => api.getReports({ projectId: selectedProject }),
  });

  // Fetch worklogs for date range
  const { data: worklogs, isLoading: worklogsLoading } = useQuery({
    queryKey: ['worklogs-report', dateRange, selectedProject],
    queryFn: () =>
      api.getWorklogs({
        projectId: selectedProject,
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
      }),
  });

  // Fetch tasks for statistics
  const { data: tasks } = useQuery({
    queryKey: ['tasks-report', selectedProject],
    queryFn: () => api.getTasks({ projectId: selectedProject }),
  });

  // Fetch RAID items for RAID report
  const { data: raidItems, isLoading: raidLoading } = useQuery({
    queryKey: ['raid-items-report', selectedProject],
    queryFn: () => api.getRAIDItems({ projectId: selectedProject }),
  });

  // Calculate statistics
  const totalHours = worklogs?.reduce((sum: number, log: Worklog) => sum + (log.hours || 0), 0) || 0;
  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter((task: Task) => task.status === 'COMPLETED').length || 0;
  const inProgressTasks = tasks?.filter((task: Task) => task.status === 'IN_PROGRESS').length || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // This week's accomplishments (completed tasks and worklogs)
  const thisWeekStart = dayjs().startOf('week');
  const thisWeekEnd = dayjs().endOf('week');
  const nextWeekStart = thisWeekStart.add(1, 'week');
  const nextWeekEnd = nextWeekStart.endOf('week');

  const thisWeekTasks = tasks?.filter((task: Task) => {
    const updatedAt = dayjs(task.updatedAt);
    return task.status === 'COMPLETED' && updatedAt.isAfter(thisWeekStart) && updatedAt.isBefore(thisWeekEnd);
  }) || [];

  const nextWeekTasks = tasks?.filter((task: Task) => {
    const startDate = dayjs(task.startDate);
    return task.status !== 'DONE' && startDate.isAfter(nextWeekStart) && startDate.isBefore(nextWeekEnd);
  }) || [];

  const handleReportTypeChange = (type: ReportType) => {
    setReportType(type);
    if (type === 'weekly') {
      setDateRange([dayjs().startOf('week'), dayjs().endOf('week')]);
    } else if (type === 'monthly') {
      setDateRange([dayjs().startOf('month'), dayjs().endOf('month')]);
    }
  };

  const handleExport = () => {
    // TODO: Implement export to PDF/Excel
    console.log('Exporting report...');
  };

  const worklogColumns = [
    {
      title: t('worklogs.date'),
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: t('worklogs.task'),
      dataIndex: ['task', 'name'],
      key: 'task',
    },
    {
      title: t('common.user'),
      dataIndex: 'user',
      key: 'user',
      render: (user: any) => `${user?.firstName} ${user?.lastName}`,
    },
    {
      title: t('worklogs.hours'),
      dataIndex: 'hours',
      key: 'hours',
      render: (hours: number) => `${hours} hrs`,
    },
    {
      title: t('worklogs.whatDone'),
      dataIndex: 'whatDone',
      key: 'whatDone',
      ellipsis: true,
    },
  ];

  const reportColumns = [
    {
      title: t('reports.reportName'),
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: t('reports.type'),
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'WEEKLY' ? 'blue' : 'green'}>
          {t(`reports.type_${type.toLowerCase()}`)}
        </Tag>
      ),
    },
    {
      title: t('reports.project'),
      dataIndex: ['project', 'name'],
      key: 'project',
    },
    {
      title: t('reports.period'),
      key: 'period',
      render: (_: any, record: Report) =>
        `${dayjs(record.startDate).format('MMM DD')} - ${dayjs(record.endDate).format('MMM DD, YYYY')}`,
    },
    {
      title: t('reports.createdBy'),
      dataIndex: 'user',
      key: 'user',
      render: (user: any) => `${user?.firstName} ${user?.lastName}`,
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: () => (
        <Button type="text" icon={<DownloadOutlined />}>
          {t('common.download')}
        </Button>
      ),
    },
  ];

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
        <Title level={2} style={{ margin: 0 }}>
          {t('reports.title')}
        </Title>
        <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
          {t('reports.export')}
        </Button>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Space size="large" wrap>
          <Select
            style={{ width: 150 }}
            value={reportType}
            onChange={handleReportTypeChange}
            options={[
              { label: t('reports.weekly'), value: 'weekly' },
              { label: t('reports.monthly'), value: 'monthly' },
              { label: t('reports.custom'), value: 'custom' },
            ]}
          />
          <RangePicker
            value={dateRange}
            onChange={(dates) => dates && setDateRange(dates as [Dayjs, Dayjs])}
            format="YYYY-MM-DD"
          />
          <Select
            style={{ width: 200 }}
            placeholder={t('reports.allProjects')}
            allowClear
            value={selectedProject}
            onChange={setSelectedProject}
            options={projects?.map((project: Project) => ({
              label: project.name,
              value: project.id,
            }))}
          />
        </Space>
      </Card>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
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
              <FileTextOutlined style={{ fontSize: 24, color: '#722ed1' }} />
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
                <Title level={3} style={{ margin: 0 }}>{completedTasks}</Title>
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Space>
              <RiseOutlined style={{ fontSize: 24, color: completionRate >= 70 ? '#52c41a' : '#faad14' }} />
              <div>
                <Text type="secondary">{t('reports.completionRate')}</Text>
                <Title level={3} style={{ margin: 0, color: completionRate >= 70 ? '#52c41a' : '#faad14' }}>{completionRate}<span style={{ fontSize: 16 }}>%</span></Title>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Tabs defaultActiveKey="worklogs">
        <TabPane tab={t('worklogs.title')} key="worklogs">
          <Card>
            <Table
              columns={worklogColumns}
              dataSource={worklogs}
              rowKey="id"
              loading={worklogsLoading}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: (total) => `${t('common.total')}: ${total}`,
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab={t('reports.savedReports')} key="reports">
          <Card>
            <Table
              columns={reportColumns}
              dataSource={reports}
              rowKey="id"
              loading={reportsLoading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `${t('common.total')}: ${total}`,
              }}
            />
          </Card>
        </TabPane>

        <TabPane tab={t('reports.summary')} key="summary">
          <Card>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Title level={4}>{t('reports.projectSummary')}</Title>
                <Text>{selectedProject ? projects?.find((p: Project) => p.id === selectedProject)?.name : t('reports.allProjects')}</Text>
              </div>
              <div>
                <Title level={4}>{t('reports.period')}</Title>
                <Text>
                  {dateRange[0].format('MMMM DD, YYYY')} - {dateRange[1].format('MMMM DD, YYYY')}
                </Text>
              </div>
              <div>
                <Title level={4}>{t('reports.statistics')}</Title>
                <Space direction="vertical">
                  <Text>• {t('reports.totalHours')}: {totalHours} hrs</Text>
                  <Text>• {t('reports.totalTasks')}: {totalTasks}</Text>
                  <Text>• {t('reports.completedTasks')}: {completedTasks}</Text>
                  <Text>• {t('reports.inProgressTasks')}: {inProgressTasks}</Text>
                  <Text>• {t('reports.completionRate')}: {completionRate}%</Text>
                </Space>
              </div>
            </Space>
          </Card>
        </TabPane>

        <TabPane tab={t('reports.thisWeekAccomplishments')} key="thisWeek">
          <Card>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Title level={4}>{t('reports.thisWeekAccomplishments')}</Title>
                <Text type="secondary">
                  {thisWeekStart.format('MMMM DD')} - {thisWeekEnd.format('MMMM DD, YYYY')}
                </Text>
              </div>
              
              <div>
                <Title level={5}>{t('reports.completedTasksThisWeek')}</Title>
                {thisWeekTasks.length > 0 ? (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {thisWeekTasks.map((task: Task) => (
                      <Card key={task.id} size="small" style={{ backgroundColor: '#f6ffed' }}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <Text strong>✓ {task.name}</Text>
                            <Tag color="green">DONE</Tag>
                          </Space>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {task.project?.name}
                          </Text>
                          {task.description && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {task.description}
                            </Text>
                          )}
                        </Space>
                      </Card>
                    ))}
                  </Space>
                ) : (
                  <Text type="secondary">{t('reports.noCompletedTasksThisWeek')}</Text>
                )}
              </div>

              <div>
                <Title level={5}>{t('reports.hoursLoggedThisWeek')}</Title>
                <Text>
                  {t('reports.totalHours')}: <Text strong>{totalHours} hrs</Text>
                </Text>
              </div>
            </Space>
          </Card>
        </TabPane>

        <TabPane tab={t('reports.nextWeekPlan')} key="nextWeek">
          <Card>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Title level={4}>{t('reports.nextWeekPlan')}</Title>
                <Text type="secondary">
                  {nextWeekStart.format('MMMM DD')} - {nextWeekEnd.format('MMMM DD, YYYY')}
                </Text>
              </div>
              
              <div>
                <Title level={5}>{t('reports.plannedTasks')}</Title>
                {nextWeekTasks.length > 0 ? (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {nextWeekTasks.map((task: Task) => (
                      <Card key={task.id} size="small" style={{ backgroundColor: '#e6f7ff' }}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <Text strong>{task.name}</Text>
                            <Tag color={task.priority === 'HIGH' || task.priority === 'CRITICAL' ? 'red' : 'blue'}>
                              {t(`tasks.priority_${task.priority.toLowerCase()}`)}
                            </Tag>
                          </Space>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {task.project?.name}
                          </Text>
                          {task.description && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {task.description}
                            </Text>
                          )}
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {t('tasks.startDate')}: {dayjs(task.startDate).format('MMM DD')} | 
                            {t('tasks.endDate')}: {dayjs(task.endDate).format('MMM DD')}
                          </Text>
                        </Space>
                      </Card>
                    ))}
                  </Space>
                ) : (
                  <Text type="secondary">{t('reports.noPlannedTasksNextWeek')}</Text>
                )}
              </div>

              <div>
                <Title level={5}>{t('reports.summary')}</Title>
                <Space direction="vertical">
                  <Text>• {t('reports.plannedTasks')}: {nextWeekTasks.length}</Text>
                  <Text>• {t('reports.highPriorityTasks')}: {nextWeekTasks.filter((t: Task) => t.priority === 'HIGH' || t.priority === 'CRITICAL').length}</Text>
                </Space>
              </div>
            </Space>
          </Card>
        </TabPane>

        <TabPane tab="RAID Log" key="raid">
          <Card>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Title level={4}>RAID Log Report</Title>
                <Text type="secondary">Risks, Assumptions, Issues, and Dependencies</Text>
              </div>

              {/* RAID Statistics */}
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                  <Card size="small" hoverable style={{ backgroundColor: '#fff1f0', borderColor: '#ff4d4f' }}>
                    <Space>
                      <WarningOutlined style={{ fontSize: 20, color: '#ff4d4f' }} />
                      <div>
                        <Text type="secondary">{t('raid.risks')}</Text>
                        <Title level={4} style={{ margin: 0, color: '#ff4d4f' }}>{raidItems?.filter((item: any) => item.type === 'RISK').length || 0}</Title>
                      </div>
                    </Space>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card size="small" hoverable style={{ backgroundColor: '#e6f7ff', borderColor: '#1890ff' }}>
                    <Space>
                      <CheckCircleOutlined style={{ fontSize: 20, color: '#1890ff' }} />
                      <div>
                        <Text type="secondary">{t('raid.assumptions')}</Text>
                        <Title level={4} style={{ margin: 0, color: '#1890ff' }}>{raidItems?.filter((item: any) => item.type === 'ASSUMPTION').length || 0}</Title>
                      </div>
                    </Space>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card size="small" hoverable style={{ backgroundColor: '#fffbe6', borderColor: '#faad14' }}>
                    <Space>
                      <WarningOutlined style={{ fontSize: 20, color: '#faad14' }} />
                      <div>
                        <Text type="secondary">{t('raid.issues')}</Text>
                        <Title level={4} style={{ margin: 0, color: '#faad14' }}>{raidItems?.filter((item: any) => item.type === 'ISSUE').length || 0}</Title>
                      </div>
                    </Space>
                  </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Card size="small" hoverable style={{ backgroundColor: '#f9f0ff', borderColor: '#722ed1' }}>
                    <Space>
                      <LinkOutlined style={{ fontSize: 20, color: '#722ed1' }} />
                      <div>
                        <Text type="secondary">{t('raid.dependencies')}</Text>
                        <Title level={4} style={{ margin: 0, color: '#722ed1' }}>{raidItems?.filter((item: any) => item.type === 'DEPENDENCY').length || 0}</Title>
                      </div>
                    </Space>
                  </Card>
                </Col>
              </Row>

              {/* High Priority Risks */}
              <div>
                <Title level={5} style={{ color: '#ff4d4f' }}>High Priority Risks</Title>
                {raidItems?.filter((item: any) => 
                  item.type === 'RISK' && 
                  item.status === 'OPEN' &&
                  (item.impact === 'HIGH' || item.impact === 'CRITICAL')
                ).length > 0 ? (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {raidItems
                      .filter((item: any) => 
                        item.type === 'RISK' && 
                        item.status === 'OPEN' &&
                        (item.impact === 'HIGH' || item.impact === 'CRITICAL')
                      )
                      .map((item: any) => {
                        const impactValue = { LOW: 1, MEDIUM: 2, HIGH: 3, VERY_HIGH: 4, CRITICAL: 5 }[item.impact] || 0;
                        const probValue = { VERY_LOW: 1, LOW: 2, MEDIUM: 3, HIGH: 4, VERY_HIGH: 5 }[item.probability] || 0;
                        const score = impactValue * probValue;
                        
                        return (
                          <Card key={item.id} size="small" style={{ backgroundColor: '#fff1f0', borderColor: '#ff4d4f' }}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                <Text strong>⚠️ {item.title}</Text>
                                <Space>
                                  <Tag color="red">{t(`raid.impact_${item.impact.toLowerCase()}`)}</Tag>
                                  <Tag color="orange">Score: {score}</Tag>
                                </Space>
                              </Space>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {item.project?.name}
                              </Text>
                              {item.description && (
                                <Text style={{ fontSize: 12 }}>{item.description}</Text>
                              )}
                              {item.mitigation && (
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                  {t('raid.mitigation')}: {item.mitigation}
                                </Text>
                              )}
                              {item.owner && (
                                <Text type="secondary" style={{ fontSize: 11 }}>
                                  {t('raid.owner')}: {item.owner}
                                </Text>
                              )}
                            </Space>
                          </Card>
                        );
                      })}
                  </Space>
                ) : (
                  <Text type="secondary">No high priority open risks</Text>
                )}
              </div>

              {/* Open Issues */}
              <div>
                <Title level={5} style={{ color: '#faad14' }}>Open Issues</Title>
                {raidItems?.filter((item: any) => 
                  item.type === 'ISSUE' && 
                  item.status === 'OPEN'
                ).length > 0 ? (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {raidItems
                      .filter((item: any) => item.type === 'ISSUE' && item.status === 'OPEN')
                      .map((item: any) => (
                        <Card key={item.id} size="small" style={{ backgroundColor: '#fffbe6', borderColor: '#faad14' }}>
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                              <Text strong>⚡ {item.title}</Text>
                              <Tag color="orange">{t(`raid.status_${item.status.toLowerCase()}`)}</Tag>
                            </Space>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {item.project?.name}
                            </Text>
                            {item.description && (
                              <Text style={{ fontSize: 12 }}>{item.description}</Text>
                            )}
                            {item.owner && (
                              <Text type="secondary" style={{ fontSize: 11 }}>
                                {t('raid.owner')}: {item.owner}
                              </Text>
                            )}
                          </Space>
                        </Card>
                      ))}
                  </Space>
                ) : (
                  <Text type="secondary">No open issues</Text>
                )}
              </div>

              {/* Active Dependencies */}
              <div>
                <Title level={5} style={{ color: '#722ed1' }}>Active Dependencies</Title>
                {raidItems?.filter((item: any) => 
                  item.type === 'DEPENDENCY' && 
                  item.status !== 'CLOSED'
                ).length > 0 ? (
                  <Space direction="vertical" style={{ width: '100%' }}>
                    {raidItems
                      .filter((item: any) => item.type === 'DEPENDENCY' && item.status !== 'CLOSED')
                      .map((item: any) => (
                        <Card key={item.id} size="small" style={{ backgroundColor: '#f9f0ff', borderColor: '#722ed1' }}>
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                              <Text strong>🔗 {item.title}</Text>
                              <Tag color="purple">{t(`raid.status_${item.status.toLowerCase()}`)}</Tag>
                            </Space>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {item.project?.name}
                            </Text>
                            {item.description && (
                              <Text style={{ fontSize: 12 }}>{item.description}</Text>
                            )}
                            {item.owner && (
                              <Text type="secondary" style={{ fontSize: 11 }}>
                                {t('raid.owner')}: {item.owner}
                              </Text>
                            )}
                          </Space>
                        </Card>
                      ))}
                  </Space>
                ) : (
                  <Text type="secondary">No active dependencies</Text>
                )}
              </div>
            </Space>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  );
}
