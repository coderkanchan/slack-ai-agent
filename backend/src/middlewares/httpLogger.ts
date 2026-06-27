import { pinoHttp } from 'pino-http';
import { IncomingMessage, ServerResponse } from 'http';
import logger from '../utils/logger.js';

export const httpLogger = pinoHttp({
  logger,
  customSuccessMessage: (req: IncomingMessage, res: ServerResponse, responseTime: number) => {
    return `HTTP ${req.method} ${req.url} completed with status ${res.statusCode} in ${responseTime}ms`;
  },
  customErrorMessage: (req: IncomingMessage, res: ServerResponse, err: Error) => {
    return `HTTP ${req.method} ${req.url} failed with status ${res.statusCode} - Error: ${err.message}`;
  },
  
  serializers: {
    req: (req: any) => ({
      method: req.method,
      url: req.url,
    }),
    res: (res: any) => ({
      statusCode: res.statusCode,
    }),
  },
});