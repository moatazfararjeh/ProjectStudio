import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth';

const settingSchema = z.object({
  category: z.string().min(1),
  key: z.string().min(1),
  labelEn: z.string().min(1),
  labelAr: z.string().min(1),
  color: z.string().optional(),
  icon: z.string().optional(),
  order: z.number().optional(),
  isActive: z.boolean().optional(),
  isSystem: z.boolean().optional(),
});

// Get all settings or filter by category
export const getSettings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { category } = req.query;

    const settings = await prisma.systemSetting.findMany({
      where: {
        ...(category && { category: category as string }),
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });

    res.json({
      status: 'success',
      data: { settings },
    });
  } catch (error) {
    next(error);
  }
};

// Get settings by category
export const getSettingsByCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { category } = req.params;

    const settings = await prisma.systemSetting.findMany({
      where: { category: category as string, isActive: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });

    res.json({
      status: 'success',
      data: { settings },
    });
  } catch (error) {
    next(error);
  }
};

// Create new setting
export const createSetting = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = settingSchema.parse(req.body);

    const setting = await prisma.systemSetting.create({
      data: validatedData,
    });

    res.status(201).json({
      status: 'success',
      data: { setting },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError('Validation failed', 400));
    }
    next(error);
  }
};

// Update setting
export const updateSetting = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const validatedData = settingSchema.partial().parse(req.body);

    // Check if setting exists and is not system (if trying to delete critical fields)
    const existingSetting = await prisma.systemSetting.findUnique({
      where: { id: id as string },
    });

    if (!existingSetting) {
      throw new AppError('Setting not found', 404);
    }

    if (existingSetting.isSystem && req.body.isActive === false) {
      throw new AppError('System settings cannot be deactivated', 400);
    }

    const setting = await prisma.systemSetting.update({
      where: { id: id as string },
      data: validatedData,
    });

    res.json({
      status: 'success',
      data: { setting },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(new AppError('Validation failed', 400));
    }
    next(error);
  }
};

// Delete setting
export const deleteSetting = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const setting = await prisma.systemSetting.findUnique({
      where: { id: id as string },
    });

    if (!setting) {
      throw new AppError('Setting not found', 404);
    }

    if (setting.isSystem) {
      throw new AppError('System settings cannot be deleted', 400);
    }

    await prisma.systemSetting.delete({
      where: { id: id as string },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// Seed default settings (for initial setup)
export const seedDefaultSettings = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const defaultSettings = [
      // Project Member Roles
      { category: 'project_member_role', key: 'MANAGER', labelEn: 'Manager', labelAr: 'مدير', color: 'purple', order: 1, isSystem: true },
      { category: 'project_member_role', key: 'TEAM_LEAD', labelEn: 'Team Lead', labelAr: 'قائد فريق', color: 'blue', order: 2, isSystem: true },
      { category: 'project_member_role', key: 'DEVELOPER', labelEn: 'Developer', labelAr: 'مطور', color: 'green', order: 3, isSystem: false },
      { category: 'project_member_role', key: 'DESIGNER', labelEn: 'Designer', labelAr: 'مصمم', color: 'cyan', order: 4, isSystem: false },
      { category: 'project_member_role', key: 'QA', labelEn: 'QA', labelAr: 'ضمان جودة', color: 'orange', order: 5, isSystem: false },
      { category: 'project_member_role', key: 'MEMBER', labelEn: 'Member', labelAr: 'عضو', color: 'default', order: 6, isSystem: true },
      
      // Project Status
      { category: 'project_status', key: 'PLANNING', labelEn: 'Planning', labelAr: 'التخطيط', color: 'blue', order: 1, isSystem: true },
      { category: 'project_status', key: 'IN_PROGRESS', labelEn: 'In Progress', labelAr: 'قيد التنفيذ', color: 'green', order: 2, isSystem: true },
      { category: 'project_status', key: 'ON_HOLD', labelEn: 'On Hold', labelAr: 'معلق', color: 'orange', order: 3, isSystem: true },
      { category: 'project_status', key: 'COMPLETED', labelEn: 'Completed', labelAr: 'مكتمل', color: 'gray', order: 4, isSystem: true },
      { category: 'project_status', key: 'CANCELLED', labelEn: 'Cancelled', labelAr: 'ملغي', color: 'red', order: 5, isSystem: true },
      
      // Task Priority
      { category: 'task_priority', key: 'LOW', labelEn: 'Low', labelAr: 'منخفض', color: 'default', order: 1, isSystem: true },
      { category: 'task_priority', key: 'MEDIUM', labelEn: 'Medium', labelAr: 'متوسط', color: 'blue', order: 2, isSystem: true },
      { category: 'task_priority', key: 'HIGH', labelEn: 'High', labelAr: 'عالي', color: 'orange', order: 3, isSystem: true },
      { category: 'task_priority', key: 'CRITICAL', labelEn: 'Critical', labelAr: 'حرج', color: 'red', order: 4, isSystem: true },
      
      // Task Status
      { category: 'task_status', key: 'NOT_STARTED', labelEn: 'Not Started', labelAr: 'لم يبدأ', color: 'default', order: 1, isSystem: true },
      { category: 'task_status', key: 'IN_PROGRESS', labelEn: 'In Progress', labelAr: 'قيد التنفيذ', color: 'blue', order: 2, isSystem: true },
      { category: 'task_status', key: 'REVIEW', labelEn: 'Review', labelAr: 'مراجعة', color: 'purple', order: 3, isSystem: true },
      { category: 'task_status', key: 'COMPLETED', labelEn: 'Completed', labelAr: 'مكتمل', color: 'green', order: 4, isSystem: true },
      { category: 'task_status', key: 'BLOCKED', labelEn: 'Blocked', labelAr: 'محظور', color: 'red', order: 5, isSystem: true },
      
      // RAID Priority
      { category: 'raid_priority', key: 'LOW', labelEn: 'Low', labelAr: 'منخفض', color: 'default', order: 1, isSystem: true },
      { category: 'raid_priority', key: 'MEDIUM', labelEn: 'Medium', labelAr: 'متوسط', color: 'blue', order: 2, isSystem: true },
      { category: 'raid_priority', key: 'HIGH', labelEn: 'High', labelAr: 'عالي', color: 'orange', order: 3, isSystem: true },
      { category: 'raid_priority', key: 'CRITICAL', labelEn: 'Critical', labelAr: 'حرج', color: 'red', order: 4, isSystem: true },
    ];

    // Use upsert to avoid duplicates
    for (const setting of defaultSettings) {
      await prisma.systemSetting.upsert({
        where: {
          category_key: {
            category: setting.category,
            key: setting.key,
          },
        },
        update: {},
        create: setting,
      });
    }

    res.json({
      status: 'success',
      message: 'Default settings seeded successfully',
    });
  } catch (error) {
    next(error);
  }
};
