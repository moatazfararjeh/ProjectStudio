import { useRef } from 'react';
import { Card, Typography, Row, Col, Table, Tag, Divider, Button, Space } from 'antd';
import { PrinterOutlined, DownloadOutlined, ArrowUpOutlined, ArrowDownOutlined, DollarOutlined, RiseOutlined, LineChartOutlined } from '@ant-design/icons';
import { useReactToPrint } from 'react-to-print';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';

const { Title, Text, Paragraph } = Typography;

interface Project {
  name: string;
  value: number;
  date: string;
  status: string;
}

interface Achievement {
  achievement: string;
  date: string;
}

interface Challenge {
  challenge: string;
  resolution: string;
}

interface AnnualReviewData {
  accountName: string;
  accountCode: string;
  reviewYear: number;
  reviewDate: string;
  
  // Sales Summary
  totalProjects: number;
  totalRevenue: number;
  projectsSummary: Project[];
  
  // YoY Comparison
  previousYearRevenue?: number;
  growthPercentage?: number;
  
  // Future Opportunities
  renewalLikelihood?: number;
  recommendedAction?: string;
  
  // Report Content
  executiveSummary?: string;
  keyAchievements?: Achievement[];
  challenges?: Challenge[];
  nextYearPlan?: string;
  
  // Metadata
  reviewedBy?: string;
}

interface AnnualReviewReportProps {
  data: AnnualReviewData;
}

