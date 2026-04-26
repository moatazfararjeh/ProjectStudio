import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Table,
  Tag,
  Divider,
  App,
} from 'antd';
import {
  FileImageOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../lib/api';
import type { Project } from '../../types';

const { Title, Text } = Typography;

interface ProjectReportsProps {
  project: Project;
}

export default function ProjectReports({ project }: ProjectReportsProps) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [isExporting, setIsExporting] = useState(false);
  const queryClient = useQueryClient();

  // Fetch data
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', project.id],
    queryFn: () => api.getTasks({ projectId: project.id }),
  });

  const { data: worklogs = [] } = useQuery({
    queryKey: ['worklogs', project.id],
    queryFn: () => api.getWorklogs({ projectId: project.id }),
  });

  const { data: raidItems = [] } = useQuery({
    queryKey: ['raid-items', project.id],
    queryFn: () => api.getRAIDItems({ projectId: project.id }),
  });

  // Calculate statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task: any) => task.status === 'COMPLETED').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalHours = worklogs.reduce((sum: number, log: any) => sum + (log.hours || 0), 0);

  const openRisks = raidItems.filter((item: any) => item.type === 'RISK' && item.status !== 'CLOSED').length;
  const openIssues = raidItems.filter((item: any) => item.type === 'ISSUE' && item.status !== 'CLOSED').length;

  // Handle PowerPoint export
  const handleExportPPT = async () => {
    try {
      setIsExporting(true);
      message.loading({ content: 'Generating PowerPoint report...', key: 'export-ppt' });
      
      const blob = await api.exportWeeklyReportPPT(project.id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Weekly_Report_${project.code}_${new Date().toISOString().split('T')[0]}.pptx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Refresh saved reports list
      queryClient.invalidateQueries({ queryKey: ['reports', project.id] });
      
      message.success({ content: 'PowerPoint report generated successfully!', key: 'export-ppt' });
    } catch (error) {
      console.error('Export error:', error);
      message.error({ content: 'Failed to generate PowerPoint report', key: 'export-ppt' });
    } finally {
      setIsExporting(false);
    }
  };

  // Task columns for table
  const taskColumns = [
    {
      title: t('tasks.name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('tasks.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'DONE' ? 'green' : status === 'IN_PROGRESS' ? 'blue' : 'default'}>
          {t(`tasks.status_${status.toLowerCase()}`)}
        </Tag>
      ),
    },
    {
      title: t('tasks.assignee'),
      dataIndex: ['assignedTo', 'firstName'],
      key: 'assignee',
      render: (_: any, record: any) =>
        record.assignedTo
          ? `${record.assignedTo.firstName} ${record.assignedTo.lastName}`
          : record.assigneeName || '-',
    },
    {
      title: t('tasks.progress'),
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number) => `${progress || 0}%`,
    },
  ];

  return (
    <div>
      <Card
        title={<span>{t('reports.title') || 'Project Report'}</span>}
        extra={
          <Space>
            <Button
              type="default"
              icon={<FileImageOutlined />}
              onClick={handleExportPPT}
              loading={isExporting}
            >
              Export PowerPoint
            </Button>
          </Space>
        }
      >
        {/* Printable Content */}
        <div style={{ padding: 20 }}>
          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <Title level={2} style={{ marginBottom: 4 }}>{project.name}</Title>
            {project.description && <Text type="secondary">{project.description}</Text>}
            <Divider />
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>{t('reports.period')}: </Text>
                <Text>{dayjs().format('MMMM DD, YYYY')}</Text>
              </Col>
              <Col span={12}>
                <Text strong>{t('projects.status')}: </Text>
                <Tag color="blue">{t(`projects.status_${project.status?.toLowerCase()}`)}</Tag>
              </Col>
            </Row>
          </div>

          {/* Statistics */}
          <Title level={4} style={{ marginBottom: 16 }}>{t('reports.statistics')}</Title>
          <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
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
                  <CheckCircleOutlined style={{ fontSize: 24, color: completionRate >= 70 ? '#52c41a' : completionRate >= 40 ? '#faad14' : '#ff4d4f' }} />
                  <div>
                    <Text type="secondary">{t('reports.completionRate')}</Text>
                    <Title level={3} style={{ margin: 0, color: completionRate >= 70 ? '#52c41a' : completionRate >= 40 ? '#faad14' : '#ff4d4f' }}>{completionRate}<span style={{ fontSize: 16 }}>%</span></Title>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>

          {/* RAID Summary */}
          <Title level={4} style={{ marginBottom: 16 }}>RAID Summary</Title>
          <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable style={{ backgroundColor: openRisks > 0 ? '#fff1f0' : undefined, borderColor: openRisks > 0 ? '#ffccc7' : undefined }}>
                <Space>
                  <WarningOutlined style={{ fontSize: 24, color: openRisks > 0 ? '#ff4d4f' : '#52c41a' }} />
                  <div>
                    <Text type="secondary">{t('raid.risks')}</Text>
                    <Title level={3} style={{ margin: 0, color: openRisks > 0 ? '#ff4d4f' : '#52c41a' }}>{openRisks}</Title>
                  </div>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable style={{ backgroundColor: openIssues > 0 ? '#fffbe6' : undefined, borderColor: openIssues > 0 ? '#ffe58f' : undefined }}>
                <Space>
                  <WarningOutlined style={{ fontSize: 24, color: openIssues > 0 ? '#faad14' : '#52c41a' }} />
                  <div>
                    <Text type="secondary">{t('raid.issues')}</Text>
                    <Title level={3} style={{ margin: 0, color: openIssues > 0 ? '#faad14' : '#52c41a' }}>{openIssues}</Title>
                  </div>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable>
                <Space>
                  <CheckCircleOutlined style={{ fontSize: 24, color: '#13c2c2' }} />
                  <div>
                    <Text type="secondary">{t('raid.assumptions')}</Text>
                    <Title level={3} style={{ margin: 0, color: '#13c2c2' }}>{raidItems.filter((item: any) => item.type === 'ASSUMPTION').length}</Title>
                  </div>
                </Space>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card hoverable>
                <Space>
                  <CheckCircleOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
                  <div>
                    <Text type="secondary">{t('raid.dependencies')}</Text>
                    <Title level={3} style={{ margin: 0, color: '#fa8c16' }}>{raidItems.filter((item: any) => item.type === 'DEPENDENCY').length}</Title>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>

          {/* High Priority Risks */}
          {openRisks > 0 && (
            <>
              <Title level={5} style={{ color: '#ff4d4f', marginBottom: 12 }}>High Priority Risks</Title>
              <Space direction="vertical" style={{ width: '100%', marginBottom: 32 }}>
                {raidItems
                  .filter((item: any) =>
                    item.type === 'RISK' &&
                    item.status === 'OPEN' &&
                    (item.impact === 'HIGH' || item.impact === 'CRITICAL' || item.impact === 'VERY_HIGH')
                  )
                  .map((item: any) => (
                    <Card key={item.id} size="small" style={{ backgroundColor: '#fff1f0', border: '1px solid #ffccc7', borderRadius: 8 }}>
                      <Text strong>⚠️ {item.title}</Text>
                      <br />
                      <Text type="secondary">{item.description}</Text>
                    </Card>
                  ))}
              </Space>
            </>
          )}

          {/* Tasks Summary */}
          <Title level={4} style={{ marginBottom: 16 }}>{t('tasks.title')}</Title>
          <Card style={{ marginBottom: 32, borderRadius: 12 }}>
            <Table
              columns={taskColumns}
              dataSource={tasks}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>

          {/* Team Members */}
          <Title level={4} style={{ marginBottom: 12 }}>{t('projects.team')}</Title>
          <Card style={{ marginBottom: 24, borderRadius: 12 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {project.members?.filter((member: any) => member.user || member.memberName).map((member: any) => (
                <div key={member.id}>
                  <Text>
                    <strong>{member.memberName || `${member.user?.firstName} ${member.user?.lastName}`}</strong> — {t(`projects.role_${member.role.toLowerCase()}`)}
                  </Text>
                </div>
              ))}
            </Space>
          </Card>

          {/* Footer */}
          <Divider />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Generated on {dayjs().format('MMMM DD, YYYY HH:mm')}
          </Text>
        </div>
      </Card>
    </div>
  );
}
