import { Response, NextFunction } from 'express';
import { z } from 'zod';
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
  targetDate: z.string().optional().nullable(),
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
        ...(data.targetDate && { targetDate: new Date(data.targetDate) }),
      },
      include: {
        owner: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
        mitigationOwner: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
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
    const excludedFields = ['owner', 'project', 'id', 'createdAt', 'updatedAt', 'identifiedDate', 'projectId', 'closedDate', 'mitigationOwner'];
    
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
