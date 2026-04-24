import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';

const worklogSchema = z.object({
  projectId: z.string(),
  taskId: z.string().optional(),
  date: z.string(),
  hours: z.number().min(0).max(24),
  description: z.string().optional(),
  whatDone: z.string().optional(),
  whatNext: z.string().optional(),
  blockers: z.string().optional(),
});

export const getWorklogs = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { projectId, taskId, userId, startDate, endDate } = req.query;

    const worklogs = await prisma.worklog.findMany({
      where: {
        ...(projectId && { projectId: projectId as string }),
        ...(taskId && { taskId: taskId as string }),
        ...(userId && { userId: userId as string }),
        ...(startDate && endDate && {
          date: {
            gte: new Date(startDate as string),
            lte: new Date(endDate as string),
          },
        }),
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        task: {
          select: { id: true, name: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    res.json({
      status: 'success',
      data: { worklogs },
    });
  } catch (error) {
    next(error);
  }
};

export const createWorklog = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = worklogSchema.parse(req.body);

    const worklog = await prisma.worklog.create({
      data: {
        ...data,
        date: new Date(data.date),
        userId: req.user!.id,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        task: {
          select: { id: true, name: true },
        },
      },
    });

    // Update task actual hours if task is specified
    if (data.taskId) {
      await prisma.task.update({
        where: { id: data.taskId },
        data: {
          actualHours: {
            increment: data.hours,
          },
        },
      });
    }

    res.status(201).json({
      status: 'success',
      data: { worklog },
    });
  } catch (error) {
    next(error);
  }
};

export const updateWorklog = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const existingWorklog = await prisma.worklog.findUnique({ where: { id: id as string } });
    const hoursDiff = data.hours ? data.hours - (existingWorklog?.hours || 0) : 0;

    const worklog = await prisma.worklog.update({
      where: { id: id as string },
      data: {
        ...data,
        ...(data.date && { date: new Date(data.date) }),
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        task: {
          select: { id: true, name: true },
        },
      },
    });

    // Update task actual hours if changed
    if (hoursDiff !== 0 && worklog.taskId) {
      await prisma.task.update({
        where: { id: worklog.taskId },
        data: {
          actualHours: {
            increment: hoursDiff,
          },
        },
      });
    }

    res.json({
      status: 'success',
      data: { worklog },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteWorklog = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const worklog = await prisma.worklog.findUnique({ where: { id: id as string } });

    await prisma.worklog.delete({
      where: { id: id as string },
    });

    // Update task actual hours
    if (worklog?.taskId) {
      await prisma.task.update({
        where: { id: worklog.taskId },
        data: {
          actualHours: {
            decrement: worklog.hours,
          },
        },
      });
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
