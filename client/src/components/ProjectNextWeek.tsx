import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, Typography, Space, Tag } from 'antd';
import dayjs from 'dayjs';
import api from '../lib/api';
import type { Project, Task } from '../types';

const { Title, Text } = Typography;

interface ProjectNextWeekProps {
  project: Project;
}

export default function ProjectNextWeek({ project }: ProjectNextWeekProps) {
  const { t } = useTranslation();

  const nextWeekStart = dayjs().add(1, 'week').startOf('week');
  const nextWeekEnd = nextWeekStart.endOf('week');

  const { data: tasks } = useQuery({
    queryKey: ['tasks-nextweek', project.id],
    queryFn: () => api.getTasks({ projectId: project.id }),
  });

  const nextWeekTasks = tasks?.filter((task: Task) => {
    const startDate = dayjs(task.startDate);
    return task.status !== 'DONE' && startDate.isAfter(nextWeekStart) && startDate.isBefore(nextWeekEnd);
  }) || [];

  return (
    <Card title={t('reports.nextWeekPlan')}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
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
  );
}
