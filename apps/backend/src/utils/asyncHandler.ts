import { Request, Response, NextFunction } from 'express';

/** Async Express handler that returns a promise. */
type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

/** Wraps async handlers and forwards rejected promises to `next()`. */
export const asyncHandler = (fn: AsyncHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};
