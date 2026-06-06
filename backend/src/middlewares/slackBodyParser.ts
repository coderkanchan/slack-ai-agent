import express from 'express';

export const slackRawBodyParser = express.json({
  verify: (req: any, _res, buf) => {
    // Ensuring exact original binary payload preservation for Slack signature validation
    if (req.originalUrl && req.originalUrl.startsWith('/slack/events')) {
      req.rawBody = buf;
    }
  }
});