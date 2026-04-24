import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, Typography, Space, Tag } from 'antd';
import dayjs from 'dayjs';
import api from '../lib/api';
import type { Project, Task, Worklog } from '../types';

const { Title, Text } = Typography;

interface ProjectThisWeekProps {
  project: Project;
}

export default function ProjectThisWeek({ project }: ProjectThisWeekProps) {
  const { t } = useTranslation();

  const thisWeekStart = dayjs().startOf('week');
  const thisWeekEnd = dayjs().endOf('week');

  const { data: tasks } = useQuery({
    queryKey: ['tasks-thisweek', project.id],
    queryFn: () => api.getTasks({ projectId: project.id }),
  });

  const { data: worklogs } = useQuery({
    queryKey: ['worklogs-thisweek', project.id],
    queryFn: () =>
      api.getWorklogs({
        projectId: project.id,
        startDate: thisWeekStart.format('YYYY-MM-DD'),
        endDate: thisWeekEnd.format('YYYY-MM-DD'),
      }),
  });

  const thisWeekTasks = tasks?.filter((task: Task) => {
    const updatedAt = dayjs(task.updatedAt);
    return task.status === 'DONE' && updatedAt.isAfter(thisWeekStart) && updatedAt.isBefore(thisWeekEnd);
  }) || [];

  const totalHours = worklogs?.reduce((sum: number, log: Worklog) => sum + (log.hours || 0), 0) || 0;

  return (
    <Card title={t('reports.thisWeekAccomplishments')}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
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
  );
}
