import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';

const highlightSchema = z.object({
  weekDate: z.string(),
  type: z.enum(['COMPLETED', 'PLANNED']),
  description: z.string().min(1),
  sortOrder: z.number().optional().default(0),
});

// GET /api/projects/:id/weekly-highlights?weekDate=YYYY-MM-DD
export const getWeeklyHighlights = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const projectId = String(req.params.id);
    const weekDate = req.query.weekDate ? String(req.query.weekDate) : undefined;

    const where: any = { projectId };
    if (weekDate) {
      const d = new Date(weekDate);
      const start = new Date(d); start.setHours(0, 0, 0, 0);
      const end   = new Date(d); end.setHours(23, 59, 59, 999);
      where.weekDate = { gte: start, lte: end };
    }

    const highlights = await prisma.weeklyHighlight.findMany({
      where,
      orderBy: [{ weekDate: 'desc' }, { type: 'asc' }, { sortOrder: 'asc' }],
    });

    res.json(highlights);
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:id/weekly-highlights/weeks
export const getWeeklyHighlightWeeks = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const projectId = String(req.params.id);
    const rows = await (prisma as any).weeklyHighlight.findMany({
      where: { projectId },
      select: { weekDate: true },
      distinct: ['weekDate'],
      orderBy: { weekDate: 'desc' },
    });
    res.json(rows.map((r: any) => r.weekDate));
  } catch (err) {
    next(err);
  }
};

// POST /api/projects/:id/weekly-highlights
export const createWeeklyHighlight = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const projectId = String(req.params.id);
    const data = highlightSchema.parse(req.body);

    const weekDate = new Date(data.weekDate);
    weekDate.setHours(0, 0, 0, 0);

    const highlight = await prisma.weeklyHighlight.create({
      data: {
        projectId,
        weekDate,
        type: data.type,
        description: data.description,
        sortOrder: data.sortOrder ?? 0,
      },
    });

    res.status(201).json(highlight);
  } catch (err) {
    next(err);
  }
};

// PUT /api/projects/:id/weekly-highlights/:hid
export const updateWeeklyHighlight = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const hid = String(req.params.hid);
    const data = highlightSchema.partial().parse(req.body);

    const updateData: any = { ...data };
    if (data.weekDate) {
      const d = new Date(data.weekDate);
      d.setHours(0, 0, 0, 0);
      updateData.weekDate = d;
    }

    const highlight = await prisma.weeklyHighlight.update({
      where: { id: hid },
      data: updateData,
    });

    res.json(highlight);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/projects/:id/weekly-highlights/:hid
export const deleteWeeklyHighlight = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const hid = String(req.params.hid);
    await prisma.weeklyHighlight.delete({ where: { id: hid } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
};
