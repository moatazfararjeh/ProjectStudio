import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, Table, DatePicker } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import api from '../lib/api';
import type { Project, Worklog } from '../types';

const { RangePicker } = DatePicker;

interface ProjectWorkLogsProps {
  project: Project;
}

export default function ProjectWorkLogs({ project }: ProjectWorkLogsProps) {
  const { t } = useTranslation();
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('week'),
    dayjs().endOf('week'),
  ]);

  const { data: worklogs, isLoading } = useQuery({
    queryKey: ['worklogs', project.id, dateRange],
    queryFn: () =>
      api.getWorklogs({
        projectId: project.id,
        startDate: dateRange[0].format('YYYY-MM-DD'),
        endDate: dateRange[1].format('YYYY-MM-DD'),
      }),
  });

  const worklogColumns = [
    {
      title: t('worklogs.date'),
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: t('worklogs.user'),
      dataIndex: 'user',
      key: 'user',
      render: (user: any) => `${user?.firstName || ''} ${user?.lastName || ''}`,
    },
    {
      title: t('worklogs.task'),
      dataIndex: 'task',
      key: 'task',
      render: (task: any) => task?.name || '-',
    },
    {
      title: t('worklogs.hours'),
      dataIndex: 'hours',
      key: 'hours',
      render: (hours: number) => `${hours} hrs`,
    },
    {
      title: t('worklogs.description'),
      dataIndex: 'description',
      key: 'description',
    },
  ];

  return (
    <Card
      title={t('worklogs.title')}
      extra={
        <RangePicker
          value={dateRange}
          onChange={(dates) => dates && setDateRange(dates as [Dayjs, Dayjs])}
        />
      }
    >
      <Table
        columns={worklogColumns}
        dataSource={worklogs}
        rowKey="id"
        loading={isLoading}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `${t('common.total')}: ${total}`,
        }}
      />
    </Card>
  );
}
