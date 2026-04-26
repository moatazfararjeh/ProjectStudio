import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Table,
  Tag,
  Popconfirm,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  App,
  Tabs,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../lib/api';
import type { Project } from '../../types';

const { Title, Text } = Typography;

interface WeeklyHighlight {
  id: string;
  projectId: string;
  weekDate: string;
  type: 'COMPLETED' | 'PLANNED';
  description: string;
  sortOrder: number;
  createdAt: string;
}

interface Props {
  project: Project;
}

// Get the Monday of the current week
function currentWeekMonday(): string {
  const today = new Date();
  const day = today.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diff);
  return dayjs(monday).format('YYYY-MM-DD');
}

export default function ProjectWeeklyHighlights({ project }: Props) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [selectedWeek, setSelectedWeek] = useState<string>(currentWeekMonday());
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<WeeklyHighlight | null>(null);
  const [form] = Form.useForm();

  // Fetch available weeks
  const { data: weeks = [] } = useQuery<string[]>({
    queryKey: ['weekly-highlight-weeks', project.id],
    queryFn: () => api.getWeeklyHighlightWeeks(project.id),
  });

  // Fetch highlights for selected week
  const { data: highlights = [], isLoading } = useQuery<WeeklyHighlight[]>({
    queryKey: ['weekly-highlights', project.id, selectedWeek],
    queryFn: () => api.getWeeklyHighlights(project.id, selectedWeek),
  });

  const completedItems = highlights.filter(h => h.type === 'COMPLETED');
  const plannedItems   = highlights.filter(h => h.type === 'PLANNED');

  // Create
  const createMutation = useMutation({
    mutationFn: (payload: any) => api.createWeeklyHighlight(project.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-highlights', project.id] });
      queryClient.invalidateQueries({ queryKey: ['weekly-highlight-weeks', project.id] });
      message.success('تم الإضافة');
      setModalOpen(false);
      form.resetFields();
    },
    onError: () => message.error('فشل في الحفظ'),
  });

  // Update
  const updateMutation = useMutation({
    mutationFn: ({ hid, payload }: { hid: string; payload: any }) =>
      api.updateWeeklyHighlight(project.id, hid, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-highlights', project.id] });
      message.success('تم التحديث');
      setModalOpen(false);
      setEditItem(null);
      form.resetFields();
    },
    onError: () => message.error('فشل في التحديث'),
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: (hid: string) => api.deleteWeeklyHighlight(project.id, hid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weekly-highlights', project.id] });
      queryClient.invalidateQueries({ queryKey: ['weekly-highlight-weeks', project.id] });
      message.success('تم الحذف');
    },
    onError: () => message.error('فشل في الحذف'),
  });

  const openAdd = (type: 'COMPLETED' | 'PLANNED') => {
    setEditItem(null);
    form.resetFields();
    form.setFieldsValue({ type, weekDate: dayjs(selectedWeek) });
    setModalOpen(true);
  };

  const openEdit = (item: WeeklyHighlight) => {
    setEditItem(item);
    form.setFieldsValue({
      type: item.type,
      weekDate: dayjs(item.weekDate),
      description: item.description,
      sortOrder: item.sortOrder,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      weekDate: dayjs(values.weekDate).format('YYYY-MM-DD'),
    };
    if (editItem) {
      updateMutation.mutate({ hid: editItem.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const columns = (type: 'COMPLETED' | 'PLANNED') => [
    {
      title: '#',
      width: 50,
      render: (_: any, __: any, idx: number) => idx + 1,
    },
    {
      title: 'الوصف',
      dataIndex: 'description',
      render: (v: string) => <Text style={{ direction: 'rtl' }}>{v}</Text>,
    },
    {
      title: 'الترتيب',
      dataIndex: 'sortOrder',
      width: 80,
    },
    {
      title: '',
      width: 100,
      render: (_: any, record: WeeklyHighlight) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm
            title="حذف هذا السطر؟"
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="نعم"
            cancelText="لا"
            okButtonProps={{ danger: true }}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Build week options from saved weeks + current week
  const weekOptions = Array.from(new Set([currentWeekMonday(), ...weeks.map(w => dayjs(w).format('YYYY-MM-DD'))])).sort().reverse();

  return (
    <div style={{ padding: '0 0 24px' }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            <CalendarOutlined style={{ marginLeft: 8 }} />
            التقرير الأسبوعي — إنجازات وخطة الأسبوع
          </Title>
        </Col>
        <Col>
          <Space>
            <Text strong>الأسبوع:</Text>
            <Select
              value={selectedWeek}
              onChange={setSelectedWeek}
              style={{ width: 180 }}
              options={weekOptions.map(w => ({ label: `أسبوع ${dayjs(w).format('DD/MM/YYYY')}`, value: w }))}
            />
          </Space>
        </Col>
      </Row>

      <Tabs
        defaultActiveKey="completed"
        items={[
          {
            key: 'completed',
            label: (
              <span>
                <CheckCircleOutlined />
                ما تم إنجازه ({completedItems.length})
              </span>
            ),
            children: (
              <Card
                extra={
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => openAdd('COMPLETED')}>
                    إضافة
                  </Button>
                }
              >
                <Table
                  dataSource={completedItems}
                  columns={columns('COMPLETED')}
                  rowKey="id"
                  size="small"
                  loading={isLoading}
                  locale={{ emptyText: <Empty description="لا توجد بنود مكتملة لهذا الأسبوع" /> }}
                  pagination={false}
                />
              </Card>
            ),
          },
          {
            key: 'planned',
            label: (
              <span>
                <CalendarOutlined />
                خطة الأسبوع القادم ({plannedItems.length})
              </span>
            ),
            children: (
              <Card
                extra={
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => openAdd('PLANNED')}>
                    إضافة
                  </Button>
                }
              >
                <Table
                  dataSource={plannedItems}
                  columns={columns('PLANNED')}
                  rowKey="id"
                  size="small"
                  loading={isLoading}
                  locale={{ emptyText: <Empty description="لا توجد خطط لهذا الأسبوع" /> }}
                  pagination={false}
                />
              </Card>
            ),
          },
        ]}
      />

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        title={editItem ? 'تعديل البند' : 'إضافة بند جديد'}
        onOk={handleSubmit}
        onCancel={() => { setModalOpen(false); setEditItem(null); form.resetFields(); }}
        okText="حفظ"
        cancelText="إلغاء"
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="type" label="النوع" rules={[{ required: true }]}>
            <Select options={[
              { label: 'تم الإنجاز', value: 'COMPLETED' },
              { label: 'مخطط للأسبوع القادم', value: 'PLANNED' },
            ]} />
          </Form.Item>
          <Form.Item name="weekDate" label="تاريخ بداية الأسبوع (الإثنين)" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" picker="date" />
          </Form.Item>
          <Form.Item name="description" label="الوصف" rules={[{ required: true, min: 2 }]}>
            <Input.TextArea rows={3} dir="rtl" placeholder="وصف المهمة أو النشاط..." />
          </Form.Item>
          <Form.Item name="sortOrder" label="الترتيب" initialValue={0}>
            <Select options={Array.from({ length: 20 }, (_, i) => ({ label: i + 1, value: i }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
