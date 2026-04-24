import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import prisma from '../config/prisma';

export const getAccounts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { projects: true, reviews: true },
        },
      },
    });

    res.json({
      success: true,
      data: { accounts },
    });
  } catch (error) {
    next(error);
  }
};

export const getAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const account = await prisma.account.findUnique({
      where: { id: id as string },
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
            startDate: true,
            endDate: true,
            progress: true,
          },
        },
        reviews: {
          orderBy: { reviewDate: 'desc' },
          take: 10,
        },
        _count: {
          select: { projects: true, reviews: true },
        },
      },
    });

    if (!account) {
      throw new AppError('Account not found', 404);
    }

    res.json({
      success: true,
      data: { account },
    });
  } catch (error) {
    next(error);
  }
};

export const createAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = req.body;

    // Check if code already exists
    const existingAccount = await prisma.account.findUnique({
      where: { code: data.code },
    });

    if (existingAccount) {
      throw new AppError(`Account code "${data.code}" already exists. Please use a different code.`, 400);
    }

    const account = await prisma.account.create({
      data: {
        name: data.name,
        code: data.code,
        industry: data.industry,
        size: data.size,
        status: data.status || 'ACTIVE',
        primaryContact: data.primaryContact,
        primaryContactEmail: data.primaryContactEmail,
        primaryContactPhone: data.primaryContactPhone,
        healthScore: data.healthScore,
        renewalProbability: data.renewalProbability,
        annualValue: data.annualValue,
        lifetimeValue: data.lifetimeValue,
        contractStartDate: data.contractStartDate ? new Date(data.contractStartDate) : undefined,
        contractEndDate: data.contractEndDate ? new Date(data.contractEndDate) : undefined,
        nextReviewDate: data.nextReviewDate ? new Date(data.nextReviewDate) : undefined,
        notes: data.notes,
      },
    });

    res.status(201).json({
      success: true,
      data: { account },
    });
  } catch (error) {
    next(error);
  }
};

export const updateAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Check if account exists
    const existingAccount = await prisma.account.findUnique({
      where: { id: id as string },
    });

    if (!existingAccount) {
      throw new AppError('Account not found', 404);
    }

    // Check if code is being changed and already exists
    if (data.code && data.code !== existingAccount.code) {
      const codeExists = await prisma.account.findUnique({
        where: { code: data.code },
      });

      if (codeExists) {
        throw new AppError(`Account code "${data.code}" already exists. Please use a different code.`, 400);
      }
    }

    const account = await prisma.account.update({
      where: { id: id as string },
      data: {
        name: data.name,
        code: data.code,
        industry: data.industry,
        size: data.size,
        status: data.status,
        primaryContact: data.primaryContact,
        primaryContactEmail: data.primaryContactEmail,
        primaryContactPhone: data.primaryContactPhone,
        healthScore: data.healthScore,
        renewalProbability: data.renewalProbability,
        annualValue: data.annualValue,
        lifetimeValue: data.lifetimeValue,
        contractStartDate: data.contractStartDate ? new Date(data.contractStartDate) : undefined,
        contractEndDate: data.contractEndDate ? new Date(data.contractEndDate) : undefined,
        nextReviewDate: data.nextReviewDate ? new Date(data.nextReviewDate) : undefined,
        notes: data.notes,
      },
    });

    res.json({
      success: true,
      data: { account },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Check if account has projects
    const account = await prisma.account.findUnique({
      where: { id: id as string },
      include: {
        _count: {
          select: { projects: true },
        },
      },
    });

    if (!account) {
      throw new AppError('Account not found', 404);
    }

    if (account._count && account._count.projects > 0) {
      throw new AppError('Cannot delete account with existing projects. Please remove or reassign projects first.', 400);
    }

    await prisma.account.delete({
      where: { id: id as string },
    });

    res.json({
      success: true,
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
