import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';

export const validateRequest = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          error_code: "VALIDATION_ERROR",
          message: "The requested payload layer failed schema parsing tests.",
          details: error.errors.map((err) => ({
            field: err.path.join('.'),
            issue: err.message,
          })),
        });
      }

      return res.status(500).json({
        success: false,
        message: "Internal schema middleware evaluation failure.",
      });
    }
  };
};