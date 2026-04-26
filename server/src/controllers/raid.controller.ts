import { Response, NextFunction } from 'express';
import { z } from 'zod';
import ExcelJS from 'exceljs';
import prisma from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const raidSchema = z.object({
  projectId: z.string(),
  type: z.enum(['RISK', 'ASSUMPTION', 'ISSUE', 'DEPENDENCY']),
  title: z.string().min(2),
  description: z.string(),
  impact: z.enum(['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH', 'CRITICAL']).optional().nullable(),
  impactDescription: z.string().optional().nullable(),
  probability: z.enum(['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH']).optional().nullable(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'MITIGATED', 'CLOSED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  mitigation: z.string().optional().nullable(),
  mitigationOwnerId: z.string().optional().nullable(),
  ownerId: z.string().optional().nullable(),
  comments: z.string().optional().nullable(),
  linkedTaskId: z.string().optional().nullable(),
  identifiedDate: z.string().optional().nullable(),
  targetDate: z.string().optional().nullable(),
  revisedTargetDate: z.string().optional().nullable(),
  closedDate: z.string().optional().nullable(),
});

// Calculate risk score (1-25)
const calculateRiskScore = (impact?: string, probability?: string): number | null => {
  if (!impact || !probability) return null;
  
  const impactMap: Record<string, number> = {
    LOW: 1, MEDIUM: 2, HIGH: 3, VERY_HIGH: 4, CRITICAL: 5
  };
  const probMap: Record<string, number> = {
    VERY_LOW: 1, LOW: 2, MEDIUM: 3, HIGH: 4, VERY_HIGH: 5
  };
  
  return impactMap[impact] * probMap[probability];
};

export const getRAIDItems = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId, type, status } = req.query;

    const items = await prisma.rAIDItem.findMany({
      where: {
        ...(projectId && { projectId: projectId as string }),
        ...(type && { type: type as any }),
        ...(status && { status: status as any }),
      },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        mitigationOwner: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        project: {
          select: { id: true, name: true },
        },
        linkedTask: {
          select: { id: true, name: true, status: true },
        },
      },
      orderBy: [
        { riskScore: 'desc' },
        { identifiedDate: 'desc' },
      ],
    });

    res.json({
      status: 'success',
      data: { items },
    });
  } catch (error) {
    next(error);
  }
};

export const getRAIDItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const item = await prisma.rAIDItem.findUnique({
      where: { id: id as string },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, avatar: true, email: true },
        },
        mitigationOwner: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        project: {
          select: { id: true, name: true },
        },
        linkedTask: {
          select: { id: true, name: true, status: true },
        },
      },
    });

    if (!item) {
      throw new AppError('RAID item not found', 404);
    }

    res.json({
      status: 'success',
      data: { item },
    });
  } catch (error) {
    next(error);
  }
};

export const createRAIDItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = raidSchema.parse(req.body);

    const riskScore = data.type === 'RISK' 
      ? calculateRiskScore(data.impact, data.probability) 
      : null;

    const item = await prisma.rAIDItem.create({
      data: {
        ...data,
        ownerId: data.ownerId || req.user!.id,
        riskScore,
        ...(data.identifiedDate   && { identifiedDate:   new Date(data.identifiedDate) }),
        ...(data.targetDate       && { targetDate:       new Date(data.targetDate) }),
        ...(data.revisedTargetDate && { revisedTargetDate: new Date(data.revisedTargetDate) }),
        ...(data.closedDate       && { closedDate:       new Date(data.closedDate) }),
      },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        mitigationOwner: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        linkedTask: {
          select: { id: true, name: true, status: true },
        },
      },
    });

    res.status(201).json({
      status: 'success',
      data: { item },
    });
  } catch (error) {
    next(error);
  }
};

