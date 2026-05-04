import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../stores/appStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Button,
  Space,
  Typography,
  Table,
  Popconfirm,
  Modal,
  Form,
  Input,
  DatePicker,
  App,
  Tabs,
  Tag,
  Tooltip,
  Divider,
  Row,
  Col,
  Select,
  Radio,
  Upload,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  FilePptOutlined,
  UserOutlined,
  MinusCircleOutlined,
  DownloadOutlined,
  UploadOutlined,
  FileWordOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../lib/api';
import type { Project } from '../../types';

const { Title, Text } = Typography;

interface Attendee {
  name: string;
  role?: string;
  attended?: boolean;
}

interface Absentee {
  name: string;
  role?: string;
  reason?: string;
}

interface KeyPoint {
  point: string;
}

interface ActionItem {
  task: string;
  assignedTo?: string;
  dueDate?: string;
  status?: string;
}

interface MeetingMinute {
  id: string;
  projectId: string;
  title: string;
  meetingDate: string;
  location?: string;
  facilitator?: string;
  language: 'AR' | 'EN';
  attendees: Attendee[];
  absentees: Absentee[];
  keyPoints: KeyPoint[];
  actionItems: ActionItem[];
  notes?: string;
  createdAt: string;
}

interface Props {
  project: Project;
}

function statusColor(s?: string) {
  switch (s) {
    case 'DONE': return 'green';
    case 'IN_PROGRESS': return 'blue';
    case 'CANCELLED': return 'red';
    default: return 'orange';
  }
}

