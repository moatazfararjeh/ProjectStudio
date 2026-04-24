import RightDrawer from '../../components/RightDrawer';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Space,
  Tag,
  App,
  Row,
  Col,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  DownloadOutlined,
  UploadOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import ExcelJS from 'exceljs';
import api from '../../lib/api';
import type { Project } from '../../types';

interface ProjectRAIDProps {
  project: Project;
}

export default function ProjectRAID({ project }: ProjectRAIDProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const { message, modal: antdModal } = App.useApp();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const selectedType = Form.useWatch('type', form);

  // Fields visibility per RAID type
  const showImpact = selectedType === 'RISK' || selectedType === 'ISSUE';
  const showProbability = selectedType === 'RISK';
  const showImpactDescription = selectedType === 'RISK' || selectedType === 'ISSUE';
  const showMitigation = selectedType === 'RISK' || selectedType === 'ISSUE';
  const showMitigationOwner = selectedType === 'RISK' || selectedType === 'ISSUE';

  // Fetch RAID items
  const { data: raidItems = [], isLoading } = useQuery({
    queryKey: ['raid-items', project.id],
    queryFn: () => api.getRAIDItems({ projectId: project.id }),
  });

  // Fetch users for owner selection
  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.getUsers(),
  });

  // Create RAID item
  const createMutation = useMutation({
    mutationFn: (data: any) => api.createRAIDItem(data),
    onSuccess: () => {
      message.success(t('raid.createSuccess'));
      queryClient.invalidateQueries({ queryKey: ['raid-items', project.id] });
      handleCancel();
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || t('common.error'));
    },
  });

  // Update RAID item
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.updateRAIDItem(id, data),
    onSuccess: () => {
      message.success(t('raid.updateSuccess'));
      queryClient.invalidateQueries({ queryKey: ['raid-items', project.id] });
      handleCancel();
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || t('common.error'));
    },
  });

  // Delete RAID item
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteRAIDItem(id),
    onSuccess: () => {
      message.success(t('raid.deleteSuccess'));
      queryClient.invalidateQueries({ queryKey: ['raid-items', project.id] });
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || t('common.error'));
    },
  });

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (record: any) => {
    setEditingItem(record);
    form.setFieldsValue({
      type: record.type,
      title: record.title,
      description: record.description,
      impactDescription: record.impactDescription,
      status: record.status,
      priority: record.priority,
      ownerId: record.owner?.id,
      mitigationOwnerId: record.mitigationOwner?.id,
      impact: record.impact,
      probability: record.probability,
      mitigation: record.mitigation,
      comments: record.comments,
      identifiedDate: record.identifiedDate ? dayjs(record.identifiedDate) : undefined,
      targetDate: record.targetDate ? dayjs(record.targetDate) : undefined,
      revisedTargetDate: record.revisedTargetDate ? dayjs(record.revisedTargetDate) : undefined,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    antdModal.confirm({
      title: t('common.confirmDelete'),
      icon: <ExclamationCircleOutlined />,
      onOk: () => deleteMutation.mutate(id),
    });
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      // Clear fields that are not relevant to the selected type
      const type = values.type;
      const isRiskOrIssue = type === 'RISK' || type === 'ISSUE';
      if (!isRiskOrIssue) {
        values.impact = null;
        values.impactDescription = null;
        values.mitigation = null;
        values.mitigationOwnerId = null;
      }
      if (type !== 'RISK') {
        values.probability = null;
      }

      const formData = {
        ...values,
        projectId: project.id,
        identifiedDate: values.identifiedDate?.toISOString(),
        targetDate: values.targetDate?.toISOString(),
        revisedTargetDate: values.revisedTargetDate?.toISOString(),
      };

      console.log('[RAID Form] Submitting data:', formData);

      if (editingItem) {
        updateMutation.mutate({ id: editingItem.id, data: formData });
      } else {
        createMutation.mutate(formData);
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // Download Excel template for import
  const handleDownloadTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet('RAID Import');

      if (t('dir') === 'rtl') {
        ws.views = [{ rightToLeft: true }];
      }

      // Column headers (must match import parser)
      const headers = [
        'Type*',
        'Title*',
        'Description*',
        'Status',
        'Priority',
        'Owner (Email)',
        'Impact Description',
        'Impact',
        'Probability',
        'Mitigation',
        'Mitigation Owner (Email)',
        'Target Date (YYYY-MM-DD)',
        'Comments',
      ];

      ws.addRow(headers);
      const headerRow = ws.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow.height = 28;

      // Column widths
      ws.columns = [
        { width: 18 }, { width: 35 }, { width: 40 }, { width: 15 },
        { width: 15 }, { width: 25 }, { width: 40 }, { width: 15 },
        { width: 15 }, { width: 40 }, { width: 25 }, { width: 20 },
        { width: 30 },
      ];

      // Data validation dropdowns
      const typeValidation = { type: 'list' as const, formulae: ['"RISK,ASSUMPTION,ISSUE,DEPENDENCY"'] };
      const statusValidation = { type: 'list' as const, formulae: ['"OPEN,IN_PROGRESS,MITIGATED,CLOSED"'] };
      const priorityValidation = { type: 'list' as const, formulae: ['"LOW,MEDIUM,HIGH,CRITICAL"'] };
      const impactValidation = { type: 'list' as const, formulae: ['"LOW,MEDIUM,HIGH,VERY_HIGH,CRITICAL"'] };
      const probValidation = { type: 'list' as const, formulae: ['"VERY_LOW,LOW,MEDIUM,HIGH,VERY_HIGH"'] };

      for (let row = 2; row <= 100; row++) {
        ws.getCell(`A${row}`).dataValidation = typeValidation;
        ws.getCell(`D${row}`).dataValidation = statusValidation;
        ws.getCell(`E${row}`).dataValidation = priorityValidation;
        ws.getCell(`H${row}`).dataValidation = impactValidation;
        ws.getCell(`I${row}`).dataValidation = probValidation;
      }

      // Add example rows
      ws.addRow(['RISK', 'Example Risk', 'Description of the risk', 'OPEN', 'HIGH', '', 'Impact details', 'HIGH', 'MEDIUM', 'Mitigation plan', '', '', '']);
      ws.addRow(['ISSUE', 'Example Issue', 'Description of the issue', 'OPEN', 'MEDIUM', '', 'Impact details', 'MEDIUM', '', 'Resolution plan', '', '', '']);
      ws.addRow(['ASSUMPTION', 'Example Assumption', 'Assumption description', 'OPEN', 'LOW', '', '', '', '', '', '', '', '']);
      ws.addRow(['DEPENDENCY', 'Example Dependency', 'Dependency description', 'OPEN', 'MEDIUM', '', '', '', '', '', '', '', '']);

      // Style example rows
      for (let r = 2; r <= 5; r++) {
        ws.getRow(r).font = { italic: true, color: { argb: 'FF888888' } };
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `RAID_Import_Template.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Template download failed:', error);
      message.error(t('common.exportFailed'));
    }
  };

  // Import from Excel
  const handleImportExcel = async (file: File) => {
    setImporting(true);
    setImportProgress({ current: 0, total: 0 });

    try {
      const workbook = new ExcelJS.Workbook();
      const arrayBuffer = await file.arrayBuffer();
      await workbook.xlsx.load(arrayBuffer);

      const worksheet = workbook.getWorksheet(1);
      if (!worksheet) {
        message.error(t('raid.importNoSheet'));
        setImporting(false);
        return;
      }

      // Build user lookup by email
      const userMap = new Map<string, string>();
      users.forEach((u: any) => {
        if (u.email) userMap.set(u.email.toLowerCase(), u.id);
      });

      const validTypes = ['RISK', 'ASSUMPTION', 'ISSUE', 'DEPENDENCY'];
      const validStatuses = ['OPEN', 'IN_PROGRESS', 'MITIGATED', 'CLOSED'];
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      const validImpacts = ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH', 'CRITICAL'];
      const validProbs = ['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'];

      const rows: any[] = [];
      const errors: string[] = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header

        const cellVal = (col: number) => {
          const cell = row.getCell(col);
          const v = cell?.value;
          if (v === null || v === undefined) return '';
          if (typeof v === 'object' && 'text' in v) return (v as any).text?.toString().trim() || '';
          if (typeof v === 'object' && 'result' in v) return (v as any).result?.toString().trim() || '';
          return v.toString().trim();
        };

        const type = cellVal(1).toUpperCase();
        const title = cellVal(2);
        const description = cellVal(3);
        const status = cellVal(4).toUpperCase() || 'OPEN';
        const priority = cellVal(5).toUpperCase() || 'MEDIUM';
        const ownerEmail = cellVal(6).toLowerCase();
        const impactDescription = cellVal(7);
        const impact = cellVal(8).toUpperCase();
        const probability = cellVal(9).toUpperCase();
        const mitigation = cellVal(10);
        const mitigationOwnerEmail = cellVal(11).toLowerCase();
        const targetDateStr = cellVal(12);
        const comments = cellVal(13);

        // Validate required fields
        if (!type || !title || !description) {
          if (type || title || description) {
            errors.push(t('raid.importRowError', { row: rowNumber, reason: t('raid.importMissingRequired') }));
          }
          return; // Skip blank rows silently
        }

        if (!validTypes.includes(type)) {
          errors.push(t('raid.importRowError', { row: rowNumber, reason: `Invalid type: ${type}` }));
          return;
        }
        if (status && !validStatuses.includes(status)) {
          errors.push(t('raid.importRowError', { row: rowNumber, reason: `Invalid status: ${status}` }));
          return;
        }
        if (priority && !validPriorities.includes(priority)) {
          errors.push(t('raid.importRowError', { row: rowNumber, reason: `Invalid priority: ${priority}` }));
          return;
        }
        if (impact && !validImpacts.includes(impact)) {
          errors.push(t('raid.importRowError', { row: rowNumber, reason: `Invalid impact: ${impact}` }));
          return;
        }
        if (probability && !validProbs.includes(probability)) {
          errors.push(t('raid.importRowError', { row: rowNumber, reason: `Invalid probability: ${probability}` }));
          return;
        }

        const data: any = {
          type,
          title,
          description,
          status,
          priority,
          projectId: project.id,
        };

        if (ownerEmail && userMap.has(ownerEmail)) data.ownerId = userMap.get(ownerEmail);
        if (impactDescription) data.impactDescription = impactDescription;
        if (impact) data.impact = impact;
        if (probability) data.probability = probability;
        if (mitigation) data.mitigation = mitigation;
        if (mitigationOwnerEmail && userMap.has(mitigationOwnerEmail)) data.mitigationOwnerId = userMap.get(mitigationOwnerEmail);
        if (comments) data.comments = comments;
        if (targetDateStr) {
          const parsed = dayjs(targetDateStr);
          if (parsed.isValid()) data.targetDate = parsed.toISOString();
        }

        rows.push(data);
      });

      if (rows.length === 0) {
        message.warning(t('raid.importNoData'));
        if (errors.length > 0) {
          Modal.error({ title: t('raid.importErrors'), content: errors.join('\n'), width: 500 });
        }
        setImporting(false);
        return;
      }

      setImportProgress({ current: 0, total: rows.length });

      let successCount = 0;
      let failCount = 0;

      for (let i = 0; i < rows.length; i++) {
        try {
          await api.createRAIDItem(rows[i]);
          successCount++;
        } catch (err: any) {
          failCount++;
          errors.push(t('raid.importRowError', { row: i + 2, reason: err?.response?.data?.message || 'API error' }));
        }
        setImportProgress({ current: i + 1, total: rows.length });
      }

      queryClient.invalidateQueries({ queryKey: ['raid-items', project.id] });

      if (errors.length > 0) {
        Modal.warning({
          title: t('raid.importPartial', { success: successCount, fail: failCount }),
          content: (
            <div style={{ maxHeight: 300, overflow: 'auto' }}>
              {errors.map((e, i) => <div key={i} style={{ color: '#cf1322', marginBottom: 4 }}>{e}</div>)}
            </div>
          ),
          width: 600,
        });
      } else {
        message.success(t('raid.importSuccess', { count: successCount }));
      }
    } catch (error) {
      console.error('Import failed:', error);
      message.error(t('raid.importFailed'));
    } finally {
      setImporting(false);
      setImportProgress({ current: 0, total: 0 });
    }
  };

  // Calculate statistics
  const openRisks = raidItems.filter(
    (item: any) => item.type === 'RISK' && item.status !== 'CLOSED'
  ).length;
  const openIssues = raidItems.filter(
    (item: any) => item.type === 'ISSUE' && item.status !== 'CLOSED'
  ).length;
  const assumptions = raidItems.filter((item: any) => item.type === 'ASSUMPTION').length;
  const dependencies = raidItems.filter((item: any) => item.type === 'DEPENDENCY').length;

  // Export to Excel
  const handleExport = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(t('raid.raidLog'));

      // Set RTL if Arabic
      if (t('dir') === 'rtl') {
        worksheet.views = [{ rightToLeft: true }];
      }

      // Add title
      worksheet.mergeCells('A1:M1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = `${t('raid.raidLog')} - ${project.name}`;
      titleCell.font = { size: 16, bold: true };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1890FF' },
      };
      titleCell.font = { ...titleCell.font, color: { argb: 'FFFFFFFF' } };
      worksheet.getRow(1).height = 30;

      // Add statistics
      worksheet.mergeCells('A2:M2');
      const statsCell = worksheet.getCell('A2');
      statsCell.value = `${t('raid.openRisks')}: ${openRisks} | ${t('raid.openIssues')}: ${openIssues} | ${t('raid.assumptions')}: ${assumptions} | ${t('raid.dependencies')}: ${dependencies}`;
      statsCell.alignment = { horizontal: 'center', vertical: 'middle' };
      statsCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0F0F0' },
      };
      worksheet.getRow(2).height = 25;

      // Add headers
      const headers = [
        t('raid.type'),
        t('raid.title'),
        t('raid.responsibility'),
        t('raid.raisedDate'),
        t('raid.impactDescription'),
        t('raid.status'),
        t('common.priority'),
        t('raid.impact'),
        t('raid.probability'),
        t('raid.mitigation'),
        t('raid.mitigationOwner'),
        t('raid.closureDueDate'),
        t('raid.revisedClosureDate'),
      ];

      worksheet.addRow(headers);
      const headerRow = worksheet.getRow(3);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF4472C4' },
      };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow.height = 25;

      // Add data
      raidItems.forEach((item: any) => {
        worksheet.addRow([
          t(`raid.type_${item.type.toLowerCase()}`),
          item.title,
          item.owner?.firstName + ' ' + item.owner?.lastName || '-',
          item.identifiedDate ? dayjs(item.identifiedDate).format('YYYY-MM-DD') : '-',
          item.impactDescription || '-',
          t(`raid.status_${item.status.toLowerCase()}`),
          item.priority ? t(`common.${item.priority.toLowerCase()}`) : '-',
          item.impact ? t(`raid.impact_${item.impact.toLowerCase()}`) : '-',
          item.probability ? t(`raid.probability_${item.probability.toLowerCase()}`) : '-',
          item.mitigation || '-',
          item.mitigationOwner?.firstName + ' ' + item.mitigationOwner?.lastName || '-',
          item.targetDate ? dayjs(item.targetDate).format('YYYY-MM-DD') : '-',
          item.revisedTargetDate ? dayjs(item.revisedTargetDate).format('YYYY-MM-DD') : '-',
        ]);
      });

      // Set column widths
      worksheet.columns = [
        { width: 15 },  // Type
        { width: 30 },  // Title
        { width: 20 },  // Responsibility
        { width: 15 },  // Raised Date
        { width: 40 },  // Impact Description
        { width: 15 },  // Status
        { width: 12 },  // Priority
        { width: 15 },  // Impact
        { width: 15 },  // Probability
        { width: 40 },  // Mitigation
        { width: 20 },  // Mitigation Owner
        { width: 15 },  // Closure Due Date
        { width: 15 },  // Revised Closure Date
      ];

      // Add borders to all cells
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 2) {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' },
            };
            cell.alignment = { vertical: 'middle', wrapText: true };
          });
        }
      });

      // Generate file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `RAID_${project.code}_${dayjs().format('YYYY-MM-DD')}.xlsx`;
      link.click();
      window.URL.revokeObjectURL(url);

      message.success(t('common.exportSuccess'));
    } catch (error) {
      console.error('Export failed:', error);
      message.error(t('common.exportFailed'));
    }
  };

  const columns = [
    {
      title: t('raid.title'),
      dataIndex: 'title',
      key: 'title',
    },
    {
      title: t('raid.type'),
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const colors: any = {
          RISK: 'red',
          ISSUE: 'orange',
          ASSUMPTION: 'blue',
          DEPENDENCY: 'purple',
        };
        return <Tag color={colors[type]}>{t(`raid.type_${type.toLowerCase()}`)}</Tag>;
      },
    },
    {
      title: t('raid.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: any = {
          OPEN: 'blue',
          IN_PROGRESS: 'orange',
          RESOLVED: 'green',
          CLOSED: 'gray',
        };
        return <Tag color={colors[status]}>{t(`raid.status_${status.toLowerCase()}`)}</Tag>;
      },
    },
    {
      title: t('raid.impact'),
      dataIndex: 'impact',
      key: 'impact',
      render: (impact: string) => {
        const colors: any = {
          CRITICAL: 'red',
          VERY_HIGH: 'volcano',
          HIGH: 'orange',
          MEDIUM: 'gold',
          LOW: 'blue',
        };
        return impact ? <Tag color={colors[impact]}>{t(`raid.impact_${impact.toLowerCase()}`)}</Tag> : '-';
      },
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title={t('raid.openRisks')}
              value={openRisks}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={t('raid.openIssues')}
              value={openIssues}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={t('raid.assumptions')}
              value={assumptions}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={t('raid.dependencies')}
              value={dependencies}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {importing && (
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FileExcelOutlined style={{ fontSize: 24, color: '#52c41a' }} />
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 4 }}>{t('raid.importing')} ({importProgress.current}/{importProgress.total})</div>
              <div style={{ width: '100%', height: 8, backgroundColor: '#f0f0f0', borderRadius: 4 }}>
                <div style={{
                  width: `${importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}%`,
                  height: '100%',
                  backgroundColor: '#52c41a',
                  borderRadius: 4,
                  transition: 'width 0.3s',
                }} />
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card
        title={t('raid.raidLog')}
        extra={
          <Space>
            <Button icon={<FileExcelOutlined />} onClick={handleDownloadTemplate}>
              {t('raid.downloadTemplate')}
            </Button>
            <Button
              icon={<UploadOutlined />}
              loading={importing}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.xlsx,.xls';
                input.onchange = (e: any) => {
                  const file = e.target.files?.[0];
                  if (file) handleImportExcel(file);
                };
                input.click();
              }}
            >
              {t('common.import')}
            </Button>
            <Button icon={<DownloadOutlined />} onClick={handleExport}>
              {t('common.export')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              {t('raid.new')}
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={raidItems}
          columns={columns}
          rowKey="id"
          loading={isLoading}
        />
      </Card>

      <RightDrawer
        title={editingItem ? t('raid.editItem') : t('raid.addItem')}
        open={isModalOpen}
        onSubmit={handleSubmit}
        onClose={handleCancel}
        width={560}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        submitText={editingItem ? t('common.save') : t('raid.addItem')}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="type"
            label={t('raid.type')}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Select>
              <Select.Option value="RISK">{t('raid.type_risk')}</Select.Option>
              <Select.Option value="ISSUE">{t('raid.type_issue')}</Select.Option>
              <Select.Option value="ASSUMPTION">{t('raid.type_assumption')}</Select.Option>
              <Select.Option value="DEPENDENCY">{t('raid.type_dependency')}</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label={t('raid.title')}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="description" label={t('raid.description')}>
            <Input.TextArea rows={4} />
          </Form.Item>

          {showImpactDescription && (
            <Form.Item name="impactDescription" label={t('raid.impactDescription')}>
              <Input.TextArea rows={3} placeholder={t('raid.impactDescriptionPlaceholder')} />
            </Form.Item>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label={t('raid.status')}
                rules={[{ required: true, message: t('common.required') }]}
              >
                <Select>
                  <Select.Option value="OPEN">{t('raid.status_open')}</Select.Option>
                  <Select.Option value="IN_PROGRESS">{t('raid.status_in_progress')}</Select.Option>
                  <Select.Option value="RESOLVED">{t('raid.status_resolved')}</Select.Option>
                  <Select.Option value="CLOSED">{t('raid.status_closed')}</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label={t('common.priority')}>
                <Select>
                  <Select.Option value="LOW">{t('common.low')}</Select.Option>
                  <Select.Option value="MEDIUM">{t('common.medium')}</Select.Option>
                  <Select.Option value="HIGH">{t('common.high')}</Select.Option>
                  <Select.Option value="CRITICAL">{t('common.critical')}</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={showMitigationOwner ? 12 : 24}>
              <Form.Item name="ownerId" label={t('raid.responsibility')}>
                <Select
                  showSearch
                  placeholder={t('raid.responsibilityPlaceholder')}
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={users.map((user: any) => ({
                    value: user.id,
                    label: `${user.firstName} ${user.lastName}`,
                  }))}
                />
              </Form.Item>
            </Col>
            {showMitigationOwner && (
              <Col span={12}>
                <Form.Item name="mitigationOwnerId" label={t('raid.mitigationOwner')}>
                  <Select
                    showSearch
                    placeholder={t('raid.mitigationOwnerPlaceholder')}
                    filterOption={(input, option) =>
                      (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={users.map((user: any) => ({
                      value: user.id,
                      label: `${user.firstName} ${user.lastName}`,
                    }))}
                  />
                </Form.Item>
              </Col>
            )}
          </Row>

          {(showImpact || showProbability) && (
            <Row gutter={16}>
              {showImpact && (
                <Col span={showProbability ? 12 : 24}>
                  <Form.Item name="impact" label={t('raid.impact')}>
                    <Select>
                      <Select.Option value="LOW">{t('raid.impact_low')}</Select.Option>
                      <Select.Option value="MEDIUM">{t('raid.impact_medium')}</Select.Option>
                      <Select.Option value="HIGH">{t('raid.impact_high')}</Select.Option>
                      <Select.Option value="VERY_HIGH">{t('raid.impact_very_high')}</Select.Option>
                      <Select.Option value="CRITICAL">{t('raid.impact_critical')}</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              )}
              {showProbability && (
                <Col span={showImpact ? 12 : 24}>
                  <Form.Item name="probability" label={t('raid.probability')}>
                    <Select>
                      <Select.Option value="VERY_LOW">{t('raid.probability_very_low')}</Select.Option>
                      <Select.Option value="LOW">{t('raid.probability_low')}</Select.Option>
                      <Select.Option value="MEDIUM">{t('raid.probability_medium')}</Select.Option>
                      <Select.Option value="HIGH">{t('raid.probability_high')}</Select.Option>
                      <Select.Option value="VERY_HIGH">{t('raid.probability_very_high')}</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
              )}
            </Row>
          )}

          {showMitigation && (
            <Form.Item name="mitigation" label={t('raid.mitigation')}>
              <Input.TextArea rows={3} />
            </Form.Item>
          )}

          <Form.Item name="comments" label={t('raid.comments')}>
            <Input.TextArea rows={2} placeholder={t('raid.commentsPlaceholder')} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="identifiedDate" label={t('raid.raisedDate')}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="targetDate" label={t('raid.closureDueDate')}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="revisedTargetDate" label={t('raid.revisedClosureDate')}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </RightDrawer>
    </div>
  );
}
