import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Form,
  Switch,
  Button,
  Row,
  Col,
  Typography,
  ColorPicker,
  InputNumber,
  Input,
  Radio,
  Space,
  Spin,
  App,
  Tag,
  Tooltip,
  Upload,
  Select,
  Tabs,
  Badge,
  Alert,
  Popconfirm,
} from 'antd';
import {
  SaveOutlined,
  UndoOutlined,
  EyeOutlined,
  BgColorsOutlined,
  AppstoreOutlined,
  SettingOutlined,
  FilePptOutlined,
  DeleteOutlined,
  PictureOutlined,
  LayoutOutlined,
  CheckCircleOutlined,
  StopOutlined,
  EditOutlined,
} from '@ant-design/icons';
import api from '../../lib/api';
import type { Project } from '../../types';

const { Text } = Typography;

interface ReportTemplateSettingsProps {
  project: Project;
}
// Default template (mirrors server-side DEFAULT_REPORT_TEMPLATE)
const DEFAULT_TEMPLATE = {
  companyName: 'EPM',
  companyNameAr: '',
  logoUrlLeft: '',
  logoUrlRight: '',
  timezone: 'Asia/Riyadh',
  workDays: [0,1,2,3,4],
  hoursPerDay: 8,
  colors: {
    primary: '951919',
    secondary: '7A1414',
    accent: 'C44040',
    success: '16A34A',
    warning: 'F59E0B',
    danger: 'DC2626',
    headerTitle: 'FFFFFF',
  },
  slides: {
    titlePage: true,
    agenda: true,
    executiveSummary: true,
    weeklyHighlights: true,
    weeklyProgress: true,
    nextWeek: true,
    milestones: true,
    risksAndChallenges: true,
  },
  language: 'bilingual' as const,
  milestonesPerPage: 10,
  risksPerPage: 8,
  timelinePerPage: 10,
  thisWeekPerPage: 20,
  nextWeekPerPage: 18,
  slideTitles: {
    agenda:             '',
    executiveSummary:   '',
    weeklyHighlights:   '',
    weeklyProgress:     '',
    nextWeek:           '',
    milestones:         '',
    risksAndChallenges: '',
  } as Record<string, string>,
  logoRepeat: 'first' as 'first' | 'all',
};


const MASTER_LAYOUT_OPTIONS = [
  { value: 'titleAndContent', label: 'Title & Content' },
  { value: 'cover',           label: 'Cover' },
  { value: 'blank',           label: 'Blank' },
  { value: 'contentEmpty',    label: 'Content Empty' },
  { value: 'sectionTitle',    label: 'Section Title' },
];
const MASTER_LAYOUT_COLORS: Record<string, string> = {
  cover: 'purple', blank: 'default', contentEmpty: 'cyan',
  titleAndContent: 'blue', sectionTitle: 'geekblue',
};

