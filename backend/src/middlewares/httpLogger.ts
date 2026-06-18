import pinoHttp from 'pino-http';
import logger from '../utils/logger.js';

export const httpLogger = pinoHttp({
  logger,
  customSuccessMessage: (req, res, responseTime) => {
    return `HTTP ${req.method} ${req.url} completed with status ${res.statusCode} in ${responseTime}ms`;
  },
  customErrorMessage: (req, res, err) => {
    return `HTTP ${req.method} ${req.url} failed with status ${res.statusCode} - Error: ${err.message}`;
  },
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
});