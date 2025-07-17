import { Request, Response, NextFunction } from 'express';
import { BadRequestError, NotFoundError, UnauthorizedError, ForbiddenError } from '../utils/errors';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(error);

  if (error instanceof BadRequestError) {
    return res.status(400).json({
      status: 'error',
      message: error.message,
    });
  }

  if (error instanceof UnauthorizedError) {
    return res.status(401).json({
      status: 'error',
      message: error.message,
    });
  }

  if (error instanceof ForbiddenError) {
    return res.status(403).json({
      status: 'error',
      message: error.message,
    });
  }

  if (error instanceof NotFoundError) {
    return res.status(404).json({
      status: 'error',
      message: error.message,
    });
  }

  // Default to 500 server error
  return res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
}; 