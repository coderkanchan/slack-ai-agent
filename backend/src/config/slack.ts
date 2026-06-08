import pkg from '@slack/bolt';
const { App, ExpressReceiver } = pkg;
import dotenv from 'dotenv';

dotenv.config();

export const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET || '',
  processBeforeResponse: true
});

export const slackApp = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: receiver
});