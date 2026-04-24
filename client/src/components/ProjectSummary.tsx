import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, Typography, Space, DatePicker } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import api from '../lib/api';
import type { Project, Task, Worklog } from '../types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface ProjectSummaryProps {
  project: Project;
}

export default function ProjectSummary({ project }: ProjectSummaryProps) {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('week'),
    dayjs().endOf('week'),
  ]);

  const { data: worklogs } = useQuery({
    queryKey: ['worklogs-summary', project.id, dateRange],
    queryFn: () =>
      api.getWorklogs({
        projectId: project.id,
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
      }),
  });

  const { data: tasks } = useQuery({
    queryKey: ['tasks-summary', project.id],
    queryFn: () => api.getTasks({ projectId: project.id }),
  });

  const totalHours = worklogs?.reduce((sum: number, log: Worklog) => sum + (log.hours || 0), 0) || 0;
  const totalTasks = tasks?.length || 0;
  const completedTasks = tasks?.filter((task: Task) => task.status === 'COMPLETED').length || 0;
  const inProgressTasks = tasks?.filter((task: Task) => task.status === 'IN_PROGRESS').length || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <Card
      title={t('reports.summary')}
      extra={
        <RangePicker
          value={dateRange}
          onChange={(dates) => dates && setDateRange(dates as [Dayjs, Dayjs])}
        />
      }
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={4}>{t('reports.projectSummary')}</Title>
          <Text>{project.name}</Text>
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
  );
}
