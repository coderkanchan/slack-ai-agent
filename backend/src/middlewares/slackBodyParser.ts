import express from 'express';

export const slackRawBodyParser = express.json({
  verify: (req: any, res, buf) => {
    if (req.url.startsWith('/slack/events')) {
      req.rawBody = buf; 
    }
  }
});