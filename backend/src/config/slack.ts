// import { App } from '@slack/bolt';
// import dotenv from 'dotenv';

// dotenv.config();

// export const slackApp = new App({
//   token: process.env.SLACK_BOT_TOKEN as string,
//   appToken: process.env.SLACK_APP_TOKEN as string,
//   socketMode: true,
// });

import pkg from '@slack/bolt';
const { App } = pkg;
import dotenv from 'dotenv';

dotenv.config();

export const slackApp = new App({
  token: process.env.SLACK_BOT_TOKEN as string,
  signingSecret: process.env.SLACK_SIGNING_SECRET as string,
});