export const updateRAIDItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = req.body;

    console.log('[RAID Update] Received data:', JSON.stringify(data, null, 2));

    // Explicitly exclude relation fields and non-updateable fields
    const excludedFields = ['owner', 'project', 'id', 'createdAt', 'updatedAt', 'identifiedDate', 'projectId', 'closedDate', 'mitigationOwner', 'linkedTask'];
    
    // Filter out excluded fields
    const updateData: any = {};
    Object.keys(data).forEach(key => {
      if (!excludedFields.includes(key) && data[key] !== undefined) {
        updateData[key] = data[key];
      }
    });

    console.log('[RAID Update] Filtered data:', JSON.stringify(updateData, null, 2));

    // Recalculate risk score if impact or probability changed
    let riskScore;
    if (updateData.impact || updateData.probability) {
      const existing = await prisma.rAIDItem.findUnique({ where: { id: id as string } });
      riskScore = calculateRiskScore(
        updateData.impact || existing?.impact,
        updateData.probability || existing?.probability
      );
    }

    const item = await prisma.rAIDItem.update({
      where: { id: id as string },
      data: {
        ...updateData,
        ...(riskScore !== undefined && { riskScore }),
        ...(updateData.targetDate && { targetDate: new Date(updateData.targetDate) }),
        ...(updateData.revisedTargetDate && { revisedTargetDate: new Date(updateData.revisedTargetDate) }),
        ...(updateData.status === 'CLOSED' && !data.closedDate && { closedDate: new Date() }),
      },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        mitigationOwner: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        linkedTask: {
          select: { id: true, name: true, status: true },
        },
      },
    });

    res.json({
      status: 'success',
      data: { item },
    });
  } catch (error) {
    console.error('[RAID Update] Error:', error);
    next(error);
  }
};

export const deleteRAIDItem = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.rAIDItem.delete({
      where: { id: id as string },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// RAID Excel Export — PGD RAID Log Template
// ─────────────────────────────────────────────

const fmt = (date: Date | null | undefined): string => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const daysDiff = (from: Date | null | undefined, to: Date): number => {
  if (!from) return 0;
  return Math.floor((to.getTime() - new Date(from).getTime()) / 86_400_000);
};

const riskLevel = (score: number | null | undefined): string => {
  if (!score) return '';
  if (score >= 16) return 'Critical';
  if (score >= 9)  return 'High';
  if (score >= 4)  return 'Medium';
  return 'Low';
};

const riskLevelColor = (score: number | null | undefined): string => {
  if (!score) return 'FFFFFF';
  if (score >= 16) return 'FF0000';
  if (score >= 9)  return 'FF6600';
  if (score >= 4)  return 'FFCC00';
  return '92D050';
};

const statusFlag = (item: any, today: Date): string => {
  if (item.status === 'CLOSED') return 'Closed';
  if (item.targetDate && new Date(item.targetDate) < today) return 'Overdue';
  if (item.status === 'IN_PROGRESS') return 'In Progress';
  return 'Open';
};

const applyHeaderStyle = (row: ExcelJS.Row, bgColor: string) => {
  row.eachCell((cell) => {
    cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + bgColor } };
    cell.font   = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top:    { style: 'thin', color: { argb: 'FFDDDDDD' } },
      bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
      left:   { style: 'thin', color: { argb: 'FFDDDDDD' } },
      right:  { style: 'thin', color: { argb: 'FFDDDDDD' } },
    };
  });
  row.height = 36;
};

const applyDataRow = (row: ExcelJS.Row, isAlt: boolean) => {
  row.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill = isAlt
      ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } }
      : { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
    cell.alignment = { vertical: 'middle', wrapText: true };
    cell.border = {
      top:    { style: 'thin', color: { argb: 'FFDDDDDD' } },
      bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
      left:   { style: 'thin', color: { argb: 'FFDDDDDD' } },
      right:  { style: 'thin', color: { argb: 'FFDDDDDD' } },
    };
  });
  row.height = 20;
};

