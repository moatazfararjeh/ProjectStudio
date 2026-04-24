import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, Table, Button, Tag, Space, App } from 'antd';
import { DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../lib/api';
import type { Project, Report } from '../types';

interface ProjectSavedReportsProps {
  project: Project;
}

export default function ProjectSavedReports({ project }: ProjectSavedReportsProps) {
  const { t } = useTranslation();
  const { message } = App.useApp();

  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports', project.id],
    queryFn: () => api.getReports({ projectId: project.id }),
  });

  const handleDownload = async (record: Report) => {
    try {
      const blob = await api.downloadReport(record.id);
      const content = record.content as any;
      const fileName = content.fileName || `Report_${record.period}.pptx`;
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);
      
      message.success(t('common.downloadSuccess'));
    } catch (error) {
      message.error(t('common.downloadFailed'));
    }
  };

  const reportColumns = [
    {
      title: t('reports.name'),
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: t('reports.type'),
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag>{type}</Tag>,
    },
    {
      title: t('reports.period'),
      dataIndex: 'period',
      key: 'period',
    },
    {
      title: t('reports.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY HH:mm'),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (record: Report) => (
        <Space>
          <Button 
            type="link" 
            size="small" 
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record)}
          >
            {t('common.download')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card title={t('reports.savedReports')}>
      <Table
        columns={reportColumns}
        dataSource={reports}
        rowKey="id"
        loading={isLoading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `${t('common.total')}: ${total}`,
        }}
      />
    </Card>
  );
}
