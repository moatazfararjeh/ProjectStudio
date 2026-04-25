import RightDrawer from '../../components/RightDrawer';
import { useState, useMemo } from 'react';
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
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  DownloadOutlined,
  UploadOutlined,
  FileExcelOutlined,
  FilterOutlined,
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
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
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

  // Bulk delete
  const handleBulkDelete = () => {
    antdModal.confirm({
      title: t('common.confirmDelete'),
      icon: <ExclamationCircleOutlined />,
      content: `${selectedRowKeys.length} ${t('raid.itemsSelected')}`,
      onOk: async () => {
        for (const id of selectedRowKeys) {
          await api.deleteRAIDItem(id as string);
        }
        setSelectedRowKeys([]);
        queryClient.invalidateQueries({ queryKey: ['raid-items', project.id] });
        message.success(t('raid.deleteSuccess'));
      },
    });
  };

  // Filtered items
  const filteredItems = useMemo(() => {
    if (!typeFilter) return raidItems;
    return raidItems.filter((item: any) => item.type === typeFilter);
  }, [raidItems, typeFilter]);

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

  // Download Excel template — PGD RAID Log (4 sheets)
  const handleDownloadTemplate = async () => {
    try {
      const workbook = new ExcelJS.Workbook();

      const applyHeader = (ws: ExcelJS.Worksheet, headers: string[], bgColor: string, widths: number[]) => {
        ws.views = [{ state: 'frozen', ySplit: 1 }];
        ws.columns = headers.map((h, i) => ({ header: h, width: widths[i] || 20 }));
        const row = ws.getRow(1);
        row.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + bgColor } };
        row.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        row.height = 36;
        row.eachCell(cell => {
          cell.border = {
            top: { style: 'thin' }, bottom: { style: 'thin' },
            left: { style: 'thin' }, right: { style: 'thin' },
          };
        });
      };

      // ── Assumptions ──────────────────────────────────────────────────
      const wsA = workbook.addWorksheet('Assumptions');
      applyHeader(wsA, [
        '#', 'Raised Date', 'Raised By', 'Assumption / Action Description',
        'Type', 'Owner', 'Status', 'Dependency',
        'Due Date', 'Revised Due Date', 'Closed Date',
        'History Comments / Progress', 'Days Overdue', 'Status Flag',
      ], '1F4E79', [5, 14, 20, 45, 12, 20, 14, 20, 14, 16, 14, 40, 13, 14]);

      // ── Dependencies ─────────────────────────────────────────────────
      const wsD = workbook.addWorksheet('Dependencies');
      applyHeader(wsD, [
        'No.', 'Dependent Milestone/Task', 'Dependency', 'Dependency Owner Name',
        'Due Date', 'Original Committed Date', 'Status', 'Revised Due Date',
        'Actual Closing Date', 'Impact Sum (days)\n+ = Negative | - = Positive',
        'History Comments', 'Days Until Due', 'Status Flag',
      ], '375623', [5, 30, 40, 22, 14, 22, 14, 16, 18, 22, 40, 13, 14]);

      // ── Risks ─────────────────────────────────────────────────────────
      const wsR = workbook.addWorksheet('Risks');
      applyHeader(wsR, [
        '#', 'Risk Title', 'Responsibility', 'Raised Date', 'Impact Description',
        'Status', 'Priority', 'Impact', 'Probability', 'Mitigation Plan',
        'Mitigation Owner', 'History Comments', 'Closure Due Date',
        'Revised Closure Due Date', 'Actual Closure Date',
        'Risk Score', 'Risk Level', 'Days Open',
      ], '833C00', [5, 30, 20, 14, 40, 14, 12, 12, 14, 40, 20, 35, 16, 22, 18, 11, 12, 11]);

      // ── Issues ────────────────────────────────────────────────────────
      const wsI = workbook.addWorksheet('Issues');
      applyHeader(wsI, [
        'No.', 'Issue Title', 'Assigned To', 'Status', 'Impact',
        'Impact Phase/Milestone', 'Project Timeline Impact (+,- Days)',
        'Support Needed', 'Owner', 'History Comments',
        'Date Raised', 'Baseline Due Date', 'Revised Due Date',
        'Closure Date', 'Days Open', 'Days Overdue', 'Urgency',
      ], '7030A0', [5, 30, 20, 14, 12, 25, 22, 20, 20, 40, 14, 16, 14, 14, 11, 13, 14]);

      // suppress unused warnings
      void wsA; void wsD; void wsR; void wsI;

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PGD_RAID_Log_Template.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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

      // Build user lookup by email
      const userMap = new Map<string, string>();
      users.forEach((u: any) => {
        if (u.email) userMap.set(u.email.toLowerCase(), u.id);
      });

      const validStatuses  = ['OPEN', 'IN_PROGRESS', 'MITIGATED', 'CLOSED'];
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      const validImpacts   = ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH', 'CRITICAL'];
      const validProbs     = ['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'];

      const rows: any[] = [];
      const errors: string[] = [];

      const cellVal = (row: ExcelJS.Row, col: number): string => {
        const cell = row.getCell(col);
        const v = cell?.value;
        if (v === null || v === undefined) return '';
        if (v instanceof Date) return v.toISOString();
        if (typeof v === 'object') {
          if ('richText' in v) return (v as any).richText?.map((r: any) => r.text || '').join('').trim() || '';
          if ('text' in v) return (v as any).text?.toString().trim() || '';
          if ('result' in v) {
            const r = (v as any).result;
            if (r instanceof Date) return r.toISOString();
            if (typeof r === 'object' && r !== null && 'richText' in r) return (r as any).richText?.map((x: any) => x.text || '').join('').trim() || '';
            return r?.toString().trim() || '';
          }
          return '';
        }
        return v.toString().trim();
      };

      // Returns dayjs ISO string if the cell contains a valid date, otherwise ''
      const cellDate = (row: ExcelJS.Row, col: number): string => {
        const cell = row.getCell(col);
        const v = cell?.value;
        if (v === null || v === undefined) return '';
        if (v instanceof Date) return dayjs(v).isValid() ? dayjs(v).toISOString() : '';
        if (typeof v === 'object' && 'result' in v) {
          const r = (v as any).result;
          if (r instanceof Date) return dayjs(r).isValid() ? dayjs(r).toISOString() : '';
          const d = dayjs(r?.toString());
          return d.isValid() ? d.toISOString() : '';
        }
        const d = dayjs(v.toString().trim());
        return d.isValid() ? d.toISOString() : '';
      };

      // Detect format: PGD 4-sheet or legacy single-sheet
      const wsAssumptions  = workbook.getWorksheet('Assumptions');
      const wsDependencies = workbook.getWorksheet('Dependencies');
      const wsRisks        = workbook.getWorksheet('Risks');
      const wsIssues       = workbook.getWorksheet('Issues');
      const isPGDFormat    = wsAssumptions || wsDependencies || wsRisks || wsIssues;

      if (isPGDFormat) {
        // ── PGD 4-sheet format ────────────────────────────────────────
        // Assumptions: #(1) RaisedDate(2) RaisedBy(3) Description(4) Type(5)
        //              Owner(6) Status(7) Dependency(8) DueDate(9) RevisedDue(10) ClosedDate(11) Comments(12)
        if (wsAssumptions) {
          wsAssumptions.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            const raisedDate  = cellDate(row, 2);
            const description = cellVal(row, 4);
            const owner       = cellVal(row, 6);
            const status      = (cellVal(row, 7).toUpperCase() || 'OPEN');
            const dueDate     = cellDate(row, 9);
            const revisedDue  = cellDate(row, 10);
            const closedDate  = cellDate(row, 11);
            const comments    = cellVal(row, 12);
            if (!description) return;
            const data: any = {
              type: 'ASSUMPTION',
              title: description.substring(0, 100),
              description,
              status: validStatuses.includes(status) ? status : 'OPEN',
              priority: 'MEDIUM',
              projectId: project.id,
            };
            if (owner && userMap.has(owner.toLowerCase())) data.ownerId = userMap.get(owner.toLowerCase());
            if (comments) data.comments = comments;
            if (raisedDate)  data.identifiedDate    = raisedDate;
            if (dueDate)     data.targetDate        = dueDate;
            if (revisedDue)  data.revisedTargetDate = revisedDue;
            if (closedDate)  data.closedDate        = closedDate;
            rows.push(data);
          });
        }

        // Dependencies: No(1) Milestone(2) Dependency(3) OwnerName(4) DueDate(5)
        //               OriginalCommitted(6) Status(7) RevisedDue(8) ActualClose(9) ImpactSum(10) Comments(11)
        if (wsDependencies) {
          wsDependencies.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            const title            = cellVal(row, 2);
            const dependency       = cellVal(row, 3);
            const dueDate          = cellDate(row, 5);
            const originalCommitted= cellDate(row, 6);
            const status           = (cellVal(row, 7).toUpperCase() || 'OPEN');
            const revisedDue       = cellDate(row, 8);
            const closedDate       = cellDate(row, 9);
            const comments         = cellVal(row, 11);
            if (!title && !dependency) return;
            const data: any = {
              type: 'DEPENDENCY',
              title: title || dependency.substring(0, 100),
              description: dependency || title,
              status: validStatuses.includes(status) ? status : 'OPEN',
              priority: 'MEDIUM',
              projectId: project.id,
            };
            if (comments) data.comments = comments;
            if (originalCommitted) data.identifiedDate    = originalCommitted;
            if (dueDate)           data.targetDate        = dueDate;
            if (revisedDue)        data.revisedTargetDate = revisedDue;
            if (closedDate)        data.closedDate        = closedDate;
            rows.push(data);
          });
        }

        // Risks: #(1) Title(2) Responsibility(3) RaisedDate(4) ImpactDesc(5)
        //        Status(6) Priority(7) Impact(8) Probability(9) MitigationPlan(10)
        //        MitigationOwner(11) Comments(12) ClosureDue(13) RevisedClosure(14) ActualClosure(15)
        if (wsRisks) {
          wsRisks.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            const title            = cellVal(row, 2);
            const raisedDate       = cellDate(row, 4);
            const impactDesc       = cellVal(row, 5);
            const status           = (cellVal(row, 6).toUpperCase() || 'OPEN');
            const priority         = (cellVal(row, 7).toUpperCase() || 'MEDIUM');
            const impact           = cellVal(row, 8).toUpperCase();
            const probability      = cellVal(row, 9).toUpperCase();
            const mitigation       = cellVal(row, 10);
            const mitigationOwner  = cellVal(row, 11);
            const comments         = cellVal(row, 12);
            const closureDue       = cellDate(row, 13);
            const revisedClosure   = cellDate(row, 14);
            const actualClosure    = cellDate(row, 15);
            if (!title) return;
            const data: any = {
              type: 'RISK',
              title,
              description: impactDesc || title,
              status:   validStatuses.includes(status)    ? status    : 'OPEN',
              priority: validPriorities.includes(priority) ? priority  : 'MEDIUM',
              projectId: project.id,
            };
            if (impactDesc) data.impactDescription = impactDesc;
            if (impact      && validImpacts.includes(impact))     data.impact = impact;
            if (probability && validProbs.includes(probability))  data.probability = probability;
            if (mitigation) data.mitigation = mitigation;
            if (mitigationOwner && userMap.has(mitigationOwner.toLowerCase())) data.mitigationOwnerId = userMap.get(mitigationOwner.toLowerCase());
            if (comments) data.comments = comments;
            if (raisedDate)      data.identifiedDate    = raisedDate;
            if (closureDue)      data.targetDate        = closureDue;
            if (revisedClosure)  data.revisedTargetDate = revisedClosure;
            if (actualClosure)   data.closedDate        = actualClosure;
            rows.push(data);
          });
        }

        // Issues: No(1) Title(2) AssignedTo(3) Status(4) Impact(5)
        //         ImpactPhase(6) TimelineImpact(7) SupportNeeded(8) Owner(9) Comments(10)
        //         DateRaised(11) BaselineDue(12) RevisedDue(13) ClosureDate(14)
        if (wsIssues) {
          wsIssues.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            const title      = cellVal(row, 2);
            const assignedTo = cellVal(row, 3);
            const status     = (cellVal(row, 4).toUpperCase() || 'OPEN');
            const impact     = cellVal(row, 5).toUpperCase();
            const owner      = cellVal(row, 9);
            const comments   = cellVal(row, 10);
            const dateRaised = cellDate(row, 11);
            const baselineDue= cellDate(row, 12);
            const revisedDue = cellDate(row, 13);
            const closedDate = cellDate(row, 14);
            if (!title) return;
            const ownerEmail = owner.toLowerCase() || assignedTo.toLowerCase();
            const data: any = {
              type: 'ISSUE',
              title,
              description: title,
              status: validStatuses.includes(status) ? status : 'OPEN',
              priority: 'MEDIUM',
              projectId: project.id,
            };
            if (impact && validImpacts.includes(impact)) data.impact = impact;
            if (ownerEmail && userMap.has(ownerEmail)) data.ownerId = userMap.get(ownerEmail);
            if (comments) data.comments = comments;
            if (dateRaised)  data.identifiedDate    = dateRaised;
            if (baselineDue) data.targetDate        = baselineDue;
            if (revisedDue)  data.revisedTargetDate = revisedDue;
            if (closedDate)  data.closedDate        = closedDate;
            rows.push(data);
          });
        }
      } else {
        // ── Legacy single-sheet format ────────────────────────────────
        const worksheet = workbook.getWorksheet(1);
        if (!worksheet) {
          message.error(t('raid.importNoSheet'));
          setImporting(false);
          return;
        }
        const validTypes = ['RISK', 'ASSUMPTION', 'ISSUE', 'DEPENDENCY'];
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return;
          const type        = cellVal(row, 1).toUpperCase();
          const title       = cellVal(row, 2);
          const description = cellVal(row, 3);
          const status      = cellVal(row, 4).toUpperCase() || 'OPEN';
          const priority    = cellVal(row, 5).toUpperCase() || 'MEDIUM';
          const ownerEmail  = cellVal(row, 6).toLowerCase();
          const impactDescription = cellVal(row, 7);
          const impact      = cellVal(row, 8).toUpperCase();
          const probability = cellVal(row, 9).toUpperCase();
          const mitigation  = cellVal(row, 10);
          const mitigationOwnerEmail = cellVal(row, 11).toLowerCase();
          const targetDateStr = cellVal(row, 12);
          const comments    = cellVal(row, 13);
          if (!type || !title || !description) {
            if (type || title || description) errors.push(t('raid.importRowError', { row: rowNumber, reason: t('raid.importMissingRequired') }));
            return;
          }
          if (!validTypes.includes(type)) { errors.push(t('raid.importRowError', { row: rowNumber, reason: `Invalid type: ${type}` })); return; }
          if (status && !validStatuses.includes(status)) { errors.push(t('raid.importRowError', { row: rowNumber, reason: `Invalid status: ${status}` })); return; }
          if (priority && !validPriorities.includes(priority)) { errors.push(t('raid.importRowError', { row: rowNumber, reason: `Invalid priority: ${priority}` })); return; }
          if (impact && !validImpacts.includes(impact)) { errors.push(t('raid.importRowError', { row: rowNumber, reason: `Invalid impact: ${impact}` })); return; }
          if (probability && !validProbs.includes(probability)) { errors.push(t('raid.importRowError', { row: rowNumber, reason: `Invalid probability: ${probability}` })); return; }
          const data: any = { type, title, description, status, priority, projectId: project.id };
          if (ownerEmail && userMap.has(ownerEmail)) data.ownerId = userMap.get(ownerEmail);
          if (impactDescription) data.impactDescription = impactDescription;
          if (impact) data.impact = impact;
          if (probability) data.probability = probability;
          if (mitigation) data.mitigation = mitigation;
          if (mitigationOwnerEmail && userMap.has(mitigationOwnerEmail)) data.mitigationOwnerId = userMap.get(mitigationOwnerEmail);
          if (comments) data.comments = comments;
          if (targetDateStr) { const parsed = dayjs(targetDateStr); if (parsed.isValid()) data.targetDate = parsed.toISOString(); }
          rows.push(data);
        });
      } // end else (legacy single-sheet)

      if (rows.length === 0) {
        message.warning(t('raid.importNoData'));
        if (errors.length > 0) Modal.error({ title: t('raid.importErrors'), content: errors.join('\n'), width: 500 });
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

  // Export to Excel — PGD RAID Log Template (4 sheets)
  const handleExport = async () => {
    try {
      const blob = await api.exportRAIDLog(project.id);
      const url  = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href     = url;
      link.download = `RAID_${project.code}_${dayjs().format('YYYY-MM-DD')}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
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
        {/* Filter bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <Space>
            <FilterOutlined style={{ color: '#8c8c8c' }} />
            <Select
              allowClear
              placeholder={t('raid.filterByType')}
              style={{ width: 180 }}
              value={typeFilter}
              onChange={(v) => { setTypeFilter(v ?? null); setSelectedRowKeys([]); }}
            >
              <Select.Option value="RISK">{t('raid.type_risk')}</Select.Option>
              <Select.Option value="ISSUE">{t('raid.type_issue')}</Select.Option>
              <Select.Option value="ASSUMPTION">{t('raid.type_assumption')}</Select.Option>
              <Select.Option value="DEPENDENCY">{t('raid.type_dependency')}</Select.Option>
            </Select>
            {typeFilter && (
              <Button size="small" onClick={() => { setTypeFilter(null); setSelectedRowKeys([]); }}>
                {t('common.clearFilter')}
              </Button>
            )}
          </Space>
          {selectedRowKeys.length > 0 && (
            <Space>
              <span style={{ color: '#8c8c8c' }}>{selectedRowKeys.length} {t('raid.itemsSelected')}</span>
              <Button danger icon={<DeleteOutlined />} onClick={handleBulkDelete}>
                {t('common.deleteSelected')}
              </Button>
            </Space>
          )}
        </div>

        <Table
          dataSource={filteredItems}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys),
          }}
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