export default function AnnualReviewReport({ data }: AnnualReviewReportProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Annual-Review-${data.accountName}-${data.reviewYear}`,
  });

  const projectColumns = [
    {
      title: t('projects.name'),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: t('projects.date'),
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: t('projects.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'COMPLETED' ? 'green' : 'blue'}>
          {t(`projects.status_${status.toLowerCase()}`)}
        </Tag>
      ),
    },
    {
      title: t('projects.value'),
      dataIndex: 'value',
      key: 'value',
      render: (value: number) => `$${value.toLocaleString()}`,
      align: 'right' as const,
    },
  ];

  const achievementColumns = [
    {
      title: t('accounts.achievement'),
      dataIndex: 'achievement',
      key: 'achievement',
      width: '70%',
    },
    {
      title: t('common.date'),
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
  ];

  const challengeColumns = [
    {
      title: t('accounts.challenge'),
      dataIndex: 'challenge',
      key: 'challenge',
      width: '50%',
    },
    {
      title: t('accounts.resolution'),
      dataIndex: 'resolution',
      key: 'resolution',
      width: '50%',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button icon={<PrinterOutlined />} onClick={handlePrint}>
          {t('common.print')}
        </Button>
        <Button icon={<DownloadOutlined />} type="primary" onClick={handlePrint}>
          {t('common.download')} PDF
        </Button>
      </div>

      <div ref={componentRef} style={{ padding: 24, backgroundColor: 'white', direction: isRTL ? 'rtl' : 'ltr' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2}>{t('accounts.annualReviewReport')}</Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            {data.accountName} ({data.accountCode})
          </Text>
          <br />
          <Text type="secondary">
            {t('accounts.reviewYear')}: {data.reviewYear} | {t('accounts.reviewDate')}: {dayjs(data.reviewDate).format('YYYY-MM-DD')}
          </Text>
          {data.reviewedBy && (
            <>
              <br />
              <Text type="secondary">{t('accounts.reviewedBy')}: {data.reviewedBy}</Text>
            </>
          )}
        </div>

        {/* Executive Summary */}
        {data.executiveSummary && (
          <>
            <Title level={4}>{t('accounts.executiveSummary')}</Title>
            <Paragraph style={{ fontSize: 14, marginBottom: 24 }}>
              {data.executiveSummary}
            </Paragraph>
          </>
        )}

        {/* Key Metrics */}
        <Title level={4}>{t('accounts.keyMetrics')}</Title>
        <Row gutter={16} style={{ marginBottom: 32 }}>
          <Col span={6}>
            <Card hoverable>
              <Space>
                <LineChartOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                <div>
                  <Text type="secondary">{t('accounts.totalProjects')}</Text>
                  <Title level={3} style={{ margin: 0 }}>{data.totalProjects}<span style={{ fontSize: 16 }}> {t('accounts.projects')}</span></Title>
                </div>
              </Space>
            </Card>
          </Col>
          <Col span={6}>
            <Card hoverable>
              <Space>
                <DollarOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                <div>
                  <Text type="secondary">{`${data.reviewYear} ${t('accounts.revenue')}`}</Text>
                  <Title level={3} style={{ margin: 0 }}>${data.totalRevenue.toLocaleString()}</Title>
                </div>
              </Space>
            </Card>
          </Col>
          {data.previousYearRevenue && (
            <Col span={6}>
              <Card hoverable>
                <Space>
                  {(data.growthPercentage || 0) >= 0
                    ? <ArrowUpOutlined style={{ fontSize: 24, color: '#3f8600' }} />
                    : <ArrowDownOutlined style={{ fontSize: 24, color: '#cf1322' }} />}
                  <div>
                    <Text type="secondary">{t('accounts.yearOverYear')}</Text>
                    <Title level={3} style={{ margin: 0, color: (data.growthPercentage || 0) >= 0 ? '#3f8600' : '#cf1322' }}>{Math.abs(data.growthPercentage || 0).toFixed(1)}<span style={{ fontSize: 16 }}>%</span></Title>
                  </div>
                </Space>
              </Card>
            </Col>
          )}
          {data.renewalLikelihood !== undefined && (
            <Col span={6}>
              <Card hoverable>
                <Space>
                  <RiseOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                  <div>
                    <Text type="secondary">{t('accounts.renewalLikelihood')}</Text>
                    <Title level={3} style={{ margin: 0, color: data.renewalLikelihood >= 70 ? '#3f8600' : data.renewalLikelihood >= 40 ? '#faad14' : '#cf1322' }}>{data.renewalLikelihood}<span style={{ fontSize: 16 }}>%</span></Title>
                  </div>
                </Space>
              </Card>
            </Col>
          )}
        </Row>

        {/* Projects Summary */}
        <Title level={4}>{t('accounts.projectsSummary')}</Title>
        <Table
          dataSource={data.projectsSummary}
          columns={projectColumns}
          pagination={false}
          size="small"
          style={{ marginBottom: 32 }}
          rowKey="name"
        />

        {data.previousYearRevenue && (
          <>
            <Title level={4}>{t('accounts.yearOverYearComparison')}</Title>
            <Row gutter={16} style={{ marginBottom: 32 }}>
              <Col span={8}>
                <Card hoverable>
                  <Space>
                    <DollarOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                    <div>
                      <Text type="secondary">{`${data.reviewYear - 1} ${t('accounts.revenue')}`}</Text>
                      <Title level={3} style={{ margin: 0 }}>${data.previousYearRevenue.toLocaleString()}</Title>
                    </div>
                  </Space>
                </Card>
              </Col>
              <Col span={8}>
                <Card hoverable>
                  <Space>
                    <DollarOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                    <div>
                      <Text type="secondary">{`${data.reviewYear} ${t('accounts.revenue')}`}</Text>
                      <Title level={3} style={{ margin: 0 }}>${data.totalRevenue.toLocaleString()}</Title>
                    </div>
                  </Space>
                </Card>
              </Col>
              <Col span={8}>
                <Card hoverable>
                  <Space>
                    <DollarOutlined style={{ fontSize: 24, color: data.totalRevenue >= data.previousYearRevenue ? '#3f8600' : '#cf1322' }} />
                    <div>
                      <Text type="secondary">{t('accounts.growth')}</Text>
                      <Title level={3} style={{ margin: 0, color: data.totalRevenue >= data.previousYearRevenue ? '#3f8600' : '#cf1322' }}>${Math.abs(data.totalRevenue - data.previousYearRevenue).toLocaleString()}</Title>
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>
          </>
        )}

        {/* Key Achievements */}
        {data.keyAchievements && data.keyAchievements.length > 0 && (
          <>
            <Title level={4}>{t('accounts.keyAchievements')}</Title>
            <Table
              dataSource={data.keyAchievements}
              columns={achievementColumns}
              pagination={false}
              size="small"
              style={{ marginBottom: 32 }}
              rowKey="achievement"
            />
          </>
        )}

        {/* Challenges & Resolutions */}
        {data.challenges && data.challenges.length > 0 && (
          <>
            <Title level={4}>{t('accounts.challengesResolutions')}</Title>
            <Table
              dataSource={data.challenges}
              columns={challengeColumns}
              pagination={false}
              size="small"
              style={{ marginBottom: 32 }}
              rowKey="challenge"
            />
          </>
        )}

        {/* Recommended Action */}
        {data.recommendedAction && (
          <>
            <Title level={4}>{t('accounts.recommendedAction')}</Title>
            <Card style={{ backgroundColor: '#f0f5ff', marginBottom: 32 }}>
              <Text strong style={{ fontSize: 16 }}>{data.recommendedAction}</Text>
            </Card>
          </>
        )}

        {/* Next Year Plan */}
        {data.nextYearPlan && (
          <>
            <Title level={4}>{t('accounts.nextYearPlan')}</Title>
            <Paragraph style={{ fontSize: 14 }}>
              {data.nextYearPlan}
            </Paragraph>
          </>
        )}

        <Divider />

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t('accounts.generatedOn')}: {dayjs().format('YYYY-MM-DD HH:mm')}
          </Text>
        </div>
      </div>
    </div>
  );
}
