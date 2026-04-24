import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    
    // Unique constraint violation
    if (prismaError.code === 'P2002') {
      const field = prismaError.meta?.target?.[0] || 'field';
      return res.status(400).json({
        status: 'error',
        message: `A record with this ${field} already exists. Please use a different value.`,
      });
    }
    
    // Foreign key constraint violation
    if (prismaError.code === 'P2003') {
      return res.status(400).json({
        status: 'error',
        message: 'Related record not found.',
      });
    }
    
    return res.status(400).json({
      status: 'error',
      message: 'Database error occurred',
    });
  }

  // Default error
  console.error('ERROR 💥:', err);
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
};
