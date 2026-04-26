import { Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';
import { generateWeeklyReportPPT } from '../utils/pptGenerator';
import { DEFAULT_REPORT_TEMPLATE, HF_LAYOUT_KEYS, HeaderFooterLayoutConfig } from '../utils/reportTemplateConfig';
import { extractDocxTheme } from '../utils/docxThemeExtractor';
import fs from 'fs';
import path from 'path';

/** GET /reports/template/:projectId — get report template config for a project */
export const getReportTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.projectId as string;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, settings: true },
    });

    if (!project) throw new AppError('Project not found', 404);

    const settings = (project.settings as any) || {};
    const template = { ...DEFAULT_REPORT_TEMPLATE, ...settings.reportTemplate };

    res.json({
      status: 'success',
      data: { template },
    });
  } catch (error) {
    next(error);
  }
};

/** PUT /reports/template/:projectId — update report template config for a project */
export const updateReportTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.projectId as string;
    const templateData = req.body;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, settings: true },
    });

    if (!project) throw new AppError('Project not found', 404);

    const currentSettings = (project.settings as any) || {};
    const updatedSettings = {
      ...currentSettings,
      reportTemplate: {
        ...DEFAULT_REPORT_TEMPLATE,
        ...currentSettings.reportTemplate,
        ...templateData,
        // Deep merge colors and slides
        colors: {
          ...DEFAULT_REPORT_TEMPLATE.colors,
          ...(currentSettings.reportTemplate?.colors || {}),
          ...(templateData.colors || {}),
        },
        slides: {
          ...DEFAULT_REPORT_TEMPLATE.slides,
          ...(currentSettings.reportTemplate?.slides || {}),
          ...(templateData.slides || {}),
        },
        // Deep merge header (5 master layout keys)
        header: Object.fromEntries(
          HF_LAYOUT_KEYS.map(k => [k, {
            ...(DEFAULT_REPORT_TEMPLATE.header as any)[k],
            ...((currentSettings.reportTemplate?.header as any)?.[k] || {}),
            ...((templateData.header as any)?.[k] || {}),
          }])
        ) as HeaderFooterLayoutConfig,
        // Deep merge footer (5 master layout keys)
        footer: Object.fromEntries(
          HF_LAYOUT_KEYS.map(k => [k, {
            ...(DEFAULT_REPORT_TEMPLATE.footer as any)[k],
            ...((currentSettings.reportTemplate?.footer as any)?.[k] || {}),
            ...((templateData.footer as any)?.[k] || {}),
          }])
        ) as HeaderFooterLayoutConfig,
      },
    };

    await prisma.project.update({
      where: { id: projectId },
      data: { settings: updatedSettings },
    });

    res.json({
      status: 'success',
      data: { template: updatedSettings.reportTemplate },
    });
  } catch (error) {
    next(error);
  }
};

export const getReports = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId, type } = req.query;

    const reports = await prisma.report.findMany({
      where: {
        ...(projectId && { projectId: projectId as string }),
        ...(type && { type: type as any }),
      },
      include: {
        generatedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      status: 'success',
      data: { reports },
    });
  } catch (error) {
    next(error);
  }
};

export const getReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const report = await prisma.report.findUnique({
      where: { id: id as string },
      include: {
        generatedBy: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        project: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    if (!report) {
      throw new AppError('Report not found', 404);
    }

    res.json({
      status: 'success',
      data: { report },
    });
  } catch (error) {
    next(error);
  }
};

export const generateWeeklyReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId, period } = req.body; // period: "2024-W01"

    // Get project data
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        manager: true,
        tasks: {
          include: {
            assignedTo: true,
          },
        },
        worklogs: {
          where: {
            // Filter by week (simplified - you'd use proper date range)
          },
          include: { user: true },
        },
        raidItems: {
          where: {
            status: { in: ['OPEN', 'IN_PROGRESS'] },
          },
          orderBy: { riskScore: 'desc' },
        },
      },
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    // Calculate metrics
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(t => t.status === 'COMPLETED').length;
    const inProgressTasks = project.tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const overdueTasks = project.tasks.filter(t => 
      t.status !== 'COMPLETED' && new Date(t.endDate) < new Date()
    ).length;

    const totalPlannedHours = project.tasks.reduce((sum, t) => sum + (t.plannedHours || 0), 0);
    const totalActualHours = project.tasks.reduce((sum, t) => sum + t.actualHours, 0);

    const topRisks = project.raidItems
      .filter(r => r.type === 'RISK')
      .slice(0, 5);

    const reportContent = {
      period,
      summary: {
        progress: project.progress,
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        totalPlannedHours,
        totalActualHours,
      },
      accomplishments: {
        completed: project.tasks
          .filter(t => t.status === 'COMPLETED')
          .map(t => ({ id: t.id, name: t.name })),
      },
      upcomingTasks: {
        planned: project.tasks
          .filter(t => t.status === 'NOT_STARTED')
          .slice(0, 10)
          .map(t => ({ id: t.id, name: t.name, startDate: t.startDate })),
      },
      risks: topRisks.map(r => ({
        id: r.id,
        title: r.title,
        riskScore: r.riskScore,
        status: r.status,
      })),
      issues: project.raidItems
        .filter(r => r.type === 'ISSUE' && r.status !== 'CLOSED')
        .map(r => ({ id: r.id, title: r.title, priority: r.priority })),
    };

    const report = await prisma.report.create({
      data: {
        projectId,
        type: 'WEEKLY',
        period,
        title: `Weekly Report - ${project.name} - ${period}`,
        content: reportContent,
        generatedById: req.user!.id,
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });

    res.status(201).json({
      status: 'success',
      data: { report },
    });
  } catch (error) {
    next(error);
  }
};

