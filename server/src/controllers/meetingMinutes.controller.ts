import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import { generateMoMDocx } from '../utils/momGenerator';
import { generateMoMFromTemplate } from '../utils/momTemplateGenerator';
import path from 'path';
import fs from 'fs';

const attendeeSchema = z.object({
  name: z.string().min(1),
  role: z.string().optional(),
  attended: z.boolean().optional(),
});
const absenteeSchema = z.object({
  name: z.string().min(1),
  role: z.string().optional(),
  reason: z.string().optional(),
});
const keyPointSchema = z.object({ point: z.string().min(1) });
const actionItemSchema = z.object({
  task: z.string().min(1),
  dueDate: z.string().optional(),
  assignedTo: z.string().optional(),
  status: z.string().optional(),
});

const momSchema = z.object({
  title: z.string().min(1),
  meetingDate: z.string(),
  location: z.string().nullish(),
  facilitator: z.string().nullish(),
  language: z.enum(['AR', 'EN']).default('AR'),
  attendees: z.array(attendeeSchema).default([]),
  absentees: z.array(absenteeSchema).default([]),
  keyPoints: z.array(keyPointSchema).default([]),
  actionItems: z.array(actionItemSchema).default([]),
  notes: z.string().nullish(),
});

// GET /api/projects/:id/meeting-minutes
export const getMeetingMinutes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const projectId = String(req.params.id);
    const items = await prisma.meetingMinutes.findMany({
      where: { projectId },
      orderBy: { meetingDate: 'desc' },
    });
    res.json(items);
  } catch (err) { next(err); }
};

// GET /api/projects/:id/meeting-minutes/:mid
export const getMeetingMinute = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const item = await prisma.meetingMinutes.findUnique({ where: { id: String(req.params.mid) } });
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (err) { next(err); }
};

// POST /api/projects/:id/meeting-minutes
export const createMeetingMinutes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const projectId = String(req.params.id);
    const data = momSchema.parse(req.body);
    const item = await prisma.meetingMinutes.create({
      data: {
        projectId,
        title: data.title,
        meetingDate: new Date(data.meetingDate),
        location: data.location,
        facilitator: data.facilitator,
        language: data.language,
        attendees: data.attendees as any,
        absentees: data.absentees as any,
        keyPoints: data.keyPoints as any,
        actionItems: data.actionItems as any,
        notes: data.notes,
        createdById: req.user?.id,
      },
    });
    res.status(201).json(item);
  } catch (err) { next(err); }
};

// PUT /api/projects/:id/meeting-minutes/:mid
export const updateMeetingMinutes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = momSchema.partial().parse(req.body);
    const updateData: any = { ...data };
    if (data.meetingDate) updateData.meetingDate = new Date(data.meetingDate);
    const item = await prisma.meetingMinutes.update({
      where: { id: String(req.params.mid) },
      data: updateData,
    });
    res.json(item);
  } catch (err) { next(err); }
};

// DELETE /api/projects/:id/meeting-minutes/:mid
export const deleteMeetingMinutes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    await prisma.meetingMinutes.delete({ where: { id: String(req.params.mid) } });
    res.json({ message: 'Deleted' });
  } catch (err) { next(err); }
};

