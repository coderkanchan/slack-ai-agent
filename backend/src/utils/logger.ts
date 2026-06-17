import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

const pinoOptions: any = {
  level: process.env.LOG_LEVEL || 'info',
};

if (!isProduction) {
  pinoOptions.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
      ignore: 'pid,hostname',
    },
  };
}

const logger = pino(pinoOptions);

export default logger;