import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Typography,
  Row,
  Col,
  List,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Space,
  Tag,
  Progress,
  Empty,
  App,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../lib/api';
import type { Task, Worklog } from '../types';
import { useAuthStore } from '../stores/authStore';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function MyDay() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const { user } = useAuthStore();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(dayjs());

  // Fetch my tasks
  const { data: myTasks } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: () => api.getTasks({ assigneeId: user?.id }),
  });

  // Fetch worklogs for selected date
  const { data: worklogs, isLoading } = useQuery({
    queryKey: ['worklogs', selectedDate.format('YYYY-MM-DD')],
    queryFn: () =>
      api.getWorklogs({
        userId: user?.id,
        date: selectedDate.format('YYYY-MM-DD'),
      }),
  });

  // Create worklog mutation
  const createWorklogMutation = useMutation({
    mutationFn: (data: any) => api.createWorklog(data),
    onSuccess: () => {
      message.success(t('worklogs.createSuccess'));
      queryClient.invalidateQueries({ queryKey: ['worklogs'] });
      handleModalClose();
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || t('common.error'));
    },
  });

  const handleModalClose = () => {
    setIsModalOpen(false);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const worklogData = {
        ...values,
        date: selectedDate.toISOString(),
      };
      createWorklogMutation.mutate(worklogData);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // Calculate statistics
  const todayTasks = myTasks?.filter((task: Task) => task.status !== 'DONE') || [];
  const completedTasks = myTasks?.filter((task: Task) => task.status === 'DONE') || [];
  const totalHours = worklogs?.reduce((sum: number, log: Worklog) => sum + (log.hours || 0), 0) || 0;

  const statusColors: Record<string, string> = {
    TODO: 'default',
    IN_PROGRESS: 'blue',
    REVIEW: 'orange',
    DONE: 'green',
    BLOCKED: 'red',
  };

  const priorityColors: Record<string, string> = {
    LOW: 'green',
    MEDIUM: 'blue',
    HIGH: 'orange',
    CRITICAL: 'red',
  };

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
          {t('worklogs.myDay')}
        </Title>
        <Space>
          <DatePicker
            value={selectedDate}
            onChange={(date) => date && setSelectedDate(date)}
            format="YYYY-MM-DD"
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
            {t('worklogs.new')}
          </Button>
        </Space>
      </div>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title={t('worklogs.activeTasks')}
              value={todayTasks.length}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title={t('worklogs.completedTasks')}
              value={completedTasks.length}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title={t('worklogs.todayHours')}
              value={totalHours}
              suffix="hrs"
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* My Tasks */}
        <Col xs={24} lg={12}>
          <Card title={t('worklogs.myTasks')} extra={<Tag>{todayTasks.length}</Tag>}>
            {todayTasks.length > 0 ? (
              <List
                dataSource={todayTasks}
                renderItem={(task: Task) => (
                  <List.Item>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Text strong>{task.name}</Text>
                        <Tag color={statusColors[task.status]}>
                          {t(`tasks.status_${task.status.toLowerCase()}`)}
                        </Tag>
                      </Space>
                      <Space>
                        <Tag color={priorityColors[task.priority]} style={{ fontSize: 11 }}>
                          {t(`tasks.priority_${task.priority.toLowerCase()}`)}
                        </Tag>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {task.project?.name}
                        </Text>
                      </Space>
                      <Progress percent={task.progress || 0} size="small" />
                    </Space>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description={t('worklogs.noActiveTasks')} />
            )}
          </Card>
        </Col>

        {/* Today's Work Logs */}
        <Col xs={24} lg={12}>
          <Card
            title={t('worklogs.todayLogs')}
            extra={<Tag>{worklogs?.length || 0}</Tag>}
            loading={isLoading}
          >
            {worklogs && worklogs.length > 0 ? (
              <List
                dataSource={worklogs}
                renderItem={(log: Worklog) => (
                  <List.Item>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Text strong>{log.task?.name}</Text>
                        <Tag color="blue">{log.hours} hrs</Tag>
                      </Space>
                      {log.description && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {log.description}
                        </Text>
                      )}
                      {log.whatDone && (
                        <div>
                          <Text type="success" style={{ fontSize: 11 }}>
                            ✓ {log.whatDone}
                          </Text>
                        </div>
                      )}
                    </Space>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description={t('worklogs.noLogs')} />
            )}
          </Card>
        </Col>
      </Row>

      {/* Log Work Modal */}
      <Modal
        title={t('worklogs.new')}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleModalClose}
        width={600}
        confirmLoading={createWorklogMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="taskId"
            label={t('worklogs.task')}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Select
              placeholder={t('worklogs.selectTask')}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={myTasks?.map((task: Task) => ({
                label: `${task.name} - ${task.project?.name}`,
                value: task.id,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="hours"
            label={t('worklogs.hours')}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <InputNumber min={0.5} max={24} step={0.5} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="description" label={t('worklogs.description')}>
            <TextArea rows={2} placeholder={t('worklogs.whatDone')} />
          </Form.Item>

          <Form.Item name="whatDone" label={t('worklogs.whatDone')}>
            <TextArea rows={2} />
          </Form.Item>

          <Form.Item name="whatNext" label={t('worklogs.whatNext')}>
            <TextArea rows={2} />
          </Form.Item>

          <Form.Item name="blockers" label={t('worklogs.blockers')}>
            <TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