export const generateMonthlyReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId, period } = req.body; // period: "2024-01"

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        manager: true,
        tasks: true,
        worklogs: true,
        raidItems: true,
      },
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    // Calculate comprehensive metrics
    const totalBudget = project.budget || project.price;
    const totalSpent = 0; // Would calculate from rate cards + worklogs

    const reportContent = {
      period,
      executive: {
        overview: `Project ${project.name} is ${project.progress}% complete.`,
        status: project.status,
        progress: project.progress,
      },
      milestones: {
        achieved: [],
        upcoming: [],
      },
      kpis: {
        scheduleVariance: 0, // Calculate based on baseline
        costVariance: totalBudget - totalSpent,
        budgetUtilization: (totalSpent / totalBudget) * 100,
      },
      raid: {
        activeRisks: project.raidItems.filter(r => r.type === 'RISK' && r.status !== 'CLOSED').length,
        activeIssues: project.raidItems.filter(r => r.type === 'ISSUE' && r.status !== 'CLOSED').length,
      },
      resources: {
        teamSize: project.tasks.reduce((acc, t) => {
          if (t.assignedToId) acc.add(t.assignedToId);
          return acc;
        }, new Set()).size,
      },
    };

    const report = await prisma.report.create({
      data: {
        projectId,
        type: 'MONTHLY',
        period,
        title: `Monthly Report - ${project.name} - ${period}`,
        content: reportContent,
        generatedById: req.user!.id,
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
      },
    });

    res.status(201).json({
      status: 'success',
      data: { report },
    });
  } catch (error) {
    next(error);
  }
};