export const exportRAIDLog = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.query;
    if (!projectId) throw new AppError('projectId is required', 400);

    const project = await prisma.project.findUnique({
      where: { id: projectId as string },
      select: { name: true },
    });

    const items = await prisma.rAIDItem.findMany({
      where: { projectId: projectId as string },
      include: {
        owner:           { select: { firstName: true, lastName: true } },
        mitigationOwner: { select: { firstName: true, lastName: true } },
      },
      orderBy: { identifiedDate: 'asc' },
    });

    const today   = new Date();
    const wb      = new ExcelJS.Workbook();
    wb.creator    = 'EPM System';
    wb.created    = today;

    const ownerName  = (o: any) => o ? `${o.firstName} ${o.lastName}` : '';

    // ── Sheet 1: Assumptions ──────────────────────────────────────────
    const assumptions = items.filter(i => i.type === 'ASSUMPTION');
    const wsA = wb.addWorksheet('Assumptions');
    wsA.views = [{ state: 'frozen', ySplit: 1 }];

    const aHeaders = [
      '#', 'Raised Date', 'Raised By', 'Assumption / Action Description',
      'Type', 'Owner', 'Status', 'Dependency',
      'Due Date', 'Revised Due Date', 'Closed Date',
      'History Comments / Progress', 'Days Overdue', 'Status Flag',
    ];
    const aWidths = [5, 14, 20, 45, 12, 20, 14, 20, 14, 16, 14, 40, 13, 14];
    wsA.columns = aHeaders.map((h, i) => ({ header: h, width: aWidths[i] }));
    applyHeaderStyle(wsA.getRow(1), '1F4E79');

    assumptions.forEach((item, idx) => {
      const overdue = item.status !== 'CLOSED' && item.targetDate
        ? Math.max(0, daysDiff(today, new Date(item.targetDate)) * -1)
        : 0;
      const r = wsA.addRow([
        idx + 1,
        fmt(item.identifiedDate),
        ownerName(item.owner),
        item.description,
        '',                            // Type (sub-type — no field)
        ownerName(item.owner),
        item.status,
        '',                            // Dependency link — no field
        fmt(item.targetDate),
        fmt(item.revisedTargetDate),
        fmt(item.closedDate),
        item.comments || '',
        overdue > 0 ? overdue : '',
        statusFlag(item, today),
      ]);
      applyDataRow(r, idx % 2 === 1);
    });

    // ── Sheet 2: Dependencies ─────────────────────────────────────────
    const dependencies = items.filter(i => i.type === 'DEPENDENCY');
    const wsD = wb.addWorksheet('Dependencies');
    wsD.views = [{ state: 'frozen', ySplit: 1 }];

    const dHeaders = [
      'No.', 'Dependent Milestone/Task', 'Dependency', 'Dependency Owner Name',
      'Due Date', 'Original Committed Date', 'Status', 'Revised Due Date',
      'Actual Closing Date', 'Impact Sum (days)\n+ = Negative | - = Positive',
      'History Comments', 'Days Until Due', 'Status Flag',
    ];
    const dWidths = [5, 30, 40, 22, 14, 22, 14, 16, 18, 22, 40, 13, 14];
    wsD.columns = dHeaders.map((h, i) => ({ header: h, width: dWidths[i] }));
    applyHeaderStyle(wsD.getRow(1), '375623');

    dependencies.forEach((item, idx) => {
      const daysUntil = item.targetDate
        ? daysDiff(today, new Date(item.targetDate))
        : '';
      const r = wsD.addRow([
        idx + 1,
        item.title,
        item.description,
        ownerName(item.owner),
        fmt(item.targetDate),
        fmt(item.identifiedDate),
        item.status,
        fmt(item.revisedTargetDate),
        fmt(item.closedDate),
        '',                           // Impact Sum — no field
        item.comments || '',
        typeof daysUntil === 'number' ? daysUntil : '',
        statusFlag(item, today),
      ]);
      applyDataRow(r, idx % 2 === 1);
    });

    // ── Sheet 3: Risks ────────────────────────────────────────────────
    const risks = items.filter(i => i.type === 'RISK');
    const wsR = wb.addWorksheet('Risks');
    wsR.views = [{ state: 'frozen', ySplit: 1 }];

    const rHeaders = [
      '#', 'Risk Title', 'Responsibility', 'Raised Date', 'Impact Description',
      'Status', 'Priority', 'Impact', 'Probability', 'Mitigation Plan',
      'Mitigation Owner', 'History Comments', 'Closure Due Date',
      'Revised Closure Due Date', 'Actual Closure Date',
      'Risk Score', 'Risk Level', 'Days Open',
    ];
    const rWidths = [5, 30, 20, 14, 40, 14, 12, 12, 14, 40, 20, 35, 16, 22, 18, 11, 12, 11];
    wsR.columns = rHeaders.map((h, i) => ({ header: h, width: rWidths[i] }));
    applyHeaderStyle(wsR.getRow(1), '833C00');

    risks.forEach((item, idx) => {
      const daysOpen = daysDiff(item.identifiedDate, today);
      const score    = item.riskScore ?? null;
      const r = wsR.addRow([
        idx + 1,
        item.title,
        ownerName(item.owner),
        fmt(item.identifiedDate),
        item.impactDescription || item.description,
        item.status,
        item.priority,
        item.impact || '',
        item.probability || '',
        item.mitigation || '',
        ownerName(item.mitigationOwner),
        item.comments || '',
        fmt(item.targetDate),
        fmt(item.revisedTargetDate),
        fmt(item.closedDate),
        score ?? '',
        riskLevel(score),
        daysOpen,
      ]);
      applyDataRow(r, idx % 2 === 1);
      // Color risk score cell
      const scoreCell = r.getCell(16);
      const levelCell = r.getCell(17);
      const argb = 'FF' + riskLevelColor(score);
      scoreCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } };
      levelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } };
      scoreCell.font = { bold: true };
      levelCell.font = { bold: true };
    });

    // ── Sheet 4: Issues ───────────────────────────────────────────────
    const issues = items.filter(i => i.type === 'ISSUE');
    const wsI = wb.addWorksheet('Issues');
    wsI.views = [{ state: 'frozen', ySplit: 1 }];

    const iHeaders = [
      'No.', 'Issue Title', 'Assigned To', 'Status', 'Impact',
      'Impact Phase/Milestone', 'Project Timeline Impact (+,- Days)',
      'Support Needed', 'Owner', 'History Comments',
      'Date Raised', 'Baseline Due Date', 'Revised Due Date',
      'Closure Date', 'Days Open', 'Days Overdue', 'Urgency',
    ];
    const iWidths = [5, 30, 20, 14, 12, 25, 22, 20, 20, 40, 14, 16, 14, 14, 11, 13, 14];
    wsI.columns = iHeaders.map((h, i) => ({ header: h, width: iWidths[i] }));
    applyHeaderStyle(wsI.getRow(1), '7030A0');

    issues.forEach((item, idx) => {
      const daysOpen    = daysDiff(item.identifiedDate, today);
      const daysOverdue = item.status !== 'CLOSED' && item.targetDate
        ? Math.max(0, daysDiff(new Date(item.targetDate), today))
        : 0;
      const urgency =
        item.priority === 'CRITICAL' ? 'Critical' :
        item.priority === 'HIGH'     ? 'High'     :
        item.priority === 'MEDIUM'   ? 'Medium'   : 'Low';
      const r = wsI.addRow([
        idx + 1,
        item.title,
        ownerName(item.owner),
        item.status,
        item.impact || '',
        '',                           // Impact Phase/Milestone — no field
        '',                           // Project Timeline Impact — no field
        '',                           // Support Needed — no field
        ownerName(item.owner),
        item.comments || '',
        fmt(item.identifiedDate),
        fmt(item.targetDate),
        fmt(item.revisedTargetDate),
        fmt(item.closedDate),
        daysOpen,
        daysOverdue > 0 ? daysOverdue : '',
        urgency,
      ]);
      applyDataRow(r, idx % 2 === 1);
    });

    // ── Stream response ───────────────────────────────────────────────
    const safeName = (project?.name || 'Project').replace(/[^a-z0-9_\- ]/gi, '_');
    const filename = `RAID_Log_${safeName}_${today.toISOString().slice(0, 10)}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

    await wb.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};
