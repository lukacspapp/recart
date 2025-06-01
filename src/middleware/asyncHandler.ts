import { Request, Response, NextFunction, RequestHandler } from 'express';

export function asyncHandler<Req extends Request>(fn: (req: Req, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler {
  return function handler(req: Request, res: Response, next: NextFunction): void {
    const handleError = (error: unknown): void => {
      next(error);
    };

    try {
      const resultPromise = fn(req as Req, res, next);
      resultPromise.catch(handleError);
    } catch (error) {
      handleError(error);
    }
  };
}
