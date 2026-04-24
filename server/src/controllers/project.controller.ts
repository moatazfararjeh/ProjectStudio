// Stub handler for project phases
import { Request, Response, NextFunction } from 'express';
export const getProjectPhases = async (req: Request, res: Response, next: NextFunction) => {
  // TODO: Implement actual phases logic
  res.json([]);
};
import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const projectSchema = z.object({
  name: z.string().min(2),
  code: z.string().min(2),
  description: z.string().optional(),
  client: z.string().optional(),
  accountId: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  budget: z.number().optional(),
  price: z.number(),
  currency: z.string().default('USD'),
  status: z.enum(['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
});

export const getProjects = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, managerId } = req.query;

    const projects = await prisma.project.findMany({
      where: {
        ...(status && { status: status as any }),
        ...(managerId && { managerId: managerId as string }),
      },
      include: {
        manager: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        account: {
          select: { id: true, name: true, code: true },
        },
        tasks: {
          select: { status: true },
        },
        _count: {
          select: { members: true, tasks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute progress (% completed tasks) and strip the raw tasks array
    const projectsWithProgress = projects.map(({ tasks, ...project }) => {
      const total = tasks.length;
      const completed = tasks.filter((t) => t.status === 'COMPLETED').length;
      const progress = total > 0 ? Math.round((completed / total) * 10000) / 100 : 0;
      return { ...project, progress };
    });

    res.json({
      status: 'success',
      data: { projects: projectsWithProgress },
    });
  } catch (error) {
    next(error);
  }
};

export const getProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: id as string },
      include: {
        manager: {
          select: { id: true, firstName: true, lastName: true, avatar: true, email: true },
        },
        account: {
          select: { id: true, name: true, code: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, avatar: true, email: true },
            },
          },
        },
        phases: {
          orderBy: { order: 'asc' },
        },
        _count: {
          select: { tasks: true, worklogs: true, raidItems: true },
        },
      },
    });

    if (!project) {
      throw new AppError('Project not found', 404);
    }

    res.json({
      status: 'success',
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = projectSchema.parse(req.body);

    // Check if project code already exists
    const existingProject = await prisma.project.findFirst({
      where: { code: data.code },
    });

    if (existingProject) {
      throw new AppError(`Project code "${data.code}" already exists. Please use a different code.`, 400);
    }

    const project = await prisma.project.create({
      data: {
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        managerId: req.user!.id,
      },
      include: {
        manager: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    });

    res.status(201).json({
      status: 'success',
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const project = await prisma.project.update({
      where: { id: id as string },
      data: {
        ...data,
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate && { endDate: new Date(data.endDate) }),
      },
      include: {
        manager: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    });

    res.json({
      status: 'success',
      data: { project },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.project.delete({
      where: { id: id as string },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const addMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { userId, role, allocation } = req.body;

    const member = await prisma.projectMember.create({
      data: {
        projectId: id as string,
        userId,
        role,
        allocation: allocation || 100,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true, email: true },
        },
      },
    });

    res.status(201).json({
      status: 'success',
      data: { member },
    });
  } catch (error) {
    next(error);
  }
};

export const updateMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { memberId } = req.params;
    const { role, allocation } = req.body;

    const member = await prisma.projectMember.update({
      where: { id: memberId as string },
      data: {
        ...(role && { role }),
        ...(allocation !== undefined && { allocation }),
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    });

    res.json({
      status: 'success',
      data: { member },
    });
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { memberId } = req.params;

    await prisma.projectMember.delete({
      where: { id: memberId as string },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getMyProjects = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User not authenticated', 401);
    }

    // Get projects where user is either manager or team member
    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { managerId: userId },
          { 
            members: {
              some: {
                userId: userId
              }
            }
          }
        ]
      },
      include: {
        manager: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        members: {
          where: { userId: userId },
          select: { role: true, allocation: true }
        },
        _count: {
          select: { members: true, tasks: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10
    });

    res.json({
      status: 'success',
      data: { projects },
    });
  } catch (error) {
    next(error);
  }
};
