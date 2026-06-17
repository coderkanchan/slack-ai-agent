import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import logger from '../utils/logger.js';

export const validateRequest = (schema: ZodSchema<any>) => {
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
        logger.warn({
          context: 'Schema Validation',
          path: req.originalUrl,
          issues: error.issues.map(i => ({ field: i.path.join('.'), message: i.message }))
        }, 'Inbound request payload failed structural validation checks.');

        return res.status(400).json({
          success: false,
          error_code: "VALIDATION_ERROR",
          message: "The requested payload layer failed schema parsing tests.",
          details: error.issues.map((err) => ({
            field: err.path.map(String).join('.'),
            issue: err.message,
          })),
        });
      }

      logger.error({ error, context: 'Schema Validation Middleware' }, 'Unexpected internal evaluation failure within structural validation layer.');

      return res.status(500).json({
        success: false,
        message: "Internal schema middleware evaluation failure.",
      });
    }
  };
};