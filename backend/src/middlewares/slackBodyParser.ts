import express from 'express';

// Professional custom parser separating Slack binary payload from default JSON
export const slackRawBodyParser = express.json({
  verify: (req: any, res, buf) => {
    if (req.url.startsWith('/slack/events')) {
      req.rawBody = buf; // Forcing preservation of raw crypto signatures
    }
  }
});