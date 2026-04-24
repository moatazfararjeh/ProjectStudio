import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Form,
  Input,
  Switch,
  Button,
  Row,
  Col,
  Typography,
  Divider,
  ColorPicker,
  InputNumber,
  Radio,
  Space,
  Spin,
  App,
  Collapse,
  Tag,
  Tooltip,
  Upload,
  Select,
} from 'antd';
import {
  SaveOutlined,
  UndoOutlined,
  EyeOutlined,
  FileImageOutlined,
  BgColorsOutlined,
  AppstoreOutlined,
  SettingOutlined,
  FilePptOutlined,
  DragOutlined,
  DeleteOutlined,
  CloseCircleOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import api from '../../lib/api';
import type { Project } from '../../types';
const { Title, Text, Paragraph } = Typography;

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
    primary: '0B4F6C',
    secondary: '1A7FA1',
    accent: '2EADD3',
    success: '16A34A',
    warning: 'F59E0B',
    danger: 'DC2626',
  },
  slides: {
    titlePage: true,
    agenda: true,
    executiveSummary: true,
    weeklyProgress: true,
    nextWeek: true,
    milestones: true,
    risksAndChallenges: true,
  },
  language: 'bilingual' as const,
  showVarianceIndicator: true,
  showProgressBars: true,
  milestonesPerPage: 10,
  risksPerPage: 8,
  timelinePerPage: 10,
  logoRepeat: 'first' as 'first' | 'all',
};


import { PlusOutlined } from '@ant-design/icons';

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

const DEFAULT_SLIDES = [
  { key: 'titlePage',          label: 'Title Page',        labelAr: 'صفحة العنوان',     desc: 'Project name & report date',       masterLayout: 'cover' },
  { key: 'agenda',             label: 'Agenda',            labelAr: 'جدول الأعمال',     desc: 'Meeting agenda items',             masterLayout: 'sectionTitle' },
  { key: 'executiveSummary',   label: 'Dashboard',         labelAr: 'لوحة البيانات',    desc: 'Progress cards & KPI statistics',  masterLayout: 'titleAndContent' },
  { key: 'weeklyProgress',     label: 'This Week',         labelAr: 'ما تم إنجازه',     desc: 'Completed tasks this week',        masterLayout: 'titleAndContent' },
  { key: 'nextWeek',           label: 'Next Week',         labelAr: 'خطة الأسبوع القادم', desc: 'Planned tasks next week',         masterLayout: 'titleAndContent' },
  { key: 'milestones',         label: 'Key Milestones',    labelAr: 'المعالم الرئيسية', desc: 'Milestones table with variance',   masterLayout: 'contentEmpty' },
  { key: 'risksAndChallenges', label: 'Risks & Challenges',labelAr: 'المخاطر والتحديات',desc: 'RAID log table',                   masterLayout: 'contentEmpty' },
];

const COLOR_FIELDS = [
  { key: 'accent', label: 'Accent', labelAr: 'التمييز' },
  { key: 'success', label: 'Success', labelAr: 'النجاح' },
  { key: 'warning', label: 'Warning', labelAr: 'التحذير' },
  { key: 'danger', label: 'Danger', labelAr: 'الخطر' },
];

