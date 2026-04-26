import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Typography,
  Button,
  Table,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  InputNumber,
  Segmented,
  Row,
  Col,
  Progress,
  Avatar,
  App,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TableOutlined,
  AppstoreOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../lib/api';
import type { Task, Project } from '../../types';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

type ViewMode = 'table' | 'kanban';

// Helper function to sort tasks hierarchically (parent tasks followed by their children)
function sortTasksHierarchically(tasks: Task[]): Task[] {
  if (!tasks || tasks.length === 0) return [];

  // Build a map for quick lookup
  const taskMap = new Map<string, Task>();
  tasks.forEach(task => taskMap.set(task.id, task));

  // Find top-level tasks (no parent or parent not in current list)
  const topLevelTasks = tasks.filter(task => !task.parentId || !taskMap.has(task.parentId));

  // Recursively build the hierarchical order
  const result: Task[] = [];
  const addedTasks = new Set<string>();

  function addTaskAndChildren(task: Task) {
    if (addedTasks.has(task.id)) return; // Prevent duplicates
    result.push(task);
    addedTasks.add(task.id);
    
    // Find all children of this task
    const children = tasks.filter(t => t.parentId === task.id);
    // Sort children by their order field
    children.sort((a, b) => (a.order || 0) - (b.order || 0));
    // Recursively add each child and its descendants
    children.forEach(child => addTaskAndChildren(child));
  }

  // Sort top-level tasks by their order field
  topLevelTasks.sort((a, b) => (a.order || 0) - (b.order || 0));

  // Add each top-level task and its descendants
  topLevelTasks.forEach(task => addTaskAndChildren(task));

  return result;
}