// GET /api/projects/:id/meeting-minutes/:mid/export
export const exportMeetingMinutes = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const mid = String(req.params.mid);
    const item = await prisma.meetingMinutes.findUnique({ where: { id: mid } });
    if (!item) return res.status(404).json({ message: 'Not found' });

    const project = await prisma.project.findUnique({
      where: { id: item.projectId },
      select: { name: true, settings: true },
    });

    const settings = (project?.settings as any) || {};
    const template = settings.momTemplate || {};

    // ── Use docxtemplater-based generator when a custom .docx template is set ──
    // NOTE: 'docxTemplatePath' is for the new docxtemplater approach (preserves design).
    // 'masterTemplatePath' is the older AdmZip style-injection approach.
    const docxTemplatePath = template.docxTemplatePath
      ? path.join(__dirname, '../../public', template.docxTemplatePath)
      : undefined;
    const masterTemplatePath = template.masterTemplatePath
      ? path.join(__dirname, '../../public', template.masterTemplatePath)
      : undefined;

    const lang = ((item as any).language === 'EN' ? 'EN' : 'AR') as 'AR' | 'EN';

    let buffer: Buffer;
    if (docxTemplatePath) {
      try {
        // Template-based: preserves all backgrounds, images, and design
        buffer = await generateMoMFromTemplate(docxTemplatePath, {
          projectName: project?.name || '',
          title:       item.title,
          meetingDate: item.meetingDate,
          location:    item.location    || undefined,
          facilitator: item.facilitator || undefined,
          language:    lang,
          attendees:   (item.attendees   as any[]) || [],
          absentees:   (item.absentees   as any[]) || [],
          keyPoints:   (item.keyPoints   as any[]) || [],
          actionItems: (item.actionItems as any[]) || [],
          notes:       item.notes || undefined,
        });
      } catch (templateErr: any) {
        // Return a readable 422 so the client can display the exact problem
        return res.status(422).json({
          message: templateErr?.message || 'Template error',
          hint: 'Fix the .docx file and re-upload it from the Meeting Minutes tab.',
        });
      }
    } else {
      // Fallback: fully-generated document (no custom template)
      const logoLeftPath  = template.logoUrlLeft  ? path.join(__dirname, '../../public', template.logoUrlLeft)  : undefined;
      const logoRightPath = template.logoUrlRight ? path.join(__dirname, '../../public', template.logoUrlRight) : undefined;
      const headerLogoPath = template.logoUrlLeft
        ? path.join(__dirname, '../../public', template.logoUrlLeft)
        : undefined;
      buffer = await generateMoMDocx({
        projectName: project?.name || '',
        title:       item.title,
        meetingDate: item.meetingDate,
        location:    item.location    || undefined,
        facilitator: item.facilitator || undefined,
        language:    lang,
        attendees:   (item.attendees   as any[]) || [],
        absentees:   (item.absentees   as any[]) || [],
        keyPoints:   (item.keyPoints   as any[]) || [],
        actionItems: (item.actionItems as any[]) || [],
        notes:       item.notes || undefined,
        template: {
          primaryColor:   template.primaryColor   || undefined,
          secondaryColor: template.secondaryColor || undefined,
          accentColor:    template.accentColor    || undefined,
          companyName:    template.companyName    || undefined,
          headerText:     template.headerText     || undefined,
          footerText:     template.footerText     || undefined,
        },
        logoLeftPath,
        logoRightPath,
        headerLogoPath,
      });
    }

    const safeTitle = item.title.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_') || 'MoM';
    const filename = `MoM_${safeTitle}_${new Date(item.meetingDate).toISOString().split('T')[0]}.docx`;
    const filenameEncoded = encodeURIComponent(`MoM_${item.title.replace(/\s+/g, '_')}_${new Date(item.meetingDate).toISOString().split('T')[0]}.docx`);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"; filename*=UTF-8''${filenameEncoded}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.send(buffer);
  } catch (err) { next(err); }
};

// POST /api/projects/:id/meeting-minutes/upload-template
// Accepts a .docx file (via multer, field name "template") and saves the
// relative path to project.settings.momTemplate.masterTemplatePath.
export const uploadMoMTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const projectId = String(req.params.id);
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) return res.status(400).json({ message: 'No file uploaded' });

    // Rename the temp file to a stable, project-scoped name
    const stableFilename = `mom_docx_${projectId}.docx`;
    const templatesDir   = path.join(__dirname, '../../public/mom-templates');
    const stablePath     = path.join(templatesDir, stableFilename);
    fs.renameSync(file.path, stablePath);

    // Persist relative path in project settings under 'docxTemplatePath'
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { settings: true },
    });
    const currentSettings = (project?.settings as any) || {};
    const updatedSettings = {
      ...currentSettings,
      momTemplate: {
        ...(currentSettings.momTemplate || {}),
        docxTemplatePath: `/mom-templates/${stableFilename}`,
      },
    };
    await prisma.project.update({
      where: { id: projectId },
      data:  { settings: updatedSettings },
    });

    res.json({
      message:           'MOM template uploaded',
      docxTemplatePath:  `/mom-templates/${stableFilename}`,
    });
  } catch (err) { next(err); }
};

// DELETE /api/projects/:id/meeting-minutes/template
// Removes the custom MOM template, reverting to the generated layout.
export const deleteMoMTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const projectId = String(req.params.id);
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { settings: true },
    });
    const currentSettings = (project?.settings as any) || {};
    const momTemplate     = { ...(currentSettings.momTemplate || {}) };
    const existingPath    = momTemplate.docxTemplatePath
      ? path.join(__dirname, '../../public', momTemplate.docxTemplatePath)
      : null;

    // Delete the physical file if it exists
    if (existingPath && fs.existsSync(existingPath)) {
      fs.unlinkSync(existingPath);
    }

    delete momTemplate.docxTemplatePath;
    await prisma.project.update({
      where: { id: projectId },
      data:  { settings: { ...currentSettings, momTemplate } },
    });

    res.json({ message: 'MOM template removed' });
  } catch (err) { next(err); }
};

