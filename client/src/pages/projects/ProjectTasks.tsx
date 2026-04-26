import { useState, useMemo, useEffect } from 'react';
import type { Key } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import RightDrawer from '../../components/RightDrawer';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Progress,
  App,
  Upload,
  Row,
  Col,
  Statistic,
  Avatar,
  Tooltip,
  Badge,
  Segmented,
  Dropdown,
  Divider,
  List,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  UploadOutlined,
  SearchOutlined,
  CaretRightOutlined,
  CaretDownOutlined,
  UserOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  StopOutlined,
  MinusCircleOutlined,
  ExpandOutlined,
  CompressOutlined,
  MoreOutlined,
  CalendarOutlined,
  TeamOutlined,
  FieldTimeOutlined,
  LinkOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import api from '../../lib/api';
import type { Project, Task } from '../../types';

const { TextArea } = Input;
const { Text } = Typography;

interface ProjectTasksProps {
  project: Project;
}

export default function ProjectTasks({ project }: ProjectTasksProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { message, modal: antdModal } = App.useApp();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);
  const [searchText, setSearchText] = useState('');
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());

  // Helper function to calculate task hierarchy level
  const getTaskLevel = (task: Task, allTasks: Task[]): number => {
    let level = 0;
    let currentTask = task;
    const taskMap = new Map(allTasks.map(t => [t.id, t]));
    
    while (currentTask.parentId) {
      level++;
      const parent = taskMap.get(currentTask.parentId);
      if (!parent) break;
      currentTask = parent;
    }
    
    return level;
  };

  // Helper function to check if task is last child
  const isLastChild = (task: Task, allTasks: Task[]): boolean => {
    if (!task.parentId) return false;
    const siblings = allTasks.filter(t => t.parentId === task.parentId);
    return siblings[siblings.length - 1]?.id === task.id;
  };

  // Helper function to get ancestor path for drawing tree lines
  const getAncestorPath = (task: Task, allTasks: Task[]): boolean[] => {
    const path: boolean[] = [];
    let currentTask = task;
    const taskMap = new Map(allTasks.map(t => [t.id, t]));
    
    while (currentTask.parentId) {
      const parent = taskMap.get(currentTask.parentId);
      if (!parent) break;
      path.unshift(isLastChild(currentTask, allTasks));
      currentTask = parent;
    }
    
    return path;
  };

  // Toggle task expansion
  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTaskIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  // Filter visible tasks based on expansion state
  // Tasks are sorted so children always follow their parent (tree order)
  const getVisibleTasks = (allTasks: Task[]): Task[] => {
    const taskMap = new Map(allTasks.map(t => [t.id, t]));

    // Build tree-ordered flat list: roots first, then children immediately after parent
    const buildTreeOrder = (tasks: Task[]): Task[] => {
      const roots = tasks.filter(t => !t.parentId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const result: Task[] = [];
      const addWithChildren = (task: Task) => {
        result.push(task);
        const children = tasks.filter(t => t.parentId === task.id).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        for (const child of children) addWithChildren(child);
      };
      for (const root of roots) addWithChildren(root);
      // Include any orphaned tasks (parentId set but parent not found)
      const included = new Set(result.map(t => t.id));
      for (const t of tasks) { if (!included.has(t.id)) result.push(t); }
      return result;
    };

    const ordered = buildTreeOrder(allTasks);

    const isTaskVisible = (task: Task): boolean => {
      if (!task.parentId) return true;
      let currentParentId: string | null | undefined = task.parentId;
      while (currentParentId) {
        if (!expandedTaskIds.has(currentParentId)) return false;
        const parent = taskMap.get(currentParentId);
        if (!parent) break;
        currentParentId = parent.parentId;
      }
      return true;
    };

    return ordered.filter(isTaskVisible);
  };

  // Fetch tasks for this project
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', project.id],
    queryFn: () => api.getTasks({ projectId: project.id }),
  });

  // All RAID items for this project (used to show badge in table)
  const { data: allRaidItems = [] } = useQuery({
    queryKey: ['raid-items', project.id],
    queryFn: () => api.getRAIDItems({ projectId: project.id }),
  });

  // RAID items linked to the task currently being edited
  const { data: linkedRaidItems = [] } = useQuery({
    queryKey: ['raid-items', project.id],
    queryFn: () => api.getRAIDItems({ projectId: project.id }),
    select: (items: any[]) => items.filter((r: any) => r.linkedTaskId === editingTask?.id),
    enabled: !!editingTask,
  });

  // Expand all parent tasks by default when tasks load
  useEffect(() => {
    if (tasks.length > 0) {
      const allParentIds = tasks
        .filter((t: Task) => t._count && t._count.subtasks > 0)
        .map((t: Task) => t.id);
      setExpandedTaskIds(new Set(allParentIds));
    }
  }, [tasks]);

  // Create task mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => api.createTask(data),
    onError: (error: any) => {
      message.error(error?.response?.data?.message || t('common.error'));
    },
  });

  // Update task mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateTask(id, data),
    onError: (error: any) => {
      message.error(error?.response?.data?.message || t('common.error'));
    },
  });

  // Delete task mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteTask(id),
    onSuccess: () => {
      message.success(t('tasks.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['tasks', project.id] });
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || t('common.error'));
    },
  });

  // Import MPP mutation
  const importMutation = useMutation({
    mutationFn: (file: File) => api.importMPP(project.id, file),
    onSuccess: async (data) => {
      message.success(`Successfully imported ${data.tasksCreated} tasks and ${data.dependenciesCreated} dependencies`);
      await queryClient.invalidateQueries({ queryKey: ['tasks', project.id] });
      
      // Auto-expand all tasks to show the full hierarchy
      setTimeout(() => {
        const updatedTasks = queryClient.getQueryData(['tasks', project.id]) as Task[] || [];
        const allParentIds = updatedTasks
          .filter((t: Task) => t._count && t._count.subtasks > 0)
          .map((t: Task) => t.id);
        setExpandedTaskIds(new Set(allParentIds));
      }, 100);
      
      setIsImportModalOpen(false);
      setUploadFile(null);
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || 'Failed to import MPP file');
    },
  });

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    form.resetFields();
  };

  const handleCreate = () => {
    setEditingTask(null);
    form.resetFields();
    form.setFieldsValue({ projectId: project.id });
    setIsModalOpen(true);
  };

  async function handleExportExcel() {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Tasks');

    ws.columns = [
      { header: '#',              key: 'idx',         width: 6  },
      { header: 'Task Name',      key: 'name',        width: 40 },
      { header: 'Status',         key: 'status',      width: 16 },
      { header: 'Priority',       key: 'priority',    width: 12 },
      { header: 'Assignee',       key: 'assignee',    width: 24 },
      { header: 'Progress (%)',   key: 'progress',    width: 14 },
      { header: 'Duration (days)',key: 'duration',    width: 16 },
      { header: 'Start Date',     key: 'startDate',   width: 14 },
      { header: 'End Date',       key: 'endDate',     width: 14 },
      { header: 'Baseline Start', key: 'bStart',      width: 16 },
      { header: 'Baseline End',   key: 'bFinish',     width: 16 },
      { header: 'Actual Start',   key: 'aStart',      width: 16 },
      { header: 'Actual End',     key: 'aFinish',     width: 16 },
      { header: 'Description',    key: 'description', width: 40 },
    ];

    // Style header row
    ws.getRow(1).eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8B0000' } };
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } } };
    });
    ws.getRow(1).height = 22;

    const statusLabel: Record<string, string> = {
      NOT_STARTED: 'Not Started', IN_PROGRESS: 'In Progress',
      BLOCKED: 'Blocked', COMPLETED: 'Completed', CANCELLED: 'Cancelled',
    };

    const allTasksOrdered = getVisibleTasks(tasks);
    allTasksOrdered.forEach((task, i) => {
      const level = getTaskLevel(task, tasks);
      const indent = '  '.repeat(level);
      const assigneeName = task.assignedTo
        ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
        : (task as any).assigneeName || 'Unassigned';

      const row = ws.addRow({
        idx:         i + 1,
        name:        indent + task.name,
        status:      statusLabel[task.status] ?? task.status,
        priority:    task.priority,
        assignee:    assigneeName,
        progress:    task.progress ?? 0,
        duration:    task.duration ?? '',
        startDate:   task.startDate  ? dayjs(task.startDate).format('YYYY-MM-DD')  : '',
        endDate:     task.endDate    ? dayjs(task.endDate).format('YYYY-MM-DD')    : '',
        bStart:      task.baselineStart  ? dayjs(task.baselineStart).format('YYYY-MM-DD')  : '',
        bFinish:     task.baselineFinish ? dayjs(task.baselineFinish).format('YYYY-MM-DD') : '',
        aStart:      task.actualStart  ? dayjs(task.actualStart).format('YYYY-MM-DD')  : '',
        aFinish:     task.actualFinish ? dayjs(task.actualFinish).format('YYYY-MM-DD') : '',
        description: task.description ?? '',
      });

      // Zebra striping
      if (i % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9F9F9' } };
        });
      }

      // Bold top-level task names
      if (level === 0) {
        row.getCell('name').font = { bold: true };
      }

      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle' };
        cell.border = { bottom: { style: 'hair', color: { argb: 'FFE8E8E8' } } };
      });
    });

    // Freeze header row
    ws.views = [{ state: 'frozen', ySplit: 1 }];

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tasks_${project.name.replace(/\s+/g, '_')}_${dayjs().format('YYYY-MM-DD')}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('Tasks exported successfully');
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task);

    // For tasks with assigneeName (non-portal MPP resource), find the matching member
    // so the dropdown shows the current assignee
    let assignedToFormValue: string | undefined = task.assignedToId || undefined;
    if (!assignedToFormValue && (task as any).assigneeName) {
      const matchedMember = project.members?.find((m: any) =>
        !m.user && m.memberName === (task as any).assigneeName
      );
      if (matchedMember) assignedToFormValue = matchedMember.id;
    }

    form.setFieldsValue({
      ...task,
      assignedToId:   assignedToFormValue,
      startDate:      task.startDate      ? dayjs(task.startDate)      : undefined,
      endDate:        task.endDate        ? dayjs(task.endDate)        : undefined,
      baselineStart:  task.baselineStart  ? dayjs(task.baselineStart)  : undefined,
      baselineFinish: task.baselineFinish ? dayjs(task.baselineFinish) : undefined,
      actualStart:    task.actualStart    ? dayjs(task.actualStart)    : undefined,
      actualFinish:   task.actualFinish   ? dayjs(task.actualFinish)   : undefined,
      dependencyIds: task.dependencies?.map((dep: any) => dep.dependsOnId) || [],
      parentId: task.parentId || undefined,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    antdModal.confirm({
      title: t('tasks.deleteConfirm'),
      content: `${t('tasks.deleteMessage')}: ${name}?`,
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const handleBulkDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select tasks to delete');
      return;
    }
    
    antdModal.confirm({
      title: 'Delete Selected Tasks',
      content: `Are you sure you want to delete ${selectedRowKeys.length} task(s)?`,
      onOk: async () => {
        try {
          for (const id of selectedRowKeys) {
            await api.deleteTask(id as string);
          }
          message.success(`Successfully deleted ${selectedRowKeys.length} task(s)`);
          setSelectedRowKeys([]);
          queryClient.invalidateQueries({ queryKey: ['tasks', project.id] });
        } catch (error) {
          message.error('Failed to delete some tasks');
        }
      },
    });
  };

  const handleImport = () => {
    setIsImportModalOpen(true);
    setUploadFile(null);
  };

  const handleImportSubmit = () => {
    if (!uploadFile) {
      message.warning('Please select a file to upload');
      return;
    }
    importMutation.mutate(uploadFile);
  };

  const handleFileChange = (info: any) => {
    if (info.file.status !== 'uploading') {
      setUploadFile(info.file.originFileObj || info.file);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const values = await form.validateFields();
      const { dependencyIds, ...taskFields } = values;

      // Only include assignedToId if it belongs to a real portal user
      const validUserIds = new Set(
        project.members?.filter((m: any) => m.user).map((m: any) => m.user.id) || []
      );
      let assigneeName: string | null | undefined = undefined; // undefined = leave unchanged
      if (taskFields.assignedToId && !validUserIds.has(taskFields.assignedToId)) {
        // Non-portal member selected — store their display name, clear the relation ID
        const nonPortalMember = project.members?.find(
          (m: any) => !m.user && m.id === taskFields.assignedToId
        );
        assigneeName = (nonPortalMember as any)?.memberName || null;
        taskFields.assignedToId = undefined;
      } else if (taskFields.assignedToId) {
        // Portal user selected — clear any stored assigneeName
        assigneeName = null;
      }

      const taskData = {
        ...taskFields,
        projectId: project.id,
        ...(assigneeName !== undefined && { assigneeName }),
        duration: taskFields.duration !== undefined ? Number(taskFields.duration) : undefined,
        startDate:      values.startDate      ? values.startDate.toISOString()      : undefined,
        endDate:        values.endDate        ? values.endDate.toISOString()        : undefined,
        baselineStart:  values.baselineStart  ? values.baselineStart.toISOString()  : null,
        baselineFinish: values.baselineFinish ? values.baselineFinish.toISOString() : null,
        actualStart:    values.actualStart    ? values.actualStart.toISOString()    : null,
        actualFinish:   values.actualFinish   ? values.actualFinish.toISOString()   : null,
      };

      if (editingTask) {
        // Update the task
        await updateMutation.mutateAsync({ id: editingTask.id, data: taskData });
        
        // Update dependencies
        if (dependencyIds) {
          // Delete existing dependencies
          if (editingTask.dependencies) {
            for (const dep of editingTask.dependencies) {
              await api.deleteTaskDependency(editingTask.id, dep.id);
            }
          }
          
          // Create new dependencies
          for (const depId of dependencyIds) {
            await api.createTaskDependency(editingTask.id, {
              dependsOnId: depId,
              type: 'FS', // Finish to Start by default
            });
          }
        }
        
        message.success(t('tasks.updateSuccess'));
        queryClient.invalidateQueries({ queryKey: ['tasks', project.id] });
        handleModalClose();
      } else {
        // Create the task first
        const newTask = await createMutation.mutateAsync(taskData);
        
        // Then create dependencies if any
        if (dependencyIds && dependencyIds.length > 0) {
          for (const depId of dependencyIds) {
            await api.createTaskDependency(newTask.id, {
              dependsOnId: depId,
              type: 'FS', // Finish to Start by default
            });
          }
        }
        
        message.success(t('tasks.createSuccess'));
        queryClient.invalidateQueries({ queryKey: ['tasks', project.id] });
        // Auto-expand parent so the new task is immediately visible
        if (taskData.parentId) {
          setExpandedTaskIds(prev => new Set([...prev, taskData.parentId as string]));
        }
        handleModalClose();
      }
    } catch (error: any) {
      console.error('Task submission failed:', error);
      if (error?.response?.data?.message) {
        message.error(error.response.data.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorityColors: Record<string, string> = {
    LOW: '#52c41a',
    MEDIUM: '#faad14',
    HIGH: '#fa541c',
    CRITICAL: '#f5222d',
  };

  const priorityTagColors: Record<string, string> = {
    LOW: 'success',
    MEDIUM: 'warning',
    HIGH: 'volcano',
    CRITICAL: 'error',
  };

  const statusConfig: Record<string, { color: string; icon: React.ReactNode; tagColor: string }> = {
    NOT_STARTED: { color: '#8c8c8c', icon: <MinusCircleOutlined />, tagColor: 'default' },
    IN_PROGRESS: { color: '#1890ff', icon: <ClockCircleOutlined />, tagColor: 'processing' },
    BLOCKED: { color: '#f5222d', icon: <StopOutlined />, tagColor: 'error' },
    COMPLETED: { color: '#52c41a', icon: <CheckCircleOutlined />, tagColor: 'success' },
    CANCELLED: { color: '#d9d9d9', icon: <ExclamationCircleOutlined />, tagColor: 'default' },
  };

  // Task statistics
  const taskStats = useMemo(() => {
    const total = tasks.length;
    const notStarted = tasks.filter((t: Task) => t.status === 'NOT_STARTED').length;
    const inProgress = tasks.filter((t: Task) => t.status === 'IN_PROGRESS').length;
    const completed = tasks.filter((t: Task) => t.status === 'COMPLETED').length;
    const blocked = tasks.filter((t: Task) => t.status === 'BLOCKED').length;
    const cancelled = tasks.filter((t: Task) => t.status === 'CANCELLED').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const overdue = tasks.filter((t: Task) => 
      t.endDate && new Date(t.endDate) < new Date() && t.status !== 'COMPLETED' && t.status !== 'CANCELLED'
    ).length;
    return { total, notStarted, inProgress, completed, blocked, cancelled, completionRate, overdue };
  }, [tasks]);

  // Filter tasks by search text only (table columns handle other filters)
  const filteredAndSortedTasks = useMemo(() => {
    const visibleTasks = getVisibleTasks(tasks);
    
    return visibleTasks.filter((task: Task) => {
      // Search filter
      if (searchText && !task.name.toLowerCase().includes(searchText.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [tasks, searchText, expandedTaskIds]);

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: Key[]) => {
      setSelectedRowKeys(selectedKeys);
    },
  };

  const columns = [
    {
      title: t('tasks.name'),
      dataIndex: 'name',
      key: 'name',
      width: 320,
      sorter: (a: Task, b: Task) => a.name.localeCompare(b.name),
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search name"
            value={selectedKeys[0]}
            onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ width: 188, marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button type="primary" onClick={() => confirm()} icon={<SearchOutlined />} size="small" style={{ width: 90 }}>Search</Button>
            <Button onClick={() => clearFilters && clearFilters()} size="small" style={{ width: 90 }}>Reset</Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered: boolean) => <SearchOutlined style={{ color: filtered ? '#667eea' : undefined }} />,
      onFilter: (value: any, record: Task) => record.name.toLowerCase().includes(value.toLowerCase()),
      render: (name: string, record: Task) => {
        const level = getTaskLevel(record, tasks);
        const ancestorPath = getAncestorPath(record, tasks);
        const hasChildren = record._count && record._count.subtasks > 0;
        const isExpanded = expandedTaskIds.has(record.id);
        const isLast = isLastChild(record, tasks);

        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {level > 0 && (
              <span style={{ display: 'flex', alignItems: 'center' }}>
                {ancestorPath.slice(0, -1).map((isLastAncestor, idx) => (
                  <span key={idx} style={{ display: 'inline-block', width: 18, color: '#e0e0e0', fontSize: 14, fontFamily: 'monospace' }}>
                    {isLastAncestor ? ' ' : '│'}
                  </span>
                ))}
                <span style={{ display: 'inline-block', width: 18, color: '#d0d0d0', fontSize: 14, fontFamily: 'monospace' }}>
                  {isLast ? '└' : '├'}
                </span>
              </span>
            )}
            {hasChildren ? (
              <Button
                type="text"
                size="small"
                icon={isExpanded ? <CaretDownOutlined style={{ fontSize: 10 }} /> : <CaretRightOutlined style={{ fontSize: 10 }} />}
                onClick={(e) => { e.stopPropagation(); toggleTaskExpansion(record.id); }}
                style={{ 
                  marginRight: 6, padding: 0, width: 22, height: 22, 
                  borderRadius: 6, 
                  background: isExpanded ? 'rgba(102,126,234,0.08)' : 'rgba(0,0,0,0.02)',
                  color: isExpanded ? '#667eea' : '#8c8c8c',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                }}
              />
            ) : (
              <span style={{ display: 'inline-block', width: 28 }} />
            )}
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={{ 
                fontWeight: level === 0 ? 600 : 400, 
                fontSize: level === 0 ? 13.5 : 13, 
                color: level === 0 ? '#262626' : '#595959',
                lineHeight: 1.4,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {name}
              </span>
              {hasChildren && (
                <span style={{ fontSize: 11, color: '#8c8c8c', lineHeight: 1.2 }}>
                  {record._count!.subtasks} subtask{record._count!.subtasks > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: t('tasks.status'),
      dataIndex: 'status',
      key: 'status',
      width: 140,
      filters: [
        { text: 'Not Started', value: 'NOT_STARTED' },
        { text: 'In Progress', value: 'IN_PROGRESS' },
        { text: 'Blocked', value: 'BLOCKED' },
        { text: 'Completed', value: 'COMPLETED' },
        { text: 'Cancelled', value: 'CANCELLED' },
      ],
      onFilter: (value: any, record: Task) => record.status === value,
      render: (status: string) => {
        const config = statusConfig[status] || statusConfig.NOT_STARTED;
        return (
          <Tag 
            icon={config.icon} 
            color={config.tagColor}
            style={{ borderRadius: 6, padding: '2px 10px', fontSize: 12, fontWeight: 500 }}
          >
            {t(`tasks.status_${status.toLowerCase()}`)}
          </Tag>
        );
      },
    },
    {
      title: t('tasks.priority'),
      dataIndex: 'priority',
      key: 'priority',
      width: 110,
      filters: [
        { text: 'Critical', value: 'CRITICAL' },
        { text: 'High', value: 'HIGH' },
        { text: 'Medium', value: 'MEDIUM' },
        { text: 'Low', value: 'LOW' },
      ],
      onFilter: (value: any, record: Task) => record.priority === value,
      sorter: (a: Task, b: Task) => {
        const priorityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
      },
      render: (priority: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ 
            width: 8, height: 8, borderRadius: '50%', 
            backgroundColor: priorityColors[priority],
            flexShrink: 0,
          }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: priorityColors[priority] }}>
            {t(`tasks.priority_${priority.toLowerCase()}`)}
          </span>
        </div>
      ),
    },
    {
      title: t('tasks.assignee'),
      key: 'assignee',
      width: 170,
      filters: project.members?.filter((member: any) => member.user).map((member: any) => ({
        text: `${member.user.firstName} ${member.user.lastName}`,
        value: member.user.id,
      })) || [],
      onFilter: (value: any, record: Task) => record.assignedToId === value,
      render: (_: any, record: Task) => {
        if (record.assignedTo) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar 
                size={26} 
                icon={<UserOutlined />}
                style={{ 
                  backgroundColor: '#667eea', 
                  fontSize: 12,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {record.assignedTo.firstName} {record.assignedTo.lastName}
              </span>
            </div>
          );
        }
        if ((record as any).assigneeName) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Avatar size={26} icon={<UserOutlined />} style={{ backgroundColor: '#8c8c8c', fontSize: 12, flexShrink: 0 }} />
              <span style={{ fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {(record as any).assigneeName}
              </span>
            </div>
          );
        }
        return <span style={{ color: '#bfbfbf', fontSize: 13 }}>Unassigned</span>;
      },
    },
    {
      title: t('tasks.progress'),
      dataIndex: 'progress',
      key: 'progress',
      width: 140,
      sorter: (a: Task, b: Task) => (a.progress || 0) - (b.progress || 0),
      render: (progress: number, record: Task) => {
        const pct = progress || 0;
        const strokeColor = record.status === 'COMPLETED' ? '#52c41a' : 
          record.status === 'BLOCKED' ? '#f5222d' : 
          pct >= 75 ? '#52c41a' : pct >= 40 ? '#1890ff' : '#faad14';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Progress 
              percent={pct} 
              size="small" 
              showInfo={false}
              strokeColor={strokeColor}
              trailColor="rgba(0,0,0,0.04)"
              style={{ flex: 1, marginBottom: 0 }}
            />
            <span style={{ fontSize: 12, fontWeight: 600, color: strokeColor, minWidth: 32, textAlign: 'right' }}>
              {pct}%
            </span>
          </div>
        );
      },
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      width: 90,
      sorter: (a: Task, b: Task) => (a.duration || 0) - (b.duration || 0),
      render: (duration: number) => {
        if (!duration) return <span style={{ color: '#bfbfbf' }}>—</span>;
        return (
          <span style={{ fontSize: 13 }}>
            {duration} {duration === 1 ? 'day' : 'days'}
          </span>
        );
      },
    },
    {
      title: <span><CalendarOutlined style={{ marginRight: 4 }} />Dates</span>,
      key: 'dates',
      width: 170,
      sorter: (a: Task, b: Task) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
      render: (_: any, record: Task) => {
        const start = record.startDate ? dayjs(record.startDate) : null;
        const end = record.endDate ? dayjs(record.endDate) : null;
        const isOverdue = end && end.isBefore(dayjs()) && record.status !== 'COMPLETED' && record.status !== 'CANCELLED';
        
        if (!start && !end) return <span style={{ color: '#bfbfbf' }}>—</span>;
        return (
          <div style={{ fontSize: 12, lineHeight: 1.6 }}>
            <div style={{ color: '#595959' }}>
              {start?.format('MMM DD')} → {end?.format('MMM DD, YYYY')}
            </div>
            {isOverdue && (
              <Tag color="error" style={{ fontSize: 10, lineHeight: '16px', borderRadius: 4, padding: '0 6px' }}>
                Overdue
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: 'Baseline',
      key: 'baseline',
      width: 160,
      render: (_: any, record: Task) => {
        const bStart  = record.baselineStart  ? dayjs(record.baselineStart)  : null;
        const bFinish = record.baselineFinish ? dayjs(record.baselineFinish) : null;
        if (!bStart && !bFinish) return <span style={{ color: '#bfbfbf' }}>—</span>;
        return (
          <div style={{ fontSize: 11, lineHeight: 1.6, color: '#8c8c8c' }}>
            <div>{bStart?.format('MMM DD')} → {bFinish?.format('MMM DD, YY')}</div>
          </div>
        );
      },
    },
    {
      title: 'Actual',
      key: 'actual',
      width: 160,
      render: (_: any, record: Task) => {
        const aStart  = record.actualStart  ? dayjs(record.actualStart)  : null;
        const aFinish = record.actualFinish ? dayjs(record.actualFinish) : null;
        if (!aStart && !aFinish) return <span style={{ color: '#bfbfbf' }}>—</span>;
        return (
          <div style={{ fontSize: 11, lineHeight: 1.6 }}>
            <div style={{ color: aFinish && aFinish.isAfter(record.endDate ? dayjs(record.endDate) : dayjs()) ? '#cf1322' : '#389e0d' }}>
              {aStart?.format('MMM DD')} → {aFinish?.format('MMM DD, YY')}
            </div>
          </div>
        );
      },
    },
    {
      title: 'RAID',
      key: 'raid',
      width: 70,
      fixed: 'right' as const,
      render: (_: any, record: Task) => {
        const items = (allRaidItems as any[]).filter((r: any) => r.linkedTaskId === record.id);
        if (items.length === 0) return <span style={{ color: '#bfbfbf' }}>—</span>;
        const typeColors: Record<string, string> = { RISK: '#ff4d4f', ASSUMPTION: '#1677ff', ISSUE: '#fa8c16', DEPENDENCY: '#722ed1' };
        return (
          <Tooltip title={items.map((r: any) => `[${r.type}] ${r.title}`).join('\n')}>
            <Badge count={items.length} size="small" color={typeColors[items[0].type] || '#1677ff'}>
              <LinkOutlined style={{ fontSize: 14, color: '#8c8c8c', cursor: 'default' }} />
            </Badge>
          </Tooltip>
        );
      },
    },
    {
      title: 'Deps',
      dataIndex: 'dependencies',
      key: 'dependencies',
      width: 80,
      fixed: 'right' as const,
      render: (dependencies: any[]) => {
        if (!dependencies || dependencies.length === 0) return <span style={{ color: '#bfbfbf' }}>—</span>;
        return (
          <Tooltip title={dependencies.map((d: any) => d.dependsOn?.name || 'Unknown').join(', ')}>
            <Tag color="geekblue" style={{ borderRadius: 6, cursor: 'default' }}>
              {dependencies.length} dep{dependencies.length > 1 ? 's' : ''}
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      fixed: 'right' as const,
      render: (_: any, record: Task) => (
        <Space size={0}>
          <Tooltip title={t('common.edit')}>
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
              style={{ color: '#8c8c8c', fontSize: 14 }}
            />
          </Tooltip>
          <Tooltip title={t('common.delete')}>
            <Button
              type="text"
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id, record.name)}
              style={{ color: '#8c8c8c', fontSize: 14 }}
              danger
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stats Summary Bar */}
      <Row gutter={[12, 12]}>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" style={{ borderRadius: 10, border: '1px solid #f0f0f0' }}>
            <Statistic 
              title={<span style={{ fontSize: 12, color: '#8c8c8c' }}>Total Tasks</span>}
              value={taskStats.total} 
              valueStyle={{ fontSize: 22, fontWeight: 700, color: '#262626' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" style={{ borderRadius: 10, border: '1px solid #f0f0f0' }}>
            <Statistic 
              title={<span style={{ fontSize: 12, color: '#8c8c8c' }}>Not Started</span>}
              value={taskStats.notStarted} 
              valueStyle={{ fontSize: 22, fontWeight: 700, color: '#8c8c8c' }}
              prefix={<MinusCircleOutlined style={{ fontSize: 16 }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" style={{ borderRadius: 10, border: '1px solid #f0f0f0' }}>
            <Statistic 
              title={<span style={{ fontSize: 12, color: '#8c8c8c' }}>In Progress</span>}
              value={taskStats.inProgress} 
              valueStyle={{ fontSize: 22, fontWeight: 700, color: '#1890ff' }}
              prefix={<ClockCircleOutlined style={{ fontSize: 16 }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" style={{ borderRadius: 10, border: '1px solid #f0f0f0' }}>
            <Statistic 
              title={<span style={{ fontSize: 12, color: '#8c8c8c' }}>Completed</span>}
              value={taskStats.completed} 
              valueStyle={{ fontSize: 22, fontWeight: 700, color: '#52c41a' }}
              prefix={<CheckCircleOutlined style={{ fontSize: 16 }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" style={{ borderRadius: 10, border: '1px solid #f0f0f0' }}>
            <Statistic 
              title={<span style={{ fontSize: 12, color: '#8c8c8c' }}>Blocked</span>}
              value={taskStats.blocked} 
              valueStyle={{ fontSize: 22, fontWeight: 700, color: '#f5222d' }}
              prefix={<ExclamationCircleOutlined style={{ fontSize: 16 }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small" style={{ borderRadius: 10, border: '1px solid #f0f0f0' }}>
            <Statistic 
              title={<span style={{ fontSize: 12, color: '#8c8c8c' }}>Completion</span>}
              value={taskStats.completionRate} 
              suffix="%" 
              valueStyle={{ 
                fontSize: 22, fontWeight: 700, 
                color: taskStats.completionRate >= 75 ? '#52c41a' : taskStats.completionRate >= 40 ? '#1890ff' : '#faad14'
              }}
            />
            <Progress 
              percent={taskStats.completionRate} 
              showInfo={false} 
              size="small" 
              strokeColor={taskStats.completionRate >= 75 ? '#52c41a' : taskStats.completionRate >= 40 ? '#1890ff' : '#faad14'}
              style={{ marginTop: 4 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Toolbar + Content */}
      <Card 
        style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}
        styles={{ body: { padding: '16px 20px' } }}
      >
        {/* Toolbar */}
        <div style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
          flexWrap: 'wrap', gap: 12, marginBottom: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Segmented
              value={viewMode}
              onChange={(val) => setViewMode(val as 'table' | 'kanban')}
              options={[
                { label: <span><UnorderedListOutlined style={{ marginRight: 4 }} />Table</span>, value: 'table' },
                { label: <span><AppstoreOutlined style={{ marginRight: 4 }} />Kanban</span>, value: 'kanban' },
              ]}
              style={{ borderRadius: 8 }}
            />
            <Input
              placeholder="Search tasks..."
              prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 240, borderRadius: 8 }}
              allowClear
            />
            {viewMode === 'table' && (
              <>
                <Tooltip title="Expand All">
                  <Button
                    type="text"
                    icon={<ExpandOutlined />}
                    onClick={() => {
                      const allParentIds = tasks
                        .filter((t: Task) => t._count && t._count.subtasks > 0)
                        .map((t: Task) => t.id);
                      setExpandedTaskIds(new Set(allParentIds));
                    }}
                    style={{ color: '#8c8c8c' }}
                  />
                </Tooltip>
                <Tooltip title="Collapse All">
                  <Button
                    type="text"
                    icon={<CompressOutlined />}
                    onClick={() => setExpandedTaskIds(new Set())}
                    style={{ color: '#8c8c8c' }}
                  />
                </Tooltip>
              </>
            )}
            {searchText && (
              <Tag color="blue" style={{ borderRadius: 6 }}>
                {filteredAndSortedTasks.length} / {tasks.length}
              </Tag>
            )}
            {taskStats.overdue > 0 && (
              <Tag color="error" style={{ borderRadius: 6 }}>
                {taskStats.overdue} overdue
              </Tag>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button icon={<UploadOutlined />} onClick={handleImport} style={{ borderRadius: 8 }}>
              Import MPP
            </Button>
            <Button icon={<FileExcelOutlined />} onClick={handleExportExcel} style={{ borderRadius: 8 }}>
              Export Excel
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleCreate}
            >
              {t('tasks.new')}
            </Button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedRowKeys.length > 0 && (
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(102,126,234,0.06) 0%, rgba(118,75,162,0.06) 100%)',
            borderRadius: 8, padding: '8px 16px', marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 12,
            border: '1px solid rgba(102,126,234,0.15)'
          }}>
            <Badge count={selectedRowKeys.length} style={{ backgroundColor: '#667eea' }} />
            <span style={{ fontSize: 13, color: '#595959' }}>tasks selected</span>
            <Button size="small" danger icon={<DeleteOutlined />} onClick={handleBulkDelete} style={{ borderRadius: 6 }}>
              Delete
            </Button>
            <Button size="small" onClick={() => setSelectedRowKeys([])} style={{ borderRadius: 6 }}>
              Clear
            </Button>
          </div>
        )}

        {/* Table View */}
        {viewMode === 'table' ? (
          <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={filteredAndSortedTasks}
            rowKey="id"
            loading={isLoading}
            scroll={{ x: 1600 }}
            pagination={{
              pageSize: 50,
              showSizeChanger: true,
              pageSizeOptions: ['25', '50', '100'],
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} tasks`,
              size: 'small',
              style: { marginTop: 12 },
            }}
            size="middle"
            rowClassName={(record: Task) => {
              if (record.status === 'BLOCKED') return 'task-row-blocked';
              if (record.status === 'COMPLETED') return 'task-row-completed';
              return '';
            }}
            style={{ 
              borderRadius: 8,
            }}
          />
        ) : (
          /* Kanban View */
          <div style={{ display: 'flex', gap: 14, overflowX: 'auto', padding: '8px 0' }}>
            {['NOT_STARTED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED'].map((status) => {
              const config = statusConfig[status] || statusConfig.NOT_STARTED;
              const columnTasks = filteredAndSortedTasks.filter((task: Task) => task.status === status);
              return (
                <div
                  key={status}
                  style={{
                    flex: '0 0 300px',
                    backgroundColor: '#fafafa',
                    borderRadius: 12,
                    padding: 14,
                    border: '1px solid #f0f0f0',
                  }}
                >
                  {/* Column Header */}
                  <div style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: 14, paddingBottom: 10, borderBottom: `2px solid ${config.color}` 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: config.color, fontSize: 16 }}>{config.icon}</span>
                      <span style={{ fontWeight: 600, fontSize: 14, color: '#262626' }}>
                        {t(`tasks.status_${status.toLowerCase()}`)}
                      </span>
                    </div>
                    <Tag 
                      color={config.tagColor} 
                      style={{ borderRadius: 10, fontWeight: 600, minWidth: 28, textAlign: 'center' }}
                    >
                      {columnTasks.length}
                    </Tag>
                  </div>
                  {/* Cards */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {columnTasks.map((task: Task) => {
                      const level = getTaskLevel(task, tasks);
                      const isOverdue = task.endDate && dayjs(task.endDate).isBefore(dayjs()) && task.status !== 'COMPLETED' && task.status !== 'CANCELLED';
                      return (
                        <Card
                          key={task.id}
                          size="small"
                          hoverable
                          style={{ 
                            cursor: 'pointer', borderRadius: 10, 
                            border: '1px solid #f0f0f0',
                            borderLeft: `3px solid ${priorityColors[task.priority]}`,
                          }}
                          styles={{ body: { padding: '10px 14px' } }}
                          onClick={() => handleEdit(task)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                            <span style={{ fontWeight: 600, fontSize: 13, color: '#262626', lineHeight: 1.4, flex: 1, marginRight: 8 }}>
                              {task.name}
                            </span>
                            {isOverdue && <Tag color="error" style={{ fontSize: 10, borderRadius: 4, lineHeight: '16px', padding: '0 4px' }}>Overdue</Tag>}
                          </div>
                          
                          {level > 0 && (
                            <Tag color="default" style={{ fontSize: 10, borderRadius: 4, marginBottom: 6 }}>
                              Subtask (L{level})
                            </Tag>
                          )}
                          {task._count && task._count.subtasks > 0 && (
                            <Tag color="geekblue" style={{ fontSize: 10, borderRadius: 4, marginBottom: 6 }}>
                              {task._count.subtasks} subtask{task._count.subtasks > 1 ? 's' : ''}
                            </Tag>
                          )}

                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: priorityColors[task.priority] }} />
                              <span style={{ fontSize: 11, color: '#8c8c8c' }}>{t(`tasks.priority_${task.priority.toLowerCase()}`)}</span>
                            </div>
                            {task.duration && (
                              <span style={{ fontSize: 11, color: '#8c8c8c' }}>
                                <FieldTimeOutlined style={{ marginRight: 2 }} />
                                {task.duration}d
                              </span>
                            )}
                            {task.dependencies && task.dependencies.length > 0 && (
                              <Tooltip title={task.dependencies.map((d: any) => d.dependsOn?.name).join(', ')}>
                                <Tag color="geekblue" style={{ fontSize: 10, borderRadius: 4, cursor: 'help' }}>
                                  {task.dependencies.length} dep{task.dependencies.length > 1 ? 's' : ''}
                                </Tag>
                              </Tooltip>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            {task.assignedTo ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Avatar size={20} icon={<UserOutlined />} style={{ backgroundColor: '#667eea', fontSize: 10 }} />
                                <span style={{ fontSize: 11, color: '#595959' }}>
                                  {task.assignedTo.firstName} {task.assignedTo.lastName}
                                </span>
                              </div>
                            ) : (
                              <span style={{ fontSize: 11, color: '#bfbfbf' }}>Unassigned</span>
                            )}
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#8c8c8c' }}>
                              {task.progress || 0}%
                            </span>
                          </div>

                          <Progress 
                            percent={task.progress || 0} 
                            size="small" 
                            showInfo={false}
                            strokeColor={task.progress && task.progress >= 75 ? '#52c41a' : '#667eea'}
                            trailColor="rgba(0,0,0,0.04)"
                            style={{ marginTop: 6, marginBottom: 0 }}
                          />
                        </Card>
                      );
                    })}
                    {columnTasks.length === 0 && (
                      <div style={{ 
                        textAlign: 'center', padding: '24px 12px', color: '#bfbfbf', fontSize: 13,
                        border: '1px dashed #e8e8e8', borderRadius: 8 
                      }}>
                        No tasks
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Create/Edit Drawer */}
      <RightDrawer
        title={editingTask ? t('tasks.edit') : t('tasks.new')}
        open={isModalOpen}
        onSubmit={handleSubmit}
        onClose={handleModalClose}
        width={520}
        confirmLoading={isSubmitting}
        submitText={editingTask ? t('common.save') : t('tasks.new')}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="projectId" hidden>
            <Input />
          </Form.Item>

          <Form.Item
            name="name"
            label={t('tasks.name')}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="description" label={t('tasks.description')}>
            <TextArea rows={3} />
          </Form.Item>

          <Form.Item 
            name="parentId" 
            label="Parent Task (Optional)"
            tooltip="Select a parent task to make this a subtask"
          >
            <Select
              allowClear
              placeholder="Select parent task (leave empty for main task)"
              showSearch
              filterOption={(input, option) => {
                const label = option?.label as string;
                return label?.toLowerCase().includes(input.toLowerCase()) || false;
              }}
              options={tasks
                .filter((t: Task) => !editingTask || t.id !== editingTask.id)
                .map((task: Task) => {
                  const level = getTaskLevel(task, tasks);
                  const prefix = '  '.repeat(level) + (level > 0 ? '└─ ' : '');
                  return {
                    label: `${prefix}${task.name}`,
                    value: task.id,
                  };
                })}
            />
          </Form.Item>

          <Form.Item 
            name="dependencyIds" 
            label="Predecessors (Tasks that must be completed first)"
            tooltip="Select tasks that must be completed before this task can start"
          >
            <Select
              mode="multiple"
              allowClear
              placeholder="Select predecessor tasks"
              filterOption={(input, option) =>
                (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {tasks
                .filter((t: Task) => !editingTask || t.id !== editingTask.id)
                .map((task: Task) => (
                  <Select.Option key={task.id} value={task.id}>
                    {task.name}
                  </Select.Option>
                ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="assignedToId"
            label={t('tasks.assignee')}
          >
            <Select placeholder={t('tasks.selectAssignee')}>
              {project.members?.map((member: any) => (
                <Select.Option
                  key={member.user ? member.user.id : member.id}
                  value={member.user ? member.user.id : member.id}
                >
                  {member.memberName || `${member.user?.firstName} ${member.user?.lastName}`}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label={t('tasks.status')}
            rules={[{ required: true, message: t('common.required') }]}
            initialValue="NOT_STARTED"
          >
            <Select onChange={() => form.validateFields(['actualStart', 'actualFinish'])}>
              <Select.Option value="NOT_STARTED">{t('tasks.status_not_started')}</Select.Option>
              <Select.Option value="IN_PROGRESS">{t('tasks.status_in_progress')}</Select.Option>
              <Select.Option value="BLOCKED">{t('tasks.status_blocked')}</Select.Option>
              <Select.Option value="COMPLETED">{t('tasks.status_completed')}</Select.Option>
              <Select.Option value="CANCELLED">{t('tasks.status_cancelled')}</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="priority"
            label={t('tasks.priority')}
            rules={[{ required: true, message: t('common.required') }]}
            initialValue="MEDIUM"
          >
            <Select>
              <Select.Option value="LOW">{t('tasks.priority_low')}</Select.Option>
              <Select.Option value="MEDIUM">{t('tasks.priority_medium')}</Select.Option>
              <Select.Option value="HIGH">{t('tasks.priority_high')}</Select.Option>
              <Select.Option value="CRITICAL">{t('tasks.priority_critical')}</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="startDate"
            label={t('tasks.startDate')}
            rules={[{
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                const end = form.getFieldValue('endDate');
                if (end && value.isAfter(end, 'day'))
                  return Promise.reject(new Error('Start date must be before or equal to end date'));
                return Promise.resolve();
              },
            }]}
          >
            <DatePicker style={{ width: '100%' }} onChange={() => form.validateFields(['endDate'])} />
          </Form.Item>

          <Form.Item
            name="endDate"
            label={t('tasks.endDate')}
            rules={[{
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                const start = form.getFieldValue('startDate');
                if (start && value.isBefore(start, 'day'))
                  return Promise.reject(new Error('End date must be after or equal to start date'));
                return Promise.resolve();
              },
            }]}
          >
            <DatePicker style={{ width: '100%' }} onChange={() => form.validateFields(['startDate'])} />
          </Form.Item>

          <Form.Item
            name="baselineStart"
            label="Baseline Start"
            rules={[{
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                const end = form.getFieldValue('baselineFinish');
                if (end && value.isAfter(end, 'day'))
                  return Promise.reject(new Error('Baseline start must be before or equal to baseline finish'));
                return Promise.resolve();
              },
            }]}
          >
            <DatePicker style={{ width: '100%' }} onChange={() => form.validateFields(['baselineFinish'])} />
          </Form.Item>

          <Form.Item
            name="baselineFinish"
            label="Baseline Finish"
            rules={[{
              validator: (_, value) => {
                if (!value) return Promise.resolve();
                const start = form.getFieldValue('baselineStart');
                if (start && value.isBefore(start, 'day'))
                  return Promise.reject(new Error('Baseline finish must be after or equal to baseline start'));
                return Promise.resolve();
              },
            }]}
          >
            <DatePicker style={{ width: '100%' }} onChange={() => form.validateFields(['baselineStart'])} />
          </Form.Item>

          <Form.Item
            name="actualStart"
            label="Actual Start"
            rules={[{
              validator: (_, value) => {
                const status = form.getFieldValue('status');
                const actualFinish = form.getFieldValue('actualFinish');
                if (!value) {
                  if (status === 'IN_PROGRESS')
                    return Promise.reject(new Error('Actual start is required when status is In Progress'));
                  if (status === 'COMPLETED')
                    return Promise.reject(new Error('Actual start is required when status is Completed'));
                  if (actualFinish)
                    return Promise.reject(new Error('Actual start is required when actual finish is set'));
                  return Promise.resolve();
                }
                if (actualFinish && value.isAfter(actualFinish, 'day'))
                  return Promise.reject(new Error('Actual start must be before or equal to actual finish'));
                return Promise.resolve();
              },
            }]}
          >
            <DatePicker style={{ width: '100%' }} onChange={() => form.validateFields(['actualFinish'])} />
          </Form.Item>

          <Form.Item
            name="actualFinish"
            label="Actual Finish"
            rules={[{
              validator: (_, value) => {
                const status = form.getFieldValue('status');
                if (!value) {
                  if (status === 'COMPLETED')
                    return Promise.reject(new Error('Actual finish is required when status is Completed'));
                  return Promise.resolve();
                }
                const start = form.getFieldValue('actualStart');
                if (!start)
                  return Promise.reject(new Error('Actual start must be set before actual finish'));
                if (value.isBefore(start, 'day'))
                  return Promise.reject(new Error('Actual finish must be after or equal to actual start'));
                return Promise.resolve();
              },
            }]}
          >
            <DatePicker style={{ width: '100%' }} onChange={() => form.validateFields(['actualStart'])} />
          </Form.Item>

          <Form.Item 
            name="duration" 
            label="Duration (days)"
            rules={[{ required: true, message: t('common.required') }]}
            tooltip="Task duration in working days"
          >
            <Input type="number" min={0} step={0.5} placeholder="Enter duration in days" />
          </Form.Item>

          {editingTask && linkedRaidItems.length > 0 && (
            <>
              <Divider style={{ fontSize: 13, margin: '12px 0 6px' }}>
                <Space><LinkOutlined />Linked RAID Items</Space>
              </Divider>
              <List
                size="small"
                dataSource={linkedRaidItems}
                renderItem={(item: any) => {
                  const typeColors: Record<string, string> = { RISK: 'red', ASSUMPTION: 'blue', ISSUE: 'orange', DEPENDENCY: 'purple' };
                  const statusColors: Record<string, string> = { OPEN: 'default', IN_PROGRESS: 'processing', MITIGATED: 'cyan', CLOSED: 'success' };
                  return (
                    <List.Item style={{ padding: '6px 0' }}>
                      <Space wrap>
                        <Tag color={typeColors[item.type] || 'default'} style={{ marginRight: 0 }}>{item.type}</Tag>
                        <Text style={{ fontSize: 13 }}>{item.title}</Text>
                        <Tag color={statusColors[item.status] || 'default'} style={{ marginRight: 0 }}>{item.status}</Tag>
                      </Space>
                    </List.Item>
                  );
                }}
              />
            </>
          )}
        </Form>
      </RightDrawer>

      {/* Import MPP Modal */}
      <Modal
        title="Import MS Project File"
        open={isImportModalOpen}
        onOk={handleImportSubmit}
        onCancel={() => {
          setIsImportModalOpen(false);
          setUploadFile(null);
        }}
        confirmLoading={importMutation.isPending}
      >
        <div style={{ marginBottom: 16 }}>
          <p>Upload a Microsoft Project XML file (.xml) to automatically create tasks for this project.</p>
          <p><strong>Note:</strong> To export from MS Project, go to File → Save As → Select XML Format (.xml)</p>
        </div>
        <Upload
          beforeUpload={() => false}
          onChange={handleFileChange}
          maxCount={1}
          accept=".xml,.mpp"
        >
          <Button icon={<UploadOutlined />}>Select MPP/XML File</Button>
        </Upload>
        {uploadFile && (
          <div style={{ marginTop: 16 }}>
            <Tag color="blue">{uploadFile.name}</Tag>
          </div>
        )}
      </Modal>
    </div>
  );
}