export default function TaskList() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { message, modal } = App.useApp();
  const [form] = Form.useForm();
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | undefined>();
  const [formProjectId, setFormProjectId] = useState<string | undefined>();

  // Fetch tasks
  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', selectedProject],
    queryFn: () => api.getTasks({ projectId: selectedProject }),
  });

  // Sort tasks hierarchically so subtasks appear under their parents
  const sortedTasks = useMemo(() => {
    return sortTasksHierarchically(tasks || []);
  }, [tasks]);

  // Fetch projects for filter
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.getProjects(),
  });

  // Fetch selected project details for members
  const { data: selectedProjectDetails } = useQuery({
    queryKey: ['project', formProjectId],
    queryFn: () => api.getProject(formProjectId!),
    enabled: !!formProjectId,
  });

  // Get available assignees from all project team members
  const availableAssignees = selectedProjectDetails?.members?.map((member: any) => {
    if (member.user) {
      return {
        label: `${member.user.firstName} ${member.user.lastName}`,
        value: member.user.id,
      };
    }
    const name = member.memberName || member.memberEmail || 'Unknown';
    return { label: name, value: `__name__${name}` };
  }) || [];

  // Create task mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => api.createTask(data),
    onSuccess: async () => {
      message.success(t('tasks.createSuccess'));
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      handleModalClose();
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || t('common.error'));
    },
  });

  // Update task mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateTask(id, data),
    onSuccess: async () => {
      message.success(t('tasks.updateSuccess'));
      await queryClient.invalidateQueries({ queryKey: ['tasks'] });
      handleModalClose();
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || t('common.error'));
    },
  });

  // Delete task mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteTask(id),
    onSuccess: () => {
      message.success(t('tasks.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || t('common.error'));
    },
  });

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    setFormProjectId(undefined);
    form.resetFields();
  };

  const handleCreate = () => {
    setEditingTask(null);
    setIsModalOpen(true);
    setFormProjectId(undefined);
    setTimeout(() => form.resetFields(), 0);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormProjectId(task.projectId);
    form.setFieldsValue({
      ...task,
      dates: [dayjs(task.startDate), dayjs(task.endDate)],
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    modal.confirm({
      title: t('tasks.deleteConfirm'),
      content: `${t('tasks.deleteMessage')}: ${name}?`,
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const taskData = {
        ...values,
        startDate: values.dates[0].toISOString(),
        endDate: values.dates[1].toISOString(),
      };
      delete taskData.dates;

      // Handle name-only team members (non-portal users)
      if (taskData.assigneeId && String(taskData.assigneeId).startsWith('__name__')) {
        taskData.assigneeName = String(taskData.assigneeId).replace('__name__', '');
        taskData.assigneeId = undefined;
      }

      if (editingTask) {
        updateMutation.mutate({ id: editingTask.id, data: taskData });
      } else {
        createMutation.mutate(taskData);
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

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

  const columns = [
    {
      title: t('tasks.name'),
      dataIndex: 'name',
      key: 'name',
      width: 250,
      fixed: 'left' as const,
      render: (name: string, record: Task) => {
        // Calculate task depth for indentation
        let depth = 0;
        let currentTask = record;
        const taskMap = new Map(sortedTasks.map(t => [t.id, t]));
        
        while (currentTask.parentId) {
          depth++;
          const parent = taskMap.get(currentTask.parentId);
          if (!parent) break;
          currentTask = parent;
        }
        
        return (
          <span style={{ paddingLeft: depth * 20 }}>
            {depth > 0 && <span style={{ color: '#999', marginRight: 8 }}>└─</span>}
            {name}
          </span>
        );
      },
    },
    {
      title: 'Parent Task',
      key: 'parent',
      width: 200,
      render: (_: any, record: Task) => {
        if (record.parent && record.parent.name) {
          return record.parent.name;
        }
        if (record.parentId && !record.parent) {
          return <Text type="secondary" italic>(Parent task not found)</Text>;
        }
        return <Text type="secondary">-</Text>;
      },
    },
    {
      title: t('tasks.project'),
      dataIndex: ['project', 'name'],
      key: 'project',
      width: 150,
    },
    {
      title: t('tasks.assignee'),
      dataIndex: 'assignee',
      key: 'assignee',
      width: 150,
      render: (assignee: any, record: any) =>
        assignee ? (
          <Space>
            <Avatar size="small" icon={<UserOutlined />} />
            <Text>{`${assignee.firstName} ${assignee.lastName}`}</Text>
          </Space>
        ) : record.assigneeName ? (
          <Space>
            <Avatar size="small" icon={<UserOutlined />} />
            <Text>{record.assigneeName}</Text>
          </Space>
        ) : (
          '-'
        ),
    },
    {
      title: t('tasks.status'),
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={statusColors[status]}>{t(`tasks.status_${status.toLowerCase()}`)}</Tag>
      ),
    },
    {
      title: t('tasks.priority'),
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => (
        <Tag color={priorityColors[priority]}>{t(`tasks.priority_${priority.toLowerCase()}`)}</Tag>
      ),
    },
    {
      title: t('tasks.progress'),
      dataIndex: 'progress',
      key: 'progress',
      width: 150,
      render: (progress: number) => <Progress percent={progress || 0} size="small" />,
    },
    {
      title: t('tasks.dates'),
      key: 'dates',
      width: 200,
      render: (_: any, record: Task) =>
        `${dayjs(record.startDate).format('MMM DD')} - ${dayjs(record.endDate).format('MMM DD')}`,
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: Task) => (
        <Space>
          <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id, record.name)}
          />
        </Space>
      ),
    },
  ];

  // Kanban columns
  const kanbanColumns = [
    { key: 'TODO', title: t('tasks.status_todo'), color: 'default' },
    { key: 'IN_PROGRESS', title: t('tasks.status_in_progress'), color: 'blue' },
    { key: 'REVIEW', title: t('tasks.status_review'), color: 'orange' },
    { key: 'DONE', title: t('tasks.status_done'), color: 'green' },
  ];

  const getTasksByStatus = (status: string) => {
    return sortedTasks?.filter((task: Task) => task.status === status) || [];
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
        <Space>
          <Title level={2} style={{ margin: 0 }}>
            {t('tasks.title')}
          </Title>
          <Select
            placeholder={t('tasks.filterByProject')}
            style={{ width: 200 }}
            allowClear
            value={selectedProject}
            onChange={setSelectedProject}
            options={projects?.map((project: Project) => ({
              label: project.name,
              value: project.id,
            }))}
          />
        </Space>
        <Space>
          <Segmented
            value={viewMode}
            onChange={(value) => setViewMode(value as ViewMode)}
            options={[
              { label: t('tasks.tableView'), value: 'table', icon: <TableOutlined /> },
              { label: t('tasks.kanbanView'), value: 'kanban', icon: <AppstoreOutlined /> },
            ]}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate} size="large">
            {t('tasks.new')}
          </Button>
        </Space>
      </div>

      {/* Table View */}
      {viewMode === 'table' && (
        <Card>
          <Table
            columns={columns}
            dataSource={sortedTasks}
            rowKey="id"
            loading={isLoading}
            scroll={{ x: 1400 }}
            pagination={{
              pageSize: 50,
              showSizeChanger: true,
              showTotal: (total) => `${t('common.total')}: ${total}`,
            }}
          />
        </Card>
      )}

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <Row gutter={16}>
          {kanbanColumns.map((column) => {
            const columnTasks = getTasksByStatus(column.key);
            return (
              <Col key={column.key} xs={24} sm={12} lg={6}>
                <Card
                  title={
                    <Space>
                      <Text strong>{column.title}</Text>
                      <Tag color={column.color}>{columnTasks.length}</Tag>
                    </Space>
                  }
                  style={{ minHeight: 500 }}
                >
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    {columnTasks.map((task: Task) => (
                      <Card
                        key={task.id}
                        size="small"
                        hoverable
                        onClick={() => handleEdit(task)}
                        style={{ cursor: 'pointer' }}
                      >
                        <Space direction="vertical" style={{ width: '100%' }} size="small">
                          <Text strong>{task.name}</Text>
                          {task.assignee && (
                            <Space size="small">
                              <Avatar size="small" icon={<UserOutlined />} />
                              <Text
                                type="secondary"
                                style={{ fontSize: 12 }}
                              >{`${task.assignee.firstName} ${task.assignee.lastName}`}</Text>
                            </Space>
                          )}
                          <Space>
                            <Tag color={priorityColors[task.priority]} style={{ fontSize: 11 }}>
                              {t(`tasks.priority_${task.priority.toLowerCase()}`)}
                            </Tag>
                          </Space>
                          <Progress percent={task.progress || 0} size="small" showInfo={false} />
                        </Space>
                      </Card>
                    ))}
                  </Space>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* Create/Edit Modal */}
      <Modal
        title={editingTask ? t('tasks.edit') : t('tasks.new')}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={handleModalClose}
        width={700}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label={t('tasks.name')}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="projectId"
            label={t('tasks.project')}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Select
              placeholder={t('tasks.selectProject')}
              onChange={(value) => {
                setFormProjectId(value);
                // Clear assignee when project changes
                form.setFieldValue('assigneeId', undefined);
              }}
              options={projects?.map((project: Project) => ({
                label: project.name,
                value: project.id,
              }))}
            />
          </Form.Item>

          <Form.Item name="description" label={t('tasks.description')}>
            <TextArea rows={3} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="assigneeId" label={t('tasks.assignee')}>
                <Select
                  placeholder={formProjectId ? t('tasks.selectAssignee') : 'Select a project first'}
                  allowClear
                  disabled={!formProjectId || availableAssignees.length === 0}
                  options={availableAssignees}
                  notFoundContent={formProjectId ? 'No team members in this project' : 'Select a project first'}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label={t('tasks.status')}
                rules={[{ required: true, message: t('common.required') }]}
              >
                <Select>
                  <Select.Option value="TODO">{t('tasks.status_todo')}</Select.Option>
                  <Select.Option value="IN_PROGRESS">{t('tasks.status_in_progress')}</Select.Option>
                  <Select.Option value="REVIEW">{t('tasks.status_review')}</Select.Option>
                  <Select.Option value="DONE">{t('tasks.status_done')}</Select.Option>
                  <Select.Option value="BLOCKED">{t('tasks.status_blocked')}</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="priority"
                label={t('tasks.priority')}
                rules={[{ required: true, message: t('common.required') }]}
              >
                <Select>
                  <Select.Option value="LOW">{t('tasks.priority_low')}</Select.Option>
                  <Select.Option value="MEDIUM">{t('tasks.priority_medium')}</Select.Option>
                  <Select.Option value="HIGH">{t('tasks.priority_high')}</Select.Option>
                  <Select.Option value="CRITICAL">{t('tasks.priority_critical')}</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="dates"
            label={t('tasks.dates')}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="plannedHours" label={t('tasks.plannedHours')}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="actualHours" label={t('tasks.actualHours')}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="progress" label={t('tasks.progress')}>
                <InputNumber min={0} max={100} style={{ width: '100%' }} suffix="%" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