export default function ReportTemplateSettings({ project }: ReportTemplateSettingsProps) {
  const DEFAULT_SLIDES = [
    { key: 'titlePage',          label: 'Title Page',        labelAr: 'صفحة العنوان',      desc: 'Project name & report date',      masterLayout: 'cover' },
    { key: 'agenda',             label: 'Agenda',            labelAr: 'جدول الأعمال',      desc: 'Meeting agenda items',            masterLayout: 'sectionTitle' },
    { key: 'executiveSummary',   label: 'Dashboard',         labelAr: 'لوحة البيانات',     desc: 'Progress cards & statistics',     masterLayout: 'titleAndContent' },
    { key: 'weeklyProgress',     label: 'This Week',         labelAr: 'ما تم إنجازه',      desc: 'Completed tasks this week',       masterLayout: 'titleAndContent' },
    { key: 'nextWeek',           label: 'Next Week',         labelAr: 'خطة الأسبوع القادم', desc: 'Planned tasks next week',        masterLayout: 'titleAndContent' },
    { key: 'milestones',         label: 'Key Milestones',    labelAr: 'المعالم الرئيسية', desc: 'Milestones table with variance',  masterLayout: 'contentEmpty' },
    { key: 'risksAndChallenges', label: 'Risks & Challenges',labelAr: 'المخاطر والتحديات',desc: 'RAID log table',                  masterLayout: 'contentEmpty' },
  ];
  const [slideInfo, setSlideInfo] = useState(DEFAULT_SLIDES);
  const [newSlide, setNewSlide] = useState({ key: '', label: '', labelAr: '', desc: '', masterLayout: 'titleAndContent' });

  // Layout banner images (one image per master layout type)
  type LayoutType = 'cover' | 'blank' | 'contentEmpty' | 'titleAndContent' | 'sectionTitle';
  const LAYOUT_KEYS: LayoutType[] = ['cover', 'blank', 'contentEmpty', 'titleAndContent', 'sectionTitle'];
  const [layoutImages, setLayoutImages] = useState<Record<LayoutType, string>>({ cover: '', blank: '', contentEmpty: '', titleAndContent: '', sectionTitle: '' });
  const [uploadingLayout, setUploadingLayout] = useState<Record<string, boolean>>({});

  // Per-slide background images
  const SLIDE_KEYS = ['titlePage', 'agenda', 'executiveSummary', 'weeklyProgress', 'nextWeek', 'milestones', 'risksAndChallenges'];
  const [slideImages, setSlideImages] = useState<Record<string, string>>(Object.fromEntries(SLIDE_KEYS.map(k => [k, ''])));
  const [uploadingSlide, setUploadingSlide] = useState<Record<string, boolean>>({});
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
        showVarianceIndicator: template.showVarianceIndicator ?? true,
        showProgressBars: template.showProgressBars ?? true,
        milestonesPerPage: template.milestonesPerPage || 10,
        risksPerPage: template.risksPerPage || 8,
        timelinePerPage: template.timelinePerPage || 10,
      });
      // Load layout banner images from template.header
      if (template.header) {
        setLayoutImages(prev => ({
          ...prev,
          ...Object.fromEntries(LAYOUT_KEYS.map(k => [k, (template.header as any)?.[k]?.imageUrl || ''])),
        }) as Record<LayoutType, string>);
      }
      // Load per-slide background images
      if ((template as any).slideImages) {
        setSlideImages(prev => ({
          ...prev,
          ...Object.fromEntries(SLIDE_KEYS.map(k => [k, ((template as any).slideImages)?.[k] || ''])),
        }));
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
      showVarianceIndicator: formValues.showVarianceIndicator,
      showProgressBars: formValues.showProgressBars,
      milestonesPerPage: formValues.milestonesPerPage,
      risksPerPage: formValues.risksPerPage,
      timelinePerPage: formValues.timelinePerPage,
      colors: { ...(template?.colors || DEFAULT_TEMPLATE.colors) },
      slides: { ...(template?.slides || DEFAULT_TEMPLATE.slides) },
      slideLayouts: Object.fromEntries(slideInfo.map(s => [s.key, s.masterLayout])),
      slideImages: { ...slideImages },
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
      showVarianceIndicator: DEFAULT_TEMPLATE.showVarianceIndicator,
      showProgressBars: DEFAULT_TEMPLATE.showProgressBars,
      milestonesPerPage: DEFAULT_TEMPLATE.milestonesPerPage,
      risksPerPage: DEFAULT_TEMPLATE.risksPerPage,
      timelinePerPage: DEFAULT_TEMPLATE.timelinePerPage,
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

  const handleLogoUpload = async (file: File, logoType: 'logoUrlLeft' | 'logoUrlRight') => {
    try {
      if (logoType === 'logoUrlLeft') setUploadingLeft(true);
      else setUploadingRight(true);
      const result = await api.uploadLogo(project.id, logoType, file);
      message.success('Logo uploaded successfully!');
      // Update form value
      form.setFieldValue(logoType, result.logoPath);
      queryClient.invalidateQueries({ queryKey: ['report-template', project.id] });
    } catch (err) {
      message.error('Logo upload failed');
    } finally {
      if (logoType === 'logoUrlLeft') setUploadingLeft(false);
      else setUploadingRight(false);
    }
  };

  const [uploadingLeft, setUploadingLeft] = useState(false);
  const [uploadingRight, setUploadingRight] = useState(false);

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

  // ---- Per-slide background image handlers ----
  const handleSlideImageUpload = async (slideKey: string, file: File) => {
    try {
      setUploadingSlide(prev => ({ ...prev, [slideKey]: true }));
      const result = await api.uploadSlideImage(project.id, slideKey, file);
      message.success('Slide image uploaded!');
      setSlideImages(prev => ({ ...prev, [slideKey]: result.imagePath }));
      queryClient.invalidateQueries({ queryKey: ['report-template', project.id] });
    } catch {
      message.error('Slide image upload failed');
    } finally {
      setUploadingSlide(prev => ({ ...prev, [slideKey]: false }));
    }
  };

  const handleSlideImageDelete = (slideKey: string) => {
    const updatedImages = { ...slideImages, [slideKey]: '' };
    setSlideImages(updatedImages);
    saveMutation.mutate({ slideImages: updatedImages });
    message.success('Slide image removed');
  };

  const handleLogoDelete = (logoType: 'logoUrlLeft' | 'logoUrlRight') => {
    form.setFieldValue(logoType, '');
    saveMutation.mutate({ [logoType]: '' });
    message.success('تم حذف الشعار بنجاح / Logo removed successfully');
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

  return (
    <div>
      {/* Header */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <FilePptOutlined style={{ fontSize: 24, color: '#0B4F6C' }} />
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  Report Template Settings
                </Title>
                <Text type="secondary">
                  إعدادات قالب التقرير - Customize PowerPoint report output
                </Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<EyeOutlined />}
                onClick={handlePreviewExport}
                loading={isExporting}
              >
                Preview Export
              </Button>
              <Button
                icon={<UndoOutlined />}
                onClick={handleReset}
              >
                Reset to Default
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={saveMutation.isPending}
              >
                Save Settings
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={16}>
        {/* LEFT COLUMN: General & Colors */}
        <Col xs={24} lg={12}>
          <Collapse
            defaultActiveKey={['general', 'colors']}
            style={{ marginBottom: 16 }}
            items={[
              {
                key: 'general',
                label: (
                  <Space>
                    <SettingOutlined />
                    <span>General Settings / الإعدادات العامة</span>
                  </Space>
                ),
                children: (
              <Form
                form={form}
                layout="vertical"
                onValuesChange={() => {}}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Company Name (English)"
                      name="companyName"
                    >
                      <Input placeholder="e.g., Your Company" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="اسم الشركة (عربي)"
                      name="companyNameAr"
                    >
                      <Input placeholder="مثال: شركتك" dir="rtl" />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  label="Left Logo / شعار يسار"
                  name="logoUrlLeft"
                >
                  <Space orientation="vertical" style={{ width: '100%' }}>
                    <Space>
                      <Upload
                        accept="image/*"
                        showUploadList={false}
                        customRequest={({ file }) => handleLogoUpload(file as File, 'logoUrlLeft')}
                        disabled={uploadingLeft}
                      >
                        <Button icon={<FileImageOutlined />} loading={uploadingLeft}>
                          رفع شعار يسار
                        </Button>
                      </Upload>
                      {(template?.logoUrlLeft || form.getFieldValue('logoUrlLeft')) && (
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleLogoDelete('logoUrlLeft')}
                        >
                          حذف الشعار
                        </Button>
                      )}
                    </Space>
                    {(template?.logoUrlLeft || form.getFieldValue('logoUrlLeft')) && (
                      <div style={{ marginTop: 4, padding: 8, border: '1px solid #d9d9d9', borderRadius: 4, background: '#fafafa', display: 'inline-block' }}>
                        <img
                          src={`http://localhost:5000${template?.logoUrlLeft || form.getFieldValue('logoUrlLeft')}`}
                          alt="Left Logo"
                          style={{ maxHeight: 48, maxWidth: 120 }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                  </Space>
                </Form.Item>
                <Form.Item
                  label="Right Logo / شعار يمين"
                  name="logoUrlRight"
                >
                  <Space orientation="vertical" style={{ width: '100%' }}>
                    <Space>
                      <Upload
                        accept="image/*"
                        showUploadList={false}
                        customRequest={({ file }) => handleLogoUpload(file as File, 'logoUrlRight')}
                        disabled={uploadingRight}
                      >
                        <Button icon={<FileImageOutlined />} loading={uploadingRight}>
                          رفع شعار يمين
                        </Button>
                      </Upload>
                      {(template?.logoUrlRight || form.getFieldValue('logoUrlRight')) && (
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleLogoDelete('logoUrlRight')}
                        >
                          حذف الشعار
                        </Button>
                      )}
                    </Space>
                    {(template?.logoUrlRight || form.getFieldValue('logoUrlRight')) && (
                      <div style={{ marginTop: 4, padding: 8, border: '1px solid #d9d9d9', borderRadius: 4, background: '#fafafa', display: 'inline-block' }}>
                        <img
                          src={`http://localhost:5000${template?.logoUrlRight || form.getFieldValue('logoUrlRight')}`}
                          alt="Right Logo"
                          style={{ maxHeight: 48, maxWidth: 120 }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                  </Space>
                </Form.Item>

                <Divider />

                <Form.Item
                  label="Logo Display / عرض الشعار"
                  name="logoRepeat"
                  initialValue={template?.logoRepeat || 'first'}
                >
                  <Radio.Group
                    onChange={(e) => saveMutation.mutate({ logoRepeat: e.target.value })}
                  >
                    <Radio.Button value="first">الصفحة الأولى فقط / First Page Only</Radio.Button>
                    <Radio.Button value="all">جميع الشرائح / All Slides</Radio.Button>
                  </Radio.Group>
                </Form.Item>

                <Form.Item
                  label="Report Language / لغة التقرير"
                  name="language"
                >
                  <Radio.Group>
                    <Radio.Button value="ar">العربية</Radio.Button>
                    <Radio.Button value="en">English</Radio.Button>
                    <Radio.Button value="bilingual">Bilingual / ثنائي اللغة</Radio.Button>
                  </Radio.Group>
                </Form.Item>

                <Divider />

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      label="Show Variance Indicator / مؤشر التباين"
                      name="showVarianceIndicator"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      label="Show Progress Bars / أشرطة التقدم"
                      name="showProgressBars"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item
                      label="Milestones Per Page"
                      name="milestonesPerPage"
                    >
                      <InputNumber min={5} max={20} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      label="Timeline Per Page"
                      name="timelinePerPage"
                    >
                      <InputNumber min={5} max={20} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      label="Risks Per Page"
                      name="risksPerPage"
                    >
                      <InputNumber min={3} max={15} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
                ),
              },
              {
                key: 'colors',
                label: (
                  <Space>
                    <BgColorsOutlined />
                    <span>Color Theme / ألوان القالب</span>
                  </Space>
                ),
                children: (
                  <>
              <Paragraph type="secondary" style={{ marginBottom: 16 }}>
                Click a color swatch to change it. Changes are saved automatically.
              </Paragraph>
              <Row gutter={[16, 16]}>
                {COLOR_FIELDS.map((cf) => (
                  <Col span={8} key={cf.key}>
                    <div style={{ textAlign: 'center' }}>
                      <Tooltip title={cf.labelAr}>
                        <ColorPicker
                          value={`#${currentColors[cf.key as keyof typeof currentColors] || '000000'}`}
                          onChange={(color) => handleColorChange(cf.key, color)}
                          showText
                          size="large"
                        />
                      </Tooltip>
                      <div style={{ marginTop: 4 }}>
                        <Text strong style={{ fontSize: 12 }}>{cf.label}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 11 }}>{cf.labelAr}</Text>
                      </div>
                    </div>
                  </Col>
                ))}
              </Row>

              {/* Color preview bar */}
              <div style={{ marginTop: 16 }}>
                <Text strong>Preview / معاينة:</Text>
                <div style={{
                  display: 'flex',
                  height: 32,
                  borderRadius: 6,
                  overflow: 'hidden',
                  marginTop: 8,
                }}>
                  {COLOR_FIELDS.map((cf) => (
                    <div
                      key={cf.key}
                      style={{
                        flex: 1,
                        backgroundColor: `#${currentColors[cf.key as keyof typeof currentColors] || '000000'}`,
                      }}
                    />
                  ))}
                </div>
                </div>
                  </>
                ),
              },
            ]}
          />
        </Col>

        {/* RIGHT COLUMN: Slides */}
        <Col xs={24} lg={12}>
          <Collapse
            defaultActiveKey={['slides']}
            style={{ marginBottom: 16 }}
            items={[{
              key: 'slides',
              label: (
                <Space>
                  <AppstoreOutlined />
                  <span>Slides / الشرائح</span>
                  <Tag color="blue">{enabledCount} / {slideInfo.length} enabled</Tag>
                </Space>
              ),
              children: (
                <>
              <Paragraph type="secondary" style={{ marginBottom: 16 }}>
                Toggle which slides appear in the generated PowerPoint report. Changes are saved automatically.
                <br />
                حدد الشرائح التي تظهر في تقرير PowerPoint. يتم الحفظ تلقائياً.
              </Paragraph>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {slideInfo.map((slide, idx) => {
                  const isEnabled = currentSlides[slide.key as keyof typeof currentSlides] ?? true;
                  return (
                    <Card
                      key={slide.key}
                      size="small"
                      style={{
                        borderLeft: `4px solid ${isEnabled ? '#0B4F6C' : '#d9d9d9'}`,
                        opacity: isEnabled ? 1 : 0.6,
                        transition: 'all 0.2s',
                      }}
                    >
                      <Row align="middle" justify="space-between">
                        <Col>
                          <Space>
                            <Tag
                              color={isEnabled ? 'blue' : 'default'}
                              style={{ minWidth: 28, textAlign: 'center' }}
                            >
                              {idx + 1}
                            </Tag>
                            <div>
                              <Text strong>{slide.label}</Text>
                              <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>
                                {slide.labelAr}
                              </Text>
                              <br />
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {slide.desc}
                              </Text>
                              <br />
                              <Select
                                size="small"
                                value={slide.masterLayout}
                                style={{ marginTop: 4, width: 160 }}
                                options={MASTER_LAYOUT_OPTIONS}
                                onChange={v => setSlideInfo(prev => prev.map(s => s.key === slide.key ? { ...s, masterLayout: v } : s))}
                              />
                            </div>
                          </Space>
                        </Col>
                        <Col>
                          <Switch
                            checked={isEnabled}
                            onChange={(checked) => handleSlideToggle(slide.key, checked)}
                          />
                        </Col>
                      </Row>
                    </Card>
                  );
                })}
                {/* Add new slide form */}
                <Card size="small" style={{ marginTop: 12, background: '#fafafa', border: '1px dashed #0B4F6C' }}>
                  <Row gutter={[8, 6]} align="middle">
                    <Col span={5}>
                      <Input
                        placeholder="Key"
                        value={newSlide.key}
                        onChange={e => setNewSlide({ ...newSlide, key: e.target.value })}
                        size="small"
                      />
                    </Col>
                    <Col span={5}>
                      <Input
                        placeholder="Label"
                        value={newSlide.label}
                        onChange={e => setNewSlide({ ...newSlide, label: e.target.value })}
                        size="small"
                      />
                    </Col>
                    <Col span={6}>
                      <Input
                        placeholder="Label (Ar)"
                        value={newSlide.labelAr}
                        onChange={e => setNewSlide({ ...newSlide, labelAr: e.target.value })}
                        size="small"
                      />
                    </Col>
                    <Col span={6}>
                      <Input
                        placeholder="Description"
                        value={newSlide.desc}
                        onChange={e => setNewSlide({ ...newSlide, desc: e.target.value })}
                        size="small"
                      />
                    </Col>
                    <Col span={2}>
                      <Button
                        icon={<PlusOutlined />}
                        size="small"
                        type="primary"
                        disabled={!newSlide.key || !newSlide.label}
                        onClick={() => {
                          setSlideInfo([...slideInfo, { ...newSlide }]);
                          setNewSlide({ key: '', label: '', labelAr: '', desc: '', masterLayout: 'titleAndContent' });
                        }}
                      >
                        إضافة
                      </Button>
                    </Col>
                    <Col span={24}>
                      <Select
                        size="small"
                        style={{ width: '100%' }}
                        placeholder="Master Layout"
                        value={newSlide.masterLayout}
                        onChange={v => setNewSlide({ ...newSlide, masterLayout: v })}
                        options={MASTER_LAYOUT_OPTIONS}
                      />
                    </Col>
                  </Row>
                </Card>
              </div>
                </>
              ),
            }]}
          />

          {/* Live preview mockup */}
          <Card
            title={
              <Space>
                <FileImageOutlined />
                <span>Slide Order Preview / ترتيب الشرائح</span>
              </Space>
            }
            size="small"
          >
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={({ active, over }) => {
                if (active.id !== over?.id) {
                  const oldIndex = slideInfo.findIndex(s => s.key === active.id);
                  const newIndex = slideInfo.findIndex(s => s.key === over?.id);
                  setSlideInfo(arrayMove(slideInfo, oldIndex, newIndex));
                }
              }}
            >
              <SortableContext
                items={slideInfo.filter(s => currentSlides[s.key as keyof typeof currentSlides] ?? true).map(s => s.key)}
                strategy={verticalListSortingStrategy}
              >
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                  minHeight: 80,
                }}>
                  {slideInfo.filter(s => currentSlides[s.key as keyof typeof currentSlides] ?? true).map((slide, idx) => (
                    <SortableSlide
                      key={slide.key}
                      id={slide.key}
                      idx={idx}
                      labelAr={slide.labelAr}
                      primaryColor={currentColors.primary}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            {/* ...existing code... */}
            {/* ...existing code... */}
          </Card>
        </Col>
      </Row>

      {/* Slide Background Images — per-slide overrides */}
      <div style={{ marginTop: 16 }}>
        <Title level={5} style={{ marginBottom: 12 }}>
          <Space><PictureOutlined /> Slide Background Images / خلفيات الشرائح</Space>
        </Title>
        <Paragraph type="secondary" style={{ marginTop: -8, marginBottom: 12, fontSize: 12 }}>
          Upload a full-page background image for each individual slide. Overrides the master layout background for that slide only. Recommended: <strong>1333 × 750 px</strong> (16:9).
        </Paragraph>
        <Row gutter={[12, 12]}>
          {slideInfo.map((slide) => {
            const imgUrl = slideImages[slide.key] || '';
            return (
              <Col xs={24} sm={12} md={8} lg={6} xl={4} key={slide.key}>
                <Card
                  size="small"
                  style={{ textAlign: 'center', borderTop: '3px solid', borderTopColor: `#${currentColors.primary || '0B4F6C'}` }}
                  styles={{ body: { padding: '10px 8px' } }}
                >
                  <div style={{ marginBottom: 6 }}>
                    <Tag color="blue" style={{ fontSize: 10 }}>{slide.label}</Tag>
                    <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{slide.labelAr}</div>
                  </div>
                  {imgUrl ? (
                    <div style={{ marginBottom: 8, padding: 4, border: '1px solid #d9d9d9', borderRadius: 4, background: '#fafafa', minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img
                        src={`http://localhost:5000${imgUrl}`}
                        alt={slide.label}
                        style={{ maxHeight: 48, maxWidth: '100%', objectFit: 'contain' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  ) : (
                    <div style={{ marginBottom: 8, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa', borderRadius: 4, border: '1px dashed #d9d9d9', color: '#bbb', fontSize: 11 }}>
                      No image
                    </div>
                  )}
                  <Space direction="vertical" style={{ width: '100%' }} size={4}>
                    <Upload
                      accept="image/*"
                      showUploadList={false}
                      customRequest={({ file }) => handleSlideImageUpload(slide.key, file as File)}
                      disabled={uploadingSlide[slide.key]}
                    >
                      <Button icon={<PictureOutlined />} loading={uploadingSlide[slide.key]} size="small" style={{ width: '100%' }}>
                        Upload
                      </Button>
                    </Upload>
                    {imgUrl && (
                      <Button danger icon={<DeleteOutlined />} size="small" style={{ width: '100%' }} onClick={() => handleSlideImageDelete(slide.key)}>
                        Remove
                      </Button>
                    )}
                  </Space>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>

      {/* Master Layout Background Images (fallback defaults) */}
      <div style={{ marginTop: 16 }}>
        <Title level={5} style={{ marginBottom: 12 }}>
          <Space><PictureOutlined /> Master Layout Backgrounds / خلفيات التخطيطات الرئيسية</Space>
        </Title>
        <Paragraph type="secondary" style={{ marginTop: -8, marginBottom: 12, fontSize: 12 }}>
          Default background for each master layout type. Applied to all slides using that layout unless overridden above. Recommended: <strong>1333 × 750 px</strong> (16:9).
        </Paragraph>
        <Row gutter={[12, 12]}>
          {MASTER_LAYOUT_OPTIONS.map(({ value, label }) => {
            const lt = value as LayoutType;
            const imgUrl = layoutImages[lt];
            return (
              <Col xs={24} sm={12} md={8} lg={6} xl={4} key={lt}>
                <Card
                  size="small"
                  style={{ textAlign: 'center', borderTop: `3px solid`, borderTopColor: `var(--ant-color-primary, #0B4F6C)` }}
                  styles={{ body: { padding: '10px 8px' } }}
                >
                  <Tag color={MASTER_LAYOUT_COLORS[lt]} style={{ marginBottom: 8 }}>{label}</Tag>
                  {imgUrl ? (
                    <div style={{ marginBottom: 8, padding: 4, border: '1px solid #d9d9d9', borderRadius: 4, background: '#fafafa', minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img
                        src={`http://localhost:5000${imgUrl}`}
                        alt={label}
                        style={{ maxHeight: 48, maxWidth: '100%', objectFit: 'contain' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                  ) : (
                    <div style={{ marginBottom: 8, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa', borderRadius: 4, border: '1px dashed #d9d9d9', color: '#bbb', fontSize: 11 }}>
                      No image
                    </div>
                  )}
                  <Space direction="vertical" style={{ width: '100%' }} size={4}>
                    <Upload
                      accept="image/*"
                      showUploadList={false}
                      customRequest={({ file }) => handleLayoutImageUpload(lt, file as File)}
                      disabled={uploadingLayout[lt]}
                    >
                      <Button icon={<PictureOutlined />} loading={uploadingLayout[lt]} size="small" style={{ width: '100%' }}>
                        Upload
                      </Button>
                    </Upload>
                    {imgUrl && (
                      <Button danger icon={<DeleteOutlined />} size="small" style={{ width: '100%' }} onClick={() => handleLayoutImageDelete(lt)}>
                        Remove
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

}

// Sortable slide component for drag-and-drop
function SortableSlide({ id, idx, labelAr, primaryColor }: { id: string; idx: number; labelAr: string; primaryColor: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    width: 120,
    height: 70,
    backgroundColor: idx === 0 ? `#${primaryColor}` : '#f5f5f5',
    border: isDragging ? '2px dashed #1890ff' : '1px solid #d9d9d9',
    borderRadius: 4,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 9,
    color: idx === 0 ? '#fff' : '#333',
    padding: 4,
    textAlign: 'center' as const,
    cursor: 'grab',
    opacity: isDragging ? 0.7 : 1,
    transform: CSS.Transform.toString(transform),
    transition,
    boxShadow: isDragging ? '0 2px 8px #1890ff33' : undefined,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div style={{ fontWeight: 'bold', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
        <DragOutlined /> Slide {idx + 1}
      </div>
      <div>{labelAr}</div>
    </div>
  );
}