export default function ProjectMeetingMinutes({ project }: Props) {
  const { t } = useTranslation();
  const { language } = useAppStore();
  const dir = language === 'ar' ? 'rtl' : 'ltr';
  const { message } = App.useApp();
  const qc = useQueryClient();

  const ACTION_STATUS_OPTIONS = [
    { value: 'OPEN', label: t('meetingMinutes.status_open') },
    { value: 'IN_PROGRESS', label: t('meetingMinutes.status_in_progress') },
    { value: 'DONE', label: t('meetingMinutes.status_done') },
    { value: 'CANCELLED', label: t('meetingMinutes.status_cancelled') },
  ];

  function statusLabel(s?: string) {
    return ACTION_STATUS_OPTIONS.find(o => o.value === s)?.label || s || t('meetingMinutes.status_open');
  }

  const [modalOpen, setModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<MeetingMinute | null>(null);
  const [activeTab, setActiveTab] = useState('list');
  const [form] = Form.useForm();
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [templateUploading, setTemplateUploading] = useState(false);
  const [hasTemplate, setHasTemplate] = useState<boolean>(
    !!(project as any)?.settings?.momTemplate?.docxTemplatePath,
  );
  const [defaultLanguage, setDefaultLanguage] = useState<'AR' | 'EN'>(
    (project as any)?.settings?.momTemplate?.defaultLanguage || 'AR',
  );

  const { data: minutes = [], isLoading } = useQuery({
    queryKey: ['meeting-minutes', project.id],
    queryFn: () => api.getMeetingMinutes(project.id),
  });

  const createMut = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.createMeetingMinutes(project.id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meeting-minutes', project.id] });
      message.success(t('meetingMinutes.createSuccess'));
      setModalOpen(false);
      form.resetFields();
    },
    onError: () => message.error(t('meetingMinutes.createError')),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      api.updateMeetingMinutes(project.id, id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meeting-minutes', project.id] });
      message.success(t('meetingMinutes.updateSuccess'));
      setModalOpen(false);
      form.resetFields();
      setEditRecord(null);
    },
    onError: () => message.error(t('meetingMinutes.updateError')),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.deleteMeetingMinutes(project.id, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meeting-minutes', project.id] });
      message.success(t('meetingMinutes.deleteSuccess'));
    },
    onError: () => message.error(t('meetingMinutes.deleteError')),
  });

  function openNew() {
    setEditRecord(null);
    setActiveTab('info');
    form.resetFields();
    form.setFieldsValue({
      language: defaultLanguage,
      meetingDate: dayjs(),
      attendees: [{ name: '', role: '', attended: true }],
      absentees: [],
      keyPoints: [{ point: '' }],
      actionItems: [],
    });
    setModalOpen(true);
  }

  function openEdit(rec: MeetingMinute) {
    setEditRecord(rec);
    setActiveTab('info');
    form.setFieldsValue({
      ...rec,
      meetingDate: dayjs(rec.meetingDate),
    });
    setModalOpen(true);
  }


  async function handleExport(rec: MeetingMinute) {
    try {
      setExportingId(rec.id);
      const blob = await api.exportMeetingMinutes(project.id, rec.id);
      // 422 means the template has tag errors — server sends JSON not a blob
      if (blob.type === 'application/json') {
        const text = await blob.text();
        const json = JSON.parse(text);
        message.error({ content: json.message || t('meetingMinutes.templateError'), duration: 10 });
        return;
      }
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `MoM_${rec.title.replace(/\s+/g, '_')}_${rec.meetingDate.slice(0, 10)}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      const msg = err?.response?.data?.message || t('meetingMinutes.exportError');
      message.error({ content: msg, duration: 10 });
    } finally {
      setExportingId(null);
    }
  }

  async function handleTemplateUpload(file: File) {
    try {
      setTemplateUploading(true);
      await api.uploadMoMTemplate(project.id, file);
      setHasTemplate(true);
      message.success(t('meetingMinutes.templateUploaded'));
    } catch {
      message.error(t('meetingMinutes.templateUploadError'));
    } finally {
      setTemplateUploading(false);
    }
    return false; // prevent antd auto-upload
  }

  async function handleTemplateDelete() {
    try {
      await api.deleteMoMTemplate(project.id);
      setHasTemplate(false);
      message.success(t('meetingMinutes.templateDeleted'));
    } catch {
      message.error(t('meetingMinutes.templateDeleteError'));
    }
  }

  async function handleTemplateDownload() {
    try {
      const blob = await api.downloadMoMTemplate(project.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mom_template_${project.name.replace(/\s+/g, '_')}.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      message.error(t('meetingMinutes.templateDownloadError'));
    }
  }

  async function handleDefaultLanguageChange(lang: 'AR' | 'EN') {
    setDefaultLanguage(lang);
    try {
      const currentSettings = (project as any)?.settings || {};
      await api.updateProject(project.id, {
        settings: {
          ...currentSettings,
          momTemplate: {
            ...(currentSettings.momTemplate || {}),
            defaultLanguage: lang,
          },
        },
      });
      message.success(t('meetingMinutes.defaultLangSaved'));
    } catch {
      message.error(t('meetingMinutes.defaultLangError'));
    }
  }

  function handleSubmit() {
    form.validateFields().then((values) => {
      const payload = {
        ...values,
        meetingDate: values.meetingDate ? values.meetingDate.toISOString() : undefined,
        attendees: (values.attendees || []).filter((a: Attendee) => a?.name),
        absentees: (values.absentees || []).filter((a: Absentee) => a?.name),
        keyPoints: (values.keyPoints || []).filter((k: KeyPoint) => k?.point),
        actionItems: (values.actionItems || []).filter((a: ActionItem) => a?.task),
      };
      if (editRecord) {
        updateMut.mutate({ id: editRecord.id, payload });
      } else {
        createMut.mutate(payload);
      }
    });
  }

  const columns = [
    {
      title: t('meetingMinutes.meetingTitle'),
      dataIndex: 'title',
      key: 'title',
      render: (v: string) => <Text strong>{v}</Text>,
    },
    {
      title: t('meetingMinutes.language'),
      dataIndex: 'language',
      key: 'language',
      render: (v: 'AR' | 'EN') => (
        <Tag color={v === 'AR' ? 'blue' : 'green'}>{v === 'AR' ? t('meetingMinutes.language_ar') : t('meetingMinutes.language_en')}</Tag>
      ),
    },
    {
      title: t('meetingMinutes.meetingDate'),
      dataIndex: 'meetingDate',
      key: 'meetingDate',
      render: (v: string) => dayjs(v).format('YYYY-MM-DD'),
    },
    {
      title: t('meetingMinutes.location'),
      dataIndex: 'location',
      key: 'location',
      render: (v?: string) => v || '—',
    },
    {
      title: t('meetingMinutes.meetingOwner'),
      dataIndex: 'facilitator',
      key: 'facilitator',
      render: (v?: string) => v || '—',
    },
    {
      title: t('meetingMinutes.attendees'),
      dataIndex: 'attendees',
      key: 'attendees',
      render: (v: Attendee[]) => <Tag icon={<UserOutlined />}>{v?.length || 0}</Tag>,
    },
    {
      title: t('meetingMinutes.actionItems'),
      dataIndex: 'actionItems',
      key: 'actionItems',
      render: (v: ActionItem[]) => <Tag color="blue">{v?.length || 0}</Tag>,
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: unknown, rec: MeetingMinute) => (
        <Space>
          <Tooltip title={t('common.edit')}>
            <Button icon={<EditOutlined />} size="small" onClick={() => openEdit(rec)} />
          </Tooltip>
          <Tooltip title={t('common.export')}>
            <Button
              icon={<DownloadOutlined />}
              size="small"
              loading={exportingId === rec.id}
              onClick={() => handleExport(rec)}
            />
          </Tooltip>
          <Popconfirm title={t('meetingMinutes.deleteConfirm')} onConfirm={() => deleteMut.mutate(rec.id)} okButtonProps={{ danger: true }}>
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* ── MOM Template upload card ─────────────────────────────── */}
      <Card
        size="small"
        style={{ marginBottom: 16 }}
        title={
          <Space>
            <FileWordOutlined />
            <span>{t('meetingMinutes.templateCard')}</span>
          </Space>
        }
      >
        <div style={{ marginBottom: 12 }}>
          <Text style={{ marginInlineEnd: 8 }}>{t('meetingMinutes.defaultLanguage')}</Text>
          <Radio.Group
            value={defaultLanguage}
            onChange={(e) => handleDefaultLanguageChange(e.target.value)}
            buttonStyle="solid"
            size="small"
          >
            <Radio.Button value="AR">{t('meetingMinutes.language_ar')} (RTL)</Radio.Button>
            <Radio.Button value="EN">{t('meetingMinutes.language_en')} (LTR)</Radio.Button>
          </Radio.Group>
        </div>
        {hasTemplate ? (
          <Space>
            <Tag color="green" icon={<FileWordOutlined />}>{t('meetingMinutes.customTemplateActive')}</Tag>
            <Tooltip title={t('meetingMinutes.downloadTemplateTooltip')}>
              <Button
                size="small"
                icon={<DownloadOutlined />}
                onClick={handleTemplateDownload}
              >
                {t('meetingMinutes.downloadTemplate')}
              </Button>
            </Tooltip>
            <Tooltip title={t('meetingMinutes.deleteTemplateTooltip')}>
              <Button
                size="small"
                danger
                icon={<CloseCircleOutlined />}
                onClick={handleTemplateDelete}
              >
                {t('meetingMinutes.deleteTemplate')}
              </Button>
            </Tooltip>
          </Space>
        ) : (
          <Space direction="vertical" size={4}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t('meetingMinutes.uploadInstructions')}
              {' '}<code>{'{title}'}</code>, <code>{'{meetingDate}'}</code>, <code>{'{location}'}</code>,
              {' '}<code>{'{facilitator}'}</code>, <code>{'{notes}'}</code>,
              {' '}<code>{'{#attendees}{attendeeName}{attendeeRole}{attendeeStatus}{/attendees}'}</code>,
              {' '}<code>{'{#keyPoints}{kpIndex}{kpText}{/keyPoints}'}</code>,
              {' '}<code>{'{#actionItems}{aiTask}{aiAssignedTo}{aiDueDate}{aiStatus}{/actionItems}'}</code>
            </Text>
            <Upload
              accept=".docx"
              showUploadList={false}
              beforeUpload={(file: File) => { handleTemplateUpload(file); return false; }}
            >
              <Button icon={<UploadOutlined />} loading={templateUploading}>
                {t('meetingMinutes.uploadTemplate')}
              </Button>
            </Upload>
          </Space>
        )}
      </Card>

      <Card
        title={
          <Space>
            <FilePptOutlined />
            <span>Meeting Minutes — {project.name}</span>
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openNew}>
            {t('meetingMinutes.newMoM')}
          </Button>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={minutes}
          loading={isLoading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        open={modalOpen}
        title={editRecord ? t('meetingMinutes.edit') : t('meetingMinutes.new')}
        onCancel={() => { setModalOpen(false); setEditRecord(null); }}
        onOk={handleSubmit}
        okText={editRecord ? t('common.save') : t('common.submit')}
        cancelText={t('common.cancel')}
        confirmLoading={createMut.isPending || updateMut.isPending}
        width={900}
        styles={{ body: { maxHeight: '75vh', overflowY: 'auto' } }}
      >
        <Form form={form} layout="vertical" dir={dir}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            tabBarGutter={24}
            style={{ direction: dir }}
            items={[
              {
                key: 'info',
                label: t('meetingMinutes.meetingInfo'),
                children: (
                  <>
                    <Row gutter={16}>
                      <Col span={16}>
                        <Form.Item name="title" label={t('meetingMinutes.meetingTitle')} rules={[{ required: true, message: t('meetingMinutes.required') }]}>
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item name="language" label={t('meetingMinutes.minutesLanguage')} rules={[{ required: true }]}>
                          <Radio.Group buttonStyle="solid">
                            <Radio.Button value="AR">{t('meetingMinutes.language_ar')} (RTL)</Radio.Button>
                            <Radio.Button value="EN">English (LTR)</Radio.Button>
                          </Radio.Group>
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item name="meetingDate" label={t('meetingMinutes.meetingDateTime')} rules={[{ required: true, message: t('meetingMinutes.required') }]}>
                          <DatePicker showTime style={{ width: '100%' }} format="YYYY-MM-DD HH:mm" />
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item name="location" label={t('meetingMinutes.meetingLocation')}>
                          <Input />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item name="facilitator" label={t('meetingMinutes.meetingFacilitator')}>
                          <Input />
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item name="notes" label={t('meetingMinutes.generalNotes')}>
                      <Input.TextArea rows={3} />
                    </Form.Item>
                  </>
                ),
              },
              {
                key: 'attendees',
                label: t('meetingMinutes.attendance'),
                children: (
                  <>
                    <Title level={5}>{t('meetingMinutes.attendees')}</Title>
                    <Form.List name="attendees">
                      {(fields, { add, remove }) => (
                        <>
                          {fields.map(({ key, name, ...rest }) => (
                            <Row gutter={8} key={key} align="middle">
                              <Col span={10}>
                                <Form.Item {...rest} name={[name, 'name']} label={name === 0 ? t('meetingMinutes.name') : ''} rules={[{ required: true, message: t('meetingMinutes.required') }]}>
                                  <Input placeholder={t('meetingMinutes.name')} />
                                </Form.Item>
                              </Col>
                              <Col span={10}>
                                <Form.Item {...rest} name={[name, 'role']} label={name === 0 ? t('meetingMinutes.role') : ''}>
                                  <Input placeholder={t('meetingMinutes.rolePosition')} />
                                </Form.Item>
                              </Col>
                              <Col span={4} style={{ paddingTop: name === 0 ? 28 : 0 }}>
                                <Button icon={<MinusCircleOutlined />} danger onClick={() => remove(name)} />
                              </Col>
                            </Row>
                          ))}
                          <Button type="dashed" onClick={() => add({ name: '', role: '', attended: true })} icon={<PlusOutlined />}>
                            {t('meetingMinutes.addAttendee')}
                          </Button>
                        </>
                      )}
                    </Form.List>

                    <Divider />
                    <Title level={5}>{t('meetingMinutes.absentees')}</Title>
                    <Form.List name="absentees">
                      {(fields, { add, remove }) => (
                        <>
                          {fields.map(({ key, name, ...rest }) => (
                            <Row gutter={8} key={key} align="middle">
                              <Col span={8}>
                                <Form.Item {...rest} name={[name, 'name']} label={name === 0 ? t('meetingMinutes.name') : ''}>
                                  <Input placeholder={t('meetingMinutes.name')} />
                                </Form.Item>
                              </Col>
                              <Col span={8}>
                                <Form.Item {...rest} name={[name, 'role']} label={name === 0 ? t('meetingMinutes.role') : ''}>
                                  <Input placeholder={t('meetingMinutes.role')} />
                                </Form.Item>
                              </Col>
                              <Col span={6}>
                                <Form.Item {...rest} name={[name, 'reason']} label={name === 0 ? t('meetingMinutes.reason') : ''}>
                                  <Input placeholder={t('meetingMinutes.reasonAbsence')} />
                                </Form.Item>
                              </Col>
                              <Col span={2} style={{ paddingTop: name === 0 ? 28 : 0 }}>
                                <Button icon={<MinusCircleOutlined />} danger onClick={() => remove(name)} />
                              </Col>
                            </Row>
                          ))}
                          <Button type="dashed" onClick={() => add({ name: '', role: '' })} icon={<PlusOutlined />}>
                            {t('meetingMinutes.addAbsentee')}
                          </Button>
                        </>
                      )}
                    </Form.List>
                  </>
                ),
              },
              {
                key: 'points',
                label: t('meetingMinutes.keyPointsActions'),
                children: (
                  <>
                    <Title level={5}>{t('meetingMinutes.keyPoints')}</Title>
                    <Form.List name="keyPoints">
                      {(fields, { add, remove }) => (
                        <>
                          {fields.map(({ key, name, ...rest }) => (
                            <Row gutter={8} key={key} align="middle">
                              <Col span={22}>
                                <Form.Item {...rest} name={[name, 'point']} rules={[{ required: true, message: t('meetingMinutes.required') }]}>
                                  <Input placeholder={t('meetingMinutes.keyPoint')} />
                                </Form.Item>
                              </Col>
                              <Col span={2}>
                                <Button icon={<MinusCircleOutlined />} danger onClick={() => remove(name)} />
                              </Col>
                            </Row>
                          ))}
                          <Button type="dashed" onClick={() => add({ point: '' })} icon={<PlusOutlined />}>
                            {t('meetingMinutes.addKeyPoint')}
                          </Button>
                        </>
                      )}
                    </Form.List>

                    <Divider />
                    <Title level={5}>{t('meetingMinutes.actionItems')}</Title>
                    <Form.List name="actionItems">
                      {(fields, { add, remove }) => (
                        <>
                          {fields.map(({ key, name, ...rest }) => (
                            <Row gutter={8} key={key} align="middle">
                              <Col span={8}>
                                <Form.Item {...rest} name={[name, 'task']} label={name === 0 ? t('meetingMinutes.action') : ''} rules={[{ required: true, message: t('meetingMinutes.required') }]}>
                                  <Input placeholder={t('meetingMinutes.actionDescription')} />
                                </Form.Item>
                              </Col>
                              <Col span={6}>
                                <Form.Item {...rest} name={[name, 'assignedTo']} label={name === 0 ? t('meetingMinutes.assignedTo') : ''}>
                                  <Input placeholder={t('meetingMinutes.assignedTo')} />
                                </Form.Item>
                              </Col>
                              <Col span={5}>
                                <Form.Item {...rest} name={[name, 'dueDate']} label={name === 0 ? t('meetingMinutes.dueDate') : ''}>
                                  <Input placeholder="YYYY-MM-DD" />
                                </Form.Item>
                              </Col>
                              <Col span={4}>
                                <Form.Item {...rest} name={[name, 'status']} label={name === 0 ? t('meetingMinutes.status') : ''}>
                                  <Select options={ACTION_STATUS_OPTIONS} placeholder={t('meetingMinutes.status')} />
                                </Form.Item>
                              </Col>
                              <Col span={1} style={{ paddingTop: name === 0 ? 28 : 0 }}>
                                <Button icon={<MinusCircleOutlined />} danger onClick={() => remove(name)} />
                              </Col>
                            </Row>
                          ))}
                          <Button type="dashed" onClick={() => add({ task: '', status: 'OPEN' })} icon={<PlusOutlined />}>
                            {t('meetingMinutes.addAction')}
                          </Button>
                        </>
                      )}
                    </Form.List>
                  </>
                ),
              },
            ]}
          />
        </Form>
      </Modal>

      {/* Action Items summary for existing records */}
      {minutes.length > 0 && (
        <Card title={t('meetingMinutes.openActionItems')} style={{ marginTop: 16 }}>
          <Table
            rowKey={(_r: ActionItem & { _mid: string; _title: string }, idx) => `${idx}`}
            dataSource={minutes.flatMap((m: MeetingMinute) =>
              (m.actionItems || [])
                .filter((a: ActionItem) => a.status !== 'DONE' && a.status !== 'CANCELLED')
                .map((a: ActionItem) => ({ ...a, _mid: m.id, _title: m.title, _date: m.meetingDate }))
            )}
            columns={[
              { title: t('meetingMinutes.meeting'), dataIndex: '_title', key: '_title' },
              { title: t('meetingMinutes.action'), dataIndex: 'task', key: 'task' },
              { title: t('meetingMinutes.assignedTo'), dataIndex: 'assignedTo', key: 'assignedTo', render: (v?: string) => v || '—' },
              { title: t('meetingMinutes.dueDate'), dataIndex: 'dueDate', key: 'dueDate', render: (v?: string) => v || '—' },
              {
                title: t('meetingMinutes.status'),
                dataIndex: 'status',
                key: 'status',
                render: (v?: string) => <Tag color={statusColor(v)}>{statusLabel(v)}</Tag>,
              },
            ]}
            pagination={false}
            size="small"
          />
        </Card>
      )}
    </div>
  );
}
