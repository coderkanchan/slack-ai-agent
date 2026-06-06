import express from 'express';

export const slackRawBodyParser = express.json({
  verify: (req: any, _res, buf) => {
    if (req.originalUrl && req.originalUrl.startsWith('/slack/events')) {
      req.rawBody = buf;
    }
  }
});