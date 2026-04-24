import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';

const rateCardSchema = z.object({
  userId: z.string().optional(),
  role: z.string().optional(),
  costRate: z.number().min(0),
  billRate: z.number().min(0).optional(),
  currency: z.string().default('USD'),
  effectiveFrom: z.string(),
  effectiveTo: z.string().optional(),
});

export const getRateCards = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, role, active } = req.query;

    const now = new Date();

    const rateCards = await prisma.rateCard.findMany({
      where: {
        ...(userId && { userId: userId as string }),
        ...(role && { role: role as string }),
        ...(active === 'true' && {
          effectiveFrom: { lte: now },
          OR: [
            { effectiveTo: null },
            { effectiveTo: { gte: now } },
          ],
        }),
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { effectiveFrom: 'desc' },
    });

    res.json({
      status: 'success',
      data: { rateCards },
    });
  } catch (error) {
    next(error);
  }
};

export const createRateCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = rateCardSchema.parse(req.body);

    const rateCard = await prisma.rateCard.create({
      data: {
        ...data,
        effectiveFrom: new Date(data.effectiveFrom),
        ...(data.effectiveTo && { effectiveTo: new Date(data.effectiveTo) }),
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    res.status(201).json({
      status: 'success',
      data: { rateCard },
    });
  } catch (error) {
    next(error);
  }
};

export const updateRateCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const rateCard = await prisma.rateCard.update({
      where: { id: id as string },
      data: {
        ...data,
        ...(data.effectiveFrom && { effectiveFrom: new Date(data.effectiveFrom) }),
        ...(data.effectiveTo && { effectiveTo: new Date(data.effectiveTo) }),
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    res.json({
      status: 'success',
      data: { rateCard },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRateCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await prisma.rateCard.delete({
      where: { id: id as string },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