export const exportWeeklyReportPPT = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.projectId as string;
    console.log('[Export PPT] Request received for projectId:', projectId);
    if (!projectId) throw new AppError('Project ID is required', 400);
    
    console.log('[Export PPT] Fetching project...');
    const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true, name: true, code: true } });
    if (!project) throw new AppError('Project not found', 404);
    
    console.log('[Export PPT] Project found:', project.name, 'Generating PPT...');
    const pptBuffer = await generateWeeklyReportPPT(projectId);
    console.log('[Export PPT] PPT generated, buffer size:', pptBuffer.length);
    
    // Create reports directory if it doesn't exist
    const reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    // Generate filename and save to disk
    const today = new Date();
    const weekNumber = getWeekNumber(today);
    const period = `${today.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
    const fileName = `Weekly_Report_${project.code}_${today.toISOString().split('T')[0]}.pptx`;
    const filePath = path.join(reportsDir, fileName);
    
    fs.writeFileSync(filePath, pptBuffer);
    console.log('[Export PPT] File saved to:', filePath);
    
    // Save report record to database
    const report = await prisma.report.create({
      data: {
        projectId,
        type: 'WEEKLY',
        period,
        title: `Weekly Status Report - Week ${weekNumber}`,
        content: {
          fileName,
          filePath: `/reports/${fileName}`,
          fileSize: pptBuffer.length,
          generatedAt: today.toISOString(),
        },
        generatedById: req.user!.id,
      },
    });
    console.log('[Export PPT] Report record saved:', report.id);
    
    // Send file to client
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pptBuffer.length);
    res.send(pptBuffer);
    console.log('[Export PPT] Response sent successfully');
  } catch (error) {
    console.error('[Export PPT] Error:', error);
    next(error);
  }
};

export const downloadReport = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    // Get report from database
    const report = await prisma.report.findUnique({
      where: { id: id as string },
      include: { project: { select: { code: true, name: true } } },
    });
    
    if (!report) {
      throw new AppError('Report not found', 404);
    }
    
    // Get file path from content
    const content = report.content as any;
    const fileName = content.fileName;
    const filePath = path.join(process.cwd(), 'reports', fileName);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new AppError('Report file not found', 404);
    }
    
    // Read file and send
    const fileBuffer = fs.readFileSync(filePath);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', fileBuffer.length);
    res.send(fileBuffer);
  } catch (error) {
    next(error);
  }
};

/** POST /reports/upload-logo/:projectId — upload logo and update project settings */
export const updateLogoUrl = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.projectId as string;
    const logoType = req.body.logoType as 'logoUrlLeft' | 'logoUrlRight';
    if (!logoType || (logoType !== 'logoUrlLeft' && logoType !== 'logoUrlRight')) {
      throw new AppError('Invalid logo type', 400);
    }
    if (!req.file) {
      throw new AppError('No logo file uploaded', 400);
    }
    // Build logo path (relative to public)
    const logoPath = `/logos/${req.file.filename}`;
    // Update project settings
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, settings: true },
    });
    if (!project) throw new AppError('Project not found', 404);
    const currentSettings = (project.settings as any) || {};
    const updatedSettings = {
      ...currentSettings,
      reportTemplate: {
        ...currentSettings.reportTemplate,
        [logoType]: logoPath,
      },
    };
    await prisma.project.update({
      where: { id: projectId },
      data: { settings: updatedSettings },
    });
    res.json({ status: 'success', logoType, logoPath });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /reports/upload-header-footer/:projectId
 * Upload a header or footer image for a specific master layout type
 * Body fields: imageType (header|footer), layoutType (cover|blank|contentEmpty|titleAndContent|sectionTitle)
 */
export const updateHeaderFooterImage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const projectId  = req.params.projectId as string;
    const imageType  = (req.body.imageType || 'header') as 'header' | 'footer';
    const layoutType = (req.params.layoutType || req.body.layoutType) as string;

    if (!imageType || !['header', 'footer'].includes(imageType)) {
      throw new AppError('Invalid imageType — must be header or footer', 400);
    }
    if (!layoutType || !HF_LAYOUT_KEYS.includes(layoutType as any)) {
      throw new AppError(`Invalid layoutType — must be one of: ${HF_LAYOUT_KEYS.join(', ')}`, 400);
    }
    if (!req.file) {
      throw new AppError('No image file uploaded', 400);
    }

    const imagePath = `/logos/${req.file.filename}`;
    console.log('[UPLOAD] params:', req.params);
    console.log('[UPLOAD] body fields:', { imageType, layoutType });
    console.log('[UPLOAD] file saved as:', req.file.filename, '→ imagePath stored:', imagePath);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, settings: true },
    });
    if (!project) throw new AppError('Project not found', 404);

    const currentSettings = (project.settings as any) || {};
    const currentTemplate = currentSettings.reportTemplate || {};
    const currentSection  = currentTemplate[imageType] || {};
    const currentLayout   = currentSection[layoutType] || {};

    const updatedSettings = {
      ...currentSettings,
      reportTemplate: {
        ...currentTemplate,
        [imageType]: {
          ...currentSection,
          [layoutType]: {
            ...currentLayout,
            imageUrl: imagePath,
          },
        },
      },
    };

    await prisma.project.update({
      where: { id: projectId },
      data: { settings: updatedSettings },
    });
    console.log('[UPLOAD] DB saved — reportTemplate.header:', JSON.stringify(updatedSettings.reportTemplate?.header, null, 2));

    res.json({ status: 'success', imageType, layoutType, imagePath });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /reports/upload-slide-image/:projectId/:slideKey
 * Upload a background image for a specific slide
 */
const SLIDE_KEYS = ['titlePage', 'agenda', 'executiveSummary', 'weeklyProgress', 'nextWeek', 'milestones', 'risksAndChallenges'];

export const updateSlideImage = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.projectId as string;
    const slideKey  = req.params.slideKey as string;

    if (!slideKey || !SLIDE_KEYS.includes(slideKey)) {
      throw new AppError(`Invalid slideKey — must be one of: ${SLIDE_KEYS.join(', ')}`, 400);
    }
    if (!req.file) {
      throw new AppError('No image file uploaded', 400);
    }

    const imagePath = `/logos/${req.file.filename}`;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, settings: true },
    });
    if (!project) throw new AppError('Project not found', 404);

    const currentSettings = (project.settings as any) || {};
    const currentTemplate = currentSettings.reportTemplate || {};
    const currentSlideImages = currentTemplate.slideImages || {};

    const updatedSettings = {
      ...currentSettings,
      reportTemplate: {
        ...currentTemplate,
        slideImages: {
          ...currentSlideImages,
          [slideKey]: imagePath,
        },
      },
    };

    await prisma.project.update({
      where: { id: projectId },
      data: { settings: updatedSettings },
    });

    res.json({ status: 'success', slideKey, imagePath });
  } catch (error) {
    next(error);
  }
};

// Helper function to get week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}