export default function ReportTemplateSettings({ project }: ReportTemplateSettingsProps) {
  const DEFAULT_SLIDES = [
    { key: 'titlePage',          label: 'Title Page',        labelAr: '',      desc: 'Project name & report date',      masterLayout: 'cover' },
    { key: 'agenda',             label: 'Agenda',            labelAr: '',      desc: 'Meeting agenda items',            masterLayout: 'sectionTitle' },
    { key: 'executiveSummary',   label: 'Dashboard',         labelAr: '',      desc: 'Progress cards & statistics',     masterLayout: 'titleAndContent' },
    { key: 'weeklyHighlights',   label: 'Weekly Highlights', labelAr: '',      desc: 'Completed + Planned two-column slide', masterLayout: 'titleAndContent' },
    { key: 'weeklyProgress',     label: 'This Week',         labelAr: '',      desc: 'Completed tasks this week',       masterLayout: 'titleAndContent' },
    { key: 'nextWeek',           label: 'Next Week',         labelAr: '',      desc: 'Planned tasks next week',        masterLayout: 'titleAndContent' },
    { key: 'milestones',         label: 'Key Milestones',    labelAr: '',      desc: 'Milestones table with variance',  masterLayout: 'contentEmpty' },
    { key: 'risksAndChallenges', label: 'Risks & Challenges',labelAr: '',      desc: 'RAID log table',                  masterLayout: 'contentEmpty' },
  ];
  const [slideInfo, setSlideInfo] = useState(DEFAULT_SLIDES);

  // Layout banner images (one image per master layout type)
  type LayoutType = 'cover' | 'blank' | 'contentEmpty' | 'titleAndContent' | 'sectionTitle';
  const LAYOUT_KEYS: LayoutType[] = ['cover', 'blank', 'contentEmpty', 'titleAndContent', 'sectionTitle'];
  const [layoutImages, setLayoutImages] = useState<Record<LayoutType, string>>({ cover: '', blank: '', contentEmpty: '', titleAndContent: '', sectionTitle: '' });
  const [uploadingLayout, setUploadingLayout] = useState<Record<string, boolean>>({});
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  // Fetch current template
  const { data: template, isLoading } = useQuery({
    queryKey: ['report-template', project.id],
    queryFn: () => api.getReportTemplate(project.id),
  });

  // Set form values when data loads
  useEffect(() => {
    if (template) {
      form.setFieldsValue({
        companyName: template.companyName || DEFAULT_TEMPLATE.companyName,
        companyNameAr: template.companyNameAr || '',
        logoUrlLeft: template.logoUrlLeft || '',
        logoUrlRight: template.logoUrlRight || '',
        language: template.language || 'bilingual',
        milestonesPerPage: template.milestonesPerPage || 10,
        risksPerPage: template.risksPerPage || 8,
        timelinePerPage: template.timelinePerPage || 10,
        thisWeekPerPage: (template as any).thisWeekPerPage || 20,
        nextWeekPerPage: (template as any).nextWeekPerPage || 18,
        slideTitle_agenda:             (template as any).slideTitles?.agenda             || '',
        slideTitle_executiveSummary:   (template as any).slideTitles?.executiveSummary   || '',
        slideTitle_weeklyHighlights:   (template as any).slideTitles?.weeklyHighlights   || '',
        slideTitle_weeklyProgress:     (template as any).slideTitles?.weeklyProgress     || '',
        slideTitle_nextWeek:           (template as any).slideTitles?.nextWeek           || '',
        slideTitle_milestones:         (template as any).slideTitles?.milestones         || '',
        slideTitle_risksAndChallenges: (template as any).slideTitles?.risksAndChallenges || '',
      });
      // Load layout banner images from template.header
      if (template.header) {
        setLayoutImages(prev => ({
          ...prev,
          ...Object.fromEntries(LAYOUT_KEYS.map(k => [k, (template.header as any)?.[k]?.imageUrl || ''])),
        }) as Record<LayoutType, string>);
      }
      // Merge saved slideLayouts back into slideInfo
      if ((template as any).slideLayouts) {
        const saved = (template as any).slideLayouts as Record<string, string>;
        setSlideInfo(prev => prev.map(s => ({
          ...s,
          masterLayout: saved[s.key] ?? s.masterLayout,
        })));
      }
    }
  }, [template, form]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (values: any) => api.updateReportTemplate(project.id, values),
    onSuccess: () => {
      message.success('Report template saved successfully!');
      queryClient.invalidateQueries({ queryKey: ['report-template', project.id] });
    },
    onError: () => {
      message.error('Failed to save report template');
    },
  });

  // Export preview
  const [isExporting, setIsExporting] = useState(false);
  const handlePreviewExport = async () => {
    try {
      setIsExporting(true);
      message.loading({ content: 'Generating preview...', key: 'preview-ppt' });
      const blob = await api.exportWeeklyReportPPT(project.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Preview_Report_${project.code}_${new Date().toISOString().split('T')[0]}.pptx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success({ content: 'Preview report generated!', key: 'preview-ppt' });
    } catch {
      message.error({ content: 'Failed to generate preview', key: 'preview-ppt' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSave = () => {
    const formValues = form.getFieldsValue();
    // Build the full template object
    const templateData = {
      companyName: formValues.companyName,
      companyNameAr: formValues.companyNameAr,
      logoUrlLeft: formValues.logoUrlLeft,
      logoUrlRight: formValues.logoUrlRight,
      language: formValues.language,
      milestonesPerPage: formValues.milestonesPerPage,
      risksPerPage: formValues.risksPerPage,
      timelinePerPage: formValues.timelinePerPage,
      thisWeekPerPage: formValues.thisWeekPerPage,
      nextWeekPerPage: formValues.nextWeekPerPage,
      slideTitles: {
        agenda:             formValues.slideTitle_agenda             || '',
        executiveSummary:   formValues.slideTitle_executiveSummary   || '',
        weeklyHighlights:   formValues.slideTitle_weeklyHighlights   || '',
        weeklyProgress:     formValues.slideTitle_weeklyProgress     || '',
        nextWeek:           formValues.slideTitle_nextWeek           || '',
        milestones:         formValues.slideTitle_milestones         || '',
        risksAndChallenges: formValues.slideTitle_risksAndChallenges || '',
      },
      colors: { ...(template?.colors || DEFAULT_TEMPLATE.colors) },
      slides: { ...(template?.slides || DEFAULT_TEMPLATE.slides) },
      slideLayouts: Object.fromEntries(slideInfo.map(s => [s.key, s.masterLayout])),
      timezone: formValues.timezone,
      workDays: formValues.workDays,
      hoursPerDay: formValues.hoursPerDay,
      logoRepeat: formValues.logoRepeat || 'first',
    };
    saveMutation.mutate(templateData);
  };

  const handleReset = () => {
    saveMutation.mutate(DEFAULT_TEMPLATE);
    form.setFieldsValue({
      companyName: DEFAULT_TEMPLATE.companyName,
      companyNameAr: DEFAULT_TEMPLATE.companyNameAr,
      logoUrlLeft: DEFAULT_TEMPLATE.logoUrlLeft,
      logoUrlRight: DEFAULT_TEMPLATE.logoUrlRight,
      language: DEFAULT_TEMPLATE.language,
      milestonesPerPage: DEFAULT_TEMPLATE.milestonesPerPage,
      risksPerPage: DEFAULT_TEMPLATE.risksPerPage,
      timelinePerPage: DEFAULT_TEMPLATE.timelinePerPage,
      thisWeekPerPage: DEFAULT_TEMPLATE.thisWeekPerPage,
      nextWeekPerPage: DEFAULT_TEMPLATE.nextWeekPerPage,
      slideTitle_agenda:             '',
      slideTitle_executiveSummary:   '',
      slideTitle_weeklyHighlights:   '',
      slideTitle_weeklyProgress:     '',
      slideTitle_nextWeek:           '',
      slideTitle_milestones:         '',
      slideTitle_risksAndChallenges: '',
      timezone: '',
      workDays: [],
      hoursPerDay: 8,
    });
  };

  const handleColorChange = (colorKey: string, color: any) => {
    const hex = typeof color === 'string' ? color : color.toHex();
    const cleanHex = hex.replace('#', '').toUpperCase();
    const newColors = {
      ...(template?.colors || DEFAULT_TEMPLATE.colors),
      [colorKey]: cleanHex,
    };
    saveMutation.mutate({ colors: newColors });
  };

  const handleSlideToggle = (slideKey: string, enabled: boolean) => {
    const newSlides = {
      ...(template?.slides || DEFAULT_TEMPLATE.slides),
      [slideKey]: enabled,
    };
    saveMutation.mutate({ slides: newSlides });
  };

  // ---- Header / Footer upload handlers ----
  const handleLayoutImageUpload = async (layoutType: LayoutType, file: File) => {
    try {
      setUploadingLayout(prev => ({ ...prev, [layoutType]: true }));
      const result = await api.uploadHeaderFooterImage(project.id, 'header', layoutType, file);
      message.success('Image uploaded!');
      setLayoutImages(prev => ({ ...prev, [layoutType]: result.imagePath }));
      queryClient.invalidateQueries({ queryKey: ['report-template', project.id] });
    } catch {
      message.error('Upload failed');
    } finally {
      setUploadingLayout(prev => ({ ...prev, [layoutType]: false }));
    }
  };

  const handleLayoutImageDelete = (layoutType: LayoutType) => {
    setLayoutImages(prev => ({ ...prev, [layoutType]: '' }));
    saveMutation.mutate({ header: { ...Object.fromEntries(LAYOUT_KEYS.map(k => [k, { imageUrl: layoutType === k ? '' : layoutImages[k], text: '' }])) } });
    message.success('Image removed');
  };

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  const currentColors = template?.colors || DEFAULT_TEMPLATE.colors;
  const currentSlides = template?.slides || DEFAULT_TEMPLATE.slides;
  const enabledCount = Object.values(currentSlides).filter(Boolean).length;

  // ── Tab: General ─────────────────────────────────────────────────────────
  const tabGeneral = (
    <Form form={form} layout="vertical">
      {/* Language & Display */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ width: 4, height: 20, background: '#951919', borderRadius: 2 }} />
          <Text strong style={{ fontSize: 14 }}>Language & Display</Text>
        </div>
        <Form.Item label="Report Language" name="language">
          <Radio.Group buttonStyle="solid">
            <Radio.Button value="ar">العربية</Radio.Button>
            <Radio.Button value="en">English</Radio.Button>
            <Radio.Button value="bilingual">ثنائي اللغة</Radio.Button>
          </Radio.Group>
        </Form.Item>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Milestones per page" name="milestonesPerPage">
              <InputNumber min={5} max={25} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Timeline per page" name="timelinePerPage">
              <InputNumber min={5} max={25} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Risks per page" name="risksPerPage">
              <InputNumber min={3} max={20} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="This Week — per page" name="thisWeekPerPage">
              <InputNumber min={5} max={30} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Next Week — per page" name="nextWeekPerPage">
              <InputNumber min={5} max={30} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
      </div>
    </Form>
  );

  // ── Tab: Colors ───────────────────────────────────────────────────────────
  const allColorFields = [
    { key: 'primary',     label: 'Primary',      labelAr: 'الأساسي',   desc: 'Header bars, key elements' },
    { key: 'secondary',   label: 'Secondary',    labelAr: 'الثانوي',   desc: 'Section slides background' },
    { key: 'accent',      label: 'Accent',       labelAr: 'التمييز',   desc: 'Divider lines, highlights' },
    { key: 'success',     label: 'Success',      labelAr: 'النجاح',    desc: 'Completed, on-track' },
    { key: 'warning',     label: 'Warning',      labelAr: 'التحذير',   desc: 'Medium risk, delayed' },
    { key: 'danger',      label: 'Danger',       labelAr: 'الخطر',     desc: 'Critical, overdue' },
    { key: 'headerTitle', label: 'Header Title', labelAr: 'عنوان الرأس', desc: 'Slide header title text color' },
  ];
  const tabColors = (
    <div>
      <Alert
        message="Colors are saved automatically on change"
        type="info" showIcon style={{ marginBottom: 20, borderRadius: 8 }}
      />
      <Row gutter={[16, 16]}>
        {allColorFields.map((cf) => (
          <Col span={8} key={cf.key}>
            <Card
              size="small"
              style={{ borderRadius: 8, textAlign: 'center', borderTop: `3px solid #${currentColors[cf.key as keyof typeof currentColors] || '000000'}` }}
              styles={{ body: { padding: '16px 12px' } }}
            >
              <Tooltip title={cf.desc}>
                <ColorPicker
                  value={`#${currentColors[cf.key as keyof typeof currentColors] || '000000'}`}
                  onChange={(color) => handleColorChange(cf.key, color)}
                  showText
                  size="large"
                />
              </Tooltip>
              <div style={{ marginTop: 8 }}>
                <Text strong style={{ fontSize: 13 }}>{cf.label}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 11 }}>{cf.labelAr}</Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
      <div style={{ marginTop: 20 }}>
        <Text strong style={{ display: 'block', marginBottom: 8 }}>معاينة / Preview:</Text>
        <div style={{ display: 'flex', height: 40, borderRadius: 8, overflow: 'hidden', border: '1px solid #e8e8e8' }}>
          {allColorFields.map((cf) => (
            <Tooltip key={cf.key} title={cf.labelAr}>
              <div
                style={{
                  flex: 1,
                  backgroundColor: `#${currentColors[cf.key as keyof typeof currentColors] || '000000'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <Text style={{ fontSize: 9, color: '#fff', textShadow: '0 1px 2px #0005' }}>{cf.labelAr}</Text>
              </div>
            </Tooltip>
          ))}
        </div>
      </div>
    </div>
  );

  // ── Tab: Slides ───────────────────────────────────────────────────────────
  // Slides that have a customizable header title (titlePage has no header bar)
  const SLIDE_TITLE_KEYS = new Set(['agenda','executiveSummary','weeklyHighlights','weeklyProgress','nextWeek','milestones','risksAndChallenges']);

  const tabSlides = (
    <Form form={form} layout="vertical">
      <Alert
        message={`${enabledCount} of ${slideInfo.length} slides enabled`}
        type={enabledCount > 0 ? 'success' : 'warning'}
        showIcon style={{ marginBottom: 16, borderRadius: 8 }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {slideInfo.map((slide, idx) => {
          const isEnabled = currentSlides[slide.key as keyof typeof currentSlides] ?? true;
          return (
            <Card
              key={slide.key}
              size="small"
              style={{
                borderRadius: 8,
                borderLeft: `4px solid ${isEnabled ? `#${currentColors.primary || '951919'}` : '#d9d9d9'}`,
                opacity: isEnabled ? 1 : 0.55,
                transition: 'all 0.2s',
                background: isEnabled ? '#fff' : '#fafafa',
              }}
              styles={{ body: { padding: '10px 14px' } }}
            >
              <Row align="middle" justify="space-between" wrap={false}>
                <Col flex="auto">
                  <Space align="start">
                    <div style={{
                      width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', background: isEnabled ? `#${currentColors.primary || '951919'}` : '#e8e8e8',
                      color: isEnabled ? '#fff' : '#aaa', fontWeight: 700, fontSize: 12, flexShrink: 0,
                    }}>
                      {idx + 1}
                    </div>
                    <div>
                      <Space wrap={false} size={6}>
                        <Text strong style={{ fontSize: 13 }}>{slide.labelAr}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>/ {slide.label}</Text>
                      </Space>
                      <br />
                      <Text type="secondary" style={{ fontSize: 11 }}>{slide.desc}</Text>
                      <br />
                      <Select
                        size="small"
                        value={slide.masterLayout}
                        style={{ marginTop: 4, width: 170 }}
                        options={MASTER_LAYOUT_OPTIONS}
                        onChange={v => setSlideInfo(prev => prev.map(s => s.key === slide.key ? { ...s, masterLayout: v } : s))}
                        disabled={!isEnabled}
                      />
                      {SLIDE_TITLE_KEYS.has(slide.key) && (
                        <Form.Item
                          name={`slideTitle_${slide.key}`}
                          style={{ marginTop: 8, marginBottom: 0 }}
                          label={
                            <span style={{ fontSize: 11, color: '#888', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <EditOutlined style={{ fontSize: 11 }} /> Slide header title
                            </span>
                          }
                        >
                          <Input
                            size="small"
                            placeholder={`e.g. ${slide.label}`}
                            style={{ width: '100%', maxWidth: 400 }}
                            disabled={!isEnabled}
                            allowClear
                          />
                        </Form.Item>
                      )}
                    </div>
                  </Space>
                </Col>
                <Col flex="none" style={{ paddingLeft: 12 }}>
                  <Switch
                    checked={isEnabled}
                    onChange={(checked) => handleSlideToggle(slide.key, checked)}
                    checkedChildren={<CheckCircleOutlined />}
                    unCheckedChildren={<StopOutlined />}
                  />
                </Col>
              </Row>
            </Card>
          );
        })}
      </div>
    </Form>
  );

  // ── Tab: Backgrounds ─────────────────────────────────────────────────────
  const tabBackgrounds = (
    <div>
      {/* Master layout backgrounds only */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 4, height: 20, background: '#951919', borderRadius: 2 }} />
          <Text strong style={{ fontSize: 14 }}>Master Layout Backgrounds</Text>
        </div>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
          Applies to all slides using the same layout. Recommended size: <strong>1333 × 750 px</strong>
        </Text>
        <Row gutter={[12, 12]}>
          {MASTER_LAYOUT_OPTIONS.map(({ value, label }) => {
            const lt = value as LayoutType;
            const imgUrl = layoutImages[lt];
            return (
              <Col xs={12} sm={8} md={6} key={lt}>
                <Card
                  size="small"
                  style={{ borderRadius: 8, textAlign: 'center', borderTop: `3px solid var(--ant-color-primary, #951919)` }}
                  styles={{ body: { padding: '10px 8px' } }}
                >
                  <Tag color={MASTER_LAYOUT_COLORS[lt]} style={{ fontSize: 10, marginBottom: 6 }}>{label}</Tag>
                  {imgUrl ? (
                    <div style={{
                      height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: '#f8fafc', borderRadius: 6, border: '1px solid #e8e8e8', marginBottom: 8,
                    }}>
                      <img
                        src={`http://localhost:5000${imgUrl}`}
                        alt={label}
                        style={{ maxHeight: 48, maxWidth: '100%', objectFit: 'contain' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  ) : (
                    <div style={{
                      height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: '#fafafa', borderRadius: 6, border: '1px dashed #d9d9d9', marginBottom: 8,
                      color: '#bbb', fontSize: 11,
                    }}>
                      <LayoutOutlined style={{ fontSize: 16 }} />
                    </div>
                  )}
                  <Space direction="vertical" style={{ width: '100%' }} size={4}>
                    <Upload accept="image/*" showUploadList={false}
                      customRequest={({ file }) => handleLayoutImageUpload(lt, file as File)}
                      disabled={uploadingLayout[lt]}
                    >
                      <Button icon={<PictureOutlined />} loading={uploadingLayout[lt]} size="small" type="primary" ghost style={{ width: '100%' }}>
                        {imgUrl ? 'Change' : 'Upload'}
                      </Button>
                    </Upload>
                    {imgUrl && (
                      <Button danger icon={<DeleteOutlined />} size="small" style={{ width: '100%' }} onClick={() => handleLayoutImageDelete(lt)}>
                        Delete
                      </Button>
                    )}
                  </Space>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>
    </div>
  );

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #951919 0%, #7A1414 100%)',
        borderRadius: 12,
        padding: '20px 24px',
        marginBottom: 20,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Space>
          <div style={{
            width: 44, height: 44, borderRadius: 10, background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FilePptOutlined style={{ fontSize: 22, color: '#fff' }} />
          </div>
          <div>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 700, display: 'block' }}>
              Report Template Settings
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
              Report Template Settings — {project.name}
            </Text>
          </div>
        </Space>
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={handlePreviewExport}
            loading={isExporting}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff' }}
          >
          Preview
            </Button>
          <Popconfirm
            title="Reset to defaults?"
            description="This will discard all custom settings and restore defaults."
            onConfirm={handleReset}
            okText="Yes, reset"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button
              icon={<UndoOutlined />}
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff' }}
            >
              Reset Settings
            </Button>
          </Popconfirm>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={saveMutation.isPending}
            style={{ background: '#951919', border: 'none', fontWeight: 600 }}
          >
            Save Settings
          </Button>
        </Space>
      </div>

      {/* Tabs */}
      <Card style={{ borderRadius: 12 }} styles={{ body: { padding: '0 24px 24px' } }}>
        <Tabs
          defaultActiveKey="general"
          size="large"
          items={[
            {
              key: 'general',
              label: (
                <Space>
                  <SettingOutlined />
                  <span>General Settings</span>
                </Space>
              ),
              children: <div style={{ paddingTop: 16 }}>{tabGeneral}</div>,
            },
            {
              key: 'slides',
              label: (
                <Space>
                  <AppstoreOutlined />
                  <span>Slides</span>
                  <Badge count={enabledCount} style={{ background: '#951919' }} />
                </Space>
              ),
              children: <div style={{ paddingTop: 16 }}>{tabSlides}</div>,
            },
            {
              key: 'colors',
              label: (
                <Space>
                  <BgColorsOutlined />
                  <span>Colors</span>
                </Space>
              ),
              children: <div style={{ paddingTop: 16 }}>{tabColors}</div>,
            },
            {
              key: 'backgrounds',
              label: (
                <Space>
                  <PictureOutlined />
                  <span>Master Layout</span>
                </Space>
              ),
              children: <div style={{ paddingTop: 16 }}>{tabBackgrounds}</div>,
            },
          ]}
        />
      </Card>
    </div>
  );
}

// Sortable slide component removed (Slide Order Preview section removed)